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
const GiaoDichThanhToan = require('../src/models/giaoDichThanhToan.model');
const DanhGia = require('../src/models/danhGia.model');
const { tinhThongKeDanhGia } = require('../src/services/danhGia.service');

const uri = new URL(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/soopi');
uri.pathname = `/soopi_f21_kiemtra_${Date.now()}`;
let server;
const token = (id) => `token=${jwt.sign({ taiKhoanId: String(id) }, process.env.JWT_SECRET)}`;
const goi = async (duongDan, id, method = 'GET', body) => {
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api${duongDan}`, {
    method, headers: { ...(id ? { Cookie: token(id) } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return [response.status, await response.json()];
};
const gui = (id, taiKhoanId, soSao = 5, noiDung = 'Sản phẩm tốt') => goi('/danh-gia', taiKhoanId, 'POST', { chiTietDonHangId: id, soSao, noiDung });

async function run() {
  assert.ok(process.env.JWT_SECRET);
  await mongoose.connect(uri.toString());
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const mua = await TaiKhoan.create({ email: 'f21-mua@example.com', matKhau: 'hash', hoTen: 'Khách Một', soDienThoai: '0901234567' });
  const muaKhac = await TaiKhoan.create({ email: 'f21-mua-khac@example.com', matKhau: 'hash', hoTen: 'Khách Hai' });
  const banA = await TaiKhoan.create({ email: 'f21-ban-a@example.com', matKhau: 'hash', hoTen: 'Shop A', vaiTro: ['Người dùng', 'Người bán'] });
  const banB = await TaiKhoan.create({ email: 'f21-ban-b@example.com', matKhau: 'hash', hoTen: 'Shop B', vaiTro: ['Người dùng', 'Người bán'] });
  const shopA = await CuaHang.create({ taiKhoanId: banA._id, tenCuaHang: 'Cửa hàng A' });
  const shopB = await CuaHang.create({ taiKhoanId: banB._id, tenCuaHang: 'Cửa hàng B' });
  const danhMuc = await DanhMuc.create({ tenDanhMuc: 'Danh mục F21' });
  const sanA = await SanPham.create({ cuaHangId: shopA._id, danhMucId: danhMuc._id, tenSanPham: 'Sản phẩm A', giaGoc: 100000, soLuongTon: 10 });
  const sanB = await SanPham.create({ cuaHangId: shopB._id, danhMucId: danhMuc._id, tenSanPham: 'Sản phẩm B', giaGoc: 100000, soLuongTon: 10 });
  let stt = 0;
  const taoDong = async (taiKhoanId, sanPhamId, trangThaiXuLy) => {
    const giaoDich = await GiaoDichThanhToan.create({ maGiaoDich: `F21${String(++stt).padStart(20, '0')}`, soTien: 100000,
      phuongThucThanhToan: 'COD', trangThaiThanhToan: 'Thành công' });
    const don = await DonHang.create({ taiKhoanId, cuaHangId: sanPhamId.equals(sanB._id) ? shopB._id : shopA._id,
      giaoDichId: giaoDich._id, diaChiNhanHang: 'Địa chỉ F21', tongTienHang: 100000, tongThanhToan: 100000,
      phuongThucThanhToan: 'COD', trangThaiThanhToan: 'Đã thanh toán', trangThaiXuLy });
    const dong = await ChiTietDonHang.create({ donHangId: don._id, sanPhamId, soLuong: 1,
      giaGocTaiThoiDiemDat: 100000, giaBanThucTe: 100000, thanhTien: 100000 });
    return { don, dong };
  };
  const choXuLy = await taoDong(mua._id, sanA._id, 'Đang vận chuyển');
  const daXong = await taoDong(mua._id, sanA._id, 'Hoàn thành');
  const daXongHai = await taoDong(mua._id, sanA._id, 'Hoàn thành');
  const donKhac = await taoDong(muaKhac._id, sanA._id, 'Hoàn thành');
  const donShopB = await taoDong(muaKhac._id, sanB._id, 'Hoàn thành');
  await DanhGia.init();

  assert.equal((await goi(`/danh-gia?sanPhamId=${sanA._id}`))[0], 200);
  assert.equal((await goi('/danh-gia'))[0], 400);
  assert.equal((await goi('/danh-gia?sanPhamId=sai'))[0], 400);
  assert.equal((await goi(`/danh-gia/co-the-danh-gia?sanPhamId=${sanA._id}`))[0], 401);
  let [status, ketQua] = await goi(`/danh-gia/co-the-danh-gia?sanPhamId=${sanA._id}`, mua._id);
  assert.equal(status, 200);
  assert.equal(ketQua.data.danhSach.length, 2);
  assert.ok(!ketQua.data.danhSach.some((item) => String(item.chiTietDonHangId) === String(choXuLy.dong._id)));
  assert.equal((await gui(daXong.dong._id, null))[0], 401);
  assert.equal((await gui(choXuLy.dong._id, mua._id))[0], 409);
  assert.equal((await gui(donKhac.dong._id, mua._id))[0], 404);
  for (const soSao of [0, 6, 2.5, '5']) assert.equal((await gui(daXong.dong._id, mua._id, soSao))[0], 400);
  for (const noiDung of ['', '   ', 'x'.repeat(1001)]) assert.equal((await gui(daXong.dong._id, mua._id, 5, noiDung))[0], 400);
  const dongThoi = await Promise.all([gui(daXong.dong._id, mua._id), gui(daXong.dong._id, mua._id)]);
  assert.deepEqual(dongThoi.map(([ma]) => ma).sort(), [201, 409]);
  assert.equal(dongThoi.find(([ma]) => ma === 409)[1].message, 'Bạn đã đánh giá sản phẩm này');
  assert.equal((await gui(daXong.dong._id, mua._id))[0], 409);
  assert.equal((await gui(daXongHai.dong._id, mua._id, 4, 'Khá tốt'))[0], 201);
  assert.equal((await gui(donShopB.dong._id, muaKhac._id, 3, 'Bình thường'))[0], 201);
  [status, ketQua] = await goi(`/danh-gia?sanPhamId=${sanA._id}&gioiHan=1`, null);
  assert.equal(status, 200);
  assert.equal(ketQua.data.danhSach.length, 1);
  assert.equal(ketQua.data.phanTrang.tongSo, 2);
  assert.equal(ketQua.data.thongKe.diemTrungBinh, 4.5);
  assert.deepEqual(ketQua.data.thongKe.phanBoSao, { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 });
  assert.deepEqual(Object.keys(ketQua.data.danhSach[0]).sort(), ['_id', 'ngayDanhGia', 'noiDung', 'soSao', 'taiKhoan'].sort());
  assert.deepEqual(Object.keys(ketQua.data.danhSach[0].taiKhoan), ['hoTen']);
  assert.ok(!JSON.stringify(ketQua).includes('f21-mua@example.com'));
  assert.ok(!JSON.stringify(ketQua).includes('0901234567'));
  assert.ok(!JSON.stringify(ketQua).includes(String(mua._id)));
  assert.equal((await goi(`/danh-gia/co-the-danh-gia?sanPhamId=${sanA._id}`, mua._id))[1].data.danhSach.length, 0);
  const chiTiet = (await goi(`/don-hang/${daXong.don._id}`, mua._id))[1].data.donHang;
  assert.equal(chiTiet.danhSachChiTiet[0].daDanhGia, true);
  const sanPham = (await goi(`/san-pham/${sanA._id}`))[1].data.sanPham;
  assert.deepEqual(sanPham.thongKeDanhGia, { diemTrungBinh: 4.5, soDanhGia: 2 });
  assert.equal((await goi(`/nguoi-ban/danh-gia?sanPhamId=${sanB._id}`, banA._id))[0], 404);
  assert.equal((await goi(`/nguoi-ban/danh-gia?sanPhamId=${sanA._id}`, mua._id))[0], 403);
  [status, ketQua] = await goi('/nguoi-ban/danh-gia', banA._id);
  assert.equal(status, 200);
  assert.equal(ketQua.data.phanTrang.tongSo, 2);
  assert.ok(ketQua.data.danhSach.every((item) => String(item.sanPham._id) === String(sanA._id)));
  assert.equal((await goi('/nguoi-ban/danh-gia?soSao=4', banA._id))[1].data.danhSach.length, 1);
  assert.equal((await goi('/nguoi-ban/danh-gia?soSao=2.5', banA._id))[0], 400);
  assert.equal((await goi(`/danh-gia/${daXong.dong._id}`, banA._id, 'PATCH'))[0], 404);
  assert.equal((await goi(`/danh-gia/${daXong.dong._id}`, banA._id, 'DELETE'))[0], 404);
  let soLanNhom = 0;
  mongoose.set('debug', (_tenCollection, thaoTac) => { if (thaoTac === 'aggregate') soLanNhom += 1; });
  try { await tinhThongKeDanhGia(sanA._id); assert.equal(soLanNhom, 1); }
  finally { mongoose.set('debug', false); }
  await SanPham.updateOne({ _id: sanA._id }, { $set: { trangThaiKinhDoanh: 'Ngừng kinh doanh' } });
  assert.equal((await goi(`/nguoi-ban/danh-gia?sanPhamId=${sanA._id}`, banA._id))[1].data.phanTrang.tongSo, 2);
  const sanChuaDanhGia = await SanPham.create({ cuaHangId: shopA._id, danhMucId: danhMuc._id,
    tenSanPham: 'Sản phẩm chưa đánh giá', giaGoc: 100000, soLuongTon: 1 });
  const sanDanhGiaThap = await SanPham.create({ cuaHangId: shopA._id, danhMucId: danhMuc._id,
    tenSanPham: 'Sản phẩm cần cải thiện', giaGoc: 100000, soLuongTon: 1 });
  const dongThap = await taoDong(muaKhac._id, sanDanhGiaThap._id, 'Hoàn thành');
  assert.equal((await gui(dongThap.dong._id, muaKhac._id, 1, 'Cần cải thiện'))[0], 201);
  [status, ketQua] = await goi('/nguoi-ban/danh-gia', banA._id);
  assert.equal(status, 200);
  assert.equal(ketQua.data.thongKe.soDanhGia, 3);
  assert.equal(ketQua.data.thongKe.diemTrungBinh, 3.3);
  assert.equal(ketQua.data.thongKe.phanBoSao[1], 1);
  assert.ok(ketQua.data.danhSach.every((item) => String(item.sanPham._id) !== String(sanB._id)));
  [status, ketQua] = await goi('/nguoi-ban/danh-gia?soSao=1', banA._id);
  assert.equal(ketQua.data.phanTrang.tongSo, 1);
  assert.equal(ketQua.data.thongKe.soDanhGia, 3);
  [status, ketQua] = await goi('/nguoi-ban/danh-gia?sapXep=saoThap', banA._id);
  assert.deepEqual(ketQua.data.danhSach.map((item) => item.soSao), [1, 4, 5]);
  assert.equal((await goi('/nguoi-ban/danh-gia?sapXep=sai', banA._id))[0], 400);
  assert.equal((await goi('/nguoi-ban/danh-gia?soSao=0', banA._id))[0], 400);
  assert.equal((await goi('/nguoi-ban/danh-gia/san-pham', mua._id))[0], 403);
  [status, ketQua] = await goi('/nguoi-ban/danh-gia/san-pham', banA._id);
  assert.equal(status, 200);
  assert.equal(ketQua.data.phanTrang.tongSo, 3);
  assert.ok(!ketQua.data.danhSach.some((item) => String(item._id) === String(sanB._id)));
  assert.equal(ketQua.data.danhSach[0].soDanhGia, 2);
  assert.equal(ketQua.data.danhSach.find((item) => String(item._id) === String(sanChuaDanhGia._id)).soDanhGia, 0);
  assert.equal(ketQua.data.danhSach.find((item) => String(item._id) === String(sanDanhGiaThap._id)).soDanhGiaThap, 1);
  [status, ketQua] = await goi('/nguoi-ban/danh-gia/san-pham?sapXep=diemThap', banA._id);
  assert.equal(String(ketQua.data.danhSach[0]._id), String(sanDanhGiaThap._id));
  [status, ketQua] = await goi('/nguoi-ban/danh-gia/san-pham?tuKhoa=chưa', banA._id);
  assert.equal(ketQua.data.phanTrang.tongSo, 1);
  assert.equal(String(ketQua.data.danhSach[0]._id), String(sanChuaDanhGia._id));
  assert.equal((await goi('/nguoi-ban/danh-gia/san-pham?tuKhoa=.*', banA._id))[1].data.phanTrang.tongSo, 0);
  [status, ketQua] = await goi('/nguoi-ban/danh-gia/san-pham?trang=2&gioiHan=2', banA._id);
  assert.equal(ketQua.data.danhSach.length, 1);
  assert.equal((await goi('/nguoi-ban/danh-gia/san-pham?sapXep=sai', banA._id))[0], 400);
  assert.equal((await goi('/nguoi-ban/danh-gia/san-pham?gioiHan=0', banA._id))[0], 400);
  await SanPham.insertMany(Array.from({ length: 51 }, (_, index) => ({ cuaHangId: shopA._id,
    danhMucId: danhMuc._id, tenSanPham: `Sản phẩm bổ sung ${index + 1}`, giaGoc: 100000, soLuongTon: 1 })));
  [status, ketQua] = await goi('/nguoi-ban/danh-gia/san-pham?trang=3&gioiHan=20', banA._id);
  assert.equal(ketQua.data.phanTrang.tongSo, 54);
  assert.equal(ketQua.data.danhSach.length, 14);
  console.log('F21: đánh giá công khai, tổng quan cửa hàng, lọc/sắp xếp, danh sách sản phẩm quá 50 mục và quyền Người bán đạt.');
}

run().catch((loi) => { console.error(loi); process.exitCode = 1; }).finally(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (mongoose.connection.readyState === 1) { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); }
});
