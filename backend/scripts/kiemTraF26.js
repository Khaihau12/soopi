const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const app = require('../app');
const TaiKhoan = require('../src/models/taiKhoan.model');
const CuaHang = require('../src/models/cuaHang.model');
const DanhMuc = require('../src/models/danhMuc.model');
const SanPham = require('../src/models/sanPham.model');
const DonHang = require('../src/models/donHang.model');
const ChiTietDonHang = require('../src/models/chiTietDonHang.model');
const GiaoDichThanhToan = require('../src/models/giaoDichThanhToan.model');
const { dienMocTrong } = require('../src/utils/mocThongKe');

const uri = new URL(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/soopi');
uri.pathname = `/soopi_f26_kiemtra_${Date.now()}`;
let server;
const goi = async (duongDan, id) => {
  const cookie = id ? `token=${jwt.sign({ taiKhoanId: String(id), phienBanToken: 0 }, process.env.JWT_SECRET)}` : '';
  const res = await fetch(`http://127.0.0.1:${server.address().port}/api/nguoi-ban/thong-ke/${duongDan}`, { headers: { Cookie: cookie } });
  return [res.status, await res.json()];
};
const ngay = (giaTri) => new Date(giaTri);

async function run() {
  await mongoose.connect(uri.toString());
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const matKhau = await bcrypt.hash('MatKhauF26!', 4);
  const mua = await TaiKhoan.create({ email: 'f26-mua@example.com', matKhau, hoTen: 'Người mua' });
  const banA = await TaiKhoan.create({ email: 'f26-a@example.com', matKhau, hoTen: 'Người bán A', vaiTro: ['Người dùng', 'Người bán'] });
  const banB = await TaiKhoan.create({ email: 'f26-b@example.com', matKhau, hoTen: 'Người bán B', vaiTro: ['Người dùng', 'Người bán'] });
  const shopA = await CuaHang.create({ taiKhoanId: banA._id, tenCuaHang: 'A' });
  const shopB = await CuaHang.create({ taiKhoanId: banB._id, tenCuaHang: 'B' });
  const danhMuc = await DanhMuc.create({ tenDanhMuc: 'Danh mục F26' });
  const spA = await SanPham.create({ tenSanPham: 'Sản phẩm A', giaGoc: 100000, soLuongTon: 10, cuaHangId: shopA._id, danhMucId: danhMuc._id });
  const spB = await SanPham.create({ tenSanPham: 'Sản phẩm B', giaGoc: 200000, soLuongTon: 10, cuaHangId: shopA._id, danhMucId: danhMuc._id });
  const spShopB = await SanPham.create({ tenSanPham: 'Sản phẩm Shop B', giaGoc: 900000, soLuongTon: 10, cuaHangId: shopB._id, danhMucId: danhMuc._id });
  const taoDon = async ({ ma, shop = shopA, sanPham = spA, tien, soLuong = 1, tao = '2026-09-28T10:00:00Z', xong, thanhToan = 'Đã thanh toán', xuLy = 'Hoàn thành', phuongThuc = 'VNPay' }) => {
    const gd = await GiaoDichThanhToan.create({ maGiaoDich: ma, soTien: tien, phuongThucThanhToan: phuongThuc, trangThaiThanhToan: thanhToan === 'Đã thanh toán' ? 'Thành công' : 'Chờ thanh toán' });
    const don = await DonHang.create({ taiKhoanId: mua._id, cuaHangId: shop._id, giaoDichId: gd._id, diaChiNhanHang: 'Hà Nội', tongTienHang: tien, tongThanhToan: tien, ngayTao: ngay(tao), ...(xong ? { ngayHoanThanh: ngay(xong) } : {}), trangThaiThanhToan: thanhToan, trangThaiXuLy: xuLy, phuongThucThanhToan: phuongThuc });
    await ChiTietDonHang.create({ donHangId: don._id, sanPhamId: sanPham._id, soLuong, giaGocTaiThoiDiemDat: tien, giaBanThucTe: tien, thanhTien: tien });
    return don;
  };
  await taoDon({ ma: 'F26A1', tien: 100000, soLuong: 2, xong: '2026-10-02T10:00:00Z' });
  await taoDon({ ma: 'F26A2', sanPham: spB, tien: 200000, xong: '2026-10-02T16:30:00Z' }); // 23:30 Việt Nam.
  await taoDon({ ma: 'F26A3', tien: 50000, xong: '2026-09-30T10:00:00Z', phuongThuc: 'COD' });
  await taoDon({ ma: 'F26A4', tien: 70000, xuLy: 'Đã hủy', xong: '2026-10-02T11:00:00Z' });
  await taoDon({ ma: 'F26A5', tien: 80000, thanhToan: 'Chờ thanh toán', xuLy: 'Chờ xác nhận' });
  await taoDon({ ma: 'F26A6', tien: 60000, thanhToan: 'Chờ thanh toán', xuLy: 'Chờ xác nhận', phuongThuc: 'COD' });
  await taoDon({ ma: 'F26B1', shop: shopB, sanPham: spShopB, tien: 900000, xong: '2026-10-02T10:00:00Z' });
  assert.equal((await goi('tong-quan', null))[0], 401);
  assert.equal((await goi('tong-quan', mua._id))[0], 403);
  const loc = '?tuNgay=2026-10-01&denNgay=2026-10-03';
  const [status, tong] = await goi(`tong-quan${loc}`, banA._id);
  assert.equal(status, 200); assert.equal(tong.data.tongDoanhThu, 300000);
  assert.equal(tong.data.soDonHoanThanh, 2); assert.equal(tong.data.soSanPhamDaBan, 3);
  assert.equal(tong.data.soDonChoXacNhan, 1);
  assert.equal((await goi(`tong-quan${loc}`, banB._id))[1].data.tongDoanhThu, 900000);
  const theoNgay = (await goi(`doanh-thu${loc}`, banA._id))[1].data.danhSach;
  assert.deepEqual(theoNgay.map((item) => item.doanhThu), [0, 300000, 0]);
  assert.equal(theoNgay[1].moc, '2026-10-02'); assert.equal(theoNgay[1].soDon, 2);
  const theoThang = (await goi('doanh-thu?tuNgay=2026-09-01&denNgay=2026-10-31&nhom=thang', banA._id))[1].data.danhSach;
  assert.deepEqual(theoThang.map((item) => item.doanhThu), [50000, 300000]);
  const banChay = (await goi(`san-pham-ban-chay${loc}`, banA._id))[1].data.danhSach;
  assert.deepEqual(banChay.map((item) => item.soLuongDaBan), [2, 1]);
  assert.equal(banChay[0].doanhThu, 100000);
  assert.deepEqual(Object.keys(banChay[0].sanPham).sort(), ['_id', 'hinhAnh', 'tenSanPham']);
  assert.equal(banChay[0].sanPham.tenSanPham, 'Sản phẩm A');
  const lichSu = (await goi('lich-su-giao-dich?tuNgay=2026-09-28&denNgay=2026-09-28&gioiHan=1', banA._id))[1].data;
  assert.equal(lichSu.phanTrang.tong, 4); assert.equal(lichSu.danhSach.length, 1);
  assert.ok(lichSu.danhSach[0].maGiaoDich); assert.deepEqual(Object.keys(lichSu.danhSach[0].nguoiMua), ['hoTen']);
  for (const duongDan of ['tong-quan?tuNgay=2026-02-30', 'tong-quan?tuNgay=2026-10-04&denNgay=2026-10-03', 'tong-quan?tuNgay=2025-01-01&denNgay=2026-10-03']) assert.equal((await goi(duongDan, banA._id))[0], 400);
  assert.equal((await goi('tong-quan?tuNgay=2026-08-01&denNgay=2026-08-02', banA._id))[1].data.tongDoanhThu, 0);
  assert.equal((await goi('san-pham-ban-chay?tuNgay=2026-08-01&denNgay=2026-08-02', banA._id))[1].data.danhSach.length, 0);
  await taoDon({ ma: 'F26CU', tien: 10000, tao: '2026-08-03T09:00:00Z' });
  assert.equal((await goi('tong-quan?tuNgay=2026-08-03&denNgay=2026-08-03', banA._id))[1].data.tongDoanhThu, 10000);
  assert.deepEqual(dienMocTrong([], '2026-10-01', '2026-10-03', 'ngay').map((item) => item.soDon), [0, 0, 0]);
  assert.deepEqual(dienMocTrong([], '2026-01-30', '2026-03-02', 'thang').map((item) => item.moc), ['2026-01', '2026-02', '2026-03']);
  console.log('F26: số liệu doanh thu theo ngày hoàn thành, múi giờ, COD, phân quyền, lịch sử và mốc trống đạt.');
}

run().catch((loi) => { console.error(loi); process.exitCode = 1; }).finally(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (mongoose.connection.readyState === 1) { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); }
});
