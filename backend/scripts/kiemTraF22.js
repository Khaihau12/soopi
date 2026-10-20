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
const YeuCauDoiTraKhieuNai = require('../src/models/yeuCauDoiTraKhieuNai.model');

const uri = new URL(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/soopi');
uri.pathname = `/soopi_f22_kiemtra_${Date.now()}`;
let server;
const token = (id) => `token=${jwt.sign({ taiKhoanId: String(id) }, process.env.JWT_SECRET)}`;
const goi = async (duongDan, id, method = 'GET', body) => {
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api${duongDan}`, {
    method, headers: { ...(id ? { Cookie: token(id) } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return [response.status, await response.json()];
};
const gui = (id, taiKhoanId, loaiYeuCau = 'Đổi trả', noiDung = 'Sản phẩm không đúng mô tả') =>
  goi('/doi-tra-khieu-nai', taiKhoanId, 'POST', { chiTietDonHangId: id, loaiYeuCau, noiDung });

async function run() {
  assert.ok(process.env.JWT_SECRET);
  await mongoose.connect(uri.toString());
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const mua = await TaiKhoan.create({ email: 'f22-mua@example.com', matKhau: 'hash', hoTen: 'Khách Một' });
  const muaKhac = await TaiKhoan.create({ email: 'f22-khac@example.com', matKhau: 'hash', hoTen: 'Khách Hai' });
  const banA = await TaiKhoan.create({ email: 'f22-ban-a@example.com', matKhau: 'hash', hoTen: 'Shop A', vaiTro: ['Người dùng', 'Người bán'] });
  const banB = await TaiKhoan.create({ email: 'f22-ban-b@example.com', matKhau: 'hash', hoTen: 'Shop B', vaiTro: ['Người dùng', 'Người bán'] });
  const admin = await TaiKhoan.create({ email: 'f22-admin@example.com', matKhau: 'hash', hoTen: 'Admin', vaiTro: ['Quản trị viên'] });
  const shopA = await CuaHang.create({ taiKhoanId: banA._id, tenCuaHang: 'Cửa hàng A' });
  const shopB = await CuaHang.create({ taiKhoanId: banB._id, tenCuaHang: 'Cửa hàng B' });
  const danhMuc = await DanhMuc.create({ tenDanhMuc: 'Danh mục F22' });
  const sanA = await SanPham.create({ cuaHangId: shopA._id, danhMucId: danhMuc._id, tenSanPham: 'Sản phẩm A', giaGoc: 100000, soLuongTon: 10 });
  const sanB = await SanPham.create({ cuaHangId: shopB._id, danhMucId: danhMuc._id, tenSanPham: 'Sản phẩm B', giaGoc: 100000, soLuongTon: 10 });
  let stt = 0;
  const taoDong = async (taiKhoanId, sanPham, trangThaiXuLy = 'Hoàn thành', ngayHoanThanh = new Date(), ngayTao = new Date()) => {
    const giaoDich = await GiaoDichThanhToan.create({ maGiaoDich: `F22${String(++stt).padStart(20, '0')}`, soTien: 100000,
      phuongThucThanhToan: 'COD', trangThaiThanhToan: 'Thành công' });
    const don = await DonHang.create({ taiKhoanId, cuaHangId: sanPham.equals(sanA._id) ? shopA._id : shopB._id,
      giaoDichId: giaoDich._id, diaChiNhanHang: 'Địa chỉ F22', tongTienHang: 100000, tongThanhToan: 100000,
      phuongThucThanhToan: 'COD', trangThaiThanhToan: 'Đã thanh toán', trangThaiXuLy, ngayTao,
      ...(ngayHoanThanh ? { ngayHoanThanh } : {}) });
    const dong = await ChiTietDonHang.create({ donHangId: don._id, sanPhamId: sanPham, soLuong: 1,
      giaGocTaiThoiDiemDat: 100000, giaBanThucTe: 100000, thanhTien: 100000 });
    return { don, dong };
  };
  const ngayTruoc = (soNgay) => new Date(Date.now() - soNgay * 86400000);
  const chuaXong = await taoDong(mua._id, sanA._id, 'Đang vận chuyển');
  const sauSauNgay = await taoDong(mua._id, sanA._id, 'Hoàn thành', ngayTruoc(6));
  const sauTamNgay = await taoDong(mua._id, sanA._id, 'Hoàn thành', ngayTruoc(8));
  const duLieuCu = await taoDong(mua._id, sanA._id, 'Hoàn thành', null, ngayTruoc(6));
  const nguoiKhac = await taoDong(muaKhac._id, sanA._id);
  const shopKhac = await taoDong(muaKhac._id, sanB._id);
  const deTuChoi = await taoDong(mua._id, sanA._id);
  await YeuCauDoiTraKhieuNai.init();

  assert.equal((await gui(sauSauNgay.dong._id, null))[0], 401);
  assert.equal((await gui(chuaXong.dong._id, mua._id))[0], 409);
  assert.equal((await gui(nguoiKhac.dong._id, mua._id))[0], 404);
  assert.equal((await gui(sauTamNgay.dong._id, mua._id))[0], 409);
  assert.equal((await gui(sauSauNgay.dong._id, mua._id, 'Sai loại'))[0], 400);
  for (const noiDung of ['', '   ', 'x'.repeat(1001)]) assert.equal((await gui(sauSauNgay.dong._id, mua._id, 'Đổi trả', noiDung))[0], 400);
  const dongThoi = await Promise.all([gui(sauSauNgay.dong._id, mua._id), gui(sauSauNgay.dong._id, mua._id)]);
  assert.deepEqual(dongThoi.map(([ma]) => ma).sort(), [201, 409]);
  const idYeuCau = dongThoi.find(([ma]) => ma === 201)[1].data.yeuCau._id;
  assert.equal((await gui(sauSauNgay.dong._id, mua._id))[0], 409);
  assert.equal((await gui(duLieuCu.dong._id, mua._id))[0], 201);
  assert.equal((await goi(`/don-hang/${sauSauNgay.don._id}`, mua._id))[1].data.donHang.danhSachChiTiet[0].coTheGuiYeuCau, false);
  assert.ok((await goi(`/don-hang/${sauSauNgay.don._id}`, mua._id))[1].data.donHang.danhSachChiTiet[0].yeuCauDoiTra._id);
  assert.equal((await goi(`/doi-tra-khieu-nai/${idYeuCau}`, muaKhac._id))[0], 404);
  assert.equal((await goi(`/doi-tra-khieu-nai/${idYeuCau}`, mua._id))[0], 200);
  assert.equal((await goi('/doi-tra-khieu-nai', mua._id))[1].data.phanTrang.tongSo, 2);
  assert.equal((await goi('/doi-tra-khieu-nai', muaKhac._id))[1].data.phanTrang.tongSo, 0);
  assert.equal((await goi(`/nguoi-ban/doi-tra-khieu-nai/${idYeuCau}`, banB._id))[0], 404);
  assert.equal((await goi(`/nguoi-ban/doi-tra-khieu-nai/${idYeuCau}/xu-ly`, banB._id, 'PATCH', { ketQuaXuLy: 'Chấp nhận' }))[0], 404);
  assert.equal((await goi(`/nguoi-ban/doi-tra-khieu-nai/${idYeuCau}/xu-ly`, mua._id, 'PATCH', { ketQuaXuLy: 'Chấp nhận' }))[0], 403);
  assert.equal((await goi(`/nguoi-ban/doi-tra-khieu-nai/${idYeuCau}/xu-ly`, admin._id, 'PATCH', { ketQuaXuLy: 'Chấp nhận' }))[0], 403);
  assert.equal((await goi(`/nguoi-ban/doi-tra-khieu-nai/${idYeuCau}/xu-ly`, banA._id, 'PATCH', { ketQuaXuLy: 'Sai' }))[0], 400);
  assert.equal((await goi('/nguoi-ban/doi-tra-khieu-nai', banA._id))[1].data.phanTrang.tongSo, 2);
  assert.equal((await goi('/nguoi-ban/doi-tra-khieu-nai', banB._id))[1].data.phanTrang.tongSo, 0);
  assert.equal((await gui(shopKhac.dong._id, muaKhac._id, 'Khiếu nại'))[0], 201);
  assert.equal((await goi('/nguoi-ban/doi-tra-khieu-nai?loaiYeuCau=Khi%E1%BA%BFu%20n%E1%BA%A1i', banB._id))[1].data.phanTrang.tongSo, 1);
  const truocDon = (await DonHang.findById(sauSauNgay.don._id)).toObject();
  const truocTon = (await SanPham.findById(sanA._id)).soLuongTon;
  const xuLy = await Promise.all([
    goi(`/nguoi-ban/doi-tra-khieu-nai/${idYeuCau}/xu-ly`, banA._id, 'PATCH', { ketQuaXuLy: 'Chấp nhận' }),
    goi(`/nguoi-ban/doi-tra-khieu-nai/${idYeuCau}/xu-ly`, banA._id, 'PATCH', { ketQuaXuLy: 'Từ chối' }),
  ]);
  assert.deepEqual(xuLy.map(([ma]) => ma).sort(), [200, 409]);
  const ketQuaDaLuu = (await YeuCauDoiTraKhieuNai.findById(idYeuCau)).ketQuaXuLy;
  assert.equal((await goi(`/nguoi-ban/doi-tra-khieu-nai/${idYeuCau}/xu-ly`, banA._id, 'PATCH', { ketQuaXuLy: 'Chấp nhận' }))[0], 409);
  assert.equal((await YeuCauDoiTraKhieuNai.findById(idYeuCau)).ketQuaXuLy, ketQuaDaLuu);
  assert.equal((await SanPham.findById(sanA._id)).soLuongTon, truocTon);
  assert.deepEqual((await DonHang.findById(sauSauNgay.don._id)).toObject(), truocDon);
  const [maTuChoi, duLieuTuChoi] = await gui(deTuChoi.dong._id, mua._id);
  assert.equal(maTuChoi, 201);
  assert.equal((await goi(`/nguoi-ban/doi-tra-khieu-nai/${duLieuTuChoi.data.yeuCau._id}/xu-ly`, banA._id, 'PATCH', { ketQuaXuLy: 'Từ chối' }))[0], 200);
  assert.equal((await gui(deTuChoi.dong._id, mua._id))[0], 409);
  let soTruyVan = 0;
  mongoose.set('debug', () => { soTruyVan += 1; });
  try {
    await goi('/nguoi-ban/doi-tra-khieu-nai?gioiHan=1', banA._id);
    const motDong = soTruyVan;
    soTruyVan = 0;
    await goi('/nguoi-ban/doi-tra-khieu-nai?gioiHan=10', banA._id);
    assert.equal(soTruyVan, motDong);
  } finally { mongoose.set('debug', false); }
  console.log('F22: hạn 7 ngày, xác thực, sở hữu, gửi đồng thời, xử lý nguyên tử, danh sách theo lô đạt.');
}

run().catch((loi) => { console.error(loi); process.exitCode = 1; }).finally(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (mongoose.connection.readyState === 1) { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); }
});
