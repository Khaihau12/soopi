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
const Voucher = require('../src/models/voucher.model');
const DonHang = require('../src/models/donHang.model');
const ChiTietDonHang = require('../src/models/chiTietDonHang.model');
const GiaoDichThanhToan = require('../src/models/giaoDichThanhToan.model');
const ApDungVoucher = require('../src/models/apDungVoucher.model');
const { xacThucChuKy } = require('../src/utils/vnpay');
const { tachMaGiaoDichTuTxnRef } = require('../src/services/giaoDichThanhToan.service');

const uri = new URL(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/soopi');
uri.pathname = `/soopi_f17_kiemtra_${Date.now()}`;
let server;
let thuTu = 0;
const taoBo = async ({ soCuaHang = 2, soLuongTon = 5, giaGoc = 100000, soNguoiMua = 1 } = {}) => {
  const so = ++thuTu;
  const nguoiMua = [];
  for (let i = 0; i < soNguoiMua; i++) nguoiMua.push(await TaiKhoan.create({ email: `f17-${so}-${i}@example.com`, matKhau: 'hash', hoTen: `Mua ${i}`, diaChiNhanHang: 'Địa chỉ nhận hàng' }));
  const chuShop = await TaiKhoan.create({ email: `f17-chu-${so}@example.com`, matKhau: 'hash', hoTen: 'Chủ shop' });
  const danhMuc = await DanhMuc.create({ tenDanhMuc: `Danh mục ${so}` });
  const shop = []; const sanPham = [];
  for (let i = 0; i < soCuaHang; i++) {
    const cuaHang = await CuaHang.create({ taiKhoanId: i === 0 ? nguoiMua[0]._id : chuShop._id,
      tenCuaHang: `Shop ${so}-${i}`, trangThaiHoatDong: 'Hoạt động' });
    shop.push(cuaHang);
    sanPham.push(await SanPham.create({ tenSanPham: `Sản phẩm ${so}-${i}`, giaGoc, soLuongTon,
      cuaHangId: cuaHang._id, danhMucId: danhMuc._id }));
  }
  const gio = [];
  for (const taiKhoan of nguoiMua) {
    const gh = await GioHang.create({ taiKhoanId: taiKhoan._id, tongGiaTri: 0 });
    gio.push(gh);
    for (const item of sanPham) await ChiTietGioHang.create({ gioHangId: gh._id, sanPhamId: item._id, soLuong: 1, duocChon: true });
  }
  return { nguoiMua, shop, sanPham, gio };
};
const themVoucher = (maVoucher, giaTriGiam, loaiVoucher = 'Toàn sàn', cuaHangId = null) => Voucher.create({
  maVoucher, tenVoucher: maVoucher, loaiVoucher, kieuGiam: 'Số tiền cố định', giaTriGiam,
  giaTriDonToiThieu: 0, soLuong: 3, trangThai: 'Kích hoạt', cuaHangId,
  ngayBatDau: new Date(Date.now() - 3600000), ngayKetThuc: new Date(Date.now() + 86400000),
});
const token = (id) => jwt.sign({ taiKhoanId: String(id) }, process.env.JWT_SECRET);
const goi = async (duongDan, id, body = {}) => {
  const res = await fetch(`http://127.0.0.1:${server.address().port}/api${duongDan}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(id ? { Cookie: `token=${token(id)}` } : {}) },
    body: JSON.stringify(body),
  });
  return [res.status, await res.json()];
};

async function run() {
  assert.ok(process.env.JWT_SECRET);
  await mongoose.connect(uri.toString());
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const vn = await taoBo();
  const v = await themVoucher('F17VNP', 10000);
  await ChiTietGioHang.create({ gioHangId: vn.gio[0]._id, sanPhamId: (await SanPham.create({ tenSanPham: 'Dòng không chọn', giaGoc: 5000, soLuongTon: 5, cuaHangId: vn.shop[0]._id, danhMucId: (await DanhMuc.findOne())._id }))._id, soLuong: 1, duocChon: false });
  let [status, res] = await goi('/don-hang', vn.nguoiMua[0]._id, { phuongThucThanhToan: 'VNPay', danhSachMaVoucher: ['F17VNP'], tongThanhToan: 1 });
  assert.equal(status, 201); assert.equal(res.data.danhSachDonHang.length, 2);
  assert.equal(res.data.danhSachGiaoDich.length, 1); assert.equal(res.data.canThanhToanVnpay, true);
  const giaoDichId = res.data.giaoDichVnpayId;
  assert.equal((await GiaoDichThanhToan.findById(giaoDichId)).soTien, 250000);
  assert.equal((await DonHang.countDocuments({ giaoDichId })), 2);
  assert.equal((await ChiTietDonHang.countDocuments({ donHangId: { $in: res.data.danhSachDonHang.map((d) => d._id) } })), 2);
  assert.equal((await Voucher.findById(v._id)).soLuong, 2);
  assert.equal((await ApDungVoucher.countDocuments({ voucherId: v._id })), 2);
  assert.equal((await ChiTietGioHang.countDocuments({ gioHangId: vn.gio[0]._id })), 1);
  assert.equal((await GioHang.findById(vn.gio[0]._id)).tongGiaTri, 0);
  assert.equal((await SanPham.findById(vn.sanPham[0]._id)).soLuongTon, 4);
  await SanPham.updateOne({ _id: vn.sanPham[0]._id }, { $set: { giaGoc: 150000 } });
  assert.equal((await ChiTietDonHang.findOne({ sanPhamId: vn.sanPham[0]._id })).giaGocTaiThoiDiemDat, 100000);

  const cod = await taoBo();
  [status, res] = await goi('/don-hang', cod.nguoiMua[0]._id, { phuongThucThanhToan: 'COD' });
  assert.equal(status, 201); assert.equal(res.data.danhSachGiaoDich.length, 2);
  assert.equal(res.data.canThanhToanVnpay, false);
  const donCod = await DonHang.find({ taiKhoanId: cod.nguoiMua[0]._id });
  assert.equal(donCod.length, 2);
  assert.equal(new Set(donCod.map((d) => String(d.giaoDichId))).size, 2);
  assert.equal((await GiaoDichThanhToan.find({ _id: { $in: res.data.danhSachGiaoDich.map((g) => g._id) } })).every((g) => g.phuongThucThanhToan === 'COD' && g.trangThaiThanhToan === 'Chờ thanh toán'), true);

  const zeroVn = await taoBo({ soCuaHang: 1 });
  await themVoucher('F17FULLV', 100000);
  await themVoucher('F17SHIPV', 30000, 'Freeship');
  [status, res] = await goi('/don-hang', zeroVn.nguoiMua[0]._id, { danhSachMaVoucher: ['F17FULLV', 'F17SHIPV'] });
  assert.equal(status, 201); assert.equal(res.data.canThanhToanVnpay, false);
  assert.equal(res.data.danhSachGiaoDich[0].trangThaiThanhToan, 'Thành công');
  assert.ok(res.data.danhSachGiaoDich[0].thoiGianHoanTat);
  assert.equal(res.data.danhSachDonHang[0].trangThaiThanhToan, 'Đã thanh toán');
  const zeroCod = await taoBo({ soCuaHang: 1 });
  await themVoucher('F17FULLC', 100000);
  await themVoucher('F17SHIPC', 30000, 'Freeship');
  [status, res] = await goi('/don-hang', zeroCod.nguoiMua[0]._id, { danhSachMaVoucher: ['F17FULLC', 'F17SHIPC'], phuongThucThanhToan: 'COD' });
  assert.equal(status, 201); assert.equal(res.data.danhSachGiaoDich[0].trangThaiThanhToan, 'Thành công');
  assert.equal(res.data.danhSachDonHang[0].trangThaiThanhToan, 'Đã thanh toán');

  const invalid = await taoBo({ soCuaHang: 1 });
  assert.equal((await goi('/don-hang', invalid.nguoiMua[0]._id, { phuongThucThanhToan: 'ABC' }))[0], 400);
  assert.equal((await goi('/don-hang', invalid.nguoiMua[0]._id, { diaChiNhanHang: '' }))[0], 400);
  const [maVoucherSai, ketQuaVoucherSai] = await goi('/don-hang', invalid.nguoiMua[0]._id, { danhSachMaVoucher: ['KHONGCO'] });
  assert.equal(maVoucherSai, 409);
  assert.equal(ketQuaVoucherSai.data.voucherKhongHopLe[0].maVoucher, 'KHONGCO');
  await CuaHang.updateOne({ _id: invalid.shop[0]._id }, { $set: { trangThaiHoatDong: 'Ngừng hoạt động' } });
  assert.equal((await goi('/don-hang', invalid.nguoiMua[0]._id))[0], 409);
  await CuaHang.updateOne({ _id: invalid.shop[0]._id }, { $set: { trangThaiHoatDong: 'Hoạt động' } });
  await SanPham.updateOne({ _id: invalid.sanPham[0]._id }, { $set: { trangThaiKinhDoanh: 'Ngừng kinh doanh' } });
  assert.equal((await goi('/don-hang', invalid.nguoiMua[0]._id))[0], 409);
  await SanPham.updateOne({ _id: invalid.sanPham[0]._id }, { $set: { trangThaiKinhDoanh: 'Đang kinh doanh' } });
  await ChiTietGioHang.updateOne({ gioHangId: invalid.gio[0]._id }, { $set: { duocChon: false } });
  assert.equal((await goi('/don-hang', invalid.nguoiMua[0]._id))[0], 400);

  const hetKho = await taoBo({ soCuaHang: 2 });
  const updateSanPham = SanPham.updateOne;
  let lanKho = 0;
  SanPham.updateOne = function (...args) { if (++lanKho === 2) return Promise.resolve({ modifiedCount: 0 }); return updateSanPham.apply(this, args); };
  try { assert.equal((await goi('/don-hang', hetKho.nguoiMua[0]._id))[0], 409); }
  finally { SanPham.updateOne = updateSanPham; }
  assert.equal((await SanPham.findById(hetKho.sanPham[0]._id)).soLuongTon, 5);
  assert.equal(await DonHang.countDocuments({ taiKhoanId: hetKho.nguoiMua[0]._id }), 0);

  const hetVoucher = await taoBo({ soCuaHang: 1 });
  const hv = await themVoucher('F17EMPTY', 1000);
  const updateVoucher = Voucher.updateOne;
  Voucher.updateOne = () => Promise.resolve({ modifiedCount: 0 });
  try { assert.equal((await goi('/don-hang', hetVoucher.nguoiMua[0]._id, { danhSachMaVoucher: ['F17EMPTY'] }))[0], 409); }
  finally { Voucher.updateOne = updateVoucher; }
  assert.equal((await SanPham.findById(hetVoucher.sanPham[0]._id)).soLuongTon, 5);
  assert.equal((await Voucher.findById(hv._id)).soLuong, 3);

  const nhoHonMuc = await taoBo({ soCuaHang: 1, giaGoc: 1000 });
  await themVoucher('F17MINSHIP', 30000, 'Freeship');
  [status, res] = await goi('/don-hang', nhoHonMuc.nguoiMua[0]._id, { danhSachMaVoucher: ['F17MINSHIP'] });
  assert.equal(status, 400); assert.match(res.message, /5\.000/);
  assert.equal((await SanPham.findById(nhoHonMuc.sanPham[0]._id)).soLuongTon, 5);

  const loiXoaGio = await taoBo({ soCuaHang: 1 });
  const xoaDongGio = ChiTietGioHang.deleteMany;
  ChiTietGioHang.deleteMany = async function (...args) { await xoaDongGio.apply(this, args); throw new Error('Lỗi sau khi xóa giỏ giả lập'); };
  try { assert.equal((await goi('/don-hang', loiXoaGio.nguoiMua[0]._id, { phuongThucThanhToan: 'COD' }))[0], 500); }
  finally { ChiTietGioHang.deleteMany = xoaDongGio; }
  assert.equal((await ChiTietGioHang.countDocuments({ gioHangId: loiXoaGio.gio[0]._id })), 1);
  assert.equal(await DonHang.countDocuments({ taiKhoanId: loiXoaGio.nguoiMua[0]._id }), 0);
  assert.equal((await SanPham.findById(loiXoaGio.sanPham[0]._id)).soLuongTon, 5);

  const loiGhi = await taoBo({ soCuaHang: 2 });
  const lv = await themVoucher('F17ROLL', 1000);
  const createChiTiet = ChiTietDonHang.create;
  let lanGhi = 0;
  ChiTietDonHang.create = function (...args) { if (++lanGhi === 2) return Promise.reject(new Error('Lỗi ghi giả lập')); return createChiTiet.apply(this, args); };
  try { assert.equal((await goi('/don-hang', loiGhi.nguoiMua[0]._id, { danhSachMaVoucher: ['F17ROLL'], phuongThucThanhToan: 'COD' }))[0], 500); }
  finally { ChiTietDonHang.create = createChiTiet; }
  assert.equal(await DonHang.countDocuments({ taiKhoanId: loiGhi.nguoiMua[0]._id }), 0);
  assert.equal(await GiaoDichThanhToan.countDocuments({ maGiaoDich: { $exists: true } }), 5); // giao dịch từ các ca thành công trước đó
  assert.equal((await Voucher.findById(lv._id)).soLuong, 3);
  assert.equal((await SanPham.findById(loiGhi.sanPham[0]._id)).soLuongTon, 5);
  assert.equal((await SanPham.findById(loiGhi.sanPham[1]._id)).soLuongTon, 5);
  assert.equal((await ChiTietGioHang.countDocuments({ gioHangId: loiGhi.gio[0]._id })), 2);
  assert.equal(await ApDungVoucher.countDocuments({ voucherId: lv._id }), 0);
  assert.equal(await ChiTietDonHang.countDocuments({ sanPhamId: { $in: loiGhi.sanPham.map((sp) => sp._id) } }), 0);

  const cuoi = await taoBo({ soCuaHang: 1, soLuongTon: 1, soNguoiMua: 2 });
  const haiKetQua = await Promise.all([goi('/don-hang', cuoi.nguoiMua[0]._id), goi('/don-hang', cuoi.nguoiMua[1]._id)]);
  assert.deepEqual(haiKetQua.map(([ma]) => ma).sort(), [201, 409]);
  assert.equal((await SanPham.findById(cuoi.sanPham[0]._id)).soLuongTon, 0);

  assert.equal((await goi('/giao-dich-thanh-toan/vnpay/tao-thanh-toan', null, { giaoDichId }))[0], 401);
  assert.equal((await goi('/giao-dich-thanh-toan/vnpay/tao-thanh-toan', cod.nguoiMua[0]._id, { giaoDichId }))[0], 404);
  assert.equal((await goi('/giao-dich-thanh-toan/vnpay/tao-thanh-toan', cod.nguoiMua[0]._id, { giaoDichId: (await DonHang.findOne({ taiKhoanId: cod.nguoiMua[0]._id })).giaoDichId }))[0], 409);
  assert.equal((await goi('/giao-dich-thanh-toan/vnpay/tao-thanh-toan', zeroVn.nguoiMua[0]._id, { giaoDichId: (await DonHang.findOne({ taiKhoanId: zeroVn.nguoiMua[0]._id })).giaoDichId }))[0], 409);
  assert.equal((await goi('/giao-dich-thanh-toan/vnpay/tao-thanh-toan', vn.nguoiMua[0]._id, { giaoDichId }))[0], 500);
  const oldEnv = Object.fromEntries(['VNP_TMN_CODE', 'VNP_HASH_SECRET', 'VNP_URL', 'VNP_RETURN_URL'].map((key) => [key, process.env[key]]));
  Object.assign(process.env, { VNP_TMN_CODE: 'TEST', VNP_HASH_SECRET: 'test-secret', VNP_URL: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html', VNP_RETURN_URL: 'http://localhost:5173/thanh-toan/ket-qua' });
  try {
    const [ma1, url1] = await goi('/giao-dich-thanh-toan/vnpay/tao-thanh-toan', vn.nguoiMua[0]._id, { giaoDichId });
    const [ma2, url2] = await goi('/giao-dich-thanh-toan/vnpay/tao-thanh-toan', vn.nguoiMua[0]._id, { giaoDichId });
    assert.equal(ma1, 200); assert.equal(ma2, 200);
    const q1 = Object.fromEntries(new URL(url1.data.duongDanThanhToan).searchParams);
    const q2 = Object.fromEntries(new URL(url2.data.duongDanThanhToan).searchParams);
    assert.equal(q1.vnp_Amount, '25000000'); assert.equal(xacThucChuKy(q1, 'test-secret'), true);
    assert.equal(tachMaGiaoDichTuTxnRef(q1.vnp_TxnRef), (await GiaoDichThanhToan.findById(giaoDichId)).maGiaoDich);
    assert.notEqual(q1.vnp_TxnRef, q2.vnp_TxnRef);
    assert.equal(q1.vnp_ExpireDate.length, 14);
    const hetHan = new Date((await GiaoDichThanhToan.findById(giaoDichId)).thoiGianTao.getTime() + 86400000);
    const { dinhDangGioVietNam } = require('../src/utils/vnpay');
    assert.equal(q1.vnp_ExpireDate, dinhDangGioVietNam(hetHan));
    assert.equal(await DonHang.countDocuments({ giaoDichId }), 2);
  } finally { for (const [key, value] of Object.entries(oldEnv)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } }
  console.log('F17: các ca tạo đơn, hoàn tác, tranh chấp kho và URL ký cục bộ đạt.');
}

run().catch((loi) => { console.error(loi); process.exitCode = 1; }).finally(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (mongoose.connection.readyState === 1) { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); }
});
