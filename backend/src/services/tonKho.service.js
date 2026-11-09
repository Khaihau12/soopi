const mongoose = require('mongoose');
const SanPham = require('../models/sanPham.model');
const { taoLoi } = require('../utils/taoLoi');
const { SO_BIEN_DONG_LUU_TOI_DA } = require('../constants/tonKho.constant');

// Ghi biến động trong cùng update với số lượng để hai phần luôn khớp trên MongoDB local.
const taoDongBienDong = (soLuongThayDoi, loai, { donHangId, taiKhoanId } = {}) => ({
    loai, soLuongThayDoi, ngayTao: new Date(),
    ...(donHangId ? { donHangId } : {}), ...(taiKhoanId ? { taiKhoanId } : {}),
});
const taoCapNhatBienDong = (soLuongThayDoi, loai, thamChieu = {}) => ({
  $inc: { soLuongTon: soLuongThayDoi },
  $push: { bienDongTonKho: { $each: [taoDongBienDong(soLuongThayDoi, loai, thamChieu)],
    $slice: -SO_BIEN_DONG_LUU_TOI_DA } },
});

const layLichSuTonKho = async (cuaHangId, id, query = {}) => {
  if (!mongoose.isValidObjectId(id)) throw taoLoi(404, 'Không tìm thấy sản phẩm');
  const trang = Number(query.trang ?? 1);
  const gioiHan = Number(query.gioiHan ?? 10);
  if (!Number.isSafeInteger(trang) || trang < 1 || !Number.isSafeInteger(gioiHan) || gioiHan < 1 || gioiHan > 20) {
    throw taoLoi(400, 'Trang phải là số nguyên dương và giới hạn từ 1 đến 20');
  }
  const sanPham = await SanPham.findOne({ _id: id, cuaHangId })
    .select('tenSanPham soLuongTon nguongCanhBaoTon +bienDongTonKho').lean();
  if (!sanPham) throw taoLoi(404, 'Không tìm thấy sản phẩm');
  const tatCa = [...(sanPham.bienDongTonKho || [])].reverse();
  let soLuongSau = sanPham.soLuongTon;
  const danhSachDayDu = tatCa.map((dong) => {
    const ketQua = { _id: dong._id, loai: dong.loai, soLuongThayDoi: dong.soLuongThayDoi,
      soLuongTruoc: soLuongSau - dong.soLuongThayDoi, soLuongSau, ngayTao: dong.ngayTao,
      donHangId: dong.donHangId || null };
    soLuongSau -= dong.soLuongThayDoi;
    return ketQua;
  });
  return {
    sanPham: { _id: sanPham._id, tenSanPham: sanPham.tenSanPham, soLuongTon: sanPham.soLuongTon,
      nguongCanhBaoTon: sanPham.nguongCanhBaoTon },
    danhSach: danhSachDayDu.slice((trang - 1) * gioiHan, trang * gioiHan),
    phanTrang: { trang, gioiHan, tongSo: tatCa.length, tongTrang: Math.ceil(tatCa.length / gioiHan) },
  };
};

module.exports = { taoDongBienDong, taoCapNhatBienDong, layLichSuTonKho };
