const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
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
const ApDungVoucher = require('../src/models/apDungVoucher.model');
const GiaoDichThanhToan = require('../src/models/giaoDichThanhToan.model');
const { xuLyGiaoDichHetHan, taoThanhToanVnpay } = require('../src/services/giaoDichThanhToan.service');

const uri = new URL(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/soopi');
uri.pathname = `/soopi_f18_kiemtra_${Date.now()}`;
process.env.VNP_HASH_SECRET = 'f18-test-secret';
process.env.VNP_TMN_CODE = 'F18TEST';
process.env.VNP_URL = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
process.env.VNP_RETURN_URL = 'http://localhost:3000/api/giao-dich-thanh-toan/vnpay/ket-qua';
process.env.FRONTEND_URL = 'http://localhost:5173';
let server;
let thuTu = 0;

const diaChiApi = () => `http://127.0.0.1:${server.address().port}/api/giao-dich-thanh-toan`;
const cookie = (id) => `token=${jwt.sign({ taiKhoanId: String(id) }, process.env.JWT_SECRET)}`;
const guiKetQua = async (thamSo) => {
  const response = await fetch(`${diaChiApi()}/vnpay/ket-qua?${new URLSearchParams(thamSo)}`, { redirect: 'manual' });
  assert.equal(response.status, 302);
  return new URL(response.headers.get('location'));
};
const kyKetQua = (giaoDich, overrides = {}) => {
  const thamSo = {
    vnp_TxnRef: `${giaoDich.maGiaoDich}R1234`,
    vnp_Amount: String(giaoDich.soTien * 100),
    vnp_ResponseCode: '00', vnp_TransactionStatus: '00', ...overrides,
  };
  const chuoi = new URLSearchParams(Object.entries(thamSo).sort(([a], [b]) => a.localeCompare(b))).toString();
  thamSo.vnp_SecureHash = crypto.createHmac('sha512', process.env.VNP_HASH_SECRET).update(chuoi).digest('hex');
  return thamSo;
};
const taoBo = async ({ soCuaHang = 1, thoiGianTao = new Date(), phuongThuc = 'VNPay', coVoucher = true } = {}) => {
  const so = ++thuTu;
  const nguoiMua = await TaiKhoan.create({ email: `f18-mua-${so}@example.com`, matKhau: 'hash', hoTen: `Người mua ${so}` });
  const chuShop = await TaiKhoan.create({ email: `f18-chu-${so}@example.com`, matKhau: 'hash', hoTen: `Chủ shop ${so}` });
  const danhMuc = await DanhMuc.create({ tenDanhMuc: `Danh mục ${so}` });
  const giaoDich = await GiaoDichThanhToan.create({ maGiaoDich: `SP${String(so).padStart(20, '0')}`, soTien: soCuaHang * 100000,
    phuongThucThanhToan: phuongThuc, trangThaiThanhToan: 'Chờ thanh toán', thoiGianTao });
  const voucher = coVoucher ? await Voucher.create({ maVoucher: `F18V${so}`, tenVoucher: `Voucher ${so}`,
    loaiVoucher: 'Toàn sàn', kieuGiam: 'Số tiền cố định', giaTriGiam: 1000,
    soLuong: 2, ngayBatDau: new Date(Date.now() - 86400000), ngayKetThuc: new Date(Date.now() + 86400000), trangThai: 'Kích hoạt' }) : null;
  const sanPham = [];
  const donHang = [];
  for (let i = 0; i < soCuaHang; i++) {
    const cuaHang = await CuaHang.create({ tenCuaHang: `Cửa hàng ${so}-${i}`, taiKhoanId: i === 0 ? nguoiMua._id : chuShop._id });
    const san = await SanPham.create({ tenSanPham: `Sản phẩm ${so}-${i}`, giaGoc: 100000, soLuongTon: 4,
      cuaHangId: cuaHang._id, danhMucId: danhMuc._id });
    sanPham.push(san);
    const don = await DonHang.create({ diaChiNhanHang: 'Địa chỉ thử nghiệm', tongTienHang: 100000, tongThanhToan: 100000,
      taiKhoanId: nguoiMua._id, cuaHangId: cuaHang._id, giaoDichId: giaoDich._id, phuongThucThanhToan: phuongThuc });
    donHang.push(don);
    await ChiTietDonHang.create({ donHangId: don._id, sanPhamId: san._id, soLuong: 1, giaGocTaiThoiDiemDat: 100000, giaBanThucTe: 100000, thanhTien: 100000 });
    if (voucher) await ApDungVoucher.create({ donHangId: don._id, voucherId: voucher._id, giaTriGiamThucTe: 1000 });
  }
  return { nguoiMua, chuShop, giaoDich, voucher, sanPham, donHang };
};
const trangThai = async (bo, gd, don, kho, voucher) => {
  assert.equal((await GiaoDichThanhToan.findById(bo.giaoDich._id)).trangThaiThanhToan, gd);
  assert.ok((await GiaoDichThanhToan.findById(bo.giaoDich._id)).thoiGianHoanTat);
  for (const item of await DonHang.find({ giaoDichId: bo.giaoDich._id })) {
    assert.equal(item.trangThaiThanhToan, don);
    assert.equal(item.trangThaiXuLy, gd === 'Thành công' ? 'Chờ xác nhận' : 'Đã hủy');
  }
  for (const san of bo.sanPham) assert.equal((await SanPham.findById(san._id)).soLuongTon, kho);
  if (bo.voucher) assert.equal((await Voucher.findById(bo.voucher._id)).soLuong, voucher);
};

async function run() {
  assert.ok(process.env.JWT_SECRET);
  await mongoose.connect(uri.toString());
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));

  const thanhCong = await taoBo({ soCuaHang: 2 });
  const urlMoi = await taoThanhToanVnpay(thanhCong.nguoiMua._id, thanhCong.giaoDich._id, '127.0.0.1');
  assert.match(new URL(urlMoi.duongDanThanhToan).searchParams.get('vnp_TxnRef'), /R\d{4}$/);
  const kyDung = kyKetQua(thanhCong.giaoDich);
  assert.equal((await guiKetQua({ ...kyDung, vnp_Amount: '1' })).searchParams.get('loi'), 'chuKy');
  await trangThaiChuaXuLy(thanhCong);
  assert.equal((await guiKetQua(kyKetQua(thanhCong.giaoDich, { vnp_Amount: '1' }))).searchParams.get('loi'), 'saiSoTien');
  await trangThaiChuaXuLy(thanhCong);
  assert.equal((await guiKetQua(kyDung)).searchParams.get('giaoDichId'), String(thanhCong.giaoDich._id));
  await trangThai(thanhCong, 'Thành công', 'Đã thanh toán', 4, 2);
  await guiKetQua(kyDung);
  await trangThai(thanhCong, 'Thành công', 'Đã thanh toán', 4, 2);

  const chiTietUrl = `${diaChiApi()}/${thanhCong.giaoDich._id}`;
  assert.equal((await fetch(chiTietUrl)).status, 401);
  assert.equal((await fetch(chiTietUrl, { headers: { Cookie: cookie(thanhCong.chuShop._id) } })).status, 404);
  const chiTietRes = await fetch(chiTietUrl, { headers: { Cookie: cookie(thanhCong.nguoiMua._id) } });
  assert.equal(chiTietRes.status, 200);
  const chiTiet = (await chiTietRes.json()).data;
  assert.equal(chiTiet.danhSachDonHang.length, 2);
  assert.ok(chiTiet.danhSachDonHang.every((don) => don.cuaHang.tenCuaHang && don.trangThaiThanhToan === 'Đã thanh toán'));
  assert.equal(new Date(chiTiet.hanThanhToan).getTime() - new Date(chiTiet.giaoDich.thoiGianTao).getTime(), 86400000);

  const thatBai = await taoBo({ soCuaHang: 2 });
  const huy = kyKetQua(thatBai.giaoDich, { vnp_ResponseCode: '24', vnp_TransactionStatus: '02' });
  await guiKetQua(huy);
  await trangThai(thatBai, 'Thất bại', 'Thất bại', 5, 3);
  const maTrangThaiLoi = await taoBo();
  await guiKetQua(kyKetQua(maTrangThaiLoi.giaoDich, { vnp_TransactionStatus: '02' }));
  await trangThai(maTrangThaiLoi, 'Thất bại', 'Thất bại', 5, 3);
  assert.equal(await ApDungVoucher.countDocuments({ donHangId: { $in: thatBai.donHang.map((don) => don._id) } }), 2);
  await guiKetQua(huy);
  await trangThai(thatBai, 'Thất bại', 'Thất bại', 5, 3);
  const cu = console.warn;
  const canhBao = [];
  console.warn = (...args) => canhBao.push(args.join(' '));
  try { await guiKetQua(kyKetQua(thatBai.giaoDich)); }
  finally { console.warn = cu; }
  assert.ok(canhBao.some((dong) => dong.includes(thatBai.giaoDich.maGiaoDich)));
  await trangThai(thatBai, 'Thất bại', 'Thất bại', 5, 3);

  const cuMoc = (phut) => new Date(Date.now() - 86400000 - phut * 60000);
  const hetHan = await taoBo({ soCuaHang: 2, thoiGianTao: cuMoc(11) });
  const giaHan = await taoBo({ thoiGianTao: cuMoc(5) });
  const conHan = await taoBo({ thoiGianTao: new Date() });
  const cod = await taoBo({ thoiGianTao: cuMoc(30), phuongThuc: 'COD' });
  assert.equal((await guiKetQua(kyKetQua(cod.giaoDich))).searchParams.get('loi'), 'khongTimThay');
  assert.equal((await guiKetQua(kyKetQua({ ...cod.giaoDich, maGiaoDich: 'SP99999999999999999999' }))).searchParams.get('loi'), 'khongTimThay');
  await xuLyGiaoDichHetHan();
  await trangThai(hetHan, 'Hết hạn', 'Hết hạn', 5, 3);
  const canhBaoHetHan = [];
  console.warn = (...args) => canhBaoHetHan.push(args.join(' '));
  try { await guiKetQua(kyKetQua(hetHan.giaoDich)); }
  finally { console.warn = cu; }
  assert.ok(canhBaoHetHan.some((dong) => dong.includes(hetHan.giaoDich.maGiaoDich)));
  await trangThai(hetHan, 'Hết hạn', 'Hết hạn', 5, 3);

  const loiQuet = await taoBo({ thoiGianTao: cuMoc(11) });
  const sauLoi = await taoBo({ thoiGianTao: cuMoc(11) });
  const update = GiaoDichThanhToan.findOneAndUpdate;
  const error = console.error;
  const loiGhi = [];
  GiaoDichThanhToan.findOneAndUpdate = function (filter, ...args) {
    if (String(filter._id) === String(loiQuet.giaoDich._id)) return Promise.reject(new Error('Lỗi quét thử nghiệm'));
    return update.call(this, filter, ...args);
  };
  console.error = (...args) => loiGhi.push(args.join(' '));
  try { await xuLyGiaoDichHetHan(); }
  finally { GiaoDichThanhToan.findOneAndUpdate = update; console.error = error; }
  assert.ok(loiGhi.some((dong) => dong.includes(String(loiQuet.giaoDich._id))));
  await trangThaiChuaXuLy(loiQuet);
  await trangThai(sauLoi, 'Hết hạn', 'Hết hạn', 5, 3);
  await xuLyGiaoDichHetHan();
  await trangThai(loiQuet, 'Hết hạn', 'Hết hạn', 5, 3);
  await trangThaiChuaXuLy(giaHan);
  await trangThaiChuaXuLy(conHan);
  await trangThaiChuaXuLy(cod);
  await xuLyGiaoDichHetHan();
  await trangThai(hetHan, 'Hết hạn', 'Hết hạn', 5, 3);

  const dau = await taoBo({ thoiGianTao: cuMoc(11) });
  const callback = guiKetQua(kyKetQua(dau.giaoDich, { vnp_ResponseCode: '24' }));
  await Promise.all([callback, xuLyGiaoDichHetHan()]);
  const ketQuaDau = (await GiaoDichThanhToan.findById(dau.giaoDich._id)).trangThaiThanhToan;
  assert.ok(['Thất bại', 'Hết hạn'].includes(ketQuaDau));
  await trangThai(dau, ketQuaDau, ketQuaDau, 5, 3);
  const quaHan = await taoBo({ thoiGianTao: cuMoc(11) });
  assert.rejects(() => taoThanhToanVnpay(quaHan.nguoiMua._id, quaHan.giaoDich._id, '127.0.0.1'), { statusCode: 409 });
  await xuLyGiaoDichHetHan();
  await trangThai(quaHan, 'Hết hạn', 'Hết hạn', 5, 3);
  const satMoc = await taoBo({ thoiGianTao: new Date(Date.now() - 86400000 + 60000) });
  const [duongDanSatMoc] = await Promise.all([
    taoThanhToanVnpay(satMoc.nguoiMua._id, satMoc.giaoDich._id, '127.0.0.1'),
    xuLyGiaoDichHetHan(),
  ]);
  assert.ok(duongDanSatMoc.duongDanThanhToan);
  await trangThaiChuaXuLy(satMoc);
  await guiKetQua(kyKetQua(satMoc.giaoDich));
  await trangThai(satMoc, 'Thành công', 'Đã thanh toán', 4, 2);

  const khoiDong = await taoBo({ thoiGianTao: cuMoc(11) });
  const tienTrinh = spawn(process.execPath, ['server.js'], {
    cwd: require('node:path').join(__dirname, '..'),
    env: { ...process.env, MONGODB_URI: uri.toString(), PORT: '0' }, stdio: 'ignore',
  });
  try {
    let daQuet = false;
    for (let lan = 0; lan < 50; lan++) {
      if (tienTrinh.exitCode !== null) throw new Error('Server dừng trước khi quét giao dịch lúc khởi động');
      const [giaoDich, don, sanPham, voucher] = await Promise.all([
        GiaoDichThanhToan.findById(khoiDong.giaoDich._id),
        DonHang.findById(khoiDong.donHang[0]._id),
        SanPham.findById(khoiDong.sanPham[0]._id),
        Voucher.findById(khoiDong.voucher._id),
      ]);
      if (giaoDich.trangThaiThanhToan === 'Hết hạn' && don.trangThaiXuLy === 'Đã hủy'
          && sanPham.soLuongTon === 5 && voucher.soLuong === 3) {
        daQuet = true; break;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert.equal(daQuet, true, 'Server phải quét ngay khi khởi động');
    await trangThai(khoiDong, 'Hết hạn', 'Hết hạn', 5, 3);
  } finally { tienTrinh.kill(); }

  console.log('F18: callback ký hợp lệ, mã VNPay, chữ ký/số tiền sai, lặp, 2 cửa hàng, quyền truy cập, hết hạn, COD, thanh toán muộn, cô lập lỗi, đua callback-quét và quét lúc khởi động đạt.');
}

async function trangThaiChuaXuLy(bo) {
  assert.equal((await GiaoDichThanhToan.findById(bo.giaoDich._id)).trangThaiThanhToan, 'Chờ thanh toán');
  assert.equal((await SanPham.findById(bo.sanPham[0]._id)).soLuongTon, 4);
  if (bo.voucher) assert.equal((await Voucher.findById(bo.voucher._id)).soLuong, 2);
}

run().catch((loi) => { console.error(loi); process.exitCode = 1; }).finally(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (mongoose.connection.readyState === 1) { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); }
});
