const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const app = require('../app');
const TaiKhoan = require('../src/models/taiKhoan.model');
const CuaHang = require('../src/models/cuaHang.model');
const DanhMuc = require('../src/models/danhMuc.model');
const SanPham = require('../src/models/sanPham.model');
const { xoaAnhNeuKhongDung } = require('../src/services/anhCloudinary.service');

const tenDb = `soopi_f12_kiemtra_${Date.now()}`;
const uri = new URL(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/soopi');
uri.pathname = `/${tenDb}`;
if (!process.env.JWT_SECRET) throw new Error('Thiếu JWT_SECRET trong môi trường kiểm tra');
let server;
let tepDaTai;
const duLieu = { tenSanPham: 'Sản phẩm kiểm tra', giaGoc: 10000, soLuongTon: 4, hinhAnh: [], moTa: '', trangThaiKinhDoanh: 'Đang kinh doanh' };

async function run() {
  await mongoose.connect(uri.toString());
  const [a, b, thuong] = await TaiKhoan.create([
    { email: 'a-f12@example.com', matKhau: 'hash', hoTen: 'Người bán A', vaiTro: ['Người dùng', 'Người bán'] },
    { email: 'b-f12@example.com', matKhau: 'hash', hoTen: 'Người bán B', vaiTro: ['Người dùng', 'Người bán'] },
    { email: 'c-f12@example.com', matKhau: 'hash', hoTen: 'Người dùng', vaiTro: ['Người dùng'] },
  ]);
  const [shopA, shopB] = await CuaHang.create([
    { taiKhoanId: a._id, tenCuaHang: 'A', trangThaiHoatDong: 'Hoạt động' },
    { taiKhoanId: b._id, tenCuaHang: 'B', trangThaiHoatDong: 'Hoạt động' },
  ]);
  const dm = await DanhMuc.create({ tenDanhMuc: 'Đồ kiểm tra' });
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const token = (id) => jwt.sign({ taiKhoanId: String(id) }, process.env.JWT_SECRET);
  const goi = async (method, path, body, id = a._id) => {
    const response = await fetch(base + path, { method, headers: { ...(id ? { Cookie: `token=${token(id)}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
    return [response.status, await response.json()];
  };
  const endpoint = '/api/nguoi-ban/san-pham';
  const taiAnh = async (ten, loai, bytes) => {
    const form = new FormData();
    form.append('hinhAnh', new Blob([bytes], { type: loai }), ten);
    const response = await fetch(base + '/api/tep-tin/hinh-anh', { method: 'POST', headers: { Cookie: `token=${token(a._id)}` }, body: form });
    return [response.status, await response.json()];
  };
  let r = await goi('GET', endpoint, undefined, null); assert.equal(r[0], 401);
  r = await goi('GET', endpoint, undefined, thuong._id); assert.equal(r[0], 403);
  const sanPhamB = await SanPham.create({ ...duLieu, danhMucId: dm._id, cuaHangId: shopB._id });
  r = await goi('GET', endpoint); assert.equal(r[0], 200); assert.equal(r[1].data.danhSach.length, 0);
  for (const method of ['GET', 'PATCH', 'DELETE']) {
    r = await goi(method, `${endpoint}/${sanPhamB._id}`, method === 'PATCH' ? { tenSanPham: 'Sai quyền' } : undefined);
    assert.equal(r[0], 404, method);
  }
  for (const body of [
    { giaGoc: 0 }, { giaGoc: -5 }, { giaGoc: 10.5 }, { soLuongTon: -1 },
    { danhMucId: new mongoose.Types.ObjectId() }, { hinhAnh: ['javascript:alert(1)'] },
  ]) {
    r = await goi('POST', endpoint, { ...duLieu, danhMucId: dm._id, ...body });
    assert.equal(r[0], 400, JSON.stringify(body));
  }
  r = await taiAnh('test.exe', 'application/octet-stream', Buffer.from('fake')); assert.equal(r[0], 400);
  r = await taiAnh('test.svg', 'image/svg+xml', Buffer.from('<svg/>')); assert.equal(r[0], 400);
  r = await taiAnh('large.png', 'image/png', Buffer.alloc(6 * 1024 * 1024)); assert.equal(r[0], 400);
  r = await taiAnh('valid.png', 'image/png', Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==', 'base64'));
  assert.equal(r[0], 201);
  const urlAnh = r[1].data.duongDan;
  tepDaTai = urlAnh;
  assert.match(urlAnh, /^https:\/\/res\.cloudinary\.com\//);
  assert.equal((await fetch(urlAnh)).status, 200);
  r = await goi('POST', endpoint, { ...duLieu, danhMucId: dm._id, cuaHangId: shopB._id });
  assert.equal(r[0], 201);
  const id = r[1].data.sanPham._id;
  assert.equal(r[1].data.sanPham.danhMuc.tenDanhMuc, dm.tenDanhMuc);
  r = await goi('GET', endpoint); assert.equal(r[1].data.danhSach.length, 1);
  assert.equal(String((await SanPham.findById(id)).cuaHangId), String(shopA._id));
  r = await goi('PATCH', `${endpoint}/${id}/ton-kho`, { soLuongTon: 7 }); assert.equal(r[0], 200);
  r = await goi('PATCH', `${endpoint}/${id}/ton-kho`, { soLuongTon: -1 }); assert.equal(r[0], 400);
  const dongThoi = await Promise.all([goi('PATCH', `${endpoint}/${id}/ton-kho`, { soLuongTon: 8 }), goi('PATCH', `${endpoint}/${id}/ton-kho`, { soLuongTon: 9 })]);
  assert(dongThoi.every(([status]) => status === 200 || status === 409));
  r = await goi('PATCH', `${endpoint}/${id}`, { soLuongTon: 100 }); assert.equal(r[0], 400);
  r = await goi('DELETE', `${endpoint}/${id}`); assert.equal(r[0], 200);
  assert.equal(await SanPham.exists({ _id: id }), null);
  r = await goi('POST', endpoint, { ...duLieu, danhMucId: dm._id });
  const idCoThamChieu = r[1].data.sanPham._id;
  await mongoose.connection.db.collection('ChiTietKhuyenMai').insertOne({ sanPhamId: new mongoose.Types.ObjectId(idCoThamChieu) });
  r = await goi('DELETE', `${endpoint}/${idCoThamChieu}`); assert.equal(r[0], 200);
  assert.equal((await SanPham.findById(idCoThamChieu)).trangThaiKinhDoanh, 'Ngừng kinh doanh');
  r = await goi('GET', `/api/san-pham/${idCoThamChieu}`); assert.equal(r[0], 404);
  r = await goi('GET', '/api/san-pham'); assert(r[1].data.danhSach.some((p) => p._id === String(sanPhamB._id)));
  console.log('F12 API: quyền, tạo, validation, tồn kho, xóa cứng/mềm, công khai: OK');
}

run().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (tepDaTai && mongoose.connection.readyState === 1) await xoaAnhNeuKhongDung(tepDaTai).catch(() => {});
  if (mongoose.connection.readyState === 1) { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); }
});
