// Chuyển bộ dữ liệu cũ dùng ID chuỗi sang ObjectId, giữ nguyên các trường nghiệp vụ.
// Chạy kiểm tra: node scripts/chuyenIdCu.js
// Chạy chuyển đổi: node scripts/chuyenIdCu.js --apply
// Khôi phục bản sao lưu: node scripts/chuyenIdCu.js --restore <đường-dẫn-file-json>
const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');
const { EJSON, ObjectId } = require('bson');
require('dotenv').config({ quiet: true });

const CAC_COLLECTION = [
  'TaiKhoan', 'YeuCauDangKyNguoiBan', 'CuaHang', 'DanhMuc', 'SanPham',
  'KhuyenMai', 'ChiTietKhuyenMai', 'Voucher', 'ApDungVoucher', 'BannerQuangCao',
  'GioHang', 'ChiTietGioHang', 'DonHang', 'ChiTietDonHang', 'GiaoDichThanhToan',
  'DanhGia', 'YeuCauDoiTraKhieuNai', 'CuocTroChuyen', 'TinNhan',
];
const THAM_CHIEU = {
  YeuCauDangKyNguoiBan: { taiKhoanId: 'TaiKhoan' },
  CuaHang: { taiKhoanId: 'TaiKhoan' },
  SanPham: { cuaHangId: 'CuaHang', danhMucId: 'DanhMuc' },
  KhuyenMai: { cuaHangId: 'CuaHang' },
  ChiTietKhuyenMai: { khuyenMaiId: 'KhuyenMai', sanPhamId: 'SanPham' },
  Voucher: { cuaHangId: 'CuaHang' },
  ApDungVoucher: { voucherId: 'Voucher', donHangId: 'DonHang' },
  GioHang: { taiKhoanId: 'TaiKhoan' },
  ChiTietGioHang: { gioHangId: 'GioHang', sanPhamId: 'SanPham' },
  DonHang: { taiKhoanId: 'TaiKhoan', cuaHangId: 'CuaHang', giaoDichId: 'GiaoDichThanhToan' },
  ChiTietDonHang: { donHangId: 'DonHang', sanPhamId: 'SanPham' },
  DanhGia: { taiKhoanId: 'TaiKhoan', sanPhamId: 'SanPham', chiTietDonHangId: 'ChiTietDonHang' },
  YeuCauDoiTraKhieuNai: { chiTietDonHangId: 'ChiTietDonHang' },
  CuocTroChuyen: { taiKhoanId: 'TaiKhoan', cuaHangId: 'CuaHang' },
  TinNhan: { cuocTroChuyenId: 'CuocTroChuyen', nguoiGuiId: 'TaiKhoan' },
};

const laObjectId = (giaTri) => giaTri instanceof ObjectId || giaTri?._bsontype === 'ObjectId';
const khoa = (giaTri) => `${laObjectId(giaTri) ? 'oid' : typeof giaTri}:${String(giaTri)}`;

const docDuLieu = async (db) => {
  const duLieu = {};
  for (const ten of CAC_COLLECTION) duLieu[ten] = await db.collection(ten).find({}).toArray();
  return duLieu;
};

const lapPhuongAn = (duLieu) => {
  const bangId = {};
  let soIdChuoi = 0;
  for (const ten of CAC_COLLECTION) {
    bangId[ten] = new Map();
    for (const taiLieu of duLieu[ten]) {
      if (typeof taiLieu._id !== 'string' && !laObjectId(taiLieu._id)) throw new Error(`${ten}: kiểu _id không hỗ trợ`);
      const idMoi = typeof taiLieu._id === 'string' ? new ObjectId() : taiLieu._id;
      if (typeof taiLieu._id === 'string') soIdChuoi++;
      bangId[ten].set(khoa(taiLieu._id), idMoi);
    }
  }
  const daChuyen = {};
  for (const ten of CAC_COLLECTION) {
    daChuyen[ten] = duLieu[ten].map((taiLieu) => {
      const moi = { ...taiLieu, _id: bangId[ten].get(khoa(taiLieu._id)) };
      for (const [truong, dich] of Object.entries(THAM_CHIEU[ten] || {})) {
        if (taiLieu[truong] === undefined || taiLieu[truong] === null) continue;
        const idMoi = bangId[dich].get(khoa(taiLieu[truong]));
        if (!idMoi) throw new Error(`${ten}/${taiLieu._id}: ${truong} không tham chiếu tới ${dich}`);
        moi[truong] = idMoi;
      }
      return moi;
    });
  }
  return { daChuyen, soIdChuoi };
};

const ghiDuLieu = async (db, duLieu) => {
  for (const ten of CAC_COLLECTION) await db.collection(ten).deleteMany({});
  for (const ten of CAC_COLLECTION) {
    if (duLieu[ten].length) await db.collection(ten).insertMany(duLieu[ten], { ordered: true });
  }
};

const kiemTraSauGhi = async (db, duLieu) => {
  for (const ten of CAC_COLLECTION) {
    const hienTai = await db.collection(ten).find({}).toArray();
    if (hienTai.length !== duLieu[ten].length) throw new Error(`${ten}: số bản ghi không khớp sau khi ghi`);
    const hienTaiTheoId = new Map(hienTai.map((taiLieu) => [khoa(taiLieu._id), taiLieu]));
    for (const taiLieu of duLieu[ten]) {
      const daLuu = hienTaiTheoId.get(khoa(taiLieu._id));
      if (!daLuu || EJSON.stringify(daLuu, { relaxed: false }) !== EJSON.stringify(taiLieu, { relaxed: false })) {
        throw new Error(`${ten}: dữ liệu bản ghi ${taiLieu._id} không khớp sau khi ghi`);
      }
    }
  }
};

const main = async () => {
  const lenh = process.argv[2];
  if (lenh && !['--apply', '--stage', '--restore'].includes(lenh)) throw new Error('Chỉ dùng --stage, --apply hoặc --restore <file>.');
  if (!process.env.MONGODB_URI) throw new Error('Thiếu MONGODB_URI.');
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    const db = mongoose.connection.db;
    if (db.databaseName !== 'soopi') throw new Error('Chỉ được chạy trên database soopi.');
    if (lenh === '--restore') {
      const tep = process.argv[3];
      if (!tep) throw new Error('Thiếu đường dẫn bản sao lưu.');
      const banSao = EJSON.parse(fs.readFileSync(path.resolve(tep), 'utf8'));
      if (banSao.database !== 'soopi' || !banSao.collections) throw new Error('Bản sao lưu không hợp lệ.');
      lapPhuongAn(banSao.collections);
      await ghiDuLieu(db, banSao.collections);
      await kiemTraSauGhi(db, banSao.collections);
      console.log('Đã khôi phục bản sao lưu.');
      return;
    }
    const duLieu = await docDuLieu(db);
    const { daChuyen, soIdChuoi } = lapPhuongAn(duLieu);
    console.log(`Kiểm tra ${CAC_COLLECTION.length} collection, ${Object.values(duLieu).reduce((tong, ds) => tong + ds.length, 0)} bản ghi; ${soIdChuoi} ID chuỗi.`);
    if (lenh === '--stage') {
      const dbThu = mongoose.connection.getClient().db('soopi_chuyen_id_kiem_tra_tam');
      try {
        await dbThu.dropDatabase();
        await ghiDuLieu(dbThu, daChuyen);
        await kiemTraSauGhi(dbThu, daChuyen);
        lapPhuongAn(await docDuLieu(dbThu));
        console.log('Bản sao chuyển đổi đã qua kiểm tra số lượng, nội dung và tham chiếu.');
      } finally { await dbThu.dropDatabase(); }
      return;
    }
    if (!lenh || !soIdChuoi) return;

    const thuMuc = path.resolve(__dirname, '..', 'backups');
    fs.mkdirSync(thuMuc, { recursive: true });
    const tenTep = `soopi-truoc-chuyen-id-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const duongDan = path.join(thuMuc, tenTep);
    fs.writeFileSync(duongDan, EJSON.stringify({ database: 'soopi', collections: duLieu }, null, 2, { relaxed: false }), { flag: 'wx' });
    console.log(`Đã sao lưu tại ${duongDan}`);
    try {
      await ghiDuLieu(db, daChuyen);
      await kiemTraSauGhi(db, daChuyen);
      console.log(`Đã chuyển ${soIdChuoi} ID chuỗi và các tham chiếu sang ObjectId.`);
    } catch (loi) {
      console.error('Chuyển đổi lỗi; đang khôi phục bản sao lưu.');
      await ghiDuLieu(db, duLieu);
      await kiemTraSauGhi(db, duLieu);
      throw loi;
    }
  } finally { await mongoose.disconnect(); }
};

main().catch((loi) => { console.error(loi); process.exitCode = 1; });
