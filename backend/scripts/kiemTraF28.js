const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const app = require('../app');
const TaiKhoan = require('../src/models/taiKhoan.model');

const uri = new URL(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/soopi');
uri.pathname = `/soopi_f28_kiemtra_${Date.now()}`;
let server;
const lienKetLog = [];
const consoleInfoGoc = console.info;

const goi = async (duongDan, body, cookie) => {
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api${duongDan}`, {
    method: duongDan === '/xac-thuc/toi' ? 'GET' : 'POST',
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, data: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] };
};

async function run() {
  await mongoose.connect(uri.toString());
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const bam = await bcrypt.hash('MatKhauCu123!', 4);
  const nguoiDung = await TaiKhoan.create({ email: 'f28-user@example.com', matKhau: bam, hoTen: 'Người dùng' });
  const biKhoa = await TaiKhoan.create({ email: 'f28-locked@example.com', matKhau: bam, hoTen: 'Bị khóa', trangThaiTaiKhoan: 'Bị khóa' });
  const admin = await TaiKhoan.create({ email: 'f28-admin@example.com', matKhau: bam, hoTen: 'Quản trị viên', vaiTro: ['Quản trị viên'] });
  const khoaSau = await TaiKhoan.create({ email: 'f28-lock-later@example.com', matKhau: bam, hoTen: 'Khóa sau' });
  const cu = await goi('/xac-thuc/dang-nhap', { email: nguoiDung.email, matKhau: 'MatKhauCu123!' });
  assert.equal(cu.status, 200);
  assert.equal((await goi('/xac-thuc/toi', null, cu.cookie)).status, 200);

  process.env.NODE_ENV = 'production';
  console.info = (noiDung) => { if (noiDung.startsWith('Liên kết đặt lại mật khẩu:')) lienKetLog.push(noiDung); };
  const khongCo = await goi('/xac-thuc/quen-mat-khau', { email: 'khongco@example.com' });
  const co = await goi('/xac-thuc/quen-mat-khau', { email: '  F28-USER@EXAMPLE.COM  ' });
  assert.equal(co.status, 200);
  assert.deepEqual(co.data, khongCo.data);
  assert.deepEqual(co.data.data, {});
  assert.equal(lienKetLog.length, 1);
  assert.equal((await goi('/xac-thuc/quen-mat-khau', { email: biKhoa.email })).data.message, co.data.message);
  assert.equal((await goi('/xac-thuc/quen-mat-khau', { email: admin.email })).data.message, co.data.message);
  assert.equal(lienKetLog.length, 1);
  assert.equal((await goi('/xac-thuc/quen-mat-khau', { email: 'sai-email' })).status, 400);

  process.env.NODE_ENV = 'development';
  const lienKetKhoaSau = (await goi('/xac-thuc/quen-mat-khau', { email: khoaSau.email })).data.data.lienKetDatLai;
  await TaiKhoan.updateOne({ _id: khoaSau.id }, { $set: { trangThaiTaiKhoan: 'Bị khóa' } });
  const tokenKhoaSau = new URL(lienKetKhoaSau).searchParams.get('token');
  assert.equal((await goi('/xac-thuc/dat-lai-mat-khau', { token: tokenKhoaSau, matKhauMoi: 'MatKhauMoi123!' })).status, 400);
  const yeuCau = await goi('/xac-thuc/quen-mat-khau', { email: nguoiDung.email });
  const lienKet = yeuCau.data.data.lienKetDatLai;
  assert.ok(lienKet.startsWith(`${process.env.FRONTEND_URL.replace(/\/+$/, '')}/dat-lai-mat-khau?token=`));
  const token = new URL(lienKet).searchParams.get('token');
  assert.equal((await goi('/xac-thuc/quen-mat-khau', { email: 'khongco@example.com' })).data.data.lienKetDatLai, undefined);
  assert.equal((await goi('/xac-thuc/dat-lai-mat-khau', { token, matKhauMoi: 'ngan' })).status, 400);
  const tokenSua = await goi('/xac-thuc/dat-lai-mat-khau', { token: token.slice(0, -5) + 'xxxxx', matKhauMoi: 'MatKhauMoi123!' });
  assert.equal(tokenSua.status, 400);
  const hetHan = jwt.sign({ taiKhoanId: nguoiDung.id, mucDich: 'datLaiMatKhau' }, process.env.JWT_SECRET + bam, { expiresIn: -1 });
  const tokenHetHan = await goi('/xac-thuc/dat-lai-mat-khau', { token: hetHan, matKhauMoi: 'MatKhauMoi123!' });
  assert.equal(tokenHetHan.status, 400);
  assert.equal(tokenSua.data.message, tokenHetHan.data.message);
  const saiMucDich = jwt.sign({ taiKhoanId: nguoiDung.id, mucDich: 'dangNhap' }, process.env.JWT_SECRET + bam, { expiresIn: '15m' });
  assert.equal((await goi('/xac-thuc/dat-lai-mat-khau', { token: saiMucDich, matKhauMoi: 'MatKhauMoi123!' })).status, 400);
  assert.equal((await goi('/xac-thuc/dat-lai-mat-khau', { token: cu.cookie.split('=')[1], matKhauMoi: 'MatKhauMoi123!' })).status, 400);
  const nguoiBiKhoaToken = jwt.sign({ taiKhoanId: biKhoa.id, mucDich: 'datLaiMatKhau' }, process.env.JWT_SECRET + bam, { expiresIn: '15m' });
  assert.equal((await goi('/xac-thuc/dat-lai-mat-khau', { token: nguoiBiKhoaToken, matKhauMoi: 'MatKhauMoi123!' })).status, 400);
  const adminToken = jwt.sign({ taiKhoanId: admin.id, mucDich: 'datLaiMatKhau' }, process.env.JWT_SECRET + bam, { expiresIn: '15m' });
  assert.equal((await goi('/xac-thuc/dat-lai-mat-khau', { token: adminToken, matKhauMoi: 'MatKhauMoi123!' })).status, 400);

  assert.equal((await goi('/xac-thuc/dat-lai-mat-khau', { token, matKhauMoi: 'MatKhauMoi123!' })).status, 200);
  assert.equal((await goi('/xac-thuc/dat-lai-mat-khau', { token, matKhauMoi: 'MatKhauMoi123!' })).status, 400);
  assert.equal((await goi('/xac-thuc/toi', null, cu.cookie)).status, 401);
  assert.equal((await goi('/xac-thuc/dang-nhap', { email: nguoiDung.email, matKhau: 'MatKhauCu123!' })).status, 401);
  assert.equal((await goi('/xac-thuc/dang-nhap', { email: nguoiDung.email, matKhau: 'MatKhauMoi123!' })).status, 200);
  assert.equal((await TaiKhoan.findById(nguoiDung.id).select('+phienBanToken')).phienBanToken, 1);
  assert.ok(lienKetLog.every((dong) => !dong.includes(nguoiDung.email) && !dong.includes(bam) && !dong.includes('MatKhauMoi123!')));
  console.log('F28: API quên/đặt lại mật khẩu, token, quyền và phiên đăng nhập đạt.');
}

run().catch((loi) => { console.error(loi); process.exitCode = 1; }).finally(async () => {
  console.info = consoleInfoGoc;
  if (server) await new Promise((resolve) => server.close(resolve));
  if (mongoose.connection.readyState === 1) {
    if (mongoose.connection.name.startsWith('soopi_f28_kiemtra_')) await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
