const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = require('../app');
const TaiKhoan = require('../src/models/taiKhoan.model');
const CuaHang = require('../src/models/cuaHang.model');
const DanhMuc = require('../src/models/danhMuc.model');
const SanPham = require('../src/models/sanPham.model');
const GioHang = require('../src/models/gioHang.model');
const ChiTietGioHang = require('../src/models/chiTietGioHang.model');
const KhuyenMai = require('../src/models/khuyenMai.model');
const ChiTietKhuyenMai = require('../src/models/chiTietKhuyenMai.model');

if (!process.env.JWT_SECRET) throw new Error('Thiếu JWT_SECRET trong môi trường kiểm tra');
const uri = new URL(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/soopi');
uri.pathname = `/soopi_f15_kiemtra_${Date.now()}`;
let server;

async function run() {
  await mongoose.connect(uri.toString());
  await Promise.all([GioHang.init(), ChiTietGioHang.init()]);
  const [a, b, seller] = await TaiKhoan.create([
    { email: 'a-f15@example.com', matKhau: 'hash', hoTen: 'Người dùng A', vaiTro: ['Người dùng'] },
    { email: 'b-f15@example.com', matKhau: 'hash', hoTen: 'Người dùng B', vaiTro: ['Người dùng'] },
    { email: 'shop-f15@example.com', matKhau: 'hash', hoTen: 'Người bán', vaiTro: ['Người dùng', 'Người bán'] },
  ]);
  const [shopA, shopB] = await CuaHang.create([
    { taiKhoanId: seller._id, tenCuaHang: 'Cửa hàng A', trangThaiHoatDong: 'Hoạt động' },
    { taiKhoanId: a._id, tenCuaHang: 'Cửa hàng B', trangThaiHoatDong: 'Hoạt động' },
  ]);
  const danhMuc = await DanhMuc.create({ tenDanhMuc: 'Kiểm tra giỏ hàng' });
  const [p1, p2, p3] = await SanPham.create([
    { tenSanPham: 'Sản phẩm A', giaGoc: 100000, soLuongTon: 5, cuaHangId: shopA._id, danhMucId: danhMuc._id },
    { tenSanPham: 'Sản phẩm B', giaGoc: 50000, soLuongTon: 3, cuaHangId: shopB._id, danhMucId: danhMuc._id },
    { tenSanPham: 'Sản phẩm C', giaGoc: 30000, soLuongTon: 2, cuaHangId: shopA._id, danhMucId: danhMuc._id },
  ]);
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const token = (id) => jwt.sign({ taiKhoanId: String(id) }, process.env.JWT_SECRET);
  const goi = async (method, path, body, id = a._id) => {
    const response = await fetch(base + path, { method,
      headers: { ...(id ? { Cookie: `token=${token(id)}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined });
    return [response.status, await response.json()];
  };
  const path = '/api/gio-hang';
  assert.equal((await goi('GET', path, undefined, null))[0], 401);
  let r = await goi('GET', path);
  assert.equal(r[0], 200); assert.equal(r[1].data.soLuongSanPham, 0);
  assert.equal(await GioHang.countDocuments({ taiKhoanId: a._id }), 1);
  for (const soLuong of [0, -1, 1.5, '2']) {
    assert.equal((await goi('POST', `${path}/chi-tiet`, { sanPhamId: p1._id, soLuong }))[0], 400);
  }
  assert.equal((await goi('POST', `${path}/chi-tiet`, { sanPhamId: p1._id, soLuong: 6 }))[0], 409);
  r = await goi('POST', `${path}/chi-tiet`, { sanPhamId: p1._id, soLuong: 2 });
  assert.equal(r[0], 201); assert.equal(r[1].data.soLuongSanPham, 1);
  assert.equal(r[1].data.danhSach[0].duocChon, true);
  assert.equal(r[1].data.gioHang.tongGiaTri, 200000);
  const dong1 = r[1].data.danhSach[0]._id;
  r = await goi('POST', `${path}/chi-tiet`, { sanPhamId: p1._id, soLuong: 1 });
  assert.equal(r[0], 201); assert.equal(r[1].data.danhSach[0].soLuong, 3);
  assert.equal(await ChiTietGioHang.countDocuments({ sanPhamId: p1._id }), 1);
  r = await goi('POST', `${path}/chi-tiet`, { sanPhamId: p1._id, soLuong: 3 });
  assert.equal(r[0], 409); assert.match(r[1].message, /5.*3/);

  r = await goi('POST', `${path}/chi-tiet`, { sanPhamId: p2._id });
  assert.equal(r[0], 201); assert.equal(r[1].data.soLuongSanPham, 2);
  const dong2 = r[1].data.danhSach.find((dong) => String(dong.sanPham._id) === String(p2._id))._id;
  assert.equal(r[1].data.gioHang.tongGiaTri, 350000);
  assert.equal((await goi('PATCH', `${path}/chi-tiet/${dong1}`, { soLuong: 0 }))[0], 400);
  assert.equal((await goi('PATCH', `${path}/chi-tiet/${dong1}`, { soLuong: 6 }))[0], 409);
  assert.equal((await goi('PATCH', `${path}/chi-tiet/${dong1}`, { soLuong: 4 }))[0], 200);
  r = await goi('PATCH', `${path}/chon`, { duocChon: false });
  assert.equal(r[0], 200); assert.equal(r[1].data.gioHang.tongGiaTri, 0);
  assert.equal(r[1].data.danhSach.every((dong) => !dong.duocChon), true);
  assert.equal((await goi('PATCH', `${path}/chon`, { duocChon: 'true' }))[0], 400);
  r = await goi('PATCH', `${path}/chon`, { duocChon: true, chiTietGioHangIds: [dong1] });
  assert.equal(r[0], 200); assert.equal(r[1].data.gioHang.tongGiaTri, 400000);
  assert.equal(r[1].data.danhSach.find((dong) => dong._id === dong2).duocChon, false);

  const promo = await KhuyenMai.create({ tenKhuyenMai: 'Giảm giá giỏ hàng', loaiKhuyenMai: 'Giảm giá', phamVi: 'Toàn sàn',
    ngayBatDau: new Date(Date.now() - 3600000), ngayKetThuc: new Date(Date.now() + 86400000), trangThai: 'Đang hoạt động' });
  await ChiTietKhuyenMai.create({ khuyenMaiId: promo._id, sanPhamId: p1._id, giaKhuyenMai: 75000 });
  r = await goi('GET', path);
  assert.equal(r[1].data.danhSach.find((dong) => dong._id === dong1).sanPham.giaBanThucTe, 75000);
  assert.equal(r[1].data.gioHang.tongGiaTri, 300000);
  assert.equal((await GioHang.findOne({ taiKhoanId: a._id })).tongGiaTri, 300000);

  await SanPham.updateOne({ _id: p1._id }, { $set: { soLuongTon: 2 } });
  r = await goi('GET', path);
  assert.equal(r[1].data.danhSach.find((dong) => dong._id === dong1).coTheMua, false);
  assert.match(r[1].data.danhSach.find((dong) => dong._id === dong1).lyDoKhongMua, /Chỉ còn 2/);
  assert.equal(r[1].data.gioHang.tongGiaTri, 0);
  assert.equal((await goi('PATCH', `${path}/chi-tiet/${dong1}`, { soLuong: 2 }))[0], 200);
  await SanPham.updateOne({ _id: p1._id }, { $set: { trangThaiKinhDoanh: 'Ngừng kinh doanh' } });
  assert.equal((await goi('POST', `${path}/chi-tiet`, { sanPhamId: p1._id }))[0], 404);
  r = await goi('GET', path);
  assert.equal(r[1].data.danhSach.find((dong) => dong._id === dong1).coTheMua, false);
  await CuaHang.updateOne({ _id: shopB._id }, { $set: { trangThaiHoatDong: 'Ngừng hoạt động' } });
  assert.equal((await goi('POST', `${path}/chi-tiet`, { sanPhamId: p2._id }))[0], 404);
  r = await goi('PATCH', `${path}/chon`, { duocChon: true });
  assert.equal(r[1].data.danhSach.find((dong) => dong._id === dong2).coTheMua, false);
  assert.equal(r[1].data.gioHang.tongGiaTri, 0);
  assert.equal((await goi('POST', `${path}/chi-tiet`, { sanPhamId: p3._id, soLuong: 3 }))[0], 409);

  r = await goi('POST', `${path}/chi-tiet`, { sanPhamId: p3._id }, b._id);
  assert.equal(r[0], 201);
  const dongB = r[1].data.danhSach[0]._id;
  assert.equal((await goi('PATCH', `${path}/chi-tiet/${dongB}`, { soLuong: 1 }))[0], 404);
  assert.equal((await goi('DELETE', `${path}/chi-tiet/${dongB}`))[0], 404);
  r = await goi('PATCH', `${path}/chon`, { duocChon: false, chiTietGioHangIds: [dongB] });
  assert.equal(r[0], 200); assert.equal((await ChiTietGioHang.findById(dongB)).duocChon, true);

  const songSong = await Promise.all(Array.from({ length: 3 }, () => goi('POST', `${path}/chi-tiet`, { sanPhamId: p3._id, soLuong: 1 }, seller._id)));
  assert.equal(songSong.every((ketQua) => ketQua[0] !== 500), true);
  const gioSeller = await goi('GET', path, undefined, seller._id);
  assert.equal(gioSeller[1].data.danhSach.filter((dong) => String(dong.sanPham._id) === String(p3._id)).length, 1);
  assert.equal(gioSeller[1].data.danhSach[0].soLuong, 2);
  assert.equal(songSong.filter((ketQua) => ketQua[0] === 201).length, 2);
  assert.equal(songSong.filter((ketQua) => ketQua[0] === 409).length, 1);
  assert.equal(await GioHang.countDocuments({ taiKhoanId: seller._id }), 1);
  r = await goi('DELETE', `${path}/chi-tiet/${dong1}`);
  assert.equal(r[0], 200);
  await SanPham.deleteOne({ _id: p2._id });
  r = await goi('GET', path);
  assert.equal(r[1].data.soLuongSanPham, 0);
  assert.equal(await ChiTietGioHang.exists({ _id: dong2 }), null);
  console.log('F15 API: xác thực, thêm đồng thời, tồn kho, giá khuyến mãi, chọn, sở hữu, ngừng bán: OK');
}

run().catch((loi) => { console.error(loi); process.exitCode = 1; }).finally(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (mongoose.connection.readyState === 1) { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); }
});
