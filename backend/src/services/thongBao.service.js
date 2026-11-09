const mongoose = require('mongoose');
const ThongBao = require('../models/thongBao.model');
const TaiKhoan = require('../models/taiKhoan.model');
const { PHAN_TRANG } = require('../constants/cauHinh.constant');
const { taoLoi } = require('../utils/taoLoi');
const { phatThongBaoMoi } = require('./thongBaoTinNhan.service');

const taoThongBao = async ({ taiKhoanId, loai, tieuDe, noiDung, duongDan, maSuKien }) => {
  try {
    const taiKhoan = await TaiKhoan.findById(taiKhoanId).select('_id').lean();
    if (!taiKhoan) return null;
    const thongBao = await ThongBao.findOneAndUpdate({ taiKhoanId, maSuKien },
      { $setOnInsert: { taiKhoanId, loai, tieuDe, noiDung, duongDan, maSuKien, ngayTao: new Date() } },
      { upsert: true, returnDocument: 'after', includeResultMetadata: true });
    if (!thongBao.lastErrorObject?.updatedExisting) await phatThongBaoMoi(taiKhoanId);
    return thongBao.value;
  } catch (loi) {
    if (loi.code !== 11000) console.error('Không lưu được thông báo:', loi);
    return null;
  }
};

const layDanhSach = async (taiKhoanId, query = {}) => {
  const trang = query.trang === undefined ? 1 : Number(query.trang);
  if (!Number.isSafeInteger(trang) || trang < 1) throw taoLoi(400, 'Trang không hợp lệ');
  const chuaDoc = query.chuaDoc === 'true';
  if (query.chuaDoc !== undefined && !['true', 'false'].includes(query.chuaDoc)) throw taoLoi(400, 'Bộ lọc thông báo không hợp lệ');
  const dieuKien = { taiKhoanId, ...(chuaDoc ? { ngayDoc: null } : {}) };
  const gioiHan = PHAN_TRANG.MAC_DINH;
  const [tongSo, soChuaDoc, danhSach] = await Promise.all([
    ThongBao.countDocuments(dieuKien),
    ThongBao.countDocuments({ taiKhoanId, ngayDoc: null }),
    ThongBao.find(dieuKien).select('-maSuKien').sort({ ngayTao: -1, _id: -1 })
      .skip((trang - 1) * gioiHan).limit(gioiHan).lean(),
  ]);
  return { danhSach, soChuaDoc,
    phanTrang: { trang, gioiHan, tongSo, tongTrang: Math.ceil(tongSo / gioiHan) } };
};

const demChuaDoc = async (taiKhoanId) => ({ soChuaDoc: await ThongBao.countDocuments({ taiKhoanId, ngayDoc: null }) });

const danhDauDaDoc = async (taiKhoanId, id) => {
  if (!mongoose.isValidObjectId(id)) throw taoLoi(404, 'Không tìm thấy thông báo');
  const thongBao = await ThongBao.findOneAndUpdate({ _id: id, taiKhoanId, ngayDoc: null },
    { $set: { ngayDoc: new Date() } }, { returnDocument: 'after' }).select('-maSuKien').lean();
  if (thongBao) return { thongBao };
  const daDoc = await ThongBao.findOne({ _id: id, taiKhoanId }).select('-maSuKien').lean();
  if (!daDoc) throw taoLoi(404, 'Không tìm thấy thông báo');
  return { thongBao: daDoc };
};

const danhDauTatCaDaDoc = async (taiKhoanId) => {
  const ketQua = await ThongBao.updateMany({ taiKhoanId, ngayDoc: null }, { $set: { ngayDoc: new Date() } });
  return { soThongBao: ketQua.modifiedCount };
};

module.exports = { taoThongBao, layDanhSach, demChuaDoc, danhDauDaDoc, danhDauTatCaDaDoc };
