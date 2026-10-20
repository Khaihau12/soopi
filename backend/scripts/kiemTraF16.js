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
const { phanBoTheoTyLe } = require('../src/utils/phanBoTheoTyLe');

if (!process.env.JWT_SECRET) throw new Error('Thiếu JWT_SECRET');
const uri = new URL(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/soopi');
uri.pathname = `/soopi_f16_kiemtra_${Date.now()}`;
let server;

async function run() {
  assert.deepEqual(phanBoTheoTyLe(0, [0, 0]), [0, 0]);
  assert.deepEqual(phanBoTheoTyLe(10001, [100000, 100000]), [5000, 5001]);
  assert.deepEqual(phanBoTheoTyLe(7, [10]), [7]);
  assert.deepEqual(phanBoTheoTyLe(1, [0, 1, 1]), [0, 0, 1]);
  await mongoose.connect(uri.toString());
  const buyer = await TaiKhoan.create({ email: 'buyer-f16@example.com', matKhau: 'hash', hoTen: 'Người mua', diaChiNhanHang: 'Địa chỉ hồ sơ' });
  const seller = await TaiKhoan.create({ email: 'seller-f16@example.com', matKhau: 'hash', hoTen: 'Người bán' });
  const shopA = await CuaHang.create({ taiKhoanId: buyer._id, tenCuaHang: 'Shop A', trangThaiHoatDong: 'Hoạt động' });
  const shopB = await CuaHang.create({ taiKhoanId: seller._id, tenCuaHang: 'Shop B', trangThaiHoatDong: 'Hoạt động' });
  const dm = await DanhMuc.create({ tenDanhMuc: 'F16' });
  const [a, b] = await SanPham.create([
    { tenSanPham: 'Sản phẩm A', giaGoc: 100000, soLuongTon: 5, cuaHangId: shopA._id, danhMucId: dm._id },
    { tenSanPham: 'Sản phẩm B', giaGoc: 100000, soLuongTon: 5, cuaHangId: shopB._id, danhMucId: dm._id },
  ]);
  const gio = await GioHang.create({ taiKhoanId: buyer._id, tongGiaTri: 777 });
  const [dongA] = await ChiTietGioHang.create([
    { gioHangId: gio._id, sanPhamId: a._id, soLuong: 1, duocChon: true },
    { gioHangId: gio._id, sanPhamId: b._id, soLuong: 1, duocChon: true },
  ]);
  const truoc = new Date(Date.now() - 3600000), sau = new Date(Date.now() + 86400000);
  const taoVoucher = (maVoucher, loaiVoucher, giaTriGiam, cuaHangId = null, them = {}) => Voucher.create({ maVoucher, tenVoucher: maVoucher, loaiVoucher, kieuGiam: 'Số tiền cố định', giaTriGiam, giaTriDonToiThieu: 0, soLuong: 5, ngayBatDau: truoc, ngayKetThuc: sau, trangThai: 'Kích hoạt', cuaHangId, ...them });
  await taoVoucher('SHOPA', 'Cửa hàng', 20000, shopA._id);
  await taoVoucher('SHOPB', 'Cửa hàng', 100000, shopB._id);
  await taoVoucher('ALL10001', 'Toàn sàn', 10001);
  await taoVoucher('ALL20000', 'Toàn sàn', 20000);
  await taoVoucher('FREESHIP', 'Freeship', 80000);
  await taoVoucher('FULLA', 'Cửa hàng', 100000, shopA._id);
  await taoVoucher('NEARFULLA', 'Cửa hàng', 96000, shopA._id);
  await taoVoucher('EXPIRED', 'Toàn sàn', 10000, null, { ngayBatDau: new Date(Date.now() - 86400000), ngayKetThuc: truoc });
  await taoVoucher('DISABLED', 'Toàn sàn', 10000, null, { trangThai: 'Vô hiệu hóa' });
  await taoVoucher('DEPLETED', 'Toàn sàn', 10000, null, { soLuong: 0 });
  await taoVoucher('MINIMUM', 'Toàn sàn', 10000, null, { giaTriDonToiThieu: 300000 });
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}/api/don-hang/xem-truoc`;
  const goi = async (body, auth = true) => {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(auth ? { Cookie: `token=${jwt.sign({ taiKhoanId: String(buyer._id) }, process.env.JWT_SECRET)}` } : {}) }, body: JSON.stringify(body) });
    return [res.status, await res.json()];
  };
  assert.equal((await goi({}, false))[0], 401);
  let [status, res] = await goi({ tongThanhToan: 1, danhSachSanPham: [] });
  assert.equal(status, 200);
  assert.equal(res.data.danhSachDonHang.length, 2);
  assert.equal(res.data.tongKet.tongThanhToan, 260000);
  assert.equal(res.data.diaChiNhanHang, 'Địa chỉ hồ sơ');
  assert.equal(res.data.phuongThucThanhToan, 'VNPay');
  assert.equal((await GioHang.findById(gio._id)).tongGiaTri, 777);
  [status, res] = await goi({ diaChiNhanHang: '', danhSachMaVoucher: ['SHOPA', 'ALL10001', 'ALL20000', 'FREESHIP'] });
  assert.equal(status, 200); assert.equal(res.data.thieuDiaChi, true);
  assert.equal(res.data.voucherKhongHopLe[0].maVoucher, 'ALL20000');
  assert.equal(res.data.tongKet.tongGiamVoucher, 30001);
  assert.equal(res.data.tongKet.giamPhiVanChuyen, 60000);
  assert.equal(res.data.tongKet.tongThanhToan, 169999);
  const donA = res.data.danhSachDonHang.find((don) => don.cuaHang._id === String(shopA._id));
  const donB = res.data.danhSachDonHang.find((don) => don.cuaHang._id === String(shopB._id));
  assert.equal(donA.giamVoucherCuaHang, 20000); assert.equal(donB.giamVoucherCuaHang, 0);
  assert.equal(res.data.voucherApDung.find((v) => v.maVoucher === 'ALL10001').giaTriGiamThucTe, 10001);
  assert.equal(res.data.danhSachDonHang.reduce((sum, don) => sum + (don.voucherApDung.find((v) => v.maVoucher === 'ALL10001')?.giaTriGiamThucTe || 0), 0), 10001);
  for (const don of res.data.danhSachDonHang) assert.equal(don.tongThanhToan, don.tongTienHang - don.tongGiamVoucher + don.phiVanChuyen - don.giamPhiVanChuyen);
  [status, res] = await goi({ danhSachMaVoucher: ['MISSING', 'MINIMUM', 'EXPIRED', 'DISABLED', 'DEPLETED', 'SHOPA', 'FULLA'] });
  assert.equal(status, 200); assert.equal(res.data.voucherKhongHopLe.length, 6);
  assert.equal(res.data.tongKet.tongGiamVoucher, 20000);
  [status, res] = await goi({ danhSachMaVoucher: ['FULLA', 'SHOPB', 'FREESHIP'], phuongThucThanhToan: 'COD' });
  assert.equal(status, 200); assert.equal(res.data.tongKet.tongThanhToan, 0);
  assert.equal(res.data.danhSachDonHang.every((don) => don.tuDongDaThanhToan), true);
  [status, res] = await goi({ danhSachMaVoucher: ['FULLA', 'FREESHIP'], phuongThucThanhToan: 'COD' });
  assert.equal(status, 200);
  assert.equal(res.data.danhSachDonHang.find((don) => don.cuaHang._id === String(shopA._id)).tuDongDaThanhToan, true);
  assert.equal(res.data.danhSachDonHang.find((don) => don.cuaHang._id === String(shopB._id)).tuDongDaThanhToan, false);
  [status, res] = await goi({ danhSachMaVoucher: ['FULLA', 'SHOPB', 'FREESHIP'] });
  assert.equal(status, 200); assert.equal(res.data.danhSachDonHang.every((don) => don.tuDongDaThanhToan), true);
  assert.equal(res.data.canhBao.length, 1);
  [status, res] = await goi({ danhSachMaVoucher: ['NEARFULLA', 'SHOPB', 'FREESHIP'] });
  assert.equal(status, 200); assert.equal(res.data.tongKet.tongThanhToan, 4000);
  assert.match(res.data.canhBao[0], /5\.000đ.*COD/);
  assert.equal((await goi({ phuongThucThanhToan: 'abc' }))[0], 400);
  assert.equal((await goi({ danhSachMaVoucher: Array.from({ length: 11 }, (_, i) => `MA${i}`) }))[0], 400);
  await ChiTietGioHang.updateOne({ _id: dongA._id }, { $set: { duocChon: false } });
  [status, res] = await goi({ danhSachMaVoucher: ['SHOPA'] });
  assert.equal(status, 200);
  assert.match(res.data.voucherKhongHopLe[0].lyDo, /không áp dụng cho sản phẩm trong giỏ/);
  await ChiTietGioHang.updateMany({ gioHangId: gio._id }, { $set: { duocChon: false } });
  assert.equal((await goi({}))[0], 400);
  await ChiTietGioHang.updateOne({ _id: dongA._id }, { $set: { duocChon: true } });
  await SanPham.updateOne({ _id: a._id }, { $set: { soLuongTon: 0 } });
  [status, res] = await goi({}); assert.equal(status, 409); assert.match(res.message, /Sản phẩm A.*hết hàng/);
  await SanPham.updateOne({ _id: a._id }, { $set: { soLuongTon: 5, trangThaiKinhDoanh: 'Ngừng kinh doanh' } });
  assert.equal((await goi({}))[0], 409);
  await SanPham.updateOne({ _id: a._id }, { $set: { trangThaiKinhDoanh: 'Đang kinh doanh' } });
  await CuaHang.updateOne({ _id: shopA._id }, { $set: { trangThaiHoatDong: 'Ngừng hoạt động' } });
  assert.equal((await goi({}))[0], 409);
  assert.equal((await GioHang.findById(gio._id)).tongGiaTri, 777);
  assert.equal((await Voucher.findOne({ maVoucher: 'SHOPA' })).soLuong, 5);
  assert.equal(await DonHang.countDocuments(), 0);
  assert.equal(await ChiTietGioHang.countDocuments({ gioHangId: gio._id }), 2);
  console.log('F16 API: tách đơn, voucher, phân bổ, COD/0đ và không ghi DB: OK');
}

run().catch((loi) => { console.error(loi); process.exitCode = 1; }).finally(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (mongoose.connection.readyState === 1) { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); }
});
