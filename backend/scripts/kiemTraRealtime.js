const assert = require('node:assert/strict');
const http = require('node:http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { io: taoClient } = require('socket.io-client');
require('dotenv').config();
const app = require('../app');
const { khoiTaoSocket } = require('../src/services/thongBaoTinNhan.service');
const TaiKhoan = require('../src/models/taiKhoan.model');
const CuaHang = require('../src/models/cuaHang.model');
const TinNhan = require('../src/models/tinNhan.model');

const uri = new URL(process.env.MONGODB_URI);
uri.pathname = `/soopi_realtime_test_${Date.now()}`;
let server;
let io;
const clients = [];
const cookie = (id, phienBanToken = 0) => `token=${jwt.sign({ taiKhoanId: String(id), phienBanToken }, process.env.JWT_SECRET)}`;
const doiSuKien = (client, ten, timeout = 3000) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error(`Không nhận được ${ten}`)), timeout);
  client.once(ten, (data) => { clearTimeout(timer); resolve(data); });
});
const ketNoi = async (id, phienBanToken = 0, origin) => {
  const client = taoClient(`http://127.0.0.1:${server.address().port}`, {
    transports: ['websocket'], extraHeaders: { ...(id ? { Cookie: cookie(id, phienBanToken) } : {}),
      ...(origin ? { Origin: origin } : {}) }, reconnection: false,
  });
  clients.push(client);
  if (id && !origin) client.on('connect_error', (loi) => console.error('Lỗi kết nối Socket.IO:', loi.message));
  await doiSuKien(client, id && !origin ? 'connect' : 'connect_error');
  return client;
};
const guiRest = async (id, duongDan, body) => {
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api${duongDan}`, {
    method: 'POST', headers: { Cookie: cookie(id), 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  return [response.status, await response.json()];
};

async function run() {
  await mongoose.connect(uri.toString());
  server = http.createServer(app);
  io = khoiTaoSocket(server);
  await new Promise((resolve) => server.listen(0, resolve));
  const mua = await TaiKhoan.create({ email: 'realtime-mua@example.com', matKhau: 'hash', hoTen: 'Khách' });
  const ban = await TaiKhoan.create({ email: 'realtime-ban@example.com', matKhau: 'hash', hoTen: 'Chủ shop', vaiTro: ['Người dùng', 'Người bán'] });
  const ngoai = await TaiKhoan.create({ email: 'realtime-ngoai@example.com', matKhau: 'hash', hoTen: 'Người ngoài' });
  const shop = await CuaHang.create({ taiKhoanId: ban._id, tenCuaHang: 'Shop realtime' });
  const [clientMua, clientBan, clientNgoai] = await Promise.all([ketNoi(mua._id), ketNoi(ban._id), ketNoi(ngoai._id)]);
  await ketNoi(null);
  await ketNoi(mua._id, 0, 'https://trang-la.example');
  let tinNgoai = 0;
  clientNgoai.on('tin-nhan-moi', () => { tinNgoai += 1; });
  const tinDau = doiSuKien(clientBan, 'tin-nhan-moi');
  const [maTao, dataTao] = await guiRest(mua._id, '/cuoc-tro-chuyen', { cuaHangId: shop._id, noiDung: 'Xin chào' });
  assert.equal(maTao, 201);
  const tin = await tinDau;
  assert.equal(tin._id, dataTao.data.tinNhan._id);
  assert.equal((await TinNhan.countDocuments({ _id: tin._id })), 1);
  const tinTraLoi = doiSuKien(clientMua, 'tin-nhan-moi');
  const [maGui, dataGui] = await guiRest(ban._id, `/cuoc-tro-chuyen/${tin.cuocTroChuyenId}/tin-nhan`, { noiDung: 'Đã nhận' });
  assert.equal(maGui, 201);
  assert.equal((await tinTraLoi)._id, dataGui.data.tinNhan._id);
  assert.equal(tinNgoai, 0);
  await TaiKhoan.updateOne({ _id: mua._id }, { $inc: { phienBanToken: 1 } });
  const clientMoi = await ketNoi(mua._id, 1);
  let tinPhienCu = 0;
  clientMua.on('tin-nhan-moi', () => { tinPhienCu += 1; });
  const tinPhienMoi = doiSuKien(clientMoi, 'tin-nhan-moi');
  assert.equal((await guiRest(ban._id, `/cuoc-tro-chuyen/${tin.cuocTroChuyenId}/tin-nhan`, { noiDung: 'Tin sau đổi mật khẩu' }))[0], 201);
  await tinPhienMoi;
  assert.equal(tinPhienCu, 0);
  console.log('Realtime: hai phía nhận tin đã lưu; người ngoài và phiên cũ sau đổi mật khẩu không nhận.');
}

run().catch((loi) => { console.error(loi); process.exitCode = 1; }).finally(async () => {
  clients.forEach((client) => client.disconnect());
  if (io) await new Promise((resolve) => io.close(resolve));
  if (server?.listening) await new Promise((resolve) => server.close(resolve));
  if (mongoose.connection.readyState === 1) await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});
