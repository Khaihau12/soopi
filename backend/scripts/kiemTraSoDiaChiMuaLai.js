const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const app = require('../app');
const TaiKhoan = require('../src/models/taiKhoan.model');
const CuaHang = require('../src/models/cuaHang.model');
const DanhMuc = require('../src/models/danhMuc.model');
const SanPham = require('../src/models/sanPham.model');
const DonHang = require('../src/models/donHang.model');
const ChiTietDonHang = require('../src/models/chiTietDonHang.model');
const ChiTietGioHang = require('../src/models/chiTietGioHang.model');
const GioHang = require('../src/models/gioHang.model');

const uri = new URL(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/soopi');
uri.pathname = `/soopi_so_dia_chi_mua_lai_${Date.now()}`;
let server;
const goi = async (path, taiKhoan, method = 'GET', body) => {
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api${path}`, {
    method,
    headers: { ...(taiKhoan ? { Cookie: `token=${jwt.sign({ taiKhoanId: String(taiKhoan._id) }, process.env.JWT_SECRET)}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return [response.status, await response.json()];
};

async function run() {
  assert.ok(process.env.JWT_SECRET);
  await mongoose.connect(uri.toString());
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const mua = await TaiKhoan.create({ email: 'so-dia-chi@example.com', matKhau: 'hash', hoTen: 'Người mua', diaChiNhanHang: 'Địa chỉ cũ' });
  const khac = await TaiKhoan.create({ email: 'so-dia-chi-khac@example.com', matKhau: 'hash', hoTen: 'Người khác' });
  const admin = await TaiKhoan.create({ email: 'so-dia-chi-admin@example.com', matKhau: 'hash', hoTen: 'Admin', vaiTro: ['Quản trị viên'] });

  assert.equal((await goi('/tai-khoan/so-dia-chi', null))[0], 401);
  assert.equal((await goi('/tai-khoan/so-dia-chi', admin))[0], 403);
  let [ma, data] = await goi('/tai-khoan/so-dia-chi', mua);
  assert.equal(ma, 200);
  assert.equal(data.data.danhSach.length, 1);
  assert.equal(data.data.danhSach[0].diaChi, 'Địa chỉ cũ');
  assert.equal(data.data.danhSach[0].macDinh, true);
  const idCu = data.data.danhSach[0]._id;
  assert.equal((await goi('/tai-khoan/so-dia-chi', mua))[1].data.danhSach.length, 1);
  assert.equal((await goi(`/tai-khoan/so-dia-chi/${idCu}`, khac, 'PATCH', { tenGoi: 'Sai', diaChi: 'Không phải của mình' }))[0], 404);
  assert.equal((await goi('/tai-khoan/so-dia-chi', mua, 'POST', { tenGoi: '', diaChi: 'Địa chỉ' }))[0], 400);
  [ma, data] = await goi('/tai-khoan/so-dia-chi', mua, 'POST', { tenGoi: 'Công ty', diaChi: 'Địa chỉ mới' });
  assert.equal(ma, 201);
  assert.equal(data.data.danhSach.length, 2);
  const idMoi = data.data.danhSach.find((item) => item.tenGoi === 'Công ty')._id;
  [ma, data] = await goi(`/tai-khoan/so-dia-chi/${idMoi}/mac-dinh`, mua, 'PATCH');
  assert.equal(ma, 200);
  assert.equal(data.data.danhSach.filter((item) => item.macDinh).length, 1);
  assert.equal((await TaiKhoan.findById(mua._id)).diaChiNhanHang, 'Địa chỉ mới');
  [ma, data] = await goi(`/tai-khoan/so-dia-chi/${idMoi}`, mua, 'PATCH', { tenGoi: 'Công ty', diaChi: 'Địa chỉ sửa' });
  assert.equal(ma, 200);
  assert.equal((await TaiKhoan.findById(mua._id)).diaChiNhanHang, 'Địa chỉ sửa');
  [ma, data] = await goi(`/tai-khoan/so-dia-chi/${idMoi}`, mua, 'DELETE');
  assert.equal(ma, 200);
  assert.equal(data.data.danhSach[0].macDinh, true);
  assert.equal((await TaiKhoan.findById(mua._id)).diaChiNhanHang, 'Địa chỉ cũ');
  [ma] = await goi('/tai-khoan/ho-so', mua, 'PATCH', { diaChiNhanHang: 'Địa chỉ hồ sơ sửa' });
  assert.equal(ma, 200);
  assert.equal((await goi('/tai-khoan/so-dia-chi', mua))[1].data.danhSach[0].diaChi, 'Địa chỉ hồ sơ sửa');

  const danhMuc = await DanhMuc.create({ tenDanhMuc: 'Danh mục mua lại' });
  const shop = await CuaHang.create({ taiKhoanId: khac._id, tenCuaHang: 'Cửa hàng mua lại' });
  const sanPham = await SanPham.create({ tenSanPham: 'Sản phẩm còn bán', giaGoc: 150000, soLuongTon: 5,
    cuaHangId: shop._id, danhMucId: danhMuc._id });
  const ngungBan = await SanPham.create({ tenSanPham: 'Sản phẩm ngừng bán', giaGoc: 90000, soLuongTon: 2,
    cuaHangId: shop._id, danhMucId: danhMuc._id, trangThaiKinhDoanh: 'Ngừng kinh doanh' });
  const taoDon = async (taiKhoanId, trangThaiXuLy) => {
    const donHang = await DonHang.create({ taiKhoanId, cuaHangId: shop._id, giaoDichId: new mongoose.Types.ObjectId(),
      diaChiNhanHang: 'Địa chỉ trong đơn cũ', tongTienHang: 100000, tongThanhToan: 130000, trangThaiXuLy });
    await ChiTietDonHang.insertMany([
      { donHangId: donHang._id, sanPhamId: sanPham._id, soLuong: 2, giaGocTaiThoiDiemDat: 100000, giaBanThucTe: 50000, thanhTien: 100000 },
      { donHangId: donHang._id, sanPhamId: ngungBan._id, soLuong: 1, giaGocTaiThoiDiemDat: 90000, giaBanThucTe: 90000, thanhTien: 90000 },
    ]);
    return donHang;
  };
  const don = await taoDon(mua._id, 'Hoàn thành');
  const donKhac = await taoDon(khac._id, 'Hoàn thành');
  const donCho = await taoDon(mua._id, 'Chờ xác nhận');
  assert.equal((await goi(`/don-hang/${don._id}/mua-lai`, null, 'POST'))[0], 401);
  assert.equal((await goi(`/don-hang/${don._id}/mua-lai`, admin, 'POST'))[0], 403);
  assert.equal((await goi(`/don-hang/${donKhac._id}/mua-lai`, mua, 'POST'))[0], 404);
  assert.equal((await goi(`/don-hang/${donCho._id}/mua-lai`, mua, 'POST'))[0], 409);
  [ma, data] = await goi(`/don-hang/${don._id}/mua-lai`, mua, 'POST');
  assert.equal(ma, 200);
  assert.equal(data.data.daThem.length, 1);
  assert.equal(data.data.boQua.length, 1);
  const gioHang = await GioHang.findOne({ taiKhoanId: mua._id });
  assert.equal((await ChiTietGioHang.findOne({ gioHangId: gioHang._id, sanPhamId: sanPham._id })).soLuong, 2);
  assert.equal((await ChiTietGioHang.findOne({ gioHangId: gioHang._id, sanPhamId: sanPham._id })).duocChon, true);
  assert.equal((await SanPham.findById(sanPham._id)).soLuongTon, 5);
  assert.equal((await DonHang.findById(don._id)).diaChiNhanHang, 'Địa chỉ trong đơn cũ');
  [ma, data] = await goi('/don-hang/xem-truoc', mua, 'POST', { phuongThucThanhToan: 'COD' });
  assert.equal(ma, 200);
  assert.equal(data.data.diaChiNhanHang, 'Địa chỉ hồ sơ sửa');
  assert.equal(data.data.danhSachDonHang[0].danhSachSanPham[0].giaBanThucTe, 150000);
  await ChiTietGioHang.updateOne({ gioHangId: gioHang._id, sanPhamId: sanPham._id }, { $set: { duocChon: false } });
  [ma, data] = await goi(`/don-hang/${don._id}/mua-lai`, mua, 'POST');
  assert.equal(ma, 200);
  assert.equal(data.data.daThem.length, 1);
  assert.equal((await ChiTietGioHang.findOne({ gioHangId: gioHang._id, sanPhamId: sanPham._id })).soLuong, 4);
  assert.equal((await ChiTietGioHang.findOne({ gioHangId: gioHang._id, sanPhamId: sanPham._id })).duocChon, true);
  [ma, data] = await goi(`/don-hang/${don._id}/mua-lai`, mua, 'POST');
  assert.equal(ma, 200);
  assert.equal(data.data.daThem.length, 0);
  assert.equal(data.data.boQua.length, 2);
  for (let i = 1; i <= 9; i++) {
    [ma, data] = await goi('/tai-khoan/so-dia-chi', mua, 'POST', { tenGoi: `Địa chỉ ${i}`, diaChi: `Đường ${i}` });
    assert.equal(ma, 201);
  }
  assert.equal(data.data.danhSach.length, 10);
  assert.equal((await goi('/tai-khoan/so-dia-chi', mua, 'POST', { tenGoi: 'Quá giới hạn', diaChi: 'Đường 11' }))[0], 409);
  for (const item of data.data.danhSach) assert.equal((await goi(`/tai-khoan/so-dia-chi/${item._id}`, mua, 'DELETE'))[0], 200);
  assert.equal((await goi('/tai-khoan/so-dia-chi', mua))[1].data.danhSach.length, 0);
  assert.equal((await TaiKhoan.findById(mua._id)).diaChiNhanHang, '');
  console.log('Sổ địa chỉ và Mua lại: đạt kiểm tra API, quyền, dữ liệu cũ, trạng thái và tồn kho.');
}

run().catch((loi) => { console.error(loi); process.exitCode = 1; }).finally(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
