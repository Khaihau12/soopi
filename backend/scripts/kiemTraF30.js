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
const ApDungVoucher = require('../src/models/apDungVoucher.model');
const DonHang = require('../src/models/donHang.model');
const ChiTietDonHang = require('../src/models/chiTietDonHang.model');
const GiaoDichThanhToan = require('../src/models/giaoDichThanhToan.model');

const uri = new URL(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/soopi');
uri.pathname = `/soopi_f30_kiemtra_${Date.now()}`;
let server;
let soMa = 0;
const cookie = (taiKhoan) => `token=${jwt.sign({ taiKhoanId: String(taiKhoan._id), phienBanToken: 0 }, process.env.JWT_SECRET)}`;
const goi = async (method, duongDan, taiKhoan) => {
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api${duongDan}`, {
    method, headers: taiKhoan ? { Cookie: cookie(taiKhoan) } : {},
  });
  return [response.status, await response.json()];
};
const huy = (don, taiKhoan) => goi('PATCH', `/don-hang/${don._id}/huy`, taiKhoan);
const giaTriKho = async (sanPham) => (await SanPham.findById(sanPham._id)).soLuongTon;

async function main() {
  assert.ok(process.env.JWT_SECRET, 'Cần JWT_SECRET cho kiểm thử');
  await mongoose.connect(uri.toString());
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));

  const mua = await TaiKhoan.create({ email: 'f30-mua@example.com', hoTen: 'Người mua', matKhau: 'hash' });
  const muaKhac = await TaiKhoan.create({ email: 'f30-khac@example.com', hoTen: 'Người khác', matKhau: 'hash' });
  const banA = await TaiKhoan.create({ email: 'f30-bana@example.com', hoTen: 'Người bán A', matKhau: 'hash', vaiTro: ['Người dùng', 'Người bán'] });
  const banB = await TaiKhoan.create({ email: 'f30-banb@example.com', hoTen: 'Người bán B', matKhau: 'hash', vaiTro: ['Người dùng', 'Người bán'] });
  const admin = await TaiKhoan.create({ email: 'f30-admin@example.com', hoTen: 'Quản trị viên', matKhau: 'hash', vaiTro: ['Quản trị viên'] });
  const shopA = await CuaHang.create({ tenCuaHang: 'Shop A', taiKhoanId: banA._id });
  const shopB = await CuaHang.create({ tenCuaHang: 'Shop B', taiKhoanId: banB._id });
  const danhMuc = await DanhMuc.create({ tenDanhMuc: 'Danh mục F30' });
  const sanA = await SanPham.create({ tenSanPham: 'Hàng A', giaGoc: 100000, soLuongTon: 3, cuaHangId: shopA._id, danhMucId: danhMuc._id });
  const sanB = await SanPham.create({ tenSanPham: 'Hàng B', giaGoc: 100000, soLuongTon: 4, cuaHangId: shopB._id, danhMucId: danhMuc._id });
  const voucher = await Voucher.create({ maVoucher: 'F30GIAO', tenVoucher: 'Voucher F30', loaiVoucher: 'Toàn sàn',
    kieuGiam: 'Số tiền cố định', giaTriGiam: 10000, soLuong: 1,
    ngayBatDau: new Date(Date.now() - 86400000), ngayKetThuc: new Date(Date.now() + 86400000) });
  const taoGiaoDich = (phuongThucThanhToan, trangThaiThanhToan, soTien = 100000) => GiaoDichThanhToan.create({
    maGiaoDich: `F30${String(++soMa).padStart(20, '0')}`, soTien, phuongThucThanhToan, trangThaiThanhToan,
  });
  const taoDon = async ({ giaoDich, cuaHang = shopA, sanPham = sanA, nguoiMua = mua,
    phuongThucThanhToan = 'VNPay', trangThaiThanhToan = 'Chờ thanh toán',
    trangThaiXuLy = 'Chờ xác nhận', tongThanhToan = 100000, soLuong = 1, dungVoucher = false }) => {
    const don = await DonHang.create({ taiKhoanId: nguoiMua._id, cuaHangId: cuaHang._id, giaoDichId: giaoDich._id,
      diaChiNhanHang: 'Địa chỉ F30', tongTienHang: 100000, tongThanhToan,
      phuongThucThanhToan, trangThaiThanhToan, trangThaiXuLy });
    await ChiTietDonHang.create({ donHangId: don._id, sanPhamId: sanPham._id, soLuong,
      giaGocTaiThoiDiemDat: 100000, giaBanThucTe: 100000, thanhTien: 100000 });
    if (dungVoucher) await ApDungVoucher.create({ donHangId: don._id, voucherId: voucher._id, giaTriGiamThucTe: 5000 });
    return don;
  };

  // A: hai cửa hàng chung một giao dịch; hai lời gọi tranh nhau chỉ được hoàn một lần.
  const gdA = await taoGiaoDich('VNPay', 'Chờ thanh toán', 200000);
  const donA1 = await taoDon({ giaoDich: gdA, sanPham: sanA, soLuong: 2, dungVoucher: true });
  const donA2 = await taoDon({ giaoDich: gdA, cuaHang: shopB, sanPham: sanB, dungVoucher: true });
  assert.equal((await goi('PATCH', `/don-hang/${donA1._id}/huy`, null))[0], 401);
  assert.equal((await huy(donA1, muaKhac))[0], 404);
  assert.equal((await huy(donA1, banA))[0], 404);
  assert.equal((await huy(donA1, admin))[0], 404);
  const danhSachA = (await goi('GET', '/don-hang', mua))[1].data.danhSach;
  const tomTatA = danhSachA.find((don) => String(don._id) === String(donA1._id));
  assert.equal(tomTatA.soDonSeBiHuy, 2);
  assert.equal(tomTatA.coTheHuy, true);
  assert.equal(tomTatA.kieuHuy, 'huyGiaoDichChuaThanhToan');
  assert.equal((await goi('GET', `/don-hang/${donA1._id}`, mua))[1].data.donHang.soDonSeBiHuy, 2);
  const [maA, dataA] = await huy(donA1, mua);
  assert.equal(maA, 200);
  assert.equal(dataA.data.ketQua.kieuHuy, 'huyGiaoDichChuaThanhToan');
  assert.equal(dataA.data.ketQua.soDonBiHuy, 2);
  assert.equal((await GiaoDichThanhToan.findById(gdA._id)).trangThaiThanhToan, 'Thất bại');
  for (const don of [donA1, donA2]) {
    const hienTai = await DonHang.findById(don._id);
    assert.equal(hienTai.trangThaiXuLy, 'Đã hủy');
    assert.equal(hienTai.trangThaiThanhToan, 'Thất bại');
  }
  assert.equal(await giaTriKho(sanA), 5);
  assert.equal(await giaTriKho(sanB), 5);
  assert.equal((await Voucher.findById(voucher._id)).soLuong, 2);
  assert.equal((await huy(donA2, mua))[0], 409);
  assert.equal(await giaTriKho(sanA), 5);

  const gdAdua = await taoGiaoDich('VNPay', 'Chờ thanh toán', 200000);
  const donAdua1 = await taoDon({ giaoDich: gdAdua, dungVoucher: true });
  const donAdua2 = await taoDon({ giaoDich: gdAdua, cuaHang: shopB, sanPham: sanB, dungVoucher: true });
  const khoTruocAdua = [await giaTriKho(sanA), await giaTriKho(sanB)];
  const voucherTruocAdua = (await Voucher.findById(voucher._id)).soLuong;
  const haiDonCungGiaoDich = await Promise.all([huy(donAdua1, mua), huy(donAdua2, mua)]);
  assert.deepEqual(haiDonCungGiaoDich.map(([ma]) => ma).sort(), [200, 409]);
  assert.equal(await giaTriKho(sanA), khoTruocAdua[0] + 1);
  assert.equal(await giaTriKho(sanB), khoTruocAdua[1] + 1);
  assert.equal((await Voucher.findById(voucher._id)).soLuong, voucherTruocAdua + 1);

  // B: đơn đã thanh toán trong giao dịch chung chỉ hủy đơn được chọn.
  const gdB = await taoGiaoDich('VNPay', 'Thành công', 200000);
  const donB1 = await taoDon({ giaoDich: gdB, trangThaiThanhToan: 'Đã thanh toán', dungVoucher: true });
  const donB2 = await taoDon({ giaoDich: gdB, cuaHang: shopB, sanPham: sanB, trangThaiThanhToan: 'Đã thanh toán' });
  const khoTruocB = await giaTriKho(sanA);
  const voucherTruocB = (await Voucher.findById(voucher._id)).soLuong;
  const [maB, dataB] = await huy(donB1, mua);
  assert.equal(maB, 200);
  assert.equal(dataB.data.ketQua.kieuHuy, 'huyDonDaThanhToan');
  assert.equal(dataB.data.ketQua.canHoanTienThuCong, true);
  assert.equal(dataB.data.donHang.trangThaiThanhToan, 'Đã thanh toán');
  assert.equal(await giaTriKho(sanA), khoTruocB + 1);
  assert.equal((await DonHang.findById(donB2._id)).trangThaiXuLy, 'Chờ xác nhận');
  assert.equal((await Voucher.findById(voucher._id)).soLuong, voucherTruocB);
  assert.equal((await huy(donB1, mua))[0], 409);
  const canHoanTien = (await goi('GET', '/quan-tri-vien/giao-dich-thanh-toan?canHoanTien=true', admin))[1].data.danhSach;
  assert.ok(canHoanTien.some((gd) => String(gd._id) === String(gdB._id) && gd.soDonCanHoanTien === 1));

  const gdKhongDong = await taoGiaoDich('VNPay', 'Thành công', 0);
  const donKhongDong = await taoDon({ giaoDich: gdKhongDong, trangThaiThanhToan: 'Đã thanh toán', tongThanhToan: 0 });
  assert.equal((await huy(donKhongDong, mua))[1].data.ketQua.canHoanTienThuCong, false);

  // C: COD chỉ hủy một đơn và giao dịch riêng; không hoàn voucher.
  const gdC = await taoGiaoDich('COD', 'Chờ thanh toán');
  const donC = await taoDon({ giaoDich: gdC, phuongThucThanhToan: 'COD', dungVoucher: true });
  const khoTruocC = await giaTriKho(sanA);
  const [maC, dataC] = await huy(donC, mua);
  assert.equal(maC, 200);
  assert.equal(dataC.data.ketQua.kieuHuy, 'huyDonCod');
  assert.equal(dataC.data.donHang.trangThaiThanhToan, 'Thất bại');
  assert.equal((await GiaoDichThanhToan.findById(gdC._id)).trangThaiThanhToan, 'Thất bại');
  assert.equal(await giaTriKho(sanA), khoTruocC + 1);
  assert.equal((await Voucher.findById(voucher._id)).soLuong, voucherTruocB);

  const gdDaXuLy = await taoGiaoDich('VNPay', 'Thành công');
  const donDaXuLy = await taoDon({ giaoDich: gdDaXuLy, trangThaiThanhToan: 'Đã thanh toán', trangThaiXuLy: 'Đã xác nhận' });
  assert.equal((await huy(donDaXuLy, mua))[0], 409);

  const gdNguoiBanMua = await taoGiaoDich('COD', 'Chờ thanh toán');
  const donNguoiBanMua = await taoDon({ giaoDich: gdNguoiBanMua, cuaHang: shopB, sanPham: sanB,
    nguoiMua: banA, phuongThucThanhToan: 'COD' });
  assert.equal((await huy(donNguoiBanMua, banA))[0], 200);

  // Cùng một đơn: hủy đối đầu với xác nhận của người bán, rồi hai hủy đối đầu.
  const gdDua = await taoGiaoDich('COD', 'Chờ thanh toán');
  const donDua = await taoDon({ giaoDich: gdDua, phuongThucThanhToan: 'COD' });
  const khoTruocDua = await giaTriKho(sanA);
  const duaVoiNguoiBan = await Promise.all([
    huy(donDua, mua),
    fetch(`http://127.0.0.1:${server.address().port}/api/don-hang/${donDua._id}/trang-thai`, {
      method: 'PATCH', headers: { Cookie: cookie(banA), 'Content-Type': 'application/json' },
      body: JSON.stringify({ trangThaiXuLy: 'Đã xác nhận' }),
    }).then(async (response) => [response.status, await response.json()]),
  ]);
  assert.deepEqual(duaVoiNguoiBan.map(([ma]) => ma).sort(), [200, 409]);
  const sauDua = await DonHang.findById(donDua._id);
  assert.ok(['Đã hủy', 'Đã xác nhận'].includes(sauDua.trangThaiXuLy));
  assert.equal(await giaTriKho(sanA), khoTruocDua + (sauDua.trangThaiXuLy === 'Đã hủy' ? 1 : 0));

  const gdLap = await taoGiaoDich('COD', 'Chờ thanh toán');
  const donLap = await taoDon({ giaoDich: gdLap, phuongThucThanhToan: 'COD' });
  const khoTruocLap = await giaTriKho(sanA);
  const haiLan = await Promise.all([huy(donLap, mua), huy(donLap, mua)]);
  assert.deepEqual(haiLan.map(([ma]) => ma).sort(), [200, 409]);
  assert.equal(await giaTriKho(sanA), khoTruocLap + 1);

  const tabDaHuy = (await goi('GET', '/nguoi-ban/don-hang?trangThaiXuLy=%C4%90%C3%A3%20h%E1%BB%A7y', banA))[1].data.danhSach;
  assert.ok(tabDaHuy.some((don) => String(don._id) === String(donB1._id)));
  const thongKeBan = (await goi('GET', '/nguoi-ban/thong-ke/tong-quan', banA))[1].data;
  const thongKeAdmin = (await goi('GET', '/quan-tri-vien/thong-ke/tong-quan', admin))[1].data;
  assert.equal(thongKeBan.tongDoanhThu, 0);
  assert.equal(thongKeAdmin.tongDoanhThu, 0);
  assert.equal(thongKeAdmin.soDonDaThanhToan, 2); // Đơn B2 và đơn đã xác nhận, không đếm hai đơn đã hủy.
  console.log('F30: A, B, 0đ, C, quyền, trạng thái, đua với Người bán/hủy lặp, tab Người bán và thống kê đạt.');
}

main().catch((loi) => { console.error(loi); process.exitCode = 1; }).finally(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (mongoose.connection.readyState === 1) { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); }
});
