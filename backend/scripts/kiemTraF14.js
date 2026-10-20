const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = require('../app');
const TaiKhoan = require('../src/models/taiKhoan.model');
const CuaHang = require('../src/models/cuaHang.model');
const Voucher = require('../src/models/voucher.model');
const ApDungVoucher = require('../src/models/apDungVoucher.model');
const { kiemTraDieuKienVoucher, tinhMucGiamVoucher } = require('../src/services/voucher.service');

if (!process.env.JWT_SECRET) throw new Error('Thiếu JWT_SECRET trong môi trường kiểm tra');
const uri = new URL(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/soopi');
uri.pathname = `/soopi_f14_kiemtra_${Date.now()}`;
let server;

async function run() {
  await mongoose.connect(uri.toString());
  const [a, b, quanTri, thuong] = await TaiKhoan.create([
    { email: 'a-f14@example.com', matKhau: 'hash', hoTen: 'Người bán A', vaiTro: ['Người dùng', 'Người bán'] },
    { email: 'b-f14@example.com', matKhau: 'hash', hoTen: 'Người bán B', vaiTro: ['Người dùng', 'Người bán'] },
    { email: 'admin-f14@example.com', matKhau: 'hash', hoTen: 'Quản trị', vaiTro: ['Quản trị viên'] },
    { email: 'user-f14@example.com', matKhau: 'hash', hoTen: 'Người dùng', vaiTro: ['Người dùng'] },
  ]);
  const [shopA, shopB] = await CuaHang.create([
    { taiKhoanId: a._id, tenCuaHang: 'Cửa hàng A', trangThaiHoatDong: 'Hoạt động' },
    { taiKhoanId: b._id, tenCuaHang: 'Cửa hàng B', trangThaiHoatDong: 'Hoạt động' },
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
  const seller = '/api/nguoi-ban/voucher';
  const admin = '/api/quan-tri-vien/voucher';
  const batDau = new Date(Date.now() - 3600000).toISOString();
  const ketThuc = new Date(Date.now() + 86400000).toISOString();
  const body = { maVoucher: 'ab12cd', tenVoucher: 'Giảm giá cửa hàng', kieuGiam: 'Phần trăm', giaTriGiam: 10, giamToiDa: 50000,
    giaTriDonToiThieu: 200000, soLuong: 10, ngayBatDau: batDau, ngayKetThuc: ketThuc };

  assert.equal((await goi('GET', seller, undefined, null))[0], 401);
  assert.equal((await goi('GET', seller, undefined, thuong._id))[0], 403);
  assert.equal((await goi('GET', admin, undefined, thuong._id))[0], 403);
  for (const sai of [
    { maVoucher: 'abc' }, { maVoucher: 'AB CD' }, { giaTriGiam: 150 }, { giaTriGiam: 0 }, { soLuong: 0 },
    { ngayKetThuc: batDau }, { giaTriGiam: null }, { soLuong: null },
  ]) assert.equal((await goi('POST', seller, { ...body, ...sai }))[0], 400, JSON.stringify(sai));
  assert.equal(await Voucher.countDocuments(), 0);

  let r = await goi('POST', seller, { ...body, loaiVoucher: 'Toàn sàn', cuaHangId: shopB._id });
  assert.equal(r[0], 201, JSON.stringify(r[1]));
  const idA = r[1].data.voucher._id;
  assert.equal(r[1].data.voucher.maVoucher, 'AB12CD');
  assert.equal(r[1].data.voucher.loaiVoucher, 'Cửa hàng');
  assert.equal(String((await Voucher.findById(idA)).cuaHangId), String(shopA._id));
  assert.equal((await goi('POST', seller, body))[0], 409);
  assert.equal((await goi('POST', admin, { ...body, maVoucher: 'ADMIN1', loaiVoucher: 'Cửa hàng' }, quanTri._id))[0], 400);

  r = await goi('POST', seller, { ...body, maVoucher: 'SHOPB1' }, b._id);
  assert.equal(r[0], 201);
  const idB = r[1].data.voucher._id;
  assert.equal((await goi('PATCH', `${seller}/${idB}`, { tenVoucher: 'Sai quyền' }))[0], 404);
  assert.equal((await goi('DELETE', `${seller}/${idB}`))[0], 404);
  assert.equal((await goi('PATCH', `${seller}/${idB}/trang-thai`, { trangThai: 'Vô hiệu hóa' }))[0], 404);
  assert.equal((await goi('PATCH', `${admin}/${idA}`, { tenVoucher: 'Sai phạm vi' }, quanTri._id))[0], 409);
  assert.equal((await goi('DELETE', `${admin}/${idA}`, undefined, quanTri._id))[0], 409);
  assert.equal((await goi('PATCH', `${seller}/${idA}`, { maVoucher: 'KHONGDUOC' }))[0], 400);
  assert.equal((await goi('PATCH', `${seller}/${idA}`, { giaTriGiam: null }))[0], 400);
  assert.equal((await goi('PATCH', `${seller}/${idA}`, { giamToiDa: null }))[0], 200);
  assert.equal((await Voucher.findById(idA)).giamToiDa, undefined);

  r = await goi('POST', admin, { ...body, maVoucher: 'TOANSAN1', loaiVoucher: 'Toàn sàn', giaTriDonToiThieu: 0 }, quanTri._id);
  assert.equal(r[0], 201);
  const idAdmin = r[1].data.voucher._id;
  assert.equal(r[1].data.voucher.cuaHang, null);
  assert.equal((await goi('PATCH', `${admin}/${idAdmin}`, { tenVoucher: 'Voucher hệ thống' }, quanTri._id))[0], 200);
  assert.equal((await goi('PATCH', `${admin}/${idA}/trang-thai`, { trangThai: 'Vô hiệu hóa' }, quanTri._id))[0], 200);
  assert.equal((await goi('GET', '/api/voucher', undefined, null))[1].data.danhSach.some((v) => v.maVoucher === 'AB12CD'), false);
  assert.equal((await goi('PATCH', `${admin}/${idA}/trang-thai`, { trangThai: 'Kích hoạt' }, quanTri._id))[0], 200);

  r = await goi('GET', '/api/voucher', undefined, null);
  assert.deepEqual(r[1].data.danhSach.map((v) => v.maVoucher), ['TOANSAN1']);
  assert.equal('soLuong' in r[1].data.danhSach[0], false);
  r = await goi('GET', `/api/voucher?cuaHangId=${shopA._id}`, undefined, null);
  assert.deepEqual(r[1].data.danhSach.map((v) => v.maVoucher).sort(), ['AB12CD', 'TOANSAN1']);
  r = await goi('GET', `/api/voucher?cuaHangId=${shopB._id}`, undefined, null);
  assert.deepEqual(r[1].data.danhSach.map((v) => v.maVoucher).sort(), ['SHOPB1', 'TOANSAN1']);
  assert.equal((await goi('GET', seller))[1].data.danhSach.every((v) => v.maVoucher !== 'SHOPB1'), true);

  await Voucher.create([
    { ...body, maVoucher: 'FUTURE1', loaiVoucher: 'Toàn sàn', ngayBatDau: new Date(Date.now() + 3600000), cuaHangId: null },
    { ...body, maVoucher: 'EXPIRED1', loaiVoucher: 'Toàn sàn', ngayBatDau: new Date(Date.now() - 86400000), ngayKetThuc: new Date(Date.now() - 3600000), cuaHangId: null },
    { ...body, maVoucher: 'EMPTY1', loaiVoucher: 'Toàn sàn', soLuong: 0, cuaHangId: null },
  ]);
  assert.equal((await goi('GET', '/api/voucher', undefined, null))[1].data.danhSach.length, 1);

  await ApDungVoucher.create({ voucherId: idA, donHangId: new mongoose.Types.ObjectId(), giaTriGiamThucTe: 50000 });
  assert.equal((await goi('GET', seller))[1].data.danhSach.find((v) => v._id === idA).soDonDaApDung, 1);
  r = await goi('DELETE', `${seller}/${idA}`);
  assert.equal(r[0], 200); assert.match(r[1].message, /vô hiệu hóa/);
  assert.equal((await Voucher.findById(idA)).trangThai, 'Vô hiệu hóa');
  assert.equal((await goi('DELETE', `${seller}/${idB}`, undefined, b._id))[0], 200);
  assert.equal(await Voucher.exists({ _id: idB }), null);

  const mau = { ...body, trangThai: 'Kích hoạt', loaiVoucher: 'Cửa hàng', cuaHangId: shopA._id };
  assert.equal(tinhMucGiamVoucher(mau, 1000000), 50000);
  assert.equal(tinhMucGiamVoucher({ ...mau, kieuGiam: 'Số tiền cố định', giaTriGiam: 100000 }, 80000), 50000);
  assert.equal(tinhMucGiamVoucher({ ...mau, kieuGiam: 'Số tiền cố định', giaTriGiam: 100000, giamToiDa: null }, 80000), 80000);
  assert.equal(tinhMucGiamVoucher({ ...mau, giamToiDa: null }, 1000000), 100000);
  assert.equal(kiemTraDieuKienVoucher(mau, { cuaHangId: shopB._id, tongTienHangCuaHang: 300000, thoiDiem: new Date() }).hopLe, false);
  assert.match(kiemTraDieuKienVoucher(mau, { cuaHangId: shopA._id, tongTienHangCuaHang: 100000, thoiDiem: new Date() }).lyDo, /tối thiểu/);
  console.log('F14 API: validation, phân quyền, CRUD, công khai, xóa mềm, hàm thuần: OK');
}

run().catch((loi) => { console.error(loi); process.exitCode = 1; }).finally(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (mongoose.connection.readyState === 1) { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); }
});
