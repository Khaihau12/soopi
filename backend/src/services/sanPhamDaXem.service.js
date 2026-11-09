const mongoose = require('mongoose');
const TaiKhoan = require('../models/taiKhoan.model');
const SanPham = require('../models/sanPham.model');
const CuaHang = require('../models/cuaHang.model');
const { TRANG_THAI_KINH_DOANH, TRANG_THAI_HOAT_DONG_CUA_HANG } = require('../constants/trangThai.constant');
const { gomGiaBanThucTe } = require('./giaSanPham.service');
const { taoLoi } = require('../utils/taoLoi');

const SO_SAN_PHAM_LUU_TOI_DA = 8;

const kiemTraId = (sanPhamId) => {
  if (!mongoose.isValidObjectId(sanPhamId)) throw taoLoi(400, 'ID sản phẩm không hợp lệ.');
  return new mongoose.Types.ObjectId(sanPhamId);
};

const ghiNhan = async (taiKhoanId, sanPhamId) => {
  const id = kiemTraId(sanPhamId);
  const sanPham = await SanPham.findOne({ _id: id, trangThaiKinhDoanh: TRANG_THAI_KINH_DOANH.DANG_KINH_DOANH }, 'cuaHangId').lean();
  if (!sanPham || !await CuaHang.exists({ _id: sanPham.cuaHangId,
    trangThaiHoatDong: TRANG_THAI_HOAT_DONG_CUA_HANG.HOAT_DONG })) {
    throw taoLoi(404, 'Sản phẩm không tồn tại hoặc đã ngừng kinh doanh.');
  }
  // Cập nhật một lần để nhiều tab không tạo ID trùng hoặc làm lịch sử vượt giới hạn.
  await TaiKhoan.updateOne({ _id: taiKhoanId }, [{ $set: { sanPhamDaXem: { $slice: [{ $concatArrays: [
    [id], { $filter: { input: { $ifNull: ['$sanPhamDaXem', []] }, as: 'muc', cond: { $ne: ['$$muc', id] } } },
  ] }, SO_SAN_PHAM_LUU_TOI_DA] } } }], { updatePipeline: true });
};

const layDanhSach = async (taiKhoanId) => {
  const taiKhoan = await TaiKhoan.findById(taiKhoanId).select('+sanPhamDaXem').lean();
  if (!taiKhoan) throw taoLoi(401, 'Vui lòng đăng nhập để tiếp tục');
  const ids = taiKhoan.sanPhamDaXem || [];
  if (!ids.length) return [];
  const cuaHangIds = (await CuaHang.find({ trangThaiHoatDong: TRANG_THAI_HOAT_DONG_CUA_HANG.HOAT_DONG }).distinct('_id'))
    .filter((id) => mongoose.isValidObjectId(id));
  const sanPham = await SanPham.find({ _id: { $in: ids }, cuaHangId: { $in: cuaHangIds },
    trangThaiKinhDoanh: TRANG_THAI_KINH_DOANH.DANG_KINH_DOANH },
  '_id tenSanPham hinhAnh giaGoc soLuongTon cuaHangId').lean();
  const coGia = await gomGiaBanThucTe(sanPham);
  const theoId = new Map(coGia.map((muc) => [String(muc._id), muc]));
  return ids.map((id) => theoId.get(String(id))).filter(Boolean);
};

module.exports = { ghiNhan, layDanhSach };
