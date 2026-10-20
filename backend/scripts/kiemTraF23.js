const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const app = require('../app');
const TaiKhoan = require('../src/models/taiKhoan.model');
const CuaHang = require('../src/models/cuaHang.model');
const CuocTroChuyen = require('../src/models/cuocTroChuyen.model');
const TinNhan = require('../src/models/tinNhan.model');

const uri = new URL(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/soopi');
uri.pathname = `/soopi_f23_kiemtra_${Date.now()}`;
let server;
const token = (id) => `token=${jwt.sign({ taiKhoanId: String(id) }, process.env.JWT_SECRET)}`;
const goi = async (duongDan, id, method = 'GET', body) => {
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api${duongDan}`, {
    method, headers: { ...(id ? { Cookie: token(id) } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return [response.status, await response.json()];
};

async function run() {
  assert.ok(process.env.JWT_SECRET);
  await mongoose.connect(uri.toString());
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const mua = await TaiKhoan.create({ email: 'f23-mua@example.com', matKhau: 'hash', hoTen: 'Khách Một' });
  const muaKhac = await TaiKhoan.create({ email: 'f23-khac@example.com', matKhau: 'hash', hoTen: 'Khách Hai' });
  const ban = await TaiKhoan.create({ email: 'f23-ban@example.com', matKhau: 'hash', hoTen: 'Chủ A', vaiTro: ['Người dùng', 'Người bán'] });
  const banKhac = await TaiKhoan.create({ email: 'f23-ban-khac@example.com', matKhau: 'hash', hoTen: 'Chủ B', vaiTro: ['Người dùng', 'Người bán'] });
  const shop = await CuaHang.create({ taiKhoanId: ban._id, tenCuaHang: 'Cửa hàng A' });
  const shopKhac = await CuaHang.create({ taiKhoanId: banKhac._id, tenCuaHang: 'Cửa hàng B' });
  await CuocTroChuyen.init();
  const tao = (id, cuaHangId, noiDung) => goi('/cuoc-tro-chuyen', id, 'POST', { cuaHangId, noiDung });
  assert.equal((await tao(null, shop._id, 'Xin chào'))[0], 401);
  assert.equal((await tao(ban._id, shop._id, 'Xin chào'))[0], 409);
  assert.equal((await tao(mua._id, new mongoose.Types.ObjectId(), 'Xin chào'))[0], 404);
  for (const noiDung of ['', '   ', 'x'.repeat(1001)]) assert.equal((await tao(mua._id, shop._id, noiDung))[0], 400);
  assert.equal(await CuocTroChuyen.countDocuments(), 0);
  const songSong = await Promise.all([tao(mua._id, shop._id, 'Tin đầu A'), tao(mua._id, shop._id, 'Tin đầu B')]);
  assert.deepEqual(songSong.map(([ma]) => ma), [201, 201]);
  const idCuoc = songSong[0][1].data.cuocTroChuyen._id;
  assert.equal(songSong[1][1].data.cuocTroChuyen._id, idCuoc);
  assert.equal(await CuocTroChuyen.countDocuments({ taiKhoanId: mua._id, cuaHangId: shop._id }), 1);
  assert.equal(await TinNhan.countDocuments({ cuocTroChuyenId: idCuoc }), 2);
  assert.equal((await goi(`/cuoc-tro-chuyen?cuaHangId=${shop._id}`, mua._id))[1].data.danhSach.length, 1);
  assert.equal((await goi('/cuoc-tro-chuyen', muaKhac._id))[1].data.danhSach.length, 0);
  assert.equal((await goi('/nguoi-ban/cuoc-tro-chuyen', ban._id))[1].data.danhSach[0].nguoiDung.hoTen, 'Khách Một');
  assert.equal((await goi('/nguoi-ban/cuoc-tro-chuyen', banKhac._id))[1].data.danhSach.length, 0);
  assert.equal((await goi('/nguoi-ban/cuoc-tro-chuyen', mua._id))[0], 403);
  for (const id of [muaKhac._id, banKhac._id]) {
    assert.equal((await goi(`/cuoc-tro-chuyen/${idCuoc}/tin-nhan`, id))[0], 404);
    assert.equal((await goi(`/cuoc-tro-chuyen/${idCuoc}/tin-nhan`, id, 'POST', { noiDung: 'Không được gửi' }))[0], 404);
  }
  assert.equal((await goi(`/cuoc-tro-chuyen/${idCuoc}/tin-nhan`, null))[0], 401);
  assert.equal((await goi(`/cuoc-tro-chuyen/${idCuoc}/tin-nhan`, ban._id, 'POST', { noiDung: 'Đã nhận yêu cầu' }))[0], 201);
  assert.equal((await goi(`/cuoc-tro-chuyen/${idCuoc}/tin-nhan`, mua._id))[1].data.danhSach.length, 3);
  assert.equal((await goi(`/cuoc-tro-chuyen/${idCuoc}/tin-nhan`, mua._id, 'POST', { noiDung: '  ' }))[0], 400);
  assert.equal((await goi(`/cuoc-tro-chuyen/${idCuoc}/tin-nhan`, mua._id, 'POST', { noiDung: 'x'.repeat(1001) }))[0], 400);
  assert.equal((await goi(`/cuoc-tro-chuyen/${idCuoc}/tin-nhan?truoc=2026-01-01T00%3A00%3A00.000Z&sau=2026-01-01T00%3A00%3A00.000Z`, mua._id))[0], 400);
  await CuaHang.updateOne({ _id: shop._id }, { trangThaiHoatDong: 'Ngừng hoạt động' });
  assert.equal((await tao(muaKhac._id, shop._id, 'Chào'))[0], 409);
  assert.equal((await tao(mua._id, shop._id, 'Tin tiếp'))[0], 201);
  const truoc = (await CuocTroChuyen.findById(idCuoc)).thoiGianCapNhat;
  await goi(`/cuoc-tro-chuyen/${idCuoc}/tin-nhan`, ban._id, 'POST', { noiDung: 'Tin mới' });
  assert.ok((await CuocTroChuyen.findById(idCuoc)).thoiGianCapNhat >= truoc);
  const moc = new Date(Date.now() - 3600000);
  const tinCu = Array.from({ length: 35 }, (_, i) => ({ cuocTroChuyenId: idCuoc, nguoiGuiId: mua._id,
    noiDung: `Tin cũ ${i}`, thoiGianGui: new Date(moc.getTime() + i * 1000) }));
  await TinNhan.insertMany(tinCu);
  const [maMacDinh, dataMacDinh] = await goi(`/cuoc-tro-chuyen/${idCuoc}/tin-nhan`, mua._id);
  assert.equal(maMacDinh, 200);
  assert.equal(dataMacDinh.data.danhSach.length, 30);
  assert.equal(dataMacDinh.data.coTinCuHon, true);
  const dau = dataMacDinh.data.danhSach[0];
  const [maCu, dataCu] = await goi(`/cuoc-tro-chuyen/${idCuoc}/tin-nhan?truoc=${encodeURIComponent(dau.thoiGianGui)}`, mua._id);
  assert.equal(maCu, 200);
  assert.ok(dataCu.data.danhSach.some((tin) => tin._id === dau._id));
  assert.equal(new Set([...dataMacDinh.data.danhSach, ...dataCu.data.danhSach].map((tin) => tin._id)).size, 40);
  const tinGanNhat = dataMacDinh.data.danhSach.at(-1);
  const [maSau, dataSau] = await goi(`/cuoc-tro-chuyen/${idCuoc}/tin-nhan?sau=${encodeURIComponent(tinGanNhat.thoiGianGui)}`, mua._id);
  assert.equal(maSau, 200);
  assert.ok(dataSau.data.danhSach.some((tin) => tin._id === tinGanNhat._id));
  const taoTinGoc = TinNhan.create;
  TinNhan.create = async () => { throw new Error('Mô phỏng lỗi lưu tin'); };
  try { assert.equal((await tao(muaKhac._id, shopKhac._id, 'Tin lỗi'))[0], 500); }
  finally { TinNhan.create = taoTinGoc; }
  assert.equal(await CuocTroChuyen.countDocuments({ taiKhoanId: muaKhac._id, cuaHangId: shopKhac._id }), 0);
  assert.equal((await tao(muaKhac._id, shopKhac._id, 'Tin hợp lệ'))[0], 201);
  assert.equal((await tao(mua._id, shopKhac._id, 'Hỏi cửa hàng B'))[0], 201);
  const danhSachDaSap = (await goi('/cuoc-tro-chuyen', mua._id))[1].data.danhSach;
  assert.equal(danhSachDaSap[0].cuaHang.tenCuaHang, 'Cửa hàng B');
  assert.equal(danhSachDaSap[0].tinNhanCuoi.noiDung, 'Hỏi cửa hàng B');
  const demTruyVan = async (duongDan) => {
    let so = 0;
    mongoose.set('debug', () => { so += 1; });
    try { await goi(duongDan, mua._id); }
    finally { mongoose.set('debug', false); }
    return so;
  };
  assert.equal(await demTruyVan('/cuoc-tro-chuyen?gioiHan=1'), await demTruyVan('/cuoc-tro-chuyen?gioiHan=20'));
  console.log('F23: API, quyền, chống trùng, cửa hàng ngừng hoạt động, phân trang và REST cursor đạt.');
}

run().catch((loi) => { console.error(loi); process.exitCode = 1; }).finally(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (mongoose.connection.readyState === 1) await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});
