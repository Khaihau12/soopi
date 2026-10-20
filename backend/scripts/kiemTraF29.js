const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const app = require('../app');
const TaiKhoan = require('../src/models/taiKhoan.model');
const CuaHang = require('../src/models/cuaHang.model');
const DanhMuc = require('../src/models/danhMuc.model');
const SanPham = require('../src/models/sanPham.model');
const { VAI_TRO } = require('../src/constants/vaiTro.constant');

const uri = new URL(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/soopi');
uri.pathname = `/soopi_f29_kiemtra_${Date.now()}`;
let server;
let soGoiNghiepVu = 0;

function layDanhSachRoute() {
  const thuMuc = path.join(__dirname, '..', 'src', 'routes');
  const index = fs.readFileSync(path.join(thuMuc, 'index.js'), 'utf8');
  const tepTheoBien = new Map([...index.matchAll(/const (\w+Routes) = require\('\.\/([^']+)'\)/g)].map(([, bien, tep]) => [bien, tep + '.js']));
  const danhSach = [];
  for (const [, tienTo, bien] of index.matchAll(/router\.use\('([^']+)', (\w+Routes)\)/g)) {
    const tep = fs.readFileSync(path.join(thuMuc, tepTheoBien.get(bien)), 'utf8');
    for (const [, method, duongDan] of tep.matchAll(/router\.(get|post|patch|delete)\('([^']*)'/g)) {
      danhSach.push({ method: method.toUpperCase(), duongDan: '/api' + tienTo + (duongDan === '/' ? '' : duongDan) });
    }
  }
  return danhSach;
}

function phamVi({ method, duongDan }) {
  if (duongDan.startsWith('/api/quan-tri-vien/')) return 'admin';
  if (duongDan.startsWith('/api/nguoi-ban/') || duongDan === '/api/don-hang/:id/trang-thai') return 'nguoiBan';
  if (duongDan.startsWith('/api/tep-tin/')) return 'nguoiBanHoacAdmin';
  if (duongDan.startsWith('/api/xac-thuc/')) return duongDan === '/api/xac-thuc/toi' ? 'taiKhoan' : 'congKhai';
  if (duongDan === '/api/giao-dich-thanh-toan/vnpay/ket-qua') return 'congKhai';
  if (duongDan.startsWith('/api/danh-gia')) return method === 'GET' && duongDan === '/api/danh-gia' ? 'congKhai' : 'taiKhoan';
  if (['/api/kiem-tra', '/api/danh-muc', '/api/san-pham', '/api/banner-quang-cao', '/api/khuyen-mai', '/api/voucher'].some((dau) => duongDan === dau || duongDan.startsWith(dau + '/'))) return 'congKhai';
  return 'taiKhoan';
}

async function goi(method, duongDan, cookie) {
  const id = new mongoose.Types.ObjectId().toString();
  const url = duongDan.replaceAll(':id', id);
  const response = await fetch(`http://127.0.0.1:${server.address().port}${url}`, {
    method, headers: cookie ? { Cookie: cookie } : {},
  });
  const noiDung = await response.text();
  for (const biMat of [process.env.JWT_SECRET, process.env.MONGODB_URI, process.env.VNP_HASH_SECRET].filter(Boolean)) {
    assert.ok(!noiDung.includes(biMat), `${method} ${duongDan} làm lộ bí mật`);
  }
  assert.ok(!noiDung.includes('"matKhau":') && !noiDung.includes('"stack":'), `${method} ${duongDan} làm lộ dữ liệu nội bộ`);
  return response.status;
}

async function goiJson(method, duongDan, duLieu, cookie) {
  const response = await fetch(`http://127.0.0.1:${server.address().port}${duongDan}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    ...(duLieu ? { body: JSON.stringify(duLieu) } : {}),
  });
  const ketQua = await response.json();
  soGoiNghiepVu += 1;
  const noiDung = JSON.stringify(ketQua);
  for (const biMat of [process.env.JWT_SECRET, process.env.MONGODB_URI, process.env.VNP_HASH_SECRET].filter(Boolean)) {
    assert.ok(!noiDung.includes(biMat), `${method} ${duongDan} làm lộ bí mật`);
  }
  assert.ok(!noiDung.includes('"matKhau":') && !noiDung.includes('"stack":'), `${method} ${duongDan} làm lộ dữ liệu nội bộ`);
  return { status: response.status, data: ketQua.data, headers: response.headers };
}

async function main() {
  await mongoose.connect(uri.toString());
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const hash = await bcrypt.hash('KiemTraF29!', 4);
  const nguoiDung = await TaiKhoan.create({ email: 'f29-user@example.com', hoTen: 'Người dùng', matKhau: hash });
  const nguoiBan = await TaiKhoan.create({ email: 'f29-seller@example.com', hoTen: 'Người bán', matKhau: hash, vaiTro: [VAI_TRO.NGUOI_DUNG, VAI_TRO.NGUOI_BAN] });
  const admin = await TaiKhoan.create({ email: 'f29-admin@example.com', hoTen: 'Quản trị viên', matKhau: hash, vaiTro: [VAI_TRO.QUAN_TRI_VIEN] });
  const biKhoa = await TaiKhoan.create({ email: 'f29-locked@example.com', hoTen: 'Bị khóa', matKhau: hash, trangThaiTaiKhoan: 'Bị khóa' });
  const cuaHang = await CuaHang.create({ tenCuaHang: 'Cửa hàng F29', taiKhoanId: nguoiBan._id });
  const banKhac = await TaiKhoan.create({ email: 'f29-other@example.com', hoTen: 'Người bán khác', matKhau: hash, vaiTro: [VAI_TRO.NGUOI_DUNG, VAI_TRO.NGUOI_BAN] });
  const cuaHangKhac = await CuaHang.create({ tenCuaHang: 'Cửa hàng khác F29', taiKhoanId: banKhac._id });
  const danhMuc = await DanhMuc.create({ tenDanhMuc: 'Danh mục F29' });
  const sanPhamKhac = await SanPham.create({ tenSanPham: 'Sản phẩm cửa hàng khác', giaGoc: 120000, soLuongTon: 3, cuaHangId: cuaHangKhac._id, danhMucId: danhMuc._id });
  assert.ok(cuaHang);

  const cookie = (taiKhoan) => `token=${jwt.sign({ taiKhoanId: String(taiKhoan._id), phienBanToken: 0 }, process.env.JWT_SECRET)}`;
  const vaiTro = { nguoiDung: cookie(nguoiDung), nguoiBan: cookie(nguoiBan), admin: cookie(admin), biKhoa: cookie(biKhoa) };

  const taiKhoanMoi = { email: 'f29-dangky@example.com', hoTen: 'Người đăng ký F29', matKhau: 'KiemTraF29!' };
  const dangKy = await goiJson('POST', '/api/xac-thuc/dang-ky', taiKhoanMoi);
  assert.equal(dangKy.status, 201);
  const dangNhap = await goiJson('POST', '/api/xac-thuc/dang-nhap', { email: taiKhoanMoi.email, matKhau: taiKhoanMoi.matKhau });
  assert.equal(dangNhap.status, 200);
  assert.ok(dangNhap.headers.get('set-cookie')?.includes('HttpOnly'));
  const cookieMoi = `token=${dangNhap.headers.get('set-cookie').match(/token=([^;]+)/)[1]}`;
  assert.equal((await goiJson('GET', '/api/xac-thuc/toi', null, cookieMoi)).status, 200);
  assert.equal((await goiJson('PATCH', '/api/tai-khoan/ho-so', { diaChiNhanHang: 'Hà Nội' }, cookieMoi)).status, 200);
  assert.equal((await goiJson('GET', '/api/danh-muc')).status, 200);
  assert.equal((await goiJson('GET', '/api/san-pham')).status, 200);
  assert.equal((await goiJson('GET', `/api/san-pham/${sanPhamKhac._id}`)).status, 200);
  const yeuCau = await goiJson('POST', '/api/yeu-cau-dang-ky-nguoi-ban',
    { tenCuaHang: 'Cửa hàng mới F29', diaChiCuaHang: 'Hà Nội' }, cookieMoi);
  assert.equal(yeuCau.status, 201);
  assert.equal((await goiJson('PATCH', `/api/quan-tri-vien/yeu-cau-dang-ky-nguoi-ban/${yeuCau.data.yeuCau._id}/xet-duyet`,
    { trangThai: 'Đã phê duyệt' }, vaiTro.admin)).status, 200);
  const sauDuyet = await goiJson('GET', '/api/xac-thuc/toi', null, cookieMoi);
  assert.ok(sauDuyet.data.taiKhoan.vaiTro.includes(VAI_TRO.NGUOI_BAN));
  assert.equal((await goiJson('GET', '/api/nguoi-ban/cua-hang', null, cookieMoi)).status, 200);
  const yeuCauBiTuChoi = await goiJson('POST', '/api/yeu-cau-dang-ky-nguoi-ban',
    { tenCuaHang: 'Cửa hàng bị từ chối F29', diaChiCuaHang: 'Đà Nẵng' }, vaiTro.nguoiDung);
  assert.equal(yeuCauBiTuChoi.status, 201);
  assert.equal((await goiJson('PATCH', `/api/quan-tri-vien/yeu-cau-dang-ky-nguoi-ban/${yeuCauBiTuChoi.data.yeuCau._id}/xet-duyet`,
    { trangThai: 'Đã từ chối' }, vaiTro.admin)).status, 200);
  assert.ok(!(await goiJson('GET', '/api/xac-thuc/toi', null, vaiTro.nguoiDung)).data.taiKhoan.vaiTro.includes(VAI_TRO.NGUOI_BAN));

  const danhSach = layDanhSachRoute();
  let daThu = 0;
  const saiLech = [];
  for (const route of danhSach) {
    const quyen = phamVi(route);
    if (quyen === 'congKhai') continue;
    const mau = `${route.method} ${route.duongDan}`;
    const thu = async (cookieCan, mongDoi, ten) => {
      const status = await goi(route.method, route.duongDan, cookieCan);
      daThu += 1;
      if (mongDoi === 'choPhep' ? [401, 403].includes(status) || status >= 500 : status !== mongDoi) {
        saiLech.push(`${mau}: ${ten} trả ${status}, mong đợi ${mongDoi}`);
      }
    };
    await thu(null, 401, 'chưa đăng nhập');
    await thu(vaiTro.biKhoa, 403, 'tài khoản bị khóa');
    if (quyen === 'admin') {
      await thu(vaiTro.nguoiDung, 403, 'Người dùng');
      await thu(vaiTro.nguoiBan, 403, 'Người bán');
      await thu(vaiTro.admin, 'choPhep', 'Quản trị viên');
    } else if (quyen === 'nguoiBan') {
      await thu(vaiTro.nguoiDung, 403, 'Người dùng');
      await thu(vaiTro.admin, 403, 'Quản trị viên');
      await thu(vaiTro.nguoiBan, 'choPhep', 'Người bán');
    } else if (quyen === 'nguoiBanHoacAdmin') {
      await thu(vaiTro.nguoiDung, 403, 'Người dùng');
      await thu(vaiTro.nguoiBan, 'choPhep', 'Người bán');
      await thu(vaiTro.admin, 'choPhep', 'Quản trị viên');
    } else {
      await thu(vaiTro.nguoiDung, 'choPhep', 'Người dùng');
      await thu(vaiTro.nguoiBan, 'choPhep', 'Người bán');
      await thu(vaiTro.admin, 'choPhep', 'Quản trị viên');
    }
  }
  for (const method of ['GET', 'PATCH', 'DELETE']) {
    const status = await goi(method, `/api/nguoi-ban/san-pham/${sanPhamKhac._id}`, vaiTro.nguoiBan);
    if (status !== 404) saiLech.push(`${method} sản phẩm cửa hàng khác trả ${status}, mong đợi 404`);
  }
  console.log(`F29: ${danhSach.length} endpoint khai báo, ${daThu} lần gọi kiểm quyền, ${soGoiNghiepVu} lần gọi luồng nghiệp vụ; ${saiLech.length} sai lệch.`);
  if (saiLech.length) throw new Error(saiLech.join('\n'));
}

main().catch((loi) => { console.error(loi.message); process.exitCode = 1; }).finally(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (mongoose.connection.readyState === 1) {
    if (mongoose.connection.name.startsWith('soopi_f29_kiemtra_')) await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
