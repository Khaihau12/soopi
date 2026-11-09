const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const app = require('../app');
const TaiKhoan = require('../src/models/taiKhoan.model');
const CuaHang = require('../src/models/cuaHang.model');
const DanhMuc = require('../src/models/danhMuc.model');
const SanPham = require('../src/models/sanPham.model');
const { taoCapNhatBienDong } = require('../src/services/tonKho.service');
const { nguoiBanLayTongQuan } = require('../src/services/thongKe.service');
const { LOAI_BIEN_DONG_TON_KHO } = require('../src/constants/tonKho.constant');

const uri = new URL(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/soopi');
uri.pathname = `/soopi_ton_kho_kiemtra_${Date.now()}`;
if (!process.env.JWT_SECRET) throw new Error('Thiếu JWT_SECRET trong môi trường kiểm tra');
let server;

async function run() {
  await mongoose.connect(uri.toString());
  const [ban, banKhac, mua] = await TaiKhoan.create([
    { email: 'ban-ton-kho@example.com', matKhau: 'hash', hoTen: 'Người bán', vaiTro: ['Người dùng', 'Người bán'] },
    { email: 'ban-khac-ton-kho@example.com', matKhau: 'hash', hoTen: 'Người bán khác', vaiTro: ['Người dùng', 'Người bán'] },
    { email: 'mua-ton-kho@example.com', matKhau: 'hash', hoTen: 'Người mua', vaiTro: ['Người dùng'] },
  ]);
  const [shop, shopKhac] = await CuaHang.create([
    { taiKhoanId: ban._id, tenCuaHang: 'Cửa hàng kiểm tra', trangThaiHoatDong: 'Hoạt động' },
    { taiKhoanId: banKhac._id, tenCuaHang: 'Cửa hàng khác', trangThaiHoatDong: 'Hoạt động' },
  ]);
  const danhMuc = await DanhMuc.create({ tenDanhMuc: 'Danh mục kiểm tra' });
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const goc = `http://127.0.0.1:${server.address().port}`;
  const token = (id) => jwt.sign({ taiKhoanId: String(id) }, process.env.JWT_SECRET);
  const goi = async (method, path, body, id = ban._id) => {
    const response = await fetch(goc + path, {
      method,
      headers: { ...(id ? { Cookie: `token=${token(id)}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    return [response.status, await response.json()];
  };
  const gocSanPham = '/api/nguoi-ban/san-pham';
  let r = await goi('POST', gocSanPham, { tenSanPham: 'Bình giữ nhiệt', giaGoc: 100000,
    soLuongTon: 4, danhMucId: danhMuc._id, hinhAnh: [] });
  assert.equal(r[0], 201);
  const id = r[1].data.sanPham._id;
  assert.equal(r[1].data.sanPham.bienDongTonKho, undefined, 'Không trả toàn bộ lịch sử khi xem sản phẩm');

  r = await goi('GET', `${gocSanPham}?canhBaoTon=1`);
  assert.equal(r[0], 200);
  assert.equal(r[1].data.tongCanhBaoTon, 1);
  assert.equal(r[1].data.danhSach.length, 1);
  assert.equal(r[1].data.danhSach[0].bienDongTonKho, undefined);

  r = await goi('GET', `${gocSanPham}/${id}/lich-su-ton-kho`);
  assert.equal(r[0], 200);
  assert.equal(r[1].data.danhSach.length, 1);
  assert.equal(r[1].data.danhSach[0].soLuongTruoc, 0);
  assert.equal(r[1].data.danhSach[0].soLuongSau, 4);

  r = await goi('PATCH', `${gocSanPham}/${id}/ton-kho`, { soLuongTon: 4, soLuongTonTruoc: 4, nguongCanhBaoTon: 2 });
  assert.equal(r[0], 200);
  r = await goi('GET', `${gocSanPham}?canhBaoTon=1`);
  assert.equal(r[1].data.tongCanhBaoTon, 0);

  r = await goi('PATCH', `${gocSanPham}/${id}/ton-kho`, { soLuongTon: 1, soLuongTonTruoc: 4, nguongCanhBaoTon: 2 });
  assert.equal(r[0], 200);
  r = await goi('GET', `${gocSanPham}/${id}/lich-su-ton-kho`);
  assert.equal(r[1].data.danhSach.length, 2, 'Đổi ngưỡng không tạo biến động tồn kho');
  assert.equal(r[1].data.danhSach[0].soLuongThayDoi, -3);
  assert.equal(r[1].data.danhSach[0].soLuongTruoc, 4);
  assert.equal(r[1].data.danhSach[0].soLuongSau, 1);
  assert.equal((await nguoiBanLayTongQuan(shop, {})).soSanPhamCanNhap, 1);

  const donHangId = new mongoose.Types.ObjectId();
  const tru = await SanPham.updateOne({ _id: id, soLuongTon: { $gte: 1 } },
    taoCapNhatBienDong(-1, LOAI_BIEN_DONG_TON_KHO.DAT_HANG, { donHangId }));
  assert.equal(tru.modifiedCount, 1);
  r = await goi('PATCH', `${gocSanPham}/${id}/ton-kho`, { soLuongTon: 5, soLuongTonTruoc: 1, nguongCanhBaoTon: 2 });
  assert.equal(r[0], 409, 'Không ghi đè số lượng vừa thay đổi khi đặt hàng');
  r = await goi('GET', `${gocSanPham}/${id}/lich-su-ton-kho?gioiHan=1&trang=2`);
  assert.equal(r[0], 200);
  assert.equal(r[1].data.phanTrang.tongSo, 3);
  assert.equal(r[1].data.danhSach[0].soLuongSau, 1);

  const hoan = await SanPham.updateOne({ _id: id },
    taoCapNhatBienDong(1, LOAI_BIEN_DONG_TON_KHO.HOAN_KHO, { donHangId }));
  assert.equal(hoan.modifiedCount, 1);
  r = await goi('GET', `${gocSanPham}/${id}/lich-su-ton-kho`);
  assert.equal(r[1].data.danhSach[0].soLuongSau, 1);
  assert.equal(r[1].data.danhSach[0].loai, LOAI_BIEN_DONG_TON_KHO.HOAN_KHO);
  assert.equal(r[1].data.danhSach[0].donHangId, String(donHangId));

  r = await goi('GET', `${gocSanPham}/${id}/lich-su-ton-kho`, undefined, null);
  assert.equal(r[0], 401);
  r = await goi('GET', `${gocSanPham}/${id}/lich-su-ton-kho`, undefined, mua._id);
  assert.equal(r[0], 403);
  r = await goi('GET', `${gocSanPham}/${id}/lich-su-ton-kho`, undefined, banKhac._id);
  assert.equal(r[0], 404);
  await SanPham.create({ tenSanPham: 'Sản phẩm khác', giaGoc: 10000, soLuongTon: 1,
    cuaHangId: shopKhac._id, danhMucId: danhMuc._id });
  await SanPham.create({ tenSanPham: 'Sản phẩm ngừng bán', giaGoc: 10000, soLuongTon: 0,
    cuaHangId: shop._id, danhMucId: danhMuc._id, trangThaiKinhDoanh: 'Ngừng kinh doanh' });
  r = await goi('GET', `${gocSanPham}?canhBaoTon=1`);
  assert.equal(r[1].data.danhSach.length, 1, 'Bộ lọc chỉ hiện sản phẩm đang bán của đúng cửa hàng');
  for (let so = 0; so < 301; so++) {
    await SanPham.updateOne({ _id: id }, taoCapNhatBienDong(1, LOAI_BIEN_DONG_TON_KHO.DIEU_CHINH));
  }
  assert.equal((await SanPham.findById(id).select('+bienDongTonKho')).bienDongTonKho.length, 300);
  r = await goi('GET', `${gocSanPham}/${id}/lich-su-ton-kho?trang=1&gioiHan=1`);
  assert.equal(r[1].data.danhSach[0].soLuongSau, 302);
  assert.equal(r[1].data.phanTrang.tongSo, 300);
  console.log('Tồn kho: cảnh báo, ghi biến động, phân trang, chống ghi đè và phân quyền: OK');
}

run().catch((loi) => { console.error(loi); process.exitCode = 1; }).finally(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (mongoose.connection.readyState === 1) { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); }
});
