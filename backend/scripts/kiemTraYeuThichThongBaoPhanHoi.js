const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const app = require('../app');
const TaiKhoan = require('../src/models/taiKhoan.model');
const CuaHang = require('../src/models/cuaHang.model');
const DanhMuc = require('../src/models/danhMuc.model');
const SanPham = require('../src/models/sanPham.model');
const DanhGia = require('../src/models/danhGia.model');
const SanPhamYeuThich = require('../src/models/sanPhamYeuThich.model');
const ThongBao = require('../src/models/thongBao.model');
const YeuCauDangKyNguoiBan = require('../src/models/yeuCauDangKyNguoiBan.model');
const { taoThongBao } = require('../src/services/thongBao.service');

const uri = new URL(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/soopi');
uri.pathname = `/soopi_tinh_nang_moi_${Date.now()}`;
let server;
const goi = async (duongDan, taiKhoan, method = 'GET', body) => {
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api${duongDan}`, {
    method, headers: { ...(taiKhoan ? { Cookie: `token=${jwt.sign({ taiKhoanId: String(taiKhoan._id) }, process.env.JWT_SECRET)}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return [response.status, await response.json()];
};

async function run() {
  assert.ok(process.env.JWT_SECRET);
  await mongoose.connect(uri.toString());
  await Promise.all([SanPhamYeuThich.init(), ThongBao.init(), DanhGia.init()]);
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const mua = await TaiKhoan.create({ email: 'mua-moi@example.com', matKhau: 'hash', hoTen: 'Khách A' });
  const muaKhac = await TaiKhoan.create({ email: 'mua-khac-moi@example.com', matKhau: 'hash', hoTen: 'Khách B' });
  const banA = await TaiKhoan.create({ email: 'ban-a-moi@example.com', matKhau: 'hash', hoTen: 'Shop A', vaiTro: ['Người dùng', 'Người bán'] });
  const banB = await TaiKhoan.create({ email: 'ban-b-moi@example.com', matKhau: 'hash', hoTen: 'Shop B', vaiTro: ['Người dùng', 'Người bán'] });
  const admin = await TaiKhoan.create({ email: 'admin-moi@example.com', matKhau: 'hash', hoTen: 'Quản trị', vaiTro: ['Quản trị viên'] });
  const shopA = await CuaHang.create({ taiKhoanId: banA._id, tenCuaHang: 'Cửa hàng A' });
  await CuaHang.create({ taiKhoanId: banB._id, tenCuaHang: 'Cửa hàng B' });
  const danhMuc = await DanhMuc.create({ tenDanhMuc: 'Danh mục thử' });
  const sanPham = await SanPham.create({ cuaHangId: shopA._id, danhMucId: danhMuc._id,
    tenSanPham: 'Chảo thử nghiệm', giaGoc: 100000, soLuongTon: 2 });

  const duongYeuThich = `/san-pham-yeu-thich/${sanPham._id}`;
  assert.equal((await goi('/san-pham-yeu-thich', null))[0], 401);
  assert.equal((await goi(duongYeuThich, admin, 'POST'))[0], 403);
  assert.equal((await goi('/san-pham-yeu-thich/sai', mua, 'POST'))[0], 400);
  assert.equal((await goi(duongYeuThich, mua, 'POST'))[0], 200);
  assert.equal((await goi(duongYeuThich, mua, 'POST'))[0], 200);
  assert.equal((await SanPhamYeuThich.countDocuments({ taiKhoanId: mua._id })), 1);
  assert.equal((await goi('/san-pham-yeu-thich/ids', mua))[1].data.danhSachId[0], String(sanPham._id));
  assert.equal((await goi('/san-pham-yeu-thich', muaKhac))[1].data.phanTrang.tongSo, 0);
  await SanPham.updateOne({ _id: sanPham._id }, { $set: { trangThaiKinhDoanh: 'Ngừng kinh doanh' } });
  assert.equal((await goi('/san-pham-yeu-thich', mua))[1].data.danhSach[0].conBan, false);
  assert.equal((await goi(duongYeuThich, muaKhac, 'POST'))[0], 404);
  assert.equal((await goi(duongYeuThich, mua, 'DELETE'))[0], 200);
  assert.equal((await goi('/san-pham-yeu-thich', mua))[1].data.phanTrang.tongSo, 0);

  const danhGia = await DanhGia.create({ taiKhoanId: mua._id, sanPhamId: sanPham._id,
    chiTietDonHangId: new mongoose.Types.ObjectId(), soSao: 4, noiDung: 'Dùng tốt' });
  const duongPhanHoi = `/nguoi-ban/danh-gia/${danhGia._id}/phan-hoi`;
  assert.equal((await goi(duongPhanHoi, banB, 'POST', { noiDung: 'Cảm ơn bạn' }))[0], 404);
  assert.equal((await goi(duongPhanHoi, mua, 'POST', { noiDung: 'Cảm ơn bạn' }))[0], 403);
  assert.equal((await goi(duongPhanHoi, banA, 'POST', { noiDung: '  ' }))[0], 400);
  assert.equal((await goi(duongPhanHoi, banA, 'POST', { noiDung: 'Cảm ơn bạn đã đánh giá!' }))[0], 200);
  assert.equal((await goi(duongPhanHoi, banA, 'POST', { noiDung: 'Thêm lần nữa' }))[0], 409);
  const congKhai = (await goi(`/danh-gia?sanPhamId=${sanPham._id}`))[1].data.danhSach[0];
  assert.equal(congKhai.phanHoiNguoiBan, 'Cảm ơn bạn đã đánh giá!');
  assert.ok(congKhai.ngayPhanHoi);

  const thongBao = (await goi('/thong-bao', mua))[1].data;
  assert.equal(thongBao.soChuaDoc, 1);
  assert.equal((await goi('/thong-bao', muaKhac))[1].data.phanTrang.tongSo, 0);
  const idThongBao = thongBao.danhSach[0]._id;
  assert.equal((await goi(`/thong-bao/${idThongBao}/da-doc`, muaKhac, 'PATCH'))[0], 404);
  assert.equal((await goi(`/thong-bao/${idThongBao}/da-doc`, mua, 'PATCH'))[0], 200);
  assert.equal((await goi('/thong-bao/chua-doc', mua))[1].data.soChuaDoc, 0);
  await Promise.all([0, 1].map(() => taoThongBao({ taiKhoanId: mua._id, loai: 'Đơn hàng',
    tieuDe: 'Đơn đã cập nhật', noiDung: 'Đơn đã cập nhật', duongDan: '/don-hang', maSuKien: 'thu-trung-lap' })));
  assert.equal(await ThongBao.countDocuments({ taiKhoanId: mua._id, maSuKien: 'thu-trung-lap' }), 1);
  assert.equal((await goi('/thong-bao/da-doc', mua, 'PATCH'))[0], 200);
  assert.equal((await goi('/thong-bao/chua-doc', mua))[1].data.soChuaDoc, 0);
  const ungVien = await TaiKhoan.create({ email: 'ung-vien-moi@example.com', matKhau: 'hash', hoTen: 'Ứng viên' });
  const yeuCau = await YeuCauDangKyNguoiBan.create({ taiKhoanId: ungVien._id,
    tenCuaHang: 'Cửa hàng mới', diaChiCuaHang: 'Địa chỉ thử nghiệm' });
  assert.equal((await goi(`/quan-tri-vien/yeu-cau-dang-ky-nguoi-ban/${yeuCau._id}/xet-duyet`, admin,
    'PATCH', { trangThai: 'Đã phê duyệt' }))[0], 200);
  assert.ok((await TaiKhoan.findById(ungVien._id)).vaiTro.includes('Người bán'));
  assert.equal((await ThongBao.findOne({ taiKhoanId: ungVien._id, loai: 'Đăng ký bán hàng' })).duongDan, '/nguoi-ban');
  console.log('Yêu thích, phản hồi đánh giá và thông báo: phân quyền, duyệt người bán, chống trùng và đánh dấu đã đọc đạt.');
}

run().catch((loi) => { console.error(loi); process.exitCode = 1; }).finally(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (mongoose.connection.readyState === 1) { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); }
});
