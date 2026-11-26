const assert = require('node:assert/strict');
const mongoose = require('mongoose');
require('dotenv').config();
const TaiKhoan = require('../src/models/taiKhoan.model');
const CuaHang = require('../src/models/cuaHang.model');
const dangKy = require('../src/services/yeuCauDangKyNguoiBan.service');
const { VAI_TRO } = require('../src/constants/vaiTro.constant');

const uri = new URL(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/soopi');
uri.pathname = `/soopi_xetduyet_kiemtra_${Date.now()}`;

async function chay() {
  await mongoose.connect(uri.toString());
  const taiKhoan = await TaiKhoan.create({ email: 'xetduyet@example.com', matKhau: 'hash', hoTen: 'Người đăng ký' });
  const thongTin = { tenCuaHang: 'Shop đầu', diaChiCuaHang: 'Hà Nội', moTaCuaHang: 'Đồ gia dụng' };
  const yeuCau = await dangKy.guiYeuCauDangKyNguoiBan(taiKhoan, thongTin);
  assert.equal(yeuCau.trangThai, 'Chờ phê duyệt');
  assert.equal((await CuaHang.findById(yeuCau._id)).trangThaiHoatDong, 'Ngừng hoạt động');
  await assert.rejects(dangKy.guiYeuCauDangKyNguoiBan(taiKhoan, thongTin), { statusCode: 409 });
  assert.equal((await dangKy.quanTriLayDanhSachYeuCau({ trangThai: 'Chờ phê duyệt' })).phanTrang.tongSo, 1);

  await dangKy.quanTriXetDuyetYeuCau(yeuCau._id, 'Đã từ chối');
  assert.equal((await dangKy.layYeuCauCuaToi(taiKhoan)).yeuCau.trangThai, 'Đã từ chối');
  const guiLai = await dangKy.guiYeuCauDangKyNguoiBan(taiKhoan,
    { ...thongTin, tenCuaHang: 'Shop đã sửa' });
  assert.equal(String(guiLai._id), String(yeuCau._id));
  assert.equal(guiLai.tenCuaHang, 'Shop đã sửa');
  assert.equal(await CuaHang.countDocuments({ taiKhoanId: taiKhoan._id }), 1);

  await dangKy.quanTriXetDuyetYeuCau(guiLai._id, 'Đã phê duyệt');
  const [shop, chuShop] = await Promise.all([CuaHang.findById(guiLai._id), TaiKhoan.findById(taiKhoan._id)]);
  assert.equal(shop.trangThaiHoatDong, 'Hoạt động');
  assert.ok(chuShop.vaiTro.includes(VAI_TRO.NGUOI_BAN));
  await assert.rejects(dangKy.guiYeuCauDangKyNguoiBan(chuShop, thongTin), { statusCode: 409 });
  console.log('Cửa hàng: đăng ký, từ chối, gửi lại cùng bản ghi, duyệt và cấp vai trò đạt.');
}

chay().catch((loi) => { console.error(loi); process.exitCode = 1; }).finally(async () => {
  if (mongoose.connection.readyState === 1 && mongoose.connection.db.databaseName.startsWith('soopi_xetduyet_kiemtra_')) {
    await mongoose.connection.dropDatabase();
  }
  await mongoose.disconnect();
});
