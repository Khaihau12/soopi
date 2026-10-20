const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const app = require('../app');
const TaiKhoan = require('../src/models/taiKhoan.model');
const CuaHang = require('../src/models/cuaHang.model');
const DanhMuc = require('../src/models/danhMuc.model');
const SanPham = require('../src/models/sanPham.model');
const Voucher = require('../src/models/voucher.model');
const DonHang = require('../src/models/donHang.model');
const ChiTietDonHang = require('../src/models/chiTietDonHang.model');
const GiaoDichThanhToan = require('../src/models/giaoDichThanhToan.model');
const ApDungVoucher = require('../src/models/apDungVoucher.model');
const DanhGia = require('../src/models/danhGia.model');
const YeuCauDoiTraKhieuNai = require('../src/models/yeuCauDoiTraKhieuNai.model');

const uri = new URL(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/soopi');
uri.pathname = `/soopi_f19_kiemtra_${Date.now()}`;
process.env.VNP_TMN_CODE = 'F19TEST';
process.env.VNP_HASH_SECRET = 'f19-test-secret';
process.env.VNP_URL = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
process.env.VNP_RETURN_URL = 'http://localhost:3000/api/giao-dich-thanh-toan/vnpay/ket-qua';
let server;
const token = (id) => `token=${jwt.sign({ taiKhoanId: String(id) }, process.env.JWT_SECRET)}`;
const goi = async (duongDan, id, tuyChon = {}) => {
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api${duongDan}`, {
    ...tuyChon, headers: { ...(id ? { Cookie: token(id) } : {}), ...(tuyChon.headers || {}) },
  });
  return [response.status, await response.json()];
};

async function run() {
  assert.ok(process.env.JWT_SECRET);
  await mongoose.connect(uri.toString());
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const mua = await TaiKhoan.create({ email: 'f19-mua@example.com', matKhau: 'hash', hoTen: 'Người mua' });
  const khac = await TaiKhoan.create({ email: 'f19-khac@example.com', matKhau: 'hash', hoTen: 'Người khác' });
  const danhMuc = await DanhMuc.create({ tenDanhMuc: 'Danh mục F19' });
  const shop = await CuaHang.create({ taiKhoanId: khac._id, tenCuaHang: 'Cửa hàng F19' });
  const sanPham = await SanPham.create({ tenSanPham: 'Sản phẩm F19', giaGoc: 100000, soLuongTon: 20,
    cuaHangId: shop._id, danhMucId: danhMuc._id, hinhAnh: ['/uploads/f19.png'] });
  const voucher = await Voucher.create({ maVoucher: 'F19SALE', tenVoucher: 'Voucher F19', loaiVoucher: 'Toàn sàn',
    kieuGiam: 'Số tiền cố định', giaTriGiam: 10000, soLuong: 10, ngayBatDau: new Date(Date.now() - 86400000),
    ngayKetThuc: new Date(Date.now() + 86400000) });
  const cacDon = [];
  for (let i = 0; i < 12; i++) {
    const phuongThuc = i === 1 ? 'COD' : 'VNPay';
    const trangThaiThanhToan = i === 2 || i === 3 || i >= 5 ? 'Đã thanh toán' : i === 4 ? 'Thất bại' : 'Chờ thanh toán';
    const trangThaiXuLy = i === 2 || i === 3 ? 'Hoàn thành' : i === 4 ? 'Đã hủy' : 'Chờ xác nhận';
    const ngayTao = new Date(Date.now() - i * 60000);
    const giaoDich = await GiaoDichThanhToan.create({ maGiaoDich: `SP${String(i + 1).padStart(20, '0')}`, soTien: 120000,
      phuongThucThanhToan: phuongThuc, trangThaiThanhToan: trangThaiThanhToan === 'Đã thanh toán' ? 'Thành công' :
        trangThaiThanhToan === 'Thất bại' ? 'Thất bại' : 'Chờ thanh toán', thoiGianTao: ngayTao });
    const don = await DonHang.create({ taiKhoanId: mua._id, cuaHangId: shop._id, giaoDichId: giaoDich._id,
      diaChiNhanHang: 'Địa chỉ F19', tongTienHang: 100000, tongGiamVoucher: 10000, phiVanChuyen: 30000,
      tongThanhToan: 120000, phuongThucThanhToan: phuongThuc, trangThaiThanhToan,
      trangThaiXuLy, ngayTao,
      ...(i === 2 ? { ngayHoanThanh: new Date(Date.now() - 3 * 86400000) } : {}),
      ...(i === 3 ? { ngayHoanThanh: new Date(Date.now() - 8 * 86400000) } : {}),
    });
    const dong = await ChiTietDonHang.create({ donHangId: don._id, sanPhamId: sanPham._id, soLuong: 1,
      giaGocTaiThoiDiemDat: 100000, giaBanThucTe: 90000, thanhTien: 90000 });
    await ApDungVoucher.create({ donHangId: don._id, voucherId: voucher._id, giaTriGiamThucTe: 10000 });
    cacDon.push({ don, giaoDich, dong });
  }
  const giaoDichKhac = await GiaoDichThanhToan.create({ maGiaoDich: `SP${String(99).padStart(20, '0')}`, soTien: 100000,
    phuongThucThanhToan: 'COD', trangThaiThanhToan: 'Chờ thanh toán' });
  const donKhac = await DonHang.create({ taiKhoanId: khac._id, cuaHangId: shop._id, giaoDichId: giaoDichKhac._id,
    diaChiNhanHang: 'Địa chỉ người khác', tongTienHang: 100000, tongThanhToan: 100000 });
  await ChiTietDonHang.create({ donHangId: donKhac._id, sanPhamId: sanPham._id, soLuong: 1,
    giaGocTaiThoiDiemDat: 100000, giaBanThucTe: 100000, thanhTien: 100000 });

  assert.equal((await goi('/don-hang', null))[0], 401);
  assert.equal((await goi(`/don-hang/${cacDon[0].don._id}`, null))[0], 401);
  assert.equal((await goi(`/don-hang/${donKhac._id}`, mua._id))[0], 404);
  assert.equal((await goi(`/don-hang/${new mongoose.Types.ObjectId()}`, mua._id))[0], 404);
  assert.equal((await goi('/don-hang/sai-id', mua._id))[0], 400);
  let [ma, ketQua] = await goi('/don-hang', mua._id);
  assert.equal(ma, 200);
  assert.equal(ketQua.data.phanTrang.tongSo, 12);
  assert.equal(ketQua.data.danhSach.length, 12);
  assert.deepEqual(ketQua.data.danhSach.map((don) => String(don._id)), cacDon.map(({ don }) => String(don._id)));
  assert.ok(ketQua.data.danhSach.every((don) => don.cuaHang.tenCuaHang === 'Cửa hàng F19' && don.soDong === 1));
  assert.equal(ketQua.data.danhSach[0].coTheThanhToanLai, true);
  assert.equal(ketQua.data.danhSach[1].coTheThanhToanLai, false);
  assert.equal((await goi('/don-hang?gioiHan=999', mua._id))[1].data.phanTrang.gioiHan, 50);
  assert.equal((await goi('/don-hang?gioiHan=3&trang=2', mua._id))[1].data.danhSach.length, 3);
  for (const thamSo of ['trangThaiXuLy=sai', 'trangThaiThanhToan=sai', 'phuongThucThanhToan=sai', 'gioiHan=0', 'trang=abc', 'thanhToanHopLe=false']) {
    assert.equal((await goi(`/don-hang?${thamSo}`, mua._id))[0], 400, thamSo);
  }
  [ma, ketQua] = await goi('/don-hang?trangThaiThanhToan=Ch%E1%BB%9D%20thanh%20to%C3%A1n&phuongThucThanhToan=VNPay', mua._id);
  assert.equal(ma, 200);
  assert.deepEqual(ketQua.data.danhSach.map((item) => String(item._id)), [String(cacDon[0].don._id)]);
  [ma, ketQua] = await goi('/don-hang?trangThaiXuLy=Ch%E1%BB%9D%20x%C3%A1c%20nh%E1%BA%ADn&thanhToanHopLe=true', mua._id);
  assert.equal(ma, 200);
  assert.ok(ketQua.data.danhSach.some((item) => String(item._id) === String(cacDon[1].don._id)));
  assert.ok(!ketQua.data.danhSach.some((item) => String(item._id) === String(cacDon[0].don._id)));

  await SanPham.updateOne({ _id: sanPham._id }, { $set: { giaGoc: 250000 } });
  [ma, ketQua] = await goi(`/don-hang/${cacDon[2].don._id}`, mua._id);
  assert.equal(ma, 200);
  assert.equal(ketQua.data.donHang.danhSachChiTiet[0].giaGocTaiThoiDiemDat, 100000);
  assert.equal(ketQua.data.donHang.danhSachChiTiet[0].giaBanThucTe, 90000);
  assert.equal(ketQua.data.donHang.voucherApDung[0].maVoucher, 'F19SALE');
  assert.equal(ketQua.data.donHang.voucherApDung[0].giaTriGiamThucTe, 10000);
  assert.equal(ketQua.data.donHang.danhSachChiTiet[0].coTheDanhGia, true);
  assert.equal(ketQua.data.donHang.danhSachChiTiet[0].coTheGuiYeuCau, true);
  assert.equal(new Date(ketQua.data.donHang.hanGuiYeuCau).getTime() - new Date(ketQua.data.donHang.ngayHoanThanh).getTime(), 7 * 86400000);
  const hetHan = (await goi(`/don-hang/${cacDon[3].don._id}`, mua._id))[1].data.donHang;
  assert.equal(hetHan.danhSachChiTiet[0].coTheGuiYeuCau, false);
  await DanhGia.create({ taiKhoanId: mua._id, sanPhamId: sanPham._id, chiTietDonHangId: cacDon[2].dong._id, soSao: 5, noiDung: 'Tốt' });
  await YeuCauDoiTraKhieuNai.create({ chiTietDonHangId: cacDon[2].dong._id, loaiYeuCau: 'Đổi trả', noiDung: 'Lỗi hàng' });
  const daXuLy = (await goi(`/don-hang/${cacDon[2].don._id}`, mua._id))[1].data.donHang.danhSachChiTiet[0];
  assert.equal(daXuLy.daDanhGia, true);
  assert.equal(daXuLy.coTheDanhGia, false);
  assert.equal(daXuLy.coTheGuiYeuCau, false);
  assert.ok(daXuLy.yeuCauDoiTra._id);
  const cod = (await goi(`/don-hang/${cacDon[1].don._id}`, mua._id))[1].data.donHang;
  assert.equal(cod.coTheThanhToanLai, false);
  assert.equal(cod.hanThanhToan, null);
  assert.equal((await goi(`/don-hang/${cacDon[0].don._id}`, mua._id))[1].data.donHang.coTheThanhToanLai, true);
  assert.equal((await goi(`/don-hang/${cacDon[4].don._id}`, mua._id))[1].data.donHang.coTheThanhToanLai, false);
  [ma, ketQua] = await goi('/giao-dich-thanh-toan/vnpay/tao-thanh-toan', mua._id,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ giaoDichId: cacDon[0].giaoDich._id }) });
  assert.equal(ma, 200);
  assert.ok(ketQua.data.duongDanThanhToan.includes('vnp_TxnRef='));
  await GiaoDichThanhToan.updateOne({ _id: cacDon[0].giaoDich._id }, { $set: { thoiGianTao: new Date(Date.now() - 25 * 3600000) } });
  assert.equal((await goi(`/don-hang/${cacDon[0].don._id}`, mua._id))[1].data.donHang.coTheThanhToanLai, false);
  await DonHang.updateOne({ _id: cacDon[3].don._id }, { $unset: { ngayHoanThanh: '' }, $set: { ngayTao: new Date(Date.now() - 2 * 86400000) } });
  const duLieuCu = (await goi(`/don-hang/${cacDon[3].don._id}`, mua._id))[1].data.donHang;
  assert.equal(duLieuCu.danhSachChiTiet[0].coTheGuiYeuCau, true);
  assert.equal(new Date(duLieuCu.hanGuiYeuCau).getTime() - new Date(duLieuCu.ngayTao).getTime(), 7 * 86400000);

  let demTruyVan = 0;
  mongoose.set('debug', () => { demTruyVan += 1; });
  try {
    await goi('/don-hang?gioiHan=1', mua._id);
    const motDon = demTruyVan;
    demTruyVan = 0;
    await goi('/don-hang?gioiHan=12', mua._id);
    assert.equal(demTruyVan, motDon, 'Số truy vấn danh sách không được tăng theo số đơn');
  } finally { mongoose.set('debug', false); }
  await SanPham.deleteOne({ _id: sanPham._id });
  const daXoa = (await goi(`/don-hang/${cacDon[2].don._id}`, mua._id))[1].data.donHang.danhSachChiTiet[0];
  assert.equal(daXoa.sanPham.tenSanPham, 'Sản phẩm không còn hiển thị');
  assert.equal(daXoa.giaBanThucTe, 90000);
  console.log('F19: quyền xem, lọc/phân trang, snapshot, voucher, thanh toán lại, đánh giá, hạn đổi trả, COD và số truy vấn cố định đạt.');
}

run().catch((loi) => { console.error(loi); process.exitCode = 1; }).finally(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (mongoose.connection.readyState === 1) { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); }
});
