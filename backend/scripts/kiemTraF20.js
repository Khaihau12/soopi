const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const app = require('../app');
const TaiKhoan = require('../src/models/taiKhoan.model');
const CuaHang = require('../src/models/cuaHang.model');
const DonHang = require('../src/models/donHang.model');
const GiaoDichThanhToan = require('../src/models/giaoDichThanhToan.model');
const ChiTietDonHang = require('../src/models/chiTietDonHang.model');
const { TRANG_THAI_XU_LY } = require('../src/constants/trangThai.constant');

const uri = new URL(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/soopi');
uri.pathname = `/soopi_f20_kiemtra_${Date.now()}`;
let server;
const token = (id) => `token=${jwt.sign({ taiKhoanId: String(id) }, process.env.JWT_SECRET)}`;
const goi = async (duongDan, id, method = 'GET', body) => {
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api${duongDan}`, {
    method, headers: { ...(id ? { Cookie: token(id) } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return [response.status, await response.json()];
};
const capNhat = (id, taiKhoanId, trangThaiXuLy) => goi(`/don-hang/${id}/trang-thai`, taiKhoanId, 'PATCH', { trangThaiXuLy });

async function run() {
  assert.ok(process.env.JWT_SECRET);
  await mongoose.connect(uri.toString());
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const mua = await TaiKhoan.create({ email: 'f20-mua@example.com', matKhau: 'hash', hoTen: 'Người mua', soDienThoai: '0901234567' });
  const banA = await TaiKhoan.create({ email: 'f20-ban-a@example.com', matKhau: 'hash', hoTen: 'Người bán A', vaiTro: ['Người dùng', 'Người bán'] });
  const banB = await TaiKhoan.create({ email: 'f20-ban-b@example.com', matKhau: 'hash', hoTen: 'Người bán B', vaiTro: ['Người dùng', 'Người bán'] });
  const admin = await TaiKhoan.create({ email: 'f20-admin@example.com', matKhau: 'hash', hoTen: 'Quản trị', vaiTro: ['Quản trị viên'] });
  const shopA = await CuaHang.create({ taiKhoanId: banA._id, tenCuaHang: 'Shop A' });
  const shopB = await CuaHang.create({ taiKhoanId: banB._id, tenCuaHang: 'Shop B' });
  let ma = 0;
  const taoDon = async (cuaHangId, phuongThucThanhToan, trangThaiThanhToan, trangThaiXuLy = TRANG_THAI_XU_LY.CHO_XAC_NHAN, tongThanhToan = 100000) => {
    const giaoDich = await GiaoDichThanhToan.create({ maGiaoDich: `F20${String(++ma).padStart(20, '0')}`, soTien: tongThanhToan,
      phuongThucThanhToan, trangThaiThanhToan: trangThaiThanhToan === 'Đã thanh toán' ? 'Thành công' : trangThaiThanhToan });
    const don = await DonHang.create({ taiKhoanId: mua._id, cuaHangId, giaoDichId: giaoDich._id,
      diaChiNhanHang: 'Địa chỉ giao hàng', tongTienHang: tongThanhToan, tongThanhToan,
      phuongThucThanhToan, trangThaiThanhToan, trangThaiXuLy });
    return { don, giaoDich };
  };
  const cod = await taoDon(shopA._id, 'COD', 'Chờ thanh toán');
  const vnpay = await taoDon(shopA._id, 'VNPay', 'Đã thanh toán');
  await ChiTietDonHang.create({ donHangId: vnpay.don._id, sanPhamId: new mongoose.Types.ObjectId(),
    soLuong: 1, giaGocTaiThoiDiemDat: 100000, giaBanThucTe: 100000, thanhTien: 100000 });
  const choTien = await taoDon(shopA._id, 'VNPay', 'Chờ thanh toán');
  const thatBai = await taoDon(shopA._id, 'VNPay', 'Thất bại');
  const hetHan = await taoDon(shopA._id, 'VNPay', 'Hết hạn');
  const daHuy = await taoDon(shopA._id, 'COD', 'Chờ thanh toán', TRANG_THAI_XU_LY.DA_HUY);
  const khacShop = await taoDon(shopB._id, 'COD', 'Chờ thanh toán');
  const khongDong = await taoDon(shopA._id, 'VNPay', 'Đã thanh toán', TRANG_THAI_XU_LY.CHO_XAC_NHAN, 0);

  assert.equal((await goi('/nguoi-ban/don-hang', null))[0], 401);
  assert.equal((await goi('/nguoi-ban/don-hang', mua._id))[0], 403);
  assert.equal((await goi('/nguoi-ban/don-hang', admin._id))[0], 403);
  assert.equal((await capNhat(cod.don._id, null, TRANG_THAI_XU_LY.DA_XAC_NHAN))[0], 401);
  assert.equal((await capNhat(cod.don._id, mua._id, TRANG_THAI_XU_LY.DA_XAC_NHAN))[0], 403);
  assert.equal((await capNhat(cod.don._id, admin._id, TRANG_THAI_XU_LY.DA_XAC_NHAN))[0], 403);
  assert.equal((await goi(`/nguoi-ban/don-hang/${khacShop.don._id}`, banA._id))[0], 404);
  assert.equal((await capNhat(khacShop.don._id, banA._id, TRANG_THAI_XU_LY.DA_XAC_NHAN))[0], 404);
  let [status, ketQua] = await goi('/nguoi-ban/don-hang?gioiHan=3', banA._id);
  assert.equal(status, 200);
  assert.equal(ketQua.data.phanTrang.tongSo, 7);
  assert.equal(ketQua.data.danhSach.length, 3);
  assert.ok(ketQua.data.danhSach.every((item) => item.nguoiMua.hoTen === 'Người mua'));
  assert.ok(!JSON.stringify(ketQua.data).includes('f20-mua@example.com'));
  [status, ketQua] = await goi('/nguoi-ban/don-hang?trangThaiXuLy=Ch%E1%BB%9D%20x%C3%A1c%20nh%E1%BA%ADn&thanhToanHopLe=true', banA._id);
  assert.equal(status, 200);
  assert.ok(ketQua.data.danhSach.some((item) => String(item._id) === String(cod.don._id)));
  assert.ok(!ketQua.data.danhSach.some((item) => String(item._id) === String(choTien.don._id)));
  for (const thamSo of ['trangThaiXuLy=sai', 'trang=0', 'gioiHan=abc']) assert.equal((await goi(`/nguoi-ban/don-hang?${thamSo}`, banA._id))[0], 400);
  [status, ketQua] = await goi(`/nguoi-ban/don-hang/${cod.don._id}`, banA._id);
  assert.equal(status, 200);
  assert.equal(ketQua.data.donHang.nguoiMua.soDienThoai, '0901234567');
  assert.equal(ketQua.data.donHang.trangThaiTiepTheo, TRANG_THAI_XU_LY.DA_XAC_NHAN);
  assert.ok(!JSON.stringify(ketQua.data).includes('maGiaoDich'));
  assert.ok(!JSON.stringify(ketQua.data).includes('f20-mua@example.com'));
  for (const don of [choTien, thatBai, hetHan, daHuy]) {
    assert.equal((await goi(`/nguoi-ban/don-hang/${don.don._id}`, banA._id))[1].data.donHang.coTheCapNhat, false);
    assert.equal((await capNhat(don.don._id, banA._id, TRANG_THAI_XU_LY.DA_XAC_NHAN))[0], 409);
  }
  assert.equal((await capNhat(cod.don._id, banA._id, 'Không có'))[0], 400);
  for (const sai of [TRANG_THAI_XU_LY.DA_HUY, TRANG_THAI_XU_LY.DANG_XU_LY, TRANG_THAI_XU_LY.CHO_XAC_NHAN]) {
    assert.equal((await capNhat(cod.don._id, banA._id, sai))[0], 409);
  }
  assert.equal((await DonHang.findById(cod.don._id)).trangThaiXuLy, TRANG_THAI_XU_LY.CHO_XAC_NHAN);
  const dongThoi = await Promise.all([capNhat(cod.don._id, banA._id, TRANG_THAI_XU_LY.DA_XAC_NHAN), capNhat(cod.don._id, banA._id, TRANG_THAI_XU_LY.DA_XAC_NHAN)]);
  assert.deepEqual(dongThoi.map(([ma]) => ma).sort(), [200, 409]);
  assert.equal((await DonHang.findById(cod.don._id)).trangThaiThanhToan, 'Chờ thanh toán');
  for (const buoc of [TRANG_THAI_XU_LY.DANG_XU_LY, TRANG_THAI_XU_LY.DANG_VAN_CHUYEN, TRANG_THAI_XU_LY.HOAN_THANH]) {
    assert.equal((await capNhat(cod.don._id, banA._id, buoc))[0], 200);
    if (buoc !== TRANG_THAI_XU_LY.HOAN_THANH) assert.equal((await DonHang.findById(cod.don._id)).trangThaiThanhToan, 'Chờ thanh toán');
  }
  const codCuoi = await DonHang.findById(cod.don._id);
  assert.equal(codCuoi.trangThaiThanhToan, 'Đã thanh toán');
  assert.ok(codCuoi.ngayHoanThanh);
  const gdCod = await GiaoDichThanhToan.findById(cod.giaoDich._id);
  assert.equal(gdCod.trangThaiThanhToan, 'Thành công');
  assert.ok(gdCod.thoiGianHoanTat);
  assert.equal((await capNhat(cod.don._id, banA._id, TRANG_THAI_XU_LY.HOAN_THANH))[0], 409);
  for (const don of [vnpay, khongDong]) {
    for (const buoc of [TRANG_THAI_XU_LY.DA_XAC_NHAN, TRANG_THAI_XU_LY.DANG_XU_LY, TRANG_THAI_XU_LY.DANG_VAN_CHUYEN, TRANG_THAI_XU_LY.HOAN_THANH]) {
      assert.equal((await capNhat(don.don._id, banA._id, buoc))[0], 200);
    }
    const daXong = await DonHang.findById(don.don._id);
    assert.equal(daXong.trangThaiThanhToan, 'Đã thanh toán');
    assert.ok(daXong.ngayHoanThanh);
    const nguoiDungThay = (await goi(`/don-hang/${don.don._id}`, mua._id))[1].data.donHang;
    assert.equal(nguoiDungThay.trangThaiXuLy, TRANG_THAI_XU_LY.HOAN_THANH);
    if (String(don.don._id) === String(vnpay.don._id)) {
      assert.equal(nguoiDungThay.danhSachChiTiet[0].coTheDanhGia, true);
      assert.equal(nguoiDungThay.danhSachChiTiet[0].coTheGuiYeuCau, true);
    }
  }
  console.log('F20: quyền/owner, lọc, COD/VNPay/0đ, thứ tự, đồng thời, dữ liệu người mua và đồng bộ giao dịch đạt.');
}

run().catch((loi) => { console.error(loi); process.exitCode = 1; }).finally(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (mongoose.connection.readyState === 1) { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); }
});
