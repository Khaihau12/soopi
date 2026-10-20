const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const app = require('../app');
const TaiKhoan = require('../src/models/taiKhoan.model');
const CuaHang = require('../src/models/cuaHang.model');
const DanhMuc = require('../src/models/danhMuc.model');
const SanPham = require('../src/models/sanPham.model');
const DonHang = require('../src/models/donHang.model');
const ChiTietDonHang = require('../src/models/chiTietDonHang.model');
const GiaoDichThanhToan = require('../src/models/giaoDichThanhToan.model');
const YeuCauDangKyNguoiBan = require('../src/models/yeuCauDangKyNguoiBan.model');

const uri = new URL(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/soopi');
uri.pathname = `/soopi_f27_kiemtra_${Date.now()}`;
let server;
const goi = async (duongDan, id) => {
  const cookie = id ? `token=${jwt.sign({ taiKhoanId: String(id), phienBanToken: 0 }, process.env.JWT_SECRET)}` : '';
  const res = await fetch(`http://127.0.0.1:${server.address().port}/api/quan-tri-vien/thong-ke/${duongDan}`, { headers: { Cookie: cookie } });
  return [res.status, await res.json()];
};

async function run() {
  await mongoose.connect(uri.toString());
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const matKhau = await bcrypt.hash('MatKhauF27!', 4);
  const admin = await TaiKhoan.create({ email: 'f27-admin@example.com', matKhau, hoTen: 'Admin', vaiTro: ['Người dùng', 'Quản trị viên'] });
  const mua = await TaiKhoan.create({ email: 'f27-mua@example.com', matKhau, hoTen: 'Người mua' });
  const banA = await TaiKhoan.create({ email: 'f27-a@example.com', matKhau, hoTen: 'Chủ A', vaiTro: ['Người dùng', 'Người bán'] });
  const banB = await TaiKhoan.create({ email: 'f27-b@example.com', matKhau, hoTen: 'Chủ B', vaiTro: ['Người dùng', 'Người bán'] });
  const shopA = await CuaHang.create({ taiKhoanId: banA._id, tenCuaHang: 'Cửa hàng A' });
  const shopB = await CuaHang.create({ taiKhoanId: banB._id, tenCuaHang: 'Cửa hàng B' });
  const mucA = await DanhMuc.create({ tenDanhMuc: 'Danh mục A' });
  const mucB = await DanhMuc.create({ tenDanhMuc: 'Danh mục B' });
  const spA = await SanPham.create({ tenSanPham: 'Sản phẩm A', giaGoc: 100000, soLuongTon: 10, cuaHangId: shopA._id, danhMucId: mucA._id });
  const spB = await SanPham.create({ tenSanPham: 'Sản phẩm B', giaGoc: 50000, soLuongTon: 10, cuaHangId: shopA._id, danhMucId: mucB._id, trangThaiKinhDoanh: 'Ngừng kinh doanh' });
  const spC = await SanPham.create({ tenSanPham: 'Sản phẩm C', giaGoc: 50000, soLuongTon: 10, cuaHangId: shopB._id, danhMucId: mucA._id });
  await YeuCauDangKyNguoiBan.create({ taiKhoanId: mua._id, tenCuaHang: 'Chờ duyệt', diaChiCuaHang: 'Hà Nội' });
  const taoDon = async ({ ma, shop = shopA, sanPham = spA, tien, soLuong = 1, tao = '2026-09-28T10:00:00Z', xong, thanhToan = 'Đã thanh toán', xuLy = 'Hoàn thành', phuongThuc = 'VNPay' }) => {
    const gd = await GiaoDichThanhToan.create({ maGiaoDich: ma, soTien: tien, phuongThucThanhToan: phuongThuc, trangThaiThanhToan: thanhToan === 'Đã thanh toán' ? 'Thành công' : 'Chờ thanh toán' });
    const don = await DonHang.create({ taiKhoanId: mua._id, cuaHangId: shop._id, giaoDichId: gd._id, diaChiNhanHang: 'Hà Nội', tongTienHang: tien, tongThanhToan: tien, ngayTao: new Date(tao), ...(xong ? { ngayHoanThanh: new Date(xong) } : {}), trangThaiThanhToan: thanhToan, trangThaiXuLy: xuLy, phuongThucThanhToan: phuongThuc });
    await ChiTietDonHang.create({ donHangId: don._id, sanPhamId: sanPham._id, soLuong, giaGocTaiThoiDiemDat: tien, giaBanThucTe: tien, thanhTien: tien });
  };
  await taoDon({ ma: 'F27TRUOC', tien: 100000, xong: '2026-09-29T10:00:00Z' });
  await taoDon({ ma: 'F27A1', tien: 100000, soLuong: 2, xong: '2026-10-02T10:00:00Z' });
  await taoDon({ ma: 'F27A2', sanPham: spB, tien: 50000, tao: '2026-10-01T10:00:00Z', xong: '2026-10-02T16:30:00Z', phuongThuc: 'COD' });
  await taoDon({ ma: 'F27B1', shop: shopB, sanPham: spC, tien: 50000, tao: '2026-10-01T10:00:00Z', xong: '2026-10-03T10:00:00Z' });
  await taoDon({ ma: 'F27HUY', tien: 70000, tao: '2026-10-01T10:00:00Z', xong: '2026-10-02T11:00:00Z', xuLy: 'Đã hủy' });
  await taoDon({ ma: 'F27DANG', tien: 80000, tao: '2026-10-01T10:00:00Z', xuLy: 'Đang xử lý' });
  await taoDon({ ma: 'F27CHO', tien: 90000, tao: '2026-10-01T10:00:00Z', thanhToan: 'Chờ thanh toán', xuLy: 'Chờ xác nhận' });
  const cacDuongDan = ['tong-quan', 'doanh-thu', 'san-pham-ban-chay', 'danh-muc-quan-tam', 'hieu-suat-nguoi-ban'];
  for (const duongDan of cacDuongDan) {
    assert.equal((await goi(duongDan, null))[0], 401);
    assert.equal((await goi(duongDan, mua._id))[0], 403);
    assert.equal((await goi(duongDan, banA._id))[0], 403);
  }
  const loc = '?tuNgay=2026-10-01&denNgay=2026-10-03';
  const [trangThaiTong, { data: tong }] = await goi(`tong-quan${loc}`, admin._id);
  assert.equal(trangThaiTong, 200);
  assert.equal(tong.tongDoanhThu, 200000); assert.equal(tong.soDonHoanThanh, 3);
  assert.equal(tong.soDonDaThanhToan, 3); // F30: đơn đã hủy sau thanh toán không tính vào thống kê.
  assert.equal(tong.soNguoiDung, 3); assert.equal(tong.soNguoiBan, 2); assert.equal(tong.soCuaHang, 2);
  assert.equal(tong.soSanPham, 3); assert.equal(tong.soSanPhamDangKinhDoanh, 2); assert.equal(tong.soYeuCauChoDuyet, 1);
  assert.equal(tong.soVoiKyTruoc.doanhThu, 100); assert.equal(tong.soVoiKyTruoc.soDonHoanThanh, 200);
  const soSanh = (await goi('tong-quan?tuNgay=2026-10-01&denNgay=2026-10-02', admin._id))[1].data;
  assert.equal(soSanh.tongDoanhThu, 150000); assert.equal(soSanh.soVoiKyTruoc.doanhThu, 50);
  const theoNgay = (await goi(`doanh-thu${loc}`, admin._id))[1].data.danhSach;
  assert.deepEqual(theoNgay.map((item) => item.doanhThu), [0, 150000, 50000]);
  assert.equal(theoNgay[1].moc, '2026-10-02');
  const theoThang = (await goi('doanh-thu?tuNgay=2026-09-01&denNgay=2026-10-31&nhom=thang', admin._id))[1].data.danhSach;
  assert.deepEqual(theoThang.map((item) => item.doanhThu), [100000, 200000]);
  const banChay = (await goi(`san-pham-ban-chay${loc}`, admin._id))[1].data.danhSach;
  assert.equal(banChay.length, 3); assert.equal(banChay[0].sanPham.tenSanPham, 'Sản phẩm A');
  assert.equal(banChay[0].soLuongDaBan, 2); assert.equal(banChay[0].doanhThu, 100000);
  assert.equal(banChay[0].cuaHang.tenCuaHang, 'Cửa hàng A');
  const danhMuc = (await goi(`danh-muc-quan-tam${loc}`, admin._id))[1].data.danhSach;
  assert.equal(danhMuc[0].danhMuc.tenDanhMuc, 'Danh mục A');
  assert.equal(danhMuc[0].soLuongDaBan, 3); assert.equal(danhMuc[0].doanhThu, 150000);
  const hieuSuat = (await goi(`hieu-suat-nguoi-ban${loc}&gioiHan=1`, admin._id))[1].data;
  assert.equal(hieuSuat.phanTrang.tongSo, 2); assert.equal(hieuSuat.phanTrang.tongTrang, 2);
  assert.equal(hieuSuat.danhSach[0].cuaHang.tenCuaHang, 'Cửa hàng A');
  assert.equal(hieuSuat.danhSach[0].chuCuaHang.hoTen, 'Chủ A');
  assert.equal(hieuSuat.danhSach[0].soDonHoanThanh, 2); assert.equal(hieuSuat.danhSach[0].doanhThu, 150000); assert.equal(hieuSuat.danhSach[0].soSanPhamDaBan, 3);
  assert.equal((await goi(`hieu-suat-nguoi-ban${loc}&gioiHan=1&trang=2`, admin._id))[1].data.danhSach[0].cuaHang.tenCuaHang, 'Cửa hàng B');
  const rong = (await goi('tong-quan?tuNgay=2026-08-01&denNgay=2026-08-03', admin._id))[1].data;
  assert.equal(rong.tongDoanhThu, 0); assert.equal(rong.soVoiKyTruoc.doanhThu, null);
  assert.equal((await goi('san-pham-ban-chay?tuNgay=2026-08-01&denNgay=2026-08-03', admin._id))[1].data.danhSach.length, 0);
  assert.equal((await goi('danh-muc-quan-tam?tuNgay=2026-08-01&denNgay=2026-08-03', admin._id))[1].data.danhSach.length, 0);
  assert.equal((await goi('hieu-suat-nguoi-ban?tuNgay=2026-08-01&denNgay=2026-08-03', admin._id))[1].data.phanTrang.tongSo, 0);
  for (const duongDan of ['tong-quan?tuNgay=2026-02-30', 'tong-quan?tuNgay=2026-10-04&denNgay=2026-10-03', 'tong-quan?tuNgay=2025-01-01&denNgay=2026-10-03']) assert.equal((await goi(duongDan, admin._id))[0], 400);
  let soTruyVan = 0;
  mongoose.set('debug', (_collection, lenh) => { if (['find', 'findOne', 'aggregate', 'countDocuments'].includes(lenh)) soTruyVan += 1; });
  try {
    await goi(`hieu-suat-nguoi-ban${loc}&gioiHan=1`, admin._id);
    const motHang = soTruyVan;
    soTruyVan = 0;
    await goi(`hieu-suat-nguoi-ban${loc}&gioiHan=20`, admin._id);
    assert.equal(soTruyVan, motHang);
  } finally { mongoose.set('debug', false); }
  console.log('F27: số liệu toàn sàn, kỳ trước, vai trò, múi giờ, xếp hạng, phân quyền và truy vấn cố định đạt.');
}

run().catch((loi) => { console.error(loi); process.exitCode = 1; }).finally(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (mongoose.connection.readyState === 1) { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); }
});
