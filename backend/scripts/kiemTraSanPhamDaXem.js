const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const app = require('../app');
const TaiKhoan = require('../src/models/taiKhoan.model');
const CuaHang = require('../src/models/cuaHang.model');
const DanhMuc = require('../src/models/danhMuc.model');
const SanPham = require('../src/models/sanPham.model');

const uri = new URL(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/soopi');
uri.pathname = `/soopi_san_pham_da_xem_${Date.now()}`;
let server;
const goi = async (duongDan, taiKhoan, method = 'GET') => {
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api${duongDan}`, {
    method,
    headers: taiKhoan ? { Cookie: `token=${jwt.sign({ taiKhoanId: String(taiKhoan._id) }, process.env.JWT_SECRET)}` } : {},
  });
  return [response.status, await response.json()];
};

async function run() {
  assert.ok(process.env.JWT_SECRET);
  await mongoose.connect(uri.toString());
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const mua = await TaiKhoan.create({ email: 'vua-xem@example.com', matKhau: 'hash', hoTen: 'Người mua' });
  const khac = await TaiKhoan.create({ email: 'vua-xem-khac@example.com', matKhau: 'hash', hoTen: 'Người khác' });
  const admin = await TaiKhoan.create({ email: 'vua-xem-admin@example.com', matKhau: 'hash', hoTen: 'Quản trị', vaiTro: ['Quản trị viên'] });
  const cuaHang = await CuaHang.create({ taiKhoanId: khac._id, tenCuaHang: 'Cửa hàng thử' });
  const danhMuc = await DanhMuc.create({ tenDanhMuc: 'Gia dụng' });
  const sanPham = await SanPham.create({ tenSanPham: 'Ấm nước', giaGoc: 100000, soLuongTon: 1,
    cuaHangId: cuaHang._id, danhMucId: danhMuc._id });
  assert.equal((await goi('/tai-khoan/san-pham-da-xem', null))[0], 401);
  assert.equal((await goi('/tai-khoan/san-pham-da-xem', admin))[0], 403);
  assert.equal((await goi(`/tai-khoan/san-pham-da-xem/${sanPham._id}`, admin, 'POST'))[0], 403);
  assert.equal((await goi('/tai-khoan/san-pham-da-xem/sai-id', mua, 'POST'))[0], 400);
  assert.equal((await goi(`/tai-khoan/san-pham-da-xem/${sanPham._id}`, mua, 'POST'))[0], 200);
  assert.equal((await goi(`/tai-khoan/san-pham-da-xem/${sanPham._id}`, mua, 'POST'))[0], 200);
  assert.equal((await goi('/tai-khoan/san-pham-da-xem', mua))[1].data.danhSach.length, 1);
  assert.equal((await goi('/tai-khoan/san-pham-da-xem', khac))[1].data.danhSach.length, 0);
  const them = [];
  for (let i = 0; i < 9; i += 1) {
    const muc = await SanPham.create({ tenSanPham: `Sản phẩm ${i}`, giaGoc: 20000 + i, soLuongTon: 1,
      cuaHangId: cuaHang._id, danhMucId: danhMuc._id });
    them.push(muc);
    assert.equal((await goi(`/tai-khoan/san-pham-da-xem/${muc._id}`, mua, 'POST'))[0], 200);
  }
  let danhSach = (await goi('/tai-khoan/san-pham-da-xem', mua))[1].data.danhSach;
  assert.equal(danhSach.length, 8);
  assert.equal(danhSach[0]._id, String(them[8]._id));
  assert.ok(!danhSach.some((muc) => muc._id === String(sanPham._id)));
  await goi(`/tai-khoan/san-pham-da-xem/${them[4]._id}`, mua, 'POST');
  danhSach = (await goi('/tai-khoan/san-pham-da-xem', mua))[1].data.danhSach;
  assert.equal(danhSach[0]._id, String(them[4]._id));
  assert.equal(danhSach.filter((muc) => muc._id === String(them[4]._id)).length, 1);
  await SanPham.updateOne({ _id: them[4]._id }, { $set: { trangThaiKinhDoanh: 'Ngừng kinh doanh' } });
  assert.equal((await goi(`/tai-khoan/san-pham-da-xem/${them[4]._id}`, mua, 'POST'))[0], 404);
  assert.ok(!(await goi('/tai-khoan/san-pham-da-xem', mua))[1].data.danhSach.some((muc) => muc._id === String(them[4]._id)));
  assert.equal((await goi(`/tai-khoan/san-pham-da-xem/${them[8]._id}`, mua, 'DELETE'))[0], 404);
  assert.equal((await goi('/tai-khoan/san-pham-da-xem', mua, 'DELETE'))[0], 404);
  assert.ok((await goi('/tai-khoan/san-pham-da-xem', mua))[1].data.danhSach.some((muc) => muc._id === String(them[8]._id)));
  console.log('Sản phẩm vừa xem: quyền truy cập, thứ tự, giới hạn, ẩn sản phẩm ngừng bán và không có API xóa đạt.');
}

run().catch((loi) => { console.error(loi); process.exitCode = 1; }).finally(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (mongoose.connection.readyState === 1) { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); }
});
