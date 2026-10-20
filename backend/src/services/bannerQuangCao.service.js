const BannerQuangCao = require('../models/bannerQuangCao.model');
const { TRANG_THAI_BANNER } = require('../constants/trangThai.constant');
const mongoose = require('mongoose');
const { PHAN_TRANG, DO_DAI_TOI_DA } = require('../constants/cauHinh.constant');
const { laDuongDanAnhHopLe } = require('../utils/kiemTra');
const { taoLoi } = require('../utils/taoLoi');
const { donAnhCu } = require('./anhCloudinary.service');

const layDanhSachBanner = () => BannerQuangCao.find({ trangThai: TRANG_THAI_BANNER.KICH_HOAT }, '_id tieuDe hinhAnh noiDung').sort({ _id: -1 }).lean();

const docPhanTrang = (query) => {
  const trang = Number(query.trang ?? 1);
  const gioiHan = Number(query.gioiHan ?? PHAN_TRANG.MAC_DINH);
  if (!Number.isSafeInteger(trang) || trang < 1 || !Number.isSafeInteger(gioiHan) || gioiHan < 1) throw taoLoi(400, 'Trang và giới hạn phải là số nguyên dương.');
  return { trang, gioiHan: Math.min(gioiHan, PHAN_TRANG.TOI_DA) };
};
const kiemTraId = (id) => { if (!mongoose.isValidObjectId(id)) throw taoLoi(400, 'ID banner không hợp lệ.'); };
const kiemTraChuoi = (giaTri, ten, toiDa, batBuoc = false) => {
  if (typeof giaTri !== 'string' || (batBuoc && !giaTri.trim()) || giaTri.trim().length > toiDa) throw taoLoi(400, `${ten} không hợp lệ hoặc vượt quá ${toiDa} ký tự.`);
  return giaTri.trim();
};
const kiemTraTrangThai = (trangThai) => {
  if (!Object.values(TRANG_THAI_BANNER).includes(trangThai)) throw taoLoi(400, 'Trạng thái banner không hợp lệ.');
  return trangThai;
};
const kiemTraHinhAnh = (hinhAnh) => {
  if (!laDuongDanAnhHopLe(hinhAnh)) throw taoLoi(400, 'Hình ảnh banner không hợp lệ. Vui lòng tải ảnh JPG, PNG, WEBP hoặc nhập URL http(s).');
  return hinhAnh;
};
const quanTriLayDanhSachBanner = async (query = {}) => {
  if (query.trangThai) kiemTraTrangThai(query.trangThai);
  const { trang, gioiHan } = docPhanTrang(query);
  const dieuKien = query.trangThai ? { trangThai: query.trangThai } : {};
  const [tongSo, danhSach] = await Promise.all([
    BannerQuangCao.countDocuments(dieuKien),
    BannerQuangCao.find(dieuKien, '_id tieuDe hinhAnh noiDung trangThai').sort({ _id: -1 }).skip((trang - 1) * gioiHan).limit(gioiHan).lean(),
  ]);
  return { danhSach, phanTrang: { trang, gioiHan, tongSo, tongTrang: Math.ceil(tongSo / gioiHan) } };
};
const quanTriTaoBanner = async (body = {}) => {
  const duLieu = {
    tieuDe: kiemTraChuoi(body.tieuDe, 'Tiêu đề banner', 200, true),
    hinhAnh: kiemTraHinhAnh(body.hinhAnh),
    noiDung: body.noiDung === undefined ? '' : kiemTraChuoi(body.noiDung, 'Nội dung banner', DO_DAI_TOI_DA.NOI_DUNG),
    trangThai: body.trangThai === undefined ? TRANG_THAI_BANNER.KICH_HOAT : kiemTraTrangThai(body.trangThai),
  };
  return BannerQuangCao.create(duLieu);
};
const quanTriCapNhatBanner = async (id, body = {}) => {
  kiemTraId(id);
  const banCu = await BannerQuangCao.findById(id).select('hinhAnh').lean();
  const capNhat = {};
  if (Object.hasOwn(body, 'tieuDe')) capNhat.tieuDe = kiemTraChuoi(body.tieuDe, 'Tiêu đề banner', 200, true);
  if (Object.hasOwn(body, 'hinhAnh')) capNhat.hinhAnh = kiemTraHinhAnh(body.hinhAnh);
  if (Object.hasOwn(body, 'noiDung')) capNhat.noiDung = kiemTraChuoi(body.noiDung, 'Nội dung banner', DO_DAI_TOI_DA.NOI_DUNG);
  if (!Object.keys(capNhat).length) throw taoLoi(400, 'Vui lòng chọn thông tin banner cần cập nhật.');
  const banner = await BannerQuangCao.findByIdAndUpdate(id, { $set: capNhat }, { returnDocument: 'after', runValidators: true });
  if (!banner) throw taoLoi(404, 'Không tìm thấy banner.');
  if (capNhat.hinhAnh) await donAnhCu([banCu.hinhAnh], [capNhat.hinhAnh]);
  return banner;
};
const quanTriCapNhatTrangThaiBanner = async (id, trangThai) => {
  kiemTraId(id); kiemTraTrangThai(trangThai);
  const banner = await BannerQuangCao.findByIdAndUpdate(id, { $set: { trangThai } }, { returnDocument: 'after', runValidators: true });
  if (!banner) throw taoLoi(404, 'Không tìm thấy banner.');
  return banner;
};
const quanTriXoaBanner = async (id) => {
  kiemTraId(id);
  const banner = await BannerQuangCao.findByIdAndDelete(id);
  if (!banner) throw taoLoi(404, 'Không tìm thấy banner.');
  await donAnhCu([banner.hinhAnh]);
};

module.exports = { layDanhSachBanner, quanTriLayDanhSachBanner, quanTriTaoBanner, quanTriCapNhatBanner, quanTriCapNhatTrangThaiBanner, quanTriXoaBanner };
