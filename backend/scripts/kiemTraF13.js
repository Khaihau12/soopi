const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = require('../app');
const TaiKhoan = require('../src/models/taiKhoan.model');
const CuaHang = require('../src/models/cuaHang.model');
const DanhMuc = require('../src/models/danhMuc.model');
const SanPham = require('../src/models/sanPham.model');
const KhuyenMai = require('../src/models/khuyenMai.model');
const ChiTietKhuyenMai = require('../src/models/chiTietKhuyenMai.model');
const { dongBoTrangThaiKhuyenMai, tinhTrangThaiKhuyenMai } = require('../src/services/khuyenMai.service');

const uri = new URL(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/soopi');
uri.pathname = `/soopi_f13_kiemtra_${Date.now()}`;
if (!process.env.JWT_SECRET) throw new Error('Thiếu JWT_SECRET trong môi trường kiểm tra');
let server;

async function run() {
  await mongoose.connect(uri.toString());
  const [a, b, quanTri, thuong] = await TaiKhoan.create([
    { email: 'a-f13@example.com', matKhau: 'hash', hoTen: 'Người bán A', vaiTro: ['Người dùng', 'Người bán'] },
    { email: 'b-f13@example.com', matKhau: 'hash', hoTen: 'Người bán B', vaiTro: ['Người dùng', 'Người bán'] },
    { email: 'admin-f13@example.com', matKhau: 'hash', hoTen: 'Quản trị', vaiTro: ['Quản trị viên'] },
    { email: 'user-f13@example.com', matKhau: 'hash', hoTen: 'Người dùng', vaiTro: ['Người dùng'] },
  ]);
  const [shopA, shopB] = await CuaHang.create([
    { taiKhoanId: a._id, tenCuaHang: 'Cửa hàng A', trangThaiHoatDong: 'Hoạt động' },
    { taiKhoanId: b._id, tenCuaHang: 'Cửa hàng B', trangThaiHoatDong: 'Hoạt động' },
  ]);
  const danhMuc = await DanhMuc.create({ tenDanhMuc: 'Kiểm tra khuyến mãi' });
  const [spA1, spA2, spB] = await SanPham.create([
    { tenSanPham: 'Sản phẩm A1', giaGoc: 10000, soLuongTon: 5, cuaHangId: shopA._id, danhMucId: danhMuc._id },
    { tenSanPham: 'Sản phẩm A2', giaGoc: 20000, soLuongTon: 5, cuaHangId: shopA._id, danhMucId: danhMuc._id },
    { tenSanPham: 'Sản phẩm B', giaGoc: 30000, soLuongTon: 5, cuaHangId: shopB._id, danhMucId: danhMuc._id },
  ]);
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const token = (id) => jwt.sign({ taiKhoanId: String(id) }, process.env.JWT_SECRET);
  const goi = async (method, duongDan, body, id = a._id) => {
    const response = await fetch(base + duongDan, {
      method,
      headers: { ...(id ? { Cookie: `token=${token(id)}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    return [response.status, await response.json()];
  };
  const seller = '/api/nguoi-ban/khuyen-mai';
  const admin = '/api/quan-tri-vien/khuyen-mai';
  const batDau = new Date(Date.now() - 3600000).toISOString();
  const ketThuc = new Date(Date.now() + 86400000).toISOString();
  const body = {
    tenKhuyenMai: '  Giảm giá thử nghiệm  ', loaiKhuyenMai: 'Giảm giá', ngayBatDau: batDau, ngayKetThuc: ketThuc,
    chiTiet: [{ sanPhamId: spA1._id, tyLeGiam: 20 }, { sanPhamId: spA2._id, giaKhuyenMai: 15000 }],
  };
  let r = await goi('GET', seller, undefined, null); assert.equal(r[0], 401);
  r = await goi('GET', seller, undefined, thuong._id); assert.equal(r[0], 403);
  r = await goi('GET', admin, undefined, thuong._id); assert.equal(r[0], 403);
  r = await goi('POST', seller, { ...body, loaiKhuyenMai: 'Flash Sale' }); assert.equal(r[0], 403);

  for (const sai of [
    { chiTiet: [] },
    { chiTiet: [{ sanPhamId: spA1._id, giaKhuyenMai: 10001 }] },
    ...[0, 100, 150].map((tyLeGiam) => ({ chiTiet: [{ sanPhamId: spA1._id, tyLeGiam }] })),
    { chiTiet: [{ sanPhamId: spA1._id, tyLeGiam: 20, giaKhuyenMai: 8000 }] },
    { chiTiet: [{ sanPhamId: spA1._id, tyLeGiam: 20 }, { sanPhamId: spA1._id, tyLeGiam: 30 }] },
    { chiTiet: [{ sanPhamId: spB._id, tyLeGiam: 20 }] },
    { ngayKetThuc: batDau }, { ngayKetThuc: new Date(Date.now() - 1000).toISOString() },
  ]) {
    r = await goi('POST', seller, { ...body, ...sai });
    assert.equal(r[0], 400, JSON.stringify(sai));
  }
  assert.equal(await KhuyenMai.countDocuments(), 0);
  assert.equal(await ChiTietKhuyenMai.countDocuments(), 0);

  r = await goi('POST', seller, { ...body, phamVi: 'Toàn sàn', cuaHangId: shopB._id });
  assert.equal(r[0], 201, JSON.stringify(r[1]));
  const id = r[1].data.khuyenMai._id;
  assert.equal(r[1].data.khuyenMai.tenKhuyenMai, 'Giảm giá thử nghiệm');
  assert.equal((await KhuyenMai.findById(id)).phamVi, 'Cửa hàng');
  assert.equal(String((await KhuyenMai.findById(id)).cuaHangId), String(shopA._id));
  assert.equal(r[1].data.khuyenMai.chiTiet.length, 2);
  assert.deepEqual(r[1].data.khuyenMai.chiTiet.map((dong) => dong.giaSauKhuyenMai).sort(), [15000, 8000].sort());
  r = await goi('GET', seller); assert.equal(r[0], 200); assert.equal(r[1].data.danhSach[0].soSanPham, 2);
  r = await goi('PATCH', `${seller}/${id}`, { loaiKhuyenMai: 'Flash Sale' }); assert.equal(r[0], 403);
  r = await goi('PATCH', `${seller}/${id}`, { chiTiet: [{ sanPhamId: spA1._id, giaKhuyenMai: 10001 }] });
  assert.equal(r[0], 400);
  assert.equal(await ChiTietKhuyenMai.countDocuments({ khuyenMaiId: id }), 2);
  assert.equal((await ChiTietKhuyenMai.findOne({ khuyenMaiId: id, sanPhamId: spA1._id })).tyLeGiam, 20);
  r = await goi('GET', `${seller}/${id}`, undefined, b._id); assert.equal(r[0], 404);
  r = await goi('PATCH', `${seller}/${id}`, { tenKhuyenMai: 'Sai quyền' }, b._id); assert.equal(r[0], 404);
  r = await goi('DELETE', `${seller}/${id}`, undefined, b._id); assert.equal(r[0], 404);
  r = await goi('GET', admin, undefined, quanTri._id); assert.equal(r[0], 200);
  assert.equal(r[1].data.danhSach.length, 0); assert.equal(r[1].data.phanTrang.tongSo, 0);
  r = await goi('GET', `${admin}?phamVi=${encodeURIComponent('Cửa hàng')}`, undefined, quanTri._id); assert.equal(r[0], 400);
  r = await goi('GET', `${admin}/${id}`, undefined, quanTri._id); assert.equal(r[0], 404);
  r = await goi('PATCH', `${admin}/${id}`, { tenKhuyenMai: 'Sai phạm vi' }, quanTri._id); assert.equal(r[0], 404);
  r = await goi('DELETE', `${admin}/${id}`, undefined, quanTri._id); assert.equal(r[0], 404);
  r = await goi('PATCH', `${admin}/${id}/vo-hieu-hoa`, undefined, quanTri._id); assert.equal(r[0], 404);
  assert.equal((await KhuyenMai.findById(id)).trangThai, 'Đang hoạt động');

  r = await goi('GET', '/api/khuyen-mai', undefined, null);
  assert.equal(r[0], 200); assert.equal(r[1].data.danhSach.length, 1);
  r = await goi('GET', `/api/san-pham?khuyenMaiId=${id}`, undefined, null);
  assert.equal(r[0], 200); assert.equal(r[1].data.danhSach.length, 2);
  assert.equal(r[1].data.danhSach.find((sp) => sp._id === String(spA1._id)).giaBanThucTe, 8000);
  assert.equal((await SanPham.findById(spA1._id)).giaGoc, 10000);
  r = await goi('PATCH', `${seller}/${id}`, { chiTiet: [{ sanPhamId: spA1._id, giaKhuyenMai: 7000 }] });
  assert.equal(r[0], 200, JSON.stringify(r[1]));
  assert.equal(await ChiTietKhuyenMai.countDocuments({ khuyenMaiId: id }), 1);
  r = await goi('GET', `/api/san-pham?khuyenMaiId=${id}`, undefined, null);
  assert.equal(r[1].data.danhSach[0].giaBanThucTe, 7000);

  const flashSaleAdmin = { ...body, tenKhuyenMai: 'Flash Sale toàn sàn thử nghiệm', loaiKhuyenMai: 'Flash Sale',
    chiTiet: [{ sanPhamId: spA1._id, tyLeGiam: 15 }] };
  r = await goi('POST', admin, flashSaleAdmin, quanTri._id); assert.equal(r[0], 201, JSON.stringify(r[1]));
  const idFlashSaleAdmin = r[1].data.khuyenMai._id;
  assert.equal(r[1].data.khuyenMai.chiTiet[0].giaSauKhuyenMai, 8500);
  r = await goi('GET', admin, undefined, quanTri._id); assert.equal(r[0], 200);
  assert.deepEqual(r[1].data.danhSach.map((muc) => muc._id), [idFlashSaleAdmin]);
  assert.equal(r[1].data.phanTrang.tongSo, 1);
  r = await goi('GET', `${admin}/${idFlashSaleAdmin}`, undefined, quanTri._id); assert.equal(r[0], 200);
  r = await goi('PATCH', `${admin}/${idFlashSaleAdmin}`, { tenKhuyenMai: 'Flash Sale toàn sàn đã sửa' }, quanTri._id); assert.equal(r[0], 200);
  assert.equal(r[1].data.khuyenMai.tenKhuyenMai, 'Flash Sale toàn sàn đã sửa');
  r = await goi('GET', '/api/khuyen-mai?loaiKhuyenMai=Flash%20Sale', undefined, null);
  assert.equal(r[1].data.danhSach.length, 1);
  assert.equal(r[1].data.danhSach[0]._id, idFlashSaleAdmin);
  const flashSaleCu = await KhuyenMai.create({ tenKhuyenMai: 'Flash Sale cửa hàng cũ', loaiKhuyenMai: 'Flash Sale',
    phamVi: 'Cửa hàng', cuaHangId: shopA._id, ngayBatDau: batDau, ngayKetThuc: ketThuc, trangThai: 'Đang hoạt động' });
  await ChiTietKhuyenMai.create({ khuyenMaiId: flashSaleCu._id, sanPhamId: spA2._id, tyLeGiam: 10 });
  r = await goi('GET', '/api/khuyen-mai?loaiKhuyenMai=Flash%20Sale', undefined, null);
  assert.deepEqual(r[1].data.danhSach.map((muc) => muc._id), [idFlashSaleAdmin]);
  r = await goi('PATCH', `${seller}/${flashSaleCu._id}`, { tenKhuyenMai: 'Sửa Flash Sale cũ' }); assert.equal(r[0], 403);
  r = await goi('PATCH', `${seller}/${flashSaleCu._id}`, { loaiKhuyenMai: 'Giảm giá' }); assert.equal(r[0], 200);
  r = await goi('DELETE', `${seller}/${flashSaleCu._id}`); assert.equal(r[0], 200);
  r = await goi('GET', `/api/san-pham?khuyenMaiId=${idFlashSaleAdmin}`, undefined, null);
  assert.equal(r[1].data.danhSach.length, 1);
  assert.equal(r[1].data.danhSach[0].giaGoc, 10000);
  assert.equal(r[1].data.danhSach[0].giaBanThucTe, 7000); // Hai chương trình tính từ giá gốc, lấy giá thấp nhất.

  r = await goi('PATCH', `${admin}/${id}/vo-hieu-hoa`, undefined, quanTri._id); assert.equal(r[0], 404);
  r = await goi('GET', `/api/san-pham/${spA1._id}`, undefined, null);
  assert.equal(r[1].data.sanPham.giaBanThucTe, 7000);
  r = await goi('DELETE', `${seller}/${id}`); assert.equal(r[0], 200);
  assert.equal(await KhuyenMai.countDocuments({ _id: id }), 0);
  assert.equal(await ChiTietKhuyenMai.countDocuments({ khuyenMaiId: id }), 0);
  r = await goi('GET', `/api/san-pham/${spA1._id}`, undefined, null);
  assert.equal(r[1].data.sanPham.giaBanThucTe, 8500);
  r = await goi('GET', `/api/san-pham?khuyenMaiId=${id}`, undefined, null);
  assert.equal(r[1].data.danhSach.length, 0);
  r = await goi('PATCH', `${admin}/${idFlashSaleAdmin}/vo-hieu-hoa`, undefined, quanTri._id); assert.equal(r[0], 200);
  r = await goi('PATCH', `${admin}/${idFlashSaleAdmin}/vo-hieu-hoa`, undefined, quanTri._id); assert.equal(r[0], 409);
  r = await goi('GET', `/api/san-pham/${spA1._id}`, undefined, null);
  assert.equal(r[1].data.sanPham.giaBanThucTe, 10000);

  const tuongLai = { ...body, ngayBatDau: new Date(Date.now() + 5 * 86400000).toISOString(), ngayKetThuc: new Date(Date.now() + 10 * 86400000).toISOString() };
  r = await goi('POST', admin, { ...tuongLai, chiTiet: [{ sanPhamId: spB._id, tyLeGiam: 10 }], phamVi: 'Cửa hàng' }, quanTri._id);
  assert.equal(r[0], 201, JSON.stringify(r[1]));
  const idTuongLai = r[1].data.khuyenMai._id;
  assert.equal((await KhuyenMai.findById(idTuongLai)).phamVi, 'Toàn sàn');
  r = await goi('GET', '/api/khuyen-mai', undefined, null); assert.equal(r[1].data.danhSach.length, 0);
  r = await goi('PATCH', `${admin}/${idTuongLai}/vo-hieu-hoa`, undefined, quanTri._id); assert.equal(r[0], 200);
  const ngayCu = await KhuyenMai.findById(idTuongLai);
  for (const thoiDiem of [new Date(), new Date(Date.now() + 6 * 86400000), new Date(Date.now() + 11 * 86400000)]) {
    await dongBoTrangThaiKhuyenMai(thoiDiem);
    const banGhi = await KhuyenMai.findById(idTuongLai);
    assert.equal(banGhi.trangThai, 'Đã kết thúc');
    assert.equal(tinhTrangThaiKhuyenMai(banGhi, thoiDiem), 'Đã kết thúc');
    assert.equal(banGhi.ngayBatDau.toISOString(), ngayCu.ngayBatDau.toISOString());
    assert.equal(banGhi.ngayKetThuc.toISOString(), ngayCu.ngayKetThuc.toISOString());
  }
  r = await goi('GET', `/api/san-pham/${spB._id}`, undefined, null); assert.equal(r[1].data.sanPham.giaBanThucTe, 30000);

  r = await goi('POST', seller, { ...body, chiTiet: [{ sanPhamId: spB._id, tyLeGiam: 15 }] }, b._id);
  assert.equal(r[0], 201);
  const idShopB = r[1].data.khuyenMai._id;
  await CuaHang.updateOne({ _id: shopB._id }, { $set: { trangThaiHoatDong: 'Ngừng hoạt động' } });
  r = await goi('GET', '/api/khuyen-mai', undefined, null);
  assert.equal(r[1].data.danhSach.some((muc) => muc._id === idShopB), false);
  r = await goi('GET', `/api/san-pham?khuyenMaiId=${idShopB}`, undefined, null);
  assert.equal(r[1].data.danhSach.length, 0);
  await CuaHang.updateOne({ _id: shopB._id }, { $set: { trangThaiHoatDong: 'Hoạt động' } });
  r = await goi('GET', '/api/khuyen-mai', undefined, null);
  assert.equal(r[1].data.danhSach.some((muc) => muc._id === idShopB), true);

  r = await goi('DELETE', `${admin}/${idTuongLai}`, undefined, quanTri._id); assert.equal(r[0], 200);
  assert.equal(await ChiTietKhuyenMai.countDocuments({ khuyenMaiId: idTuongLai }), 0);
  r = await goi('DELETE', `${seller}/${idShopB}`, undefined, b._id); assert.equal(r[0], 200);
  r = await goi('DELETE', `${admin}/${idFlashSaleAdmin}`, undefined, quanTri._id); assert.equal(r[0], 200);
  console.log('F13 API: validation, quyền, tạo/sửa/xóa, giá, công khai, vô hiệu hóa một chiều: OK');
}

run().catch((loi) => { console.error(loi); process.exitCode = 1; }).finally(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (mongoose.connection.readyState === 1) { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); }
});
