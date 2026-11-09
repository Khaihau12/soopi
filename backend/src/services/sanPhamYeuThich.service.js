const mongoose = require('mongoose');
const SanPhamYeuThich = require('../models/sanPhamYeuThich.model');
const SanPham = require('../models/sanPham.model');
const CuaHang = require('../models/cuaHang.model');
const { gomGiaBanThucTe } = require('./giaSanPham.service');
const { TRANG_THAI_KINH_DOANH, TRANG_THAI_HOAT_DONG_CUA_HANG } = require('../constants/trangThai.constant');
const { PHAN_TRANG } = require('../constants/cauHinh.constant');
const { taoLoi } = require('../utils/taoLoi');

const kiemTraId = (id) => {
  if (!mongoose.isValidObjectId(id)) throw taoLoi(400, 'ID sản phẩm không hợp lệ');
};

const layTrang = (query = {}) => {
  const trang = query.trang === undefined ? 1 : Number(query.trang);
  if (!Number.isSafeInteger(trang) || trang < 1) throw taoLoi(400, 'Trang không hợp lệ');
  return trang;
};

const layDanhSach = async (taiKhoanId, query = {}) => {
  const trang = layTrang(query);
  const gioiHan = PHAN_TRANG.MAC_DINH;
  const [tongSo, daLuu] = await Promise.all([
    SanPhamYeuThich.countDocuments({ taiKhoanId }),
    SanPhamYeuThich.find({ taiKhoanId }).sort({ ngayLuu: -1, _id: -1 })
      .skip((trang - 1) * gioiHan).limit(gioiHan).lean(),
  ]);
  const sanPham = await SanPham.find({ _id: { $in: daLuu.map((item) => item.sanPhamId) } })
    .select('_id tenSanPham hinhAnh giaGoc soLuongTon trangThaiKinhDoanh cuaHangId').lean();
  const cuaHang = await CuaHang.find({ _id: { $in: sanPham.map((item) => item.cuaHangId) } })
    .select('_id tenCuaHang trangThaiHoatDong').lean();
  const cuaHangTheoId = new Map(cuaHang.map((item) => [String(item._id), item]));
  const coGia = await gomGiaBanThucTe(sanPham);
  const sanPhamTheoId = new Map(coGia.map((item) => [String(item._id), item]));
  return { danhSach: daLuu.map((item) => {
    const sanPhamDaLuu = sanPhamTheoId.get(String(item.sanPhamId));
    const shop = sanPhamDaLuu && cuaHangTheoId.get(String(sanPhamDaLuu.cuaHangId));
    const conBan = sanPhamDaLuu?.trangThaiKinhDoanh === TRANG_THAI_KINH_DOANH.DANG_KINH_DOANH
      && shop?.trangThaiHoatDong === TRANG_THAI_HOAT_DONG_CUA_HANG.HOAT_DONG;
    return { _id: item._id, sanPhamId: item.sanPhamId, ngayLuu: item.ngayLuu, conBan: Boolean(conBan),
      sanPham: sanPhamDaLuu ? { _id: sanPhamDaLuu._id, tenSanPham: sanPhamDaLuu.tenSanPham,
        hinhAnh: sanPhamDaLuu.hinhAnh, giaGoc: sanPhamDaLuu.giaGoc,
        giaBanThucTe: sanPhamDaLuu.giaBanThucTe, soLuongTon: sanPhamDaLuu.soLuongTon,
        cuaHang: shop ? { _id: shop._id, tenCuaHang: shop.tenCuaHang } : null } : null };
  }), phanTrang: { trang, gioiHan, tongSo, tongTrang: Math.ceil(tongSo / gioiHan) } };
};

const layTrangThai = async (taiKhoanId, sanPhamId) => {
  kiemTraId(sanPhamId);
  return { daLuu: Boolean(await SanPhamYeuThich.exists({ taiKhoanId, sanPhamId })) };
};

const layCacIdDaLuu = async (taiKhoanId) => ({ danhSachId: (await SanPhamYeuThich.distinct('sanPhamId', { taiKhoanId })).map(String) });

const luuSanPham = async (taiKhoanId, sanPhamId) => {
  kiemTraId(sanPhamId);
  const sanPham = await SanPham.findById(sanPhamId).select('cuaHangId trangThaiKinhDoanh').lean();
  const shop = sanPham && await CuaHang.findById(sanPham.cuaHangId).select('trangThaiHoatDong').lean();
  if (!sanPham || sanPham.trangThaiKinhDoanh !== TRANG_THAI_KINH_DOANH.DANG_KINH_DOANH
    || shop?.trangThaiHoatDong !== TRANG_THAI_HOAT_DONG_CUA_HANG.HOAT_DONG) {
    throw taoLoi(404, 'Sản phẩm không còn được bán');
  }
  try {
    await SanPhamYeuThich.updateOne({ taiKhoanId, sanPhamId },
      { $setOnInsert: { taiKhoanId, sanPhamId, ngayLuu: new Date() } }, { upsert: true });
  } catch (loi) { if (loi.code !== 11000) throw loi; }
  return { daLuu: true };
};

const boLuuSanPham = async (taiKhoanId, sanPhamId) => {
  kiemTraId(sanPhamId);
  await SanPhamYeuThich.deleteOne({ taiKhoanId, sanPhamId });
  return { daLuu: false };
};

module.exports = { layDanhSach, layTrangThai, layCacIdDaLuu, luuSanPham, boLuuSanPham };
