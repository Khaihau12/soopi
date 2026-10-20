const mongoose = require('mongoose');
const DonHang = require('../models/donHang.model');
const TaiKhoan = require('../models/taiKhoan.model');
const CuaHang = require('../models/cuaHang.model');
const SanPham = require('../models/sanPham.model');
const YeuCauDangKyNguoiBan = require('../models/yeuCauDangKyNguoiBan.model');
const { PHAN_TRANG } = require('../constants/cauHinh.constant');
const { TRANG_THAI_XU_LY, TRANG_THAI_THANH_TOAN_DON, PHUONG_THUC_THANH_TOAN, TRANG_THAI_KINH_DOANH, TRANG_THAI_YEU_CAU_NGUOI_BAN } = require('../constants/trangThai.constant');
const { VAI_TRO } = require('../constants/vaiTro.constant');
const { taoLoi } = require('../utils/taoLoi');
const { layKhoangThongKe, dienMocTrong } = require('../utils/mocThongKe');

const idCuaHang = (cuaHang) => new mongoose.Types.ObjectId(String(cuaHang._id));
const locHoanThanh = (cuaHang, khoang) => [
  { $match: { cuaHangId: idCuaHang(cuaHang) } },
  // Đơn cũ chưa có ngày hoàn thành được tính theo ngày tạo.
  { $addFields: { ngayThongKe: { $ifNull: ['$ngayHoanThanh', '$ngayTao'] } } },
  { $match: { trangThaiXuLy: TRANG_THAI_XU_LY.HOAN_THANH, trangThaiThanhToan: TRANG_THAI_THANH_TOAN_DON.DA_THANH_TOAN, ngayThongKe: khoang } },
];

const noiChiTiet = [
  { $lookup: { from: 'ChiTietDonHang', localField: '_id', foreignField: 'donHangId', as: 'chiTiet' } },
  { $unwind: '$chiTiet' },
];

const nguoiBanLayTongQuan = async (cuaHang, query) => {
  const { tuNgay, denNgay, khoang } = layKhoangThongKe(query);
  const [tong, sanPham, choXacNhan] = await Promise.all([
    DonHang.aggregate([...locHoanThanh(cuaHang, khoang), { $group: { _id: null, tongDoanhThu: { $sum: '$tongThanhToan' }, soDonHoanThanh: { $sum: 1 } } }]),
    DonHang.aggregate([...locHoanThanh(cuaHang, khoang), ...noiChiTiet, { $group: { _id: null, soSanPhamDaBan: { $sum: '$chiTiet.soLuong' } } }]),
    DonHang.countDocuments({ cuaHangId: idCuaHang(cuaHang), trangThaiXuLy: TRANG_THAI_XU_LY.CHO_XAC_NHAN,
      $or: [{ trangThaiThanhToan: TRANG_THAI_THANH_TOAN_DON.DA_THANH_TOAN }, { phuongThucThanhToan: PHUONG_THUC_THANH_TOAN.COD, trangThaiThanhToan: TRANG_THAI_THANH_TOAN_DON.CHO_THANH_TOAN }] }),
  ]);
  return { khoangThoiGian: { tuNgay, denNgay }, tongDoanhThu: tong[0]?.tongDoanhThu || 0,
    soDonHoanThanh: tong[0]?.soDonHoanThanh || 0, soSanPhamDaBan: sanPham[0]?.soSanPhamDaBan || 0, soDonChoXacNhan: choXacNhan };
};

const nguoiBanLayDoanhThu = async (cuaHang, query) => {
  const { tuNgay, denNgay, khoang } = layKhoangThongKe(query);
  const nhom = query.nhom || 'ngay';
  if (!['ngay', 'thang'].includes(nhom)) throw taoLoi(400, 'Kiểu nhóm phải là ngày hoặc tháng');
  const danhSach = await DonHang.aggregate([...locHoanThanh(cuaHang, khoang),
    { $group: { _id: { $dateToString: { format: nhom === 'thang' ? '%Y-%m' : '%Y-%m-%d', date: '$ngayThongKe', timezone: 'Asia/Ho_Chi_Minh' } }, doanhThu: { $sum: '$tongThanhToan' }, soDon: { $sum: 1 } } },
    { $project: { _id: 0, moc: '$_id', doanhThu: 1, soDon: 1 } }, { $sort: { moc: 1 } },
  ]);
  return { nhom, danhSach: dienMocTrong(danhSach, tuNgay, denNgay, nhom) };
};

const nguoiBanLaySanPhamBanChay = async (cuaHang, query) => {
  const { khoang } = layKhoangThongKe(query);
  const gioiHan = query.gioiHan === undefined ? 5 : Number(query.gioiHan);
  if (!Number.isInteger(gioiHan) || gioiHan < 1 || gioiHan > 20) throw taoLoi(400, 'Giới hạn sản phẩm phải từ 1 đến 20');
  const danhSach = await DonHang.aggregate([...locHoanThanh(cuaHang, khoang), ...noiChiTiet,
    { $group: { _id: '$chiTiet.sanPhamId', soLuongDaBan: { $sum: '$chiTiet.soLuong' }, doanhThu: { $sum: '$chiTiet.thanhTien' } } },
    { $sort: { soLuongDaBan: -1, doanhThu: -1, _id: 1 } }, { $limit: gioiHan },
    { $lookup: { from: 'SanPham', localField: '_id', foreignField: '_id', as: 'sanPham' } },
    { $project: { _id: 0, soLuongDaBan: 1, doanhThu: 1, sanPhamId: { $arrayElemAt: ['$sanPham._id', 0] }, tenSanPham: { $arrayElemAt: ['$sanPham.tenSanPham', 0] }, hinhAnh: { $arrayElemAt: ['$sanPham.hinhAnh', 0] } } },
  ]);
  return { danhSach: danhSach.map(({ soLuongDaBan, doanhThu, sanPhamId, tenSanPham, hinhAnh }) => ({
    sanPham: { _id: sanPhamId, tenSanPham, hinhAnh: hinhAnh || [] }, soLuongDaBan, doanhThu,
  })) };
};

const docSoTrang = (giaTri, macDinh, toiDa) => {
  const so = giaTri === undefined ? macDinh : Number(giaTri);
  if (!Number.isInteger(so) || so < 1 || so > toiDa) throw taoLoi(400, 'Phân trang không hợp lệ');
  return so;
};

const nguoiBanLayLichSuGiaoDich = async (cuaHang, query) => {
  const { khoang } = layKhoangThongKe(query);
  const trang = docSoTrang(query.trang, 1, 1000000);
  const gioiHan = docSoTrang(query.gioiHan, PHAN_TRANG.MAC_DINH, PHAN_TRANG.TOI_DA);
  const [ketQua] = await DonHang.aggregate([
    { $match: { cuaHangId: idCuaHang(cuaHang), trangThaiThanhToan: TRANG_THAI_THANH_TOAN_DON.DA_THANH_TOAN, ngayTao: khoang } },
    { $sort: { ngayTao: -1, _id: -1 } },
    { $facet: { tong: [{ $count: 'soLuong' }], danhSach: [
      { $skip: (trang - 1) * gioiHan }, { $limit: gioiHan },
      { $lookup: { from: 'TaiKhoan', localField: 'taiKhoanId', foreignField: '_id', as: 'nguoiMua' } },
      { $lookup: { from: 'GiaoDichThanhToan', localField: 'giaoDichId', foreignField: '_id', as: 'giaoDich' } },
      { $project: { ngayTao: 1, tongThanhToan: 1, trangThaiXuLy: 1,
        hoTen: { $arrayElemAt: ['$nguoiMua.hoTen', 0] },
        maGiaoDich: { $arrayElemAt: ['$giaoDich.maGiaoDich', 0] } } },
    ] } },
  ]);
  const tong = ketQua.tong[0]?.soLuong || 0;
  return { danhSach: ketQua.danhSach.map(({ hoTen, ...don }) => ({ ...don, nguoiMua: { hoTen } })),
    phanTrang: { trang, gioiHan, tong, tongTrang: Math.ceil(tong / gioiHan) } };
};

const locHoanThanhToanSan = (khoang) => [
  { $match: { trangThaiXuLy: TRANG_THAI_XU_LY.HOAN_THANH, trangThaiThanhToan: TRANG_THAI_THANH_TOAN_DON.DA_THANH_TOAN } },
  // Dữ liệu cũ thiếu ngày hoàn thành được quy về ngày tạo đơn.
  { $addFields: { ngayThongKe: { $ifNull: ['$ngayHoanThanh', '$ngayTao'] } } },
  { $match: { ngayThongKe: khoang } },
];

const tongHopDon = (khoang) => DonHang.aggregate([...locHoanThanhToanSan(khoang),
  { $group: { _id: null, doanhThu: { $sum: '$tongThanhToan' }, soDon: { $sum: 1 } } },
]);

const soSanhKy = (hienTai, truoc) => truoc === 0 ? null : Math.round((hienTai - truoc) / truoc * 1000) / 10;

const quanTriLayTongQuan = async (query) => {
  const { tuNgay, denNgay, khoang } = layKhoangThongKe(query);
  const soNgay = (Date.parse(`${denNgay}T00:00:00Z`) - Date.parse(`${tuNgay}T00:00:00Z`)) / 86400000 + 1;
  const denKyTruoc = new Date(Date.parse(`${tuNgay}T00:00:00Z`) - 86400000).toISOString().slice(0, 10);
  const tuKyTruoc = new Date(Date.parse(`${tuNgay}T00:00:00Z`) - soNgay * 86400000).toISOString().slice(0, 10);
  const { khoang: khoangTruoc } = layKhoangThongKe({ tuNgay: tuKyTruoc, denNgay: denKyTruoc });
  const [hienTai, kyTruoc, soDonDaThanhToan, soNguoiDung, soNguoiBan, soCuaHang, soSanPham, soSanPhamDangKinhDoanh, soYeuCauChoDuyet] = await Promise.all([
    tongHopDon(khoang), tongHopDon(khoangTruoc),
    DonHang.countDocuments({ trangThaiThanhToan: TRANG_THAI_THANH_TOAN_DON.DA_THANH_TOAN,
      trangThaiXuLy: { $ne: TRANG_THAI_XU_LY.DA_HUY }, ngayTao: khoang }),
    TaiKhoan.countDocuments({ vaiTro: VAI_TRO.NGUOI_DUNG, $nor: [{ vaiTro: VAI_TRO.QUAN_TRI_VIEN }] }),
    TaiKhoan.countDocuments({ vaiTro: VAI_TRO.NGUOI_BAN }),
    CuaHang.countDocuments(), SanPham.countDocuments(),
    SanPham.countDocuments({ trangThaiKinhDoanh: TRANG_THAI_KINH_DOANH.DANG_KINH_DOANH }),
    YeuCauDangKyNguoiBan.countDocuments({ trangThai: TRANG_THAI_YEU_CAU_NGUOI_BAN.CHO_PHE_DUYET }),
  ]);
  const tongDoanhThu = hienTai[0]?.doanhThu || 0;
  const soDonHoanThanh = hienTai[0]?.soDon || 0;
  return { khoangThoiGian: { tuNgay, denNgay }, tongDoanhThu, soDonHoanThanh, soDonDaThanhToan,
    soVoiKyTruoc: { doanhThu: soSanhKy(tongDoanhThu, kyTruoc[0]?.doanhThu || 0), soDonHoanThanh: soSanhKy(soDonHoanThanh, kyTruoc[0]?.soDon || 0) },
    soNguoiDung, soNguoiBan, soCuaHang, soSanPham, soSanPhamDangKinhDoanh, soYeuCauChoDuyet };
};

const quanTriLayDoanhThu = async (query) => {
  const { tuNgay, denNgay, khoang } = layKhoangThongKe(query);
  const nhom = query.nhom || 'ngay';
  if (!['ngay', 'thang'].includes(nhom)) throw taoLoi(400, 'Kiểu nhóm phải là ngày hoặc tháng');
  const danhSach = await DonHang.aggregate([...locHoanThanhToanSan(khoang),
    { $group: { _id: { $dateToString: { format: nhom === 'thang' ? '%Y-%m' : '%Y-%m-%d', date: '$ngayThongKe', timezone: 'Asia/Ho_Chi_Minh' } }, doanhThu: { $sum: '$tongThanhToan' }, soDon: { $sum: 1 } } },
    { $project: { _id: 0, moc: '$_id', doanhThu: 1, soDon: 1 } }, { $sort: { moc: 1 } },
  ]);
  return { nhom, danhSach: dienMocTrong(danhSach, tuNgay, denNgay, nhom) };
};

const layGioiHanXepHang = (giaTri, macDinh) => docSoTrang(giaTri, macDinh, 20);

const quanTriLaySanPhamBanChay = async (query) => {
  const { khoang } = layKhoangThongKe(query);
  const gioiHan = layGioiHanXepHang(query.gioiHan, 5);
  const ketQua = await DonHang.aggregate([...locHoanThanhToanSan(khoang), ...noiChiTiet,
    { $group: { _id: '$chiTiet.sanPhamId', soLuongDaBan: { $sum: '$chiTiet.soLuong' }, doanhThu: { $sum: '$chiTiet.thanhTien' } } },
    { $sort: { soLuongDaBan: -1, doanhThu: -1, _id: 1 } }, { $limit: gioiHan },
    { $lookup: { from: 'SanPham', localField: '_id', foreignField: '_id', as: 'sanPham' } },
    { $unwind: '$sanPham' },
    { $lookup: { from: 'CuaHang', localField: 'sanPham.cuaHangId', foreignField: '_id', as: 'cuaHang' } },
    { $project: { _id: 0, soLuongDaBan: 1, doanhThu: 1, sanPhamId: '$sanPham._id', tenSanPham: '$sanPham.tenSanPham', hinhAnh: '$sanPham.hinhAnh', cuaHangId: { $arrayElemAt: ['$cuaHang._id', 0] }, tenCuaHang: { $arrayElemAt: ['$cuaHang.tenCuaHang', 0] } } },
  ]);
  return { danhSach: ketQua.map(({ soLuongDaBan, doanhThu, sanPhamId, tenSanPham, hinhAnh, cuaHangId, tenCuaHang }) => ({
    sanPham: { _id: sanPhamId, tenSanPham, hinhAnh }, cuaHang: { _id: cuaHangId, tenCuaHang }, soLuongDaBan, doanhThu,
  })) };
};

const quanTriLayDanhMucQuanTam = async (query) => {
  const { khoang } = layKhoangThongKe(query);
  const gioiHan = layGioiHanXepHang(query.gioiHan, 10);
  const ketQua = await DonHang.aggregate([...locHoanThanhToanSan(khoang), ...noiChiTiet,
    { $lookup: { from: 'SanPham', localField: 'chiTiet.sanPhamId', foreignField: '_id', as: 'sanPham' } },
    { $unwind: '$sanPham' },
    { $group: { _id: '$sanPham.danhMucId', soLuongDaBan: { $sum: '$chiTiet.soLuong' }, doanhThu: { $sum: '$chiTiet.thanhTien' } } },
    { $sort: { soLuongDaBan: -1, doanhThu: -1, _id: 1 } }, { $limit: gioiHan },
    { $lookup: { from: 'DanhMuc', localField: '_id', foreignField: '_id', as: 'danhMuc' } },
    { $project: { _id: 0, soLuongDaBan: 1, doanhThu: 1, danhMucId: { $arrayElemAt: ['$danhMuc._id', 0] }, tenDanhMuc: { $arrayElemAt: ['$danhMuc.tenDanhMuc', 0] } } },
  ]);
  return { danhSach: ketQua.map(({ soLuongDaBan, doanhThu, danhMucId, tenDanhMuc }) => ({
    danhMuc: { _id: danhMucId, tenDanhMuc }, soLuongDaBan, doanhThu,
  })) };
};

const quanTriLayHieuSuatNguoiBan = async (query) => {
  const { khoang } = layKhoangThongKe(query);
  const trang = docSoTrang(query.trang, 1, 1000000);
  const gioiHan = docSoTrang(query.gioiHan, PHAN_TRANG.MAC_DINH, PHAN_TRANG.TOI_DA);
  const [ketQua] = await DonHang.aggregate([...locHoanThanhToanSan(khoang),
    // Tính số sản phẩm cho từng đơn trước khi nhóm để không nhân đôi số đơn.
    { $lookup: { from: 'ChiTietDonHang', localField: '_id', foreignField: 'donHangId', as: 'chiTiet' } },
    { $project: { cuaHangId: 1, tongThanhToan: 1, soSanPham: { $sum: '$chiTiet.soLuong' } } },
    { $group: { _id: '$cuaHangId', soDonHoanThanh: { $sum: 1 }, doanhThu: { $sum: '$tongThanhToan' }, soSanPhamDaBan: { $sum: '$soSanPham' } } },
    { $sort: { doanhThu: -1, _id: 1 } },
    { $facet: { tong: [{ $count: 'soLuong' }], danhSach: [
      { $skip: (trang - 1) * gioiHan }, { $limit: gioiHan },
      { $lookup: { from: 'CuaHang', localField: '_id', foreignField: '_id', as: 'cuaHang' } },
      { $unwind: '$cuaHang' },
      { $lookup: { from: 'TaiKhoan', localField: 'cuaHang.taiKhoanId', foreignField: '_id', as: 'chuCuaHang' } },
      { $project: { _id: 0, soDonHoanThanh: 1, doanhThu: 1, soSanPhamDaBan: 1, cuaHangId: '$cuaHang._id', tenCuaHang: '$cuaHang.tenCuaHang', hoTen: { $arrayElemAt: ['$chuCuaHang.hoTen', 0] } } },
    ] } },
  ]);
  const tongSo = ketQua.tong[0]?.soLuong || 0;
  return { danhSach: ketQua.danhSach.map(({ cuaHangId, tenCuaHang, hoTen, ...soLieu }) => ({
    cuaHang: { _id: cuaHangId, tenCuaHang }, chuCuaHang: { hoTen }, ...soLieu,
  })), phanTrang: { trang, gioiHan, tongSo, tongTrang: Math.ceil(tongSo / gioiHan) } };
};

module.exports = { nguoiBanLayTongQuan, nguoiBanLayDoanhThu, nguoiBanLaySanPhamBanChay, nguoiBanLayLichSuGiaoDich,
  quanTriLayTongQuan, quanTriLayDoanhThu, quanTriLaySanPhamBanChay, quanTriLayDanhMucQuanTam, quanTriLayHieuSuatNguoiBan, dienMocTrong };
