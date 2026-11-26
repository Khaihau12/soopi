// Chạy xem trước trước; --apply sao lưu, chuyển dữ liệu và chỉ xóa collection cũ sau khi đối chiếu.
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');
const { EJSON } = require('bson');

const tenCu = ['YeuCauDangKyNguoiBan', 'YeuCauDoiTraKhieuNai', 'ApDungVoucher'];
const apply = process.argv.includes('--apply');

async function chay() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  if (db.databaseName !== 'soopi') throw new Error(`Không chuyển dữ liệu trên database ${db.databaseName}`);
  const hienCo = await db.listCollections({}, { nameOnly: true }).toArray();
  const tenHienCo = new Set(hienCo.map((item) => item.name));
  const thieu = tenCu.filter((ten) => !tenHienCo.has(ten));
  if (thieu.length) throw new Error(`Thiếu collection nguồn: ${thieu.join(', ')}. Kiểm tra lại trước khi chuyển.`);
  const [dangKy, doiTra, suDung] = await Promise.all(tenCu.map((ten) => db.collection(ten).find({}).toArray()));
  const shops = db.collection('CuaHang');
  const dongDon = db.collection('ChiTietDonHang');
  const donHang = db.collection('DonHang');
  const voucher = db.collection('Voucher');
  const shopsCu = await shops.find({}).toArray();
  const dongCu = await dongDon.find({}).toArray();
  const donCu = await donHang.find({}).toArray();
  const voucherCu = await voucher.find({}).toArray();
  const bangShop = new Map(shopsCu.map((x) => [String(x.taiKhoanId), x]));
  const bangDong = new Map(dongCu.map((x) => [String(x._id), x]));
  const bangDon = new Map(donCu.map((x) => [String(x._id), x]));
  const bangVoucher = new Map(voucherCu.map((x) => [String(x._id), x]));
  if (new Set(dangKy.map((x) => String(x.taiKhoanId))).size !== dangKy.length) {
    throw new Error('Một tài khoản có nhiều hồ sơ đăng ký; cần xử lý trước khi chuyển.');
  }
  if (new Set(doiTra.map((x) => String(x.chiTietDonHangId))).size !== doiTra.length) {
    throw new Error('Một dòng đơn có nhiều yêu cầu đổi trả; cần xử lý trước khi chuyển.');
  }
  for (const x of dangKy) {
    if (x.trangThai === 'Đã phê duyệt' && !bangShop.has(String(x.taiKhoanId))) throw new Error(`Thiếu cửa hàng cho hồ sơ ${x._id}`);
  }
  for (const x of doiTra) {
    if (!bangDong.has(String(x.chiTietDonHangId))) throw new Error(`Thiếu dòng đơn cho yêu cầu ${x._id}`);
    const hienTai = bangDong.get(String(x.chiTietDonHangId)).yeuCauDoiTra;
    if (hienTai && String(hienTai._id) !== String(x._id)) throw new Error(`Dòng đơn đã có yêu cầu khác: ${x.chiTietDonHangId}`);
  }
  for (const x of suDung) {
    if (!bangDon.has(String(x.donHangId)) || !bangVoucher.has(String(x.voucherId))) throw new Error(`Thiếu đơn hoặc voucher cho lượt dùng ${x._id}`);
    if (!Number.isSafeInteger(x.giaTriGiamThucTe) || x.giaTriGiamThucTe < 0) throw new Error(`Mức giảm không hợp lệ ở lượt ${x._id}`);
  }
  const nhomVoucher = new Map();
  for (const x of suDung) {
    const v = bangVoucher.get(String(x.voucherId));
    const id = String(x.donHangId);
    if (!nhomVoucher.has(id)) nhomVoucher.set(id, []);
    nhomVoucher.get(id).push({ voucherId: x.voucherId, maVoucher: v.maVoucher, tenVoucher: v.tenVoucher || v.maVoucher,
      loaiVoucher: v.loaiVoucher, giaTriGiamThucTe: x.giaTriGiamThucTe, thoiGianApDung: x.thoiGianApDung });
  }
  for (const [id, ds] of nhomVoucher) {
    if ((bangDon.get(id).voucherDaDung || []).length) throw new Error(`Đơn ${id} đã có voucherDaDung; không ghi đè.`);
    if (new Set(ds.map((x) => String(x.voucherId))).size !== ds.length) {
      throw new Error(`Voucher trùng trên đơn ${id}; cần xử lý trước khi chuyển.`);
    }
  }
  console.log(`Chuyển: ${dangKy.length} hồ sơ bán hàng, ${doiTra.length} yêu cầu đổi trả, ${suDung.length} lượt voucher trên ${nhomVoucher.size} đơn.`);
  if (!apply) return;
  const thuMuc = path.join(__dirname, '..', 'backups');
  fs.mkdirSync(thuMuc, { recursive: true });
  const file = path.join(thuMuc, `truoc-chuyen-thuc-the-${Date.now()}.json`);
  fs.writeFileSync(file, EJSON.stringify({ dangKy, doiTra, suDung, shopsCu, dongCu, donCu, voucherCu }, null, 2), { flag: 'wx' });
  console.log(`Đã sao lưu dữ liệu liên quan: ${file}`);
  for (const x of dangKy) {
    const hienTai = bangShop.get(String(x.taiKhoanId));
    if (hienTai) {
      await shops.updateOne({ _id: hienTai._id }, { $set: { trangThaiDuyet: x.trangThai, ngayGui: x.ngayGui } });
    } else {
      await shops.updateOne({ _id: x._id }, { $setOnInsert: { _id: x._id, tenCuaHang: x.tenCuaHang,
        moTa: x.moTaCuaHang || '', diaChi: x.diaChiCuaHang, taiKhoanId: x.taiKhoanId,
        trangThaiHoatDong: 'Ngừng hoạt động', trangThaiDuyet: x.trangThai, ngayGui: x.ngayGui } }, { upsert: true });
    }
  }
  for (const x of doiTra) {
    await dongDon.updateOne({ _id: x.chiTietDonHangId }, { $set: { yeuCauDoiTra: {
      _id: x._id, loaiYeuCau: x.loaiYeuCau, noiDung: x.noiDung, ngayTao: x.ngayTao,
      trangThaiXuLy: x.trangThaiXuLy, ...(x.ketQuaXuLy ? { ketQuaXuLy: x.ketQuaXuLy } : {}),
    } } });
  }
  for (const [id, ds] of nhomVoucher) await donHang.updateOne({ _id: new mongoose.Types.ObjectId(id) }, { $set: { voucherDaDung: ds } });
  for (const x of dangKy) {
    const moi = await shops.findOne({ taiKhoanId: x.taiKhoanId });
    if (!moi || moi.trangThaiDuyet !== x.trangThai || +new Date(moi.ngayGui) !== +new Date(x.ngayGui)) {
      throw new Error(`Đối chiếu cửa hàng thất bại: ${x._id}; giữ nguyên collection cũ.`);
    }
  }
  for (const x of doiTra) {
    const moi = await dongDon.findOne({ _id: x.chiTietDonHangId });
    const y = moi?.yeuCauDoiTra;
    if (!y || String(y._id) !== String(x._id) || y.loaiYeuCau !== x.loaiYeuCau
      || y.noiDung !== x.noiDung || y.trangThaiXuLy !== x.trangThaiXuLy
      || (y.ketQuaXuLy || null) !== (x.ketQuaXuLy || null) || +new Date(y.ngayTao) !== +new Date(x.ngayTao)) {
      throw new Error(`Đối chiếu đổi trả thất bại: ${x._id}; giữ nguyên collection cũ.`);
    }
  }
  for (const [id, ds] of nhomVoucher) {
    const moi = await donHang.findOne({ _id: new mongoose.Types.ObjectId(id) });
    const daLuu = moi?.voucherDaDung || [];
    if (daLuu.length !== ds.length || ds.some((x) => !daLuu.some((y) =>
      String(y.voucherId) === String(x.voucherId) && y.maVoucher === x.maVoucher
      && y.loaiVoucher === x.loaiVoucher && y.giaTriGiamThucTe === x.giaTriGiamThucTe
      && +new Date(y.thoiGianApDung) === +new Date(x.thoiGianApDung)))) {
      throw new Error(`Đối chiếu voucher thất bại trên đơn ${id}; giữ nguyên collection cũ.`);
    }
  }
  for (const ten of tenCu) await db.collection(ten).drop();
  console.log('Đã đối chiếu và xóa ba collection cũ.');
}

chay().catch((loi) => { console.error(loi); process.exitCode = 1; }).finally(() => mongoose.disconnect());
