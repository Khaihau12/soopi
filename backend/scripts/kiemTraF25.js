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
const GiaoDichThanhToan = require('../src/models/giaoDichThanhToan.model');
const DonHang = require('../src/models/donHang.model');

const uri = new URL(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/soopi');
uri.pathname = `/soopi_f25_kiemtra_${Date.now()}`;
let server;
const token = (id) => `token=${jwt.sign({ taiKhoanId: String(id), phienBanToken: 0 }, process.env.JWT_SECRET)}`;
const goi = async (path, id, method = 'GET', body) => {
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api${path}`, {
    method, headers: { ...(id ? { Cookie: token(id) } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return [response.status, await response.json()];
};
const goiVoiCookie = async (path, cookie, method = 'GET', body) => {
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api${path}`, {
    method, headers: { ...(cookie ? { Cookie: cookie } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return [response.status, await response.json(), response.headers.get('set-cookie')?.split(';')[0]];
};

async function run() {
  await mongoose.connect(uri.toString());
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const bam = await bcrypt.hash('MatKhauF25!', 4);
  const admin = await TaiKhoan.create({ email: 'f25-admin@example.com', matKhau: bam, hoTen: 'Admin', vaiTro: ['Quản trị viên'] });
  const mua = await TaiKhoan.create({ email: 'f25-mua@example.com', matKhau: bam, hoTen: 'Người mua' });
  const ban = await TaiKhoan.create({ email: 'f25-ban@example.com', matKhau: bam, hoTen: 'Người bán', vaiTro: ['Người dùng', 'Người bán'] });
  const shop = await CuaHang.create({ taiKhoanId: ban._id, tenCuaHang: 'Cửa hàng F25' });
  const danhMuc = await DanhMuc.create({ tenDanhMuc: 'Danh mục F25' });
  const sanPham = await SanPham.create({ tenSanPham: 'Sản phẩm F25', giaGoc: 100000, soLuongTon: 3, cuaHangId: shop._id, danhMucId: danhMuc._id });
  const giaoDich = await GiaoDichThanhToan.create({ maGiaoDich: 'F25VNPAY', soTien: 100000, phuongThucThanhToan: 'VNPay', trangThaiThanhToan: 'Thành công', thoiGianTao: new Date('2026-10-18T17:00:00.000Z') });
  await DonHang.create({ taiKhoanId: mua._id, cuaHangId: shop._id, giaoDichId: giaoDich._id, diaChiNhanHang: 'Hà Nội', tongTienHang: 100000, tongThanhToan: 100000, phuongThucThanhToan: 'VNPay', trangThaiThanhToan: 'Đã thanh toán', trangThaiXuLy: 'Đã hủy' });
  const giaoDichCod = await GiaoDichThanhToan.create({ maGiaoDich: 'F25COD', soTien: 0, phuongThucThanhToan: 'COD', trangThaiThanhToan: 'Chờ thanh toán', thoiGianTao: new Date('2026-10-18T16:59:59.000Z') });
  await DonHang.create({ taiKhoanId: mua._id, cuaHangId: shop._id, giaoDichId: giaoDichCod._id, diaChiNhanHang: 'Hà Nội', tongTienHang: 0, tongThanhToan: 0, phuongThucThanhToan: 'COD', trangThaiThanhToan: 'Chờ thanh toán', trangThaiXuLy: 'Đã hủy' });
  const giaoDichKhongDong = await GiaoDichThanhToan.create({ maGiaoDich: 'F25ZERO', soTien: 0, phuongThucThanhToan: 'VNPay', trangThaiThanhToan: 'Thành công', thoiGianTao: new Date('2026-10-18T16:59:59.000Z') });
  await DonHang.create({ taiKhoanId: mua._id, cuaHangId: shop._id, giaoDichId: giaoDichKhongDong._id, diaChiNhanHang: 'Hà Nội', tongTienHang: 0, tongThanhToan: 0, phuongThucThanhToan: 'VNPay', trangThaiThanhToan: 'Đã thanh toán', trangThaiXuLy: 'Đã hủy' });
  const dau = '/quan-tri-vien';
  for (const path of [`${dau}/giao-dich-thanh-toan`, `${dau}/san-pham`, `${dau}/banner-quang-cao`]) {
    assert.equal((await goi(path, null))[0], 401);
    assert.equal((await goi(path, mua._id))[0], 403);
    assert.equal((await goi(path, ban._id))[0], 403);
  }
  const [maLoc, loc] = await goi(`${dau}/giao-dich-thanh-toan?canHoanTien=true`, admin._id);
  assert.equal(maLoc, 200); assert.equal(loc.data.phanTrang.tongSo, 1);
  assert.equal(loc.data.danhSach[0].soDonCanHoanTien, 1);
  assert.equal(loc.data.danhSach[0].nguoiMua.email, mua.email);
  const chiTiet = await goi(`${dau}/giao-dich-thanh-toan/${giaoDich._id}`, admin._id);
  assert.equal(chiTiet[1].data.giaoDich.danhSachDonHang[0].canHoanTien, true);
  assert.equal((await goi(`${dau}/giao-dich-thanh-toan/${giaoDichKhongDong._id}`, admin._id))[1].data.giaoDich.danhSachDonHang[0].canHoanTien, false);
  assert.equal((await goi(`${dau}/giao-dich-thanh-toan?phuongThucThanhToan=COD`, admin._id))[1].data.phanTrang.tongSo, 1);
  assert.equal((await goi(`${dau}/giao-dich-thanh-toan?tuNgay=2026-10-19&denNgay=2026-10-19`, admin._id))[1].data.phanTrang.tongSo, 1);
  assert.equal((await goi(`${dau}/giao-dich-thanh-toan?tuNgay=2026-10-20&denNgay=2026-10-19`, admin._id))[0], 400);
  assert.equal((await goi(`${dau}/giao-dich-thanh-toan?tuNgay=2026-02-30`, admin._id))[0], 400);
  assert.equal((await goi(`${dau}/giao-dich-thanh-toan/${giaoDich._id}`, admin._id, 'PATCH', {}))[0], 404);
  let soTruyVan = 0;
  mongoose.set('debug', (_collection, lenh) => {
    if (['find', 'findOne', 'countDocuments'].includes(lenh)) soTruyVan += 1;
  });
  try {
    await goi(`${dau}/giao-dich-thanh-toan?gioiHan=1`, admin._id);
    const motGiaoDich = soTruyVan;
    soTruyVan = 0;
    await goi(`${dau}/giao-dich-thanh-toan?gioiHan=12`, admin._id);
    assert.equal(soTruyVan, motGiaoDich);
  } finally { mongoose.set('debug', false); }
  assert.equal((await goi(`${dau}/san-pham?cuaHangId=${shop._id}&danhMucId=${danhMuc._id}`, admin._id))[1].data.phanTrang.tongSo, 1);
  assert.equal((await goi(`${dau}/san-pham?cuaHangId=sai-id`, admin._id))[0], 400);
  assert.equal((await goi(`${dau}/san-pham/${sanPham._id}`, admin._id))[1].data.sanPham.chuCuaHang.hoTen, 'Người bán');
  assert.equal((await goi('/gio-hang/chi-tiet', mua._id, 'POST', { sanPhamId: sanPham._id, soLuong: 1 }))[0], 201);
  assert.equal((await goi(`${dau}/san-pham/${sanPham._id}/trang-thai`, admin._id, 'PATCH', { trangThaiKinhDoanh: 'Ngừng kinh doanh' }))[0], 200);
  assert.equal((await goi(`${dau}/san-pham/${sanPham._id}/trang-thai`, admin._id, 'PATCH', { trangThaiKinhDoanh: 'Ngừng kinh doanh' }))[0], 409);
  assert.equal((await goi('/san-pham', null))[1].data.phanTrang.tongSo, 0);
  assert.equal((await goi('/gio-hang', mua._id))[1].data.danhSach[0].coTheMua, false);
  assert.equal((await DonHang.findOne({ giaoDichId: giaoDich._id })).tongThanhToan, 100000);
  assert.equal((await goi(`${dau}/san-pham/${sanPham._id}/trang-thai`, admin._id, 'PATCH', { trangThaiKinhDoanh: 'Đang kinh doanh' }))[0], 200);
  assert.equal((await goi('/san-pham', null))[1].data.phanTrang.tongSo, 1);
  assert.equal((await goi(`${dau}/banner-quang-cao`, admin._id, 'POST', { tieuDe: '', hinhAnh: '/uploads/hop-le.png' }))[0], 400);
  assert.equal((await goi(`${dau}/banner-quang-cao`, admin._id, 'POST', { tieuDe: 'Sai', hinhAnh: 'javascript:alert(1)' }))[0], 400);
  const [maTao, tao] = await goi(`${dau}/banner-quang-cao`, admin._id, 'POST', { tieuDe: ' Banner F25 ', hinhAnh: '/uploads/hop-le.png' });
  assert.equal(maTao, 201); assert.equal(tao.data.banner.tieuDe, 'Banner F25');
  const idBanner = tao.data.banner._id;
  assert.equal((await goi('/banner-quang-cao', null))[1].data.danhSach.length, 1);
  assert.equal((await goi(`${dau}/banner-quang-cao/${idBanner}`, admin._id, 'PATCH', { noiDung: 'Nội dung mới' }))[0], 200);
  assert.equal((await goi(`${dau}/banner-quang-cao/${idBanner}/trang-thai`, admin._id, 'PATCH', { trangThai: 'Vô hiệu hóa' }))[0], 200);
  assert.equal((await goi('/banner-quang-cao', null))[1].data.danhSach.length, 0);
  assert.equal((await goi(`${dau}/banner-quang-cao/${idBanner}`, admin._id, 'DELETE'))[0], 200);
  assert.equal((await goi(`${dau}/banner-quang-cao`, admin._id))[1].data.phanTrang.tongSo, 0);
  const dangNhap = (matKhau) => goiVoiCookie('/xac-thuc/dang-nhap', null, 'POST', { email: mua.email, matKhau });
  const cookieA = (await dangNhap('MatKhauF25!'))[2];
  const cookieB = (await dangNhap('MatKhauF25!'))[2];
  assert.equal((await goiVoiCookie('/xac-thuc/toi', cookieA))[0], 200);
  assert.equal((await goiVoiCookie('/xac-thuc/toi', cookieB))[0], 200);
  assert.equal((await goi(`${dau}/tai-khoan/${mua._id}/mat-khau`, admin._id, 'PATCH', { matKhauMoi: 'MatKhauSauReset!' }))[0], 200);
  assert.equal((await goiVoiCookie('/xac-thuc/toi', cookieA))[0], 401);
  assert.equal((await goiVoiCookie('/xac-thuc/toi', cookieB))[0], 401);
  assert.equal((await dangNhap('MatKhauF25!'))[0], 401);
  const cookieMoi = (await dangNhap('MatKhauSauReset!'))[2];
  assert.equal((await goiVoiCookie('/xac-thuc/toi', cookieMoi))[0], 200);
  assert.equal((await goiVoiCookie('/tai-khoan/doi-mat-khau', cookieMoi, 'PATCH', {
    matKhauHienTai: 'MatKhauSauReset!', matKhauMoi: 'MatKhauTuDoi!', xacNhanMatKhauMoi: 'MatKhauTuDoi!',
  }))[0], 200);
  assert.equal((await goiVoiCookie('/xac-thuc/toi', cookieMoi))[0], 401);
  assert.equal((await goiVoiCookie('/xac-thuc/toi', (await dangNhap('MatKhauTuDoi!'))[2]))[0], 200);
  console.log('F25: phân quyền, giao dịch VNPay/COD, hoàn tiền thủ công, ngày Việt Nam, sản phẩm, banner và thu hồi token trên mọi thiết bị đạt.');
}

run().catch((err) => { console.error(err); process.exitCode = 1; }).finally(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (mongoose.connection.readyState === 1) { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); }
});
