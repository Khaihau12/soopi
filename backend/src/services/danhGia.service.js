const mongoose = require('mongoose');
const DanhGia = require('../models/danhGia.model');
const DonHang = require('../models/donHang.model');
const ChiTietDonHang = require('../models/chiTietDonHang.model');
const SanPham = require('../models/sanPham.model');
const TaiKhoan = require('../models/taiKhoan.model');
const { DO_DAI_TOI_DA, PHAN_TRANG } = require('../constants/cauHinh.constant');
const { TRANG_THAI_XU_LY } = require('../constants/trangThai.constant');
const { taoLoi } = require('../utils/taoLoi');

const kiemTraSanPhamId = (id) => {
  if (!mongoose.isValidObjectId(id)) throw taoLoi(400, 'ID sản phẩm không hợp lệ');
  return id;
};

const docPhanTrang = ({ trang, gioiHan } = {}) => {
  for (const giaTri of [trang, gioiHan]) {
    if (giaTri !== undefined && (!/^\d+$/.test(String(giaTri)) || !Number.isSafeInteger(Number(giaTri)) || Number(giaTri) < 1)) {
      throw taoLoi(400, 'Trang và giới hạn phải là số nguyên dương');
    }
  }
  return { trang: Number(trang || 1), gioiHan: Math.min(Number(gioiHan || PHAN_TRANG.MAC_DINH), PHAN_TRANG.TOI_DA) };
};

const kiemTraSoSao = (soSao) => {
  if (typeof soSao !== 'number' || !Number.isInteger(soSao) || soSao < 1 || soSao > 5) {
    throw taoLoi(400, 'Số sao phải là số nguyên từ 1 đến 5');
  }
  return soSao;
};

const tinhThongKeDanhGia = async (sanPhamId) => {
  // MongoDB nhóm trực tiếp theo sản phẩm, không tải toàn bộ đánh giá về ứng dụng.
  const [thongKe] = await DanhGia.aggregate([
    { $match: { sanPhamId: new mongoose.Types.ObjectId(String(sanPhamId)) } },
    { $group: {
      _id: null,
      soDanhGia: { $sum: 1 },
      tongSoSao: { $sum: '$soSao' },
      sao1: { $sum: { $cond: [{ $eq: ['$soSao', 1] }, 1, 0] } },
      sao2: { $sum: { $cond: [{ $eq: ['$soSao', 2] }, 1, 0] } },
      sao3: { $sum: { $cond: [{ $eq: ['$soSao', 3] }, 1, 0] } },
      sao4: { $sum: { $cond: [{ $eq: ['$soSao', 4] }, 1, 0] } },
      sao5: { $sum: { $cond: [{ $eq: ['$soSao', 5] }, 1, 0] } },
    } },
  ]);
  return { diemTrungBinh: thongKe ? Math.round(thongKe.tongSoSao / thongKe.soDanhGia * 10) / 10 : 0,
    soDanhGia: thongKe?.soDanhGia || 0,
    phanBoSao: { 1: thongKe?.sao1 || 0, 2: thongKe?.sao2 || 0, 3: thongKe?.sao3 || 0,
      4: thongKe?.sao4 || 0, 5: thongKe?.sao5 || 0 } };
};

const dungDanhSachDanhGia = async (dieuKien, phanTrang, hienSanPham = false) => {
  const { trang, gioiHan } = phanTrang;
  const [tongSo, cacDanhGia] = await Promise.all([
    DanhGia.countDocuments(dieuKien),
    DanhGia.find(dieuKien).select('_id soSao noiDung ngayDanhGia taiKhoanId sanPhamId')
      .sort({ ngayDanhGia: -1, _id: -1 }).skip((trang - 1) * gioiHan).limit(gioiHan).lean(),
  ]);
  const [cacTaiKhoan, cacSanPham] = await Promise.all([
    TaiKhoan.find({ _id: { $in: cacDanhGia.map((item) => item.taiKhoanId) } }).select('_id hoTen').lean(),
    hienSanPham ? SanPham.find({ _id: { $in: cacDanhGia.map((item) => item.sanPhamId) } }).select('_id tenSanPham hinhAnh').lean() : [],
  ]);
  const taiKhoanTheoId = new Map(cacTaiKhoan.map((item) => [String(item._id), item]));
  const sanPhamTheoId = new Map(cacSanPham.map((item) => [String(item._id), item]));
  return {
    danhSach: cacDanhGia.map((item) => ({ _id: item._id, soSao: item.soSao, noiDung: item.noiDung,
      ngayDanhGia: item.ngayDanhGia, taiKhoan: { hoTen: taiKhoanTheoId.get(String(item.taiKhoanId))?.hoTen || 'Người mua' },
      ...(hienSanPham ? { sanPham: sanPhamTheoId.get(String(item.sanPhamId)) ||
        { _id: item.sanPhamId, tenSanPham: 'Sản phẩm không còn hiển thị', hinhAnh: [] } } : {}) })),
    phanTrang: { trang, gioiHan, tongSo, tongTrang: Math.ceil(tongSo / gioiHan) },
  };
};

const layDanhSachDanhGia = async (query = {}) => {
  const sanPhamId = kiemTraSanPhamId(query.sanPhamId);
  const phanTrang = docPhanTrang(query);
  const [danhSach, thongKe] = await Promise.all([
    dungDanhSachDanhGia({ sanPhamId }, phanTrang),
    tinhThongKeDanhGia(sanPhamId),
  ]);
  return { ...danhSach, thongKe };
};

const layDongCoTheDanhGia = async (taiKhoanId, sanPhamId) => {
  kiemTraSanPhamId(sanPhamId);
  const cacDon = await DonHang.find({ taiKhoanId, trangThaiXuLy: TRANG_THAI_XU_LY.HOAN_THANH })
    .select('_id ngayTao').lean();
  const cacDong = await ChiTietDonHang.find({ donHangId: { $in: cacDon.map((don) => don._id) }, sanPhamId })
    .select('_id donHangId').lean();
  const daDanhGia = await DanhGia.find({ chiTietDonHangId: { $in: cacDong.map((dong) => dong._id) } })
    .select('chiTietDonHangId').lean();
  const daDanhGiaIds = new Set(daDanhGia.map((item) => String(item.chiTietDonHangId)));
  const donTheoId = new Map(cacDon.map((don) => [String(don._id), don]));
  return cacDong.filter((dong) => !daDanhGiaIds.has(String(dong._id)))
    .map((dong) => ({ chiTietDonHangId: dong._id, donHangId: dong.donHangId,
      ngayTao: donTheoId.get(String(dong.donHangId))?.ngayTao }))
    .sort((a, b) => new Date(b.ngayTao) - new Date(a.ngayTao));
};

const taoDanhGia = async (taiKhoanId, body = {}) => {
  const chiTietDonHangId = body?.chiTietDonHangId;
  if (!mongoose.isValidObjectId(chiTietDonHangId)) throw taoLoi(404, 'Không tìm thấy sản phẩm trong đơn hàng của bạn');
  const dong = await ChiTietDonHang.findById(chiTietDonHangId).lean();
  const donHang = dong && await DonHang.findOne({ _id: dong.donHangId, taiKhoanId }).lean();
  if (!donHang) throw taoLoi(404, 'Không tìm thấy sản phẩm trong đơn hàng của bạn');
  if (donHang.trangThaiXuLy !== TRANG_THAI_XU_LY.HOAN_THANH) {
    throw taoLoi(409, 'Bạn chỉ có thể đánh giá sau khi đơn hàng hoàn thành');
  }
  const soSao = kiemTraSoSao(body.soSao);
  if (typeof body.noiDung !== 'string' || !body.noiDung.trim()) throw taoLoi(400, 'Vui lòng nhập nội dung đánh giá');
  const noiDung = body.noiDung.trim();
  if (noiDung.length > DO_DAI_TOI_DA.NOI_DUNG) throw taoLoi(400, `Nội dung đánh giá không được quá ${DO_DAI_TOI_DA.NOI_DUNG} ký tự`);
  if (await DanhGia.exists({ chiTietDonHangId })) throw taoLoi(409, 'Bạn đã đánh giá sản phẩm này');
  try {
    const danhGia = await DanhGia.create({ chiTietDonHangId, taiKhoanId, sanPhamId: dong.sanPhamId,
      soSao, noiDung, ngayDanhGia: new Date() });
    return { _id: danhGia._id, chiTietDonHangId: danhGia.chiTietDonHangId,
      soSao: danhGia.soSao, noiDung: danhGia.noiDung, ngayDanhGia: danhGia.ngayDanhGia };
  } catch (loi) {
    if (loi.code === 11000) throw taoLoi(409, 'Bạn đã đánh giá sản phẩm này');
    throw loi;
  }
};

const nguoiBanLayDanhSachDanhGia = async (cuaHangId, query = {}) => {
  const { sanPhamId, soSao } = query;
  const phanTrang = docPhanTrang(query);
  if (sanPhamId && !mongoose.isValidObjectId(sanPhamId)) throw taoLoi(404, 'Không tìm thấy sản phẩm của cửa hàng');
  if (soSao !== undefined && (!/^[1-5]$/.test(String(soSao)))) throw taoLoi(400, 'Số sao lọc phải từ 1 đến 5');
  let cacId;
  if (sanPhamId) {
    const sanPham = await SanPham.findOne({ _id: sanPhamId, cuaHangId }).select('_id').lean();
    if (!sanPham) throw taoLoi(404, 'Không tìm thấy sản phẩm của cửa hàng');
    cacId = [sanPham._id];
  } else cacId = await SanPham.find({ cuaHangId }).distinct('_id');
  const dieuKien = { sanPhamId: { $in: cacId }, ...(soSao ? { soSao: Number(soSao) } : {}) };
  const [danhSach, thongKe] = await Promise.all([
    dungDanhSachDanhGia(dieuKien, phanTrang, true),
    sanPhamId ? tinhThongKeDanhGia(sanPhamId) : null,
  ]);
  return { ...danhSach, ...(thongKe ? { thongKe } : {}) };
};

module.exports = { layDanhSachDanhGia, layDongCoTheDanhGia, taoDanhGia,
  nguoiBanLayDanhSachDanhGia, tinhThongKeDanhGia };
