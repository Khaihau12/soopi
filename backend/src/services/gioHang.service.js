const mongoose = require('mongoose');
const GioHang = require('../models/gioHang.model');
const ChiTietGioHang = require('../models/chiTietGioHang.model');
const SanPham = require('../models/sanPham.model');
const CuaHang = require('../models/cuaHang.model');
const { gomGiaBanThucTe } = require('./giaSanPham.service');
const { TRANG_THAI_KINH_DOANH, TRANG_THAI_HOAT_DONG_CUA_HANG } = require('../constants/trangThai.constant');
const { taoLoi } = require('../utils/taoLoi');

const layHoacTaoGioHang = async (taiKhoanId) => {
  try {
    return await GioHang.findOneAndUpdate(
      { taiKhoanId }, { $setOnInsert: { taiKhoanId, tongGiaTri: 0 } },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );
  } catch (loi) {
    if (loi.code !== 11000) throw loi;
    return GioHang.findOne({ taiKhoanId });
  }
};

const kiemTraSoLuong = (soLuong) => {
  if (typeof soLuong !== 'number' || !Number.isSafeInteger(soLuong) || soLuong < 1) {
    throw taoLoi(400, 'Số lượng phải là số nguyên từ 1 trở lên');
  }
  return soLuong;
};

const lyDoKhongMua = (sanPham, cuaHang, soLuong) => {
  if (sanPham.trangThaiKinhDoanh !== TRANG_THAI_KINH_DOANH.DANG_KINH_DOANH) return 'Sản phẩm đã ngừng kinh doanh';
  if (!cuaHang || cuaHang.trangThaiHoatDong !== TRANG_THAI_HOAT_DONG_CUA_HANG.HOAT_DONG) return 'Cửa hàng tạm ngừng hoạt động';
  if (sanPham.soLuongTon < 1) return 'Đã hết hàng';
  if (soLuong > sanPham.soLuongTon) return `Chỉ còn ${sanPham.soLuongTon} sản phẩm`;
  return null;
};

const dungTrangThaiGioHang = async (taiKhoanId, { chiDoc = false } = {}) => {
  const gioHang = chiDoc ? await GioHang.findOne({ taiKhoanId }) : await layHoacTaoGioHang(taiKhoanId);
  if (!gioHang) return { gioHang: null, soLuongSanPham: 0, danhSach: [] };
  const cacDong = await ChiTietGioHang.find({ gioHangId: gioHang._id }).sort({ _id: 1 }).lean();
  const sanPham = await SanPham.find({ _id: { $in: cacDong.map((dong) => dong.sanPhamId) } }).lean();
  const theoId = new Map(sanPham.map((item) => [String(item._id), item]));
  const dongHu = cacDong.filter((dong) => !theoId.has(String(dong.sanPhamId)));
  if (dongHu.length && !chiDoc) await ChiTietGioHang.deleteMany({ gioHangId: gioHang._id, _id: { $in: dongHu.map((dong) => dong._id) } });
  const cuaHang = await CuaHang.find({ _id: { $in: sanPham.map((item) => item.cuaHangId) } }).lean();
  const cuaHangTheoId = new Map(cuaHang.map((item) => [String(item._id), item]));
  const coGia = await gomGiaBanThucTe(sanPham);
  const giaTheoId = new Map(coGia.map((item) => [String(item._id), item]));
  let tongGiaTri = 0;
  const danhSach = cacDong.flatMap((dong) => {
    const item = giaTheoId.get(String(dong.sanPhamId));
    if (!item) return [];
    const shop = cuaHangTheoId.get(String(item.cuaHangId));
    const lyDo = lyDoKhongMua(item, shop, dong.soLuong);
    if (!lyDo && dong.duocChon) tongGiaTri += dong.soLuong * item.giaBanThucTe;
    return [{
      _id: dong._id, soLuong: dong.soLuong, duocChon: dong.duocChon,
      coTheMua: !lyDo, lyDoKhongMua: lyDo,
      sanPham: {
        _id: item._id, tenSanPham: item.tenSanPham, hinhAnh: item.hinhAnh,
        giaGoc: item.giaGoc, giaBanThucTe: item.giaBanThucTe,
        khuyenMaiApDung: item.khuyenMaiApDung, soLuongTon: item.soLuongTon,
        trangThaiKinhDoanh: item.trangThaiKinhDoanh,
      },
      cuaHang: shop ? { _id: shop._id, tenCuaHang: shop.tenCuaHang, trangThaiHoatDong: shop.trangThaiHoatDong } : null,
    }];
  });
  if (!chiDoc && gioHang.tongGiaTri !== tongGiaTri) {
    await GioHang.updateOne({ _id: gioHang._id }, { $set: { tongGiaTri } });
  }
  return { gioHang: { _id: gioHang._id, tongGiaTri }, soLuongSanPham: danhSach.length, danhSach };
};

const layGioHang = dungTrangThaiGioHang;

const themSanPhamVaoGio = async (taiKhoanId, body = {}) => {
  const { sanPhamId } = body;
  const soLuongThem = kiemTraSoLuong(body.soLuong === undefined ? 1 : body.soLuong);
  if (!mongoose.isValidObjectId(sanPhamId)) throw taoLoi(404, 'Sản phẩm không tồn tại hoặc đã ngừng kinh doanh');
  const sanPham = await SanPham.findById(sanPhamId).lean();
  const cuaHang = sanPham && await CuaHang.findById(sanPham.cuaHangId).lean();
  if (!sanPham || sanPham.trangThaiKinhDoanh !== TRANG_THAI_KINH_DOANH.DANG_KINH_DOANH
      || cuaHang?.trangThaiHoatDong !== TRANG_THAI_HOAT_DONG_CUA_HANG.HOAT_DONG) {
    throw taoLoi(404, 'Sản phẩm không tồn tại hoặc đã ngừng kinh doanh');
  }
  const gioHang = await layHoacTaoGioHang(taiKhoanId);
  for (let lan = 0; lan < 5; lan++) {
    const daCo = await ChiTietGioHang.findOne({ gioHangId: gioHang._id, sanPhamId }).lean();
    if (daCo) {
      const ketQua = await ChiTietGioHang.updateOne(
        { _id: daCo._id, gioHangId: gioHang._id, soLuong: { $lte: sanPham.soLuongTon - soLuongThem } },
        { $inc: { soLuong: soLuongThem } },
      );
      if (ketQua.modifiedCount === 1) return dungTrangThaiGioHang(taiKhoanId);
      const moi = await ChiTietGioHang.findById(daCo._id).lean();
      if (!moi) continue;
      if (moi.soLuong + soLuongThem > sanPham.soLuongTon) {
        throw taoLoi(409, `Chỉ còn ${sanPham.soLuongTon} sản phẩm (trong giỏ bạn đã có ${moi.soLuong})`);
      }
      continue;
    }
    if (soLuongThem > sanPham.soLuongTon) throw taoLoi(409, `Chỉ còn ${sanPham.soLuongTon} sản phẩm (trong giỏ bạn đã có 0)`);
    try {
      await ChiTietGioHang.create({ gioHangId: gioHang._id, sanPhamId, soLuong: soLuongThem, duocChon: true });
      return dungTrangThaiGioHang(taiKhoanId);
    } catch (loi) {
      if (loi.code !== 11000) throw loi;
    }
  }
  throw taoLoi(409, 'Giỏ hàng vừa thay đổi, vui lòng thử lại');
};

const layDongCuaToi = async (taiKhoanId, id) => {
  if (!mongoose.isValidObjectId(id)) throw taoLoi(404, 'Không tìm thấy sản phẩm trong giỏ hàng');
  const gioHang = await layHoacTaoGioHang(taiKhoanId);
  const dong = await ChiTietGioHang.findOne({ _id: id, gioHangId: gioHang._id }).lean();
  if (!dong) throw taoLoi(404, 'Không tìm thấy sản phẩm trong giỏ hàng');
  return { gioHang, dong };
};

const capNhatSoLuongDongGio = async (taiKhoanId, id, body = {}) => {
  const soLuong = kiemTraSoLuong(body.soLuong);
  const { gioHang, dong } = await layDongCuaToi(taiKhoanId, id);
  const sanPham = await SanPham.findById(dong.sanPhamId).lean();
  if (!sanPham) throw taoLoi(404, 'Sản phẩm không còn tồn tại trong giỏ hàng');
  if (soLuong > sanPham.soLuongTon) throw taoLoi(409, `Chỉ còn ${sanPham.soLuongTon} sản phẩm`);
  await ChiTietGioHang.updateOne({ _id: id, gioHangId: gioHang._id }, { $set: { soLuong } });
  return dungTrangThaiGioHang(taiKhoanId);
};

const xoaDongGio = async (taiKhoanId, id) => {
  const { gioHang } = await layDongCuaToi(taiKhoanId, id);
  await ChiTietGioHang.deleteOne({ _id: id, gioHangId: gioHang._id });
  return dungTrangThaiGioHang(taiKhoanId);
};

const chonDongGio = async (taiKhoanId, body = {}) => {
  if (typeof body.duocChon !== 'boolean') throw taoLoi(400, 'Giá trị chọn sản phẩm phải là đúng hoặc sai');
  const gioHang = await layHoacTaoGioHang(taiKhoanId);
  const ids = body.chiTietGioHangIds;
  if (ids !== undefined && (!Array.isArray(ids) || ids.some((id) => !mongoose.isValidObjectId(id)))) {
    throw taoLoi(400, 'Danh sách sản phẩm cần chọn không hợp lệ');
  }
  const dieuKien = { gioHangId: gioHang._id, ...(ids === undefined ? {} : { _id: { $in: ids } }) };
  await ChiTietGioHang.updateMany(dieuKien, { $set: { duocChon: body.duocChon } });
  return dungTrangThaiGioHang(taiKhoanId);
};

module.exports = { layGioHang, themSanPhamVaoGio, capNhatSoLuongDongGio, xoaDongGio, chonDongGio, dungTrangThaiGioHang };
