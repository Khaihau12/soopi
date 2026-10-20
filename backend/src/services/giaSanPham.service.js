const mongoose = require('mongoose');
const KhuyenMai = require('../models/khuyenMai.model');
const ChiTietKhuyenMai = require('../models/chiTietKhuyenMai.model');
const { TRANG_THAI_KHUYEN_MAI } = require('../constants/trangThai.constant');

const gomGiaBanThucTe = async (danhSachSanPham, thoiDiem = new Date()) => {
  if (!danhSachSanPham.length) return [];
  const sanPhamIds = danhSachSanPham.map((sanPham) => sanPham._id);
  const khuyenMai = (await KhuyenMai.find({
    ngayBatDau: { $lte: thoiDiem },
    ngayKetThuc: { $gte: thoiDiem },
    trangThai: { $ne: TRANG_THAI_KHUYEN_MAI.DA_KET_THUC },
  }).select('_id tenKhuyenMai loaiKhuyenMai ngayKetThuc').lean())
    .filter((item) => mongoose.isValidObjectId(item._id));
  const chiTiet = khuyenMai.length ? await ChiTietKhuyenMai.find({
    khuyenMaiId: { $in: khuyenMai.map((item) => item._id) },
    sanPhamId: { $in: sanPhamIds },
  }).select('sanPhamId khuyenMaiId giaKhuyenMai tyLeGiam').lean() : [];
  const thongTinKhuyenMai = new Map(khuyenMai.map((item) => [item._id.toString(), item]));
  const chiTietTheoSanPham = new Map();
  for (const item of chiTiet) {
    const key = item.sanPhamId.toString();
    if (!chiTietTheoSanPham.has(key)) chiTietTheoSanPham.set(key, []);
    chiTietTheoSanPham.get(key).push(item);
  }

  return danhSachSanPham.map((sanPham) => {
    const duLieu = typeof sanPham.toObject === 'function' ? sanPham.toObject() : sanPham;
    const giaGoc = duLieu.giaGoc;
    const cacMuc = (chiTietTheoSanPham.get(duLieu._id.toString()) || []).map((item) => {
      const chuongTrinh = thongTinKhuyenMai.get(item.khuyenMaiId.toString());
      const giaTinh = Number.isFinite(item.giaKhuyenMai)
        ? item.giaKhuyenMai
        : Number.isFinite(item.tyLeGiam) ? Math.round(giaGoc * (100 - item.tyLeGiam) / 100) : giaGoc;
      return {
        gia: Math.max(0, Math.min(giaGoc, Math.round(giaTinh))),
        thongTin: {
          khuyenMaiId: chuongTrinh._id,
          tenKhuyenMai: chuongTrinh.tenKhuyenMai,
          loaiKhuyenMai: chuongTrinh.loaiKhuyenMai,
          ngayKetThuc: chuongTrinh.ngayKetThuc,
        },
      };
    }).sort((a, b) => a.gia - b.gia);
    return {
      ...duLieu,
      giaBanThucTe: cacMuc[0]?.gia ?? giaGoc,
      khuyenMaiApDung: cacMuc[0]?.thongTin ?? null,
      khuyenMaiDangApDung: cacMuc.map((muc) => muc.thongTin),
    };
  });
};

module.exports = { gomGiaBanThucTe };
