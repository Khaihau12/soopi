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
const GiaoDichThanhToan = require('../src/models/giaoDichThanhToan.model');

const uri = new URL(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/soopi');
uri.pathname = `/soopi_f24_kiemtra_${Date.now()}`;
let server;
const phienBanTheoId = new Map();
const token = (id) => `token=${jwt.sign({ taiKhoanId: String(id), phienBanToken: phienBanTheoId.get(String(id)) || 0 }, process.env.JWT_SECRET)}`;
const goi = async (duongDan, id, method = 'GET', body) => {
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api${duongDan}`, {
    method, headers: { ...(id ? { Cookie: token(id) } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return [response.status, await response.json()];
};
const doiTrangThai = (id, trangThaiTaiKhoan, ai) => goi(`/quan-tri-vien/tai-khoan/${id}/trang-thai`, ai, 'PATCH', { trangThaiTaiKhoan });
const doiCuaHang = (id, trangThaiHoatDong, ai) => goi(`/quan-tri-vien/cua-hang/${id}/trang-thai`, ai, 'PATCH', { trangThaiHoatDong });

async function run() {
  assert.ok(process.env.JWT_SECRET);
  await mongoose.connect(uri.toString());
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const matKhauCu = 'MatKhauF24Cu!';
  const matKhauMoi = 'MatKhauF24Moi!';
  const bam = await bcrypt.hash(matKhauCu, 4);
  const admin = await TaiKhoan.create({ email: 'f24-admin@example.com', matKhau: bam, hoTen: 'Quản trị F24', vaiTro: ['Quản trị viên'] });
  const mua = await TaiKhoan.create({ email: 'f24-mua@example.com', matKhau: bam, hoTen: 'Khách F24', soDienThoai: '0900000001' });
  const ban = await TaiKhoan.create({ email: 'f24-ban@example.com', matKhau: bam, hoTen: 'Chủ F24', vaiTro: ['Người dùng', 'Người bán'] });
  const banKhac = await TaiKhoan.create({ email: 'f24-ban-khac@example.com', matKhau: bam, hoTen: 'Chủ khác', vaiTro: ['Người dùng', 'Người bán'] });
  const shop = await CuaHang.create({ taiKhoanId: ban._id, tenCuaHang: 'Cửa hàng F24' });
  const shopKhac = await CuaHang.create({ taiKhoanId: banKhac._id, tenCuaHang: 'Cửa hàng khác' });
  const danhMuc = await DanhMuc.create({ tenDanhMuc: 'Danh mục F24' });
  const sanPham = await SanPham.create({ cuaHangId: shop._id, danhMucId: danhMuc._id,
    tenSanPham: 'Sản phẩm F24', giaGoc: 100000, soLuongTon: 10 });
  await SanPham.create({ cuaHangId: shop._id, danhMucId: danhMuc._id,
    tenSanPham: 'Sản phẩm F24 thứ hai', giaGoc: 200000, soLuongTon: 5 });
  const giaoDich = await GiaoDichThanhToan.create({ maGiaoDich: 'F24GIAODICH', soTien: 100000,
    phuongThucThanhToan: 'VNPay', trangThaiThanhToan: 'Thành công' });
  const donHang = await DonHang.create({ taiKhoanId: mua._id, cuaHangId: shop._id, giaoDichId: giaoDich._id,
    diaChiNhanHang: 'Địa chỉ F24', tongTienHang: 100000, tongThanhToan: 100000,
    trangThaiThanhToan: 'Đã thanh toán', trangThaiXuLy: 'Chờ xác nhận' });

  const endpoints = [
    ['/quan-tri-vien/tai-khoan', 'GET'],
    [`/quan-tri-vien/tai-khoan/${mua._id}`, 'GET'],
    [`/quan-tri-vien/tai-khoan/${mua._id}/trang-thai`, 'PATCH', { trangThaiTaiKhoan: 'Bị khóa' }],
    [`/quan-tri-vien/tai-khoan/${mua._id}/mat-khau`, 'PATCH', { matKhauMoi }],
    ['/quan-tri-vien/cua-hang', 'GET'],
    [`/quan-tri-vien/cua-hang/${shop._id}/trang-thai`, 'PATCH', { trangThaiHoatDong: 'Ngừng hoạt động' }],
  ];
  for (const [url, method, body] of endpoints) {
    assert.equal((await goi(url, null, method, body))[0], 401);
    assert.equal((await goi(url, mua._id, method, body))[0], 403);
    assert.equal((await goi(url, ban._id, method, body))[0], 403);
  }
  const [maDanhSach, dataDanhSach] = await goi('/quan-tri-vien/tai-khoan', admin._id);
  assert.equal(maDanhSach, 200);
  assert.equal(dataDanhSach.data.phanTrang.tongSo, 3);
  assert.ok(dataDanhSach.data.danhSach.every((item) => !item.vaiTro.includes('Quản trị viên')));
  assert.equal((await goi(`/quan-tri-vien/tai-khoan/${admin._id}`, admin._id))[0], 404);
  assert.equal((await doiTrangThai(admin._id, 'Bị khóa', admin._id))[0], 409);
  assert.equal((await goi(`/quan-tri-vien/tai-khoan/${admin._id}/mat-khau`, admin._id, 'PATCH', { matKhauMoi }))[0], 409);
  assert.equal((await goi('/quan-tri-vien/tai-khoan/sai-id', admin._id))[0], 400);
  assert.equal((await doiTrangThai('sai-id', 'Bị khóa', admin._id))[0], 400);
  assert.equal((await goi('/quan-tri-vien/tai-khoan?tuKhoa=.*(', admin._id))[0], 200);
  assert.equal((await goi('/quan-tri-vien/tai-khoan?vaiTro=Ng%C6%B0%E1%BB%9Di%20b%C3%A1n', admin._id))[1].data.phanTrang.tongSo, 2);
  assert.equal((await goi(`/quan-tri-vien/tai-khoan/${ban._id}`, admin._id))[1].data.taiKhoan.cuaHang.tenCuaHang, 'Cửa hàng F24');
  assert.equal((await goi(`/quan-tri-vien/tai-khoan/${mua._id}`, admin._id))[1].data.taiKhoan.cuaHang, null);
  assert.equal((await doiTrangThai(mua._id, 'Sai', admin._id))[0], 400);
  assert.equal((await doiTrangThai(mua._id, 'Hoạt động', admin._id))[0], 409);
  assert.equal((await doiTrangThai(mua._id, 'Bị khóa', admin._id))[0], 200);
  assert.equal((await goi('/tai-khoan/ho-so', mua._id))[0], 403);
  assert.equal((await goi('/xac-thuc/dang-nhap', null, 'POST', { email: mua.email, matKhau: matKhauCu }))[0], 403);
  assert.equal((await doiTrangThai(mua._id, 'Hoạt động', admin._id))[0], 200);
  assert.equal((await goi('/xac-thuc/dang-nhap', null, 'POST', { email: mua.email, matKhau: matKhauCu }))[0], 200);
  assert.equal((await goi(`/quan-tri-vien/tai-khoan/${mua._id}/mat-khau`, admin._id, 'PATCH', { matKhauMoi: 'ngan' }))[0], 400);
  const [maReset, dataReset] = await goi(`/quan-tri-vien/tai-khoan/${mua._id}/mat-khau`, admin._id, 'PATCH', { matKhauMoi });
  assert.equal(maReset, 200);
  assert.ok(!JSON.stringify(dataReset).includes(matKhauMoi));
  const matKhauTrongDb = (await TaiKhoan.findById(mua._id).select('+matKhau')).matKhau;
  assert.notEqual(matKhauTrongDb, matKhauMoi);
  assert.equal(await bcrypt.compare(matKhauMoi, matKhauTrongDb), true);
  assert.equal((await goi('/tai-khoan/ho-so', mua._id))[0], 401);
  assert.equal((await goi('/xac-thuc/dang-nhap', null, 'POST', { email: mua.email, matKhau: matKhauCu }))[0], 401);
  assert.equal((await goi('/xac-thuc/dang-nhap', null, 'POST', { email: mua.email, matKhau: matKhauMoi }))[0], 200);
  phienBanTheoId.set(String(mua._id), 1);
  assert.equal((await goi('/tai-khoan/ho-so', mua._id))[0], 200);
  assert.equal((await doiTrangThai(ban._id, 'Bị khóa', admin._id))[0], 200);
  assert.equal((await CuaHang.findById(shop._id)).trangThaiHoatDong, 'Hoạt động');
  assert.equal((await goi('/san-pham', null))[1].data.phanTrang.tongSo, 2);
  assert.equal((await doiTrangThai(ban._id, 'Hoạt động', admin._id))[0], 200);

  const [maShop, dataShop] = await goi('/quan-tri-vien/cua-hang', admin._id);
  assert.equal(maShop, 200);
  assert.equal(dataShop.data.danhSach.find((item) => item._id === String(shop._id)).soSanPham, 2);
  assert.deepEqual(Object.keys(dataShop.data.danhSach[0].chuCuaHang).sort(), ['_id', 'email', 'hoTen']);
  assert.equal((await goi('/quan-tri-vien/cua-hang?tuKhoa=.*(', admin._id))[0], 200);
  assert.equal((await doiCuaHang('sai-id', 'Ngừng hoạt động', admin._id))[0], 400);
  assert.equal((await doiCuaHang(new mongoose.Types.ObjectId(), 'Ngừng hoạt động', admin._id))[0], 404);
  assert.equal((await doiCuaHang(shop._id, 'Sai', admin._id))[0], 400);
  assert.equal((await doiCuaHang(shop._id, 'Hoạt động', admin._id))[0], 409);
  assert.equal((await goi('/san-pham', null))[1].data.phanTrang.tongSo, 2);
  assert.equal((await doiCuaHang(shop._id, 'Ngừng hoạt động', admin._id))[0], 200);
  assert.equal((await doiCuaHang(shop._id, 'Ngừng hoạt động', admin._id))[0], 409);
  assert.equal((await goi('/san-pham', null))[1].data.phanTrang.tongSo, 0);
  assert.equal((await goi('/gio-hang/chi-tiet', mua._id, 'POST', { sanPhamId: sanPham._id, soLuong: 1 }))[0], 404);
  assert.equal((await goi('/nguoi-ban/don-hang', ban._id))[1].data.phanTrang.tongSo, 1);
  assert.equal((await goi(`/don-hang/${donHang._id}/trang-thai`, ban._id, 'PATCH', { trangThaiXuLy: 'Đã xác nhận' }))[0], 200);
  assert.equal((await doiCuaHang(shop._id, 'Hoạt động', admin._id))[0], 200);
  assert.equal((await goi('/san-pham', null))[1].data.phanTrang.tongSo, 2);
  assert.equal((await CuaHang.findById(shopKhac._id)).trangThaiHoatDong, 'Hoạt động');
  let soTruyVan = 0;
  mongoose.set('debug', () => { soTruyVan += 1; });
  try {
    await goi('/quan-tri-vien/cua-hang?gioiHan=1', admin._id);
    const motCuaHang = soTruyVan;
    soTruyVan = 0;
    await goi('/quan-tri-vien/cua-hang?gioiHan=12', admin._id);
    assert.equal(soTruyVan, motCuaHang);
  } finally { mongoose.set('debug', false); }
  console.log('F24: phân quyền, lọc Admin, khóa/mở, mật khẩu, cửa hàng, giỏ, sản phẩm, đơn và truy vấn theo lô đạt.');
}

run().catch((loi) => { console.error(loi); process.exitCode = 1; }).finally(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (mongoose.connection.readyState === 1) { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); }
});
