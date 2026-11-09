require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');
const KhuyenMai = require('../src/models/khuyenMai.model');
const ChiTietKhuyenMai = require('../src/models/chiTietKhuyenMai.model');
const { PHAM_VI_KHUYEN_MAI } = require('../src/constants/trangThai.constant');

async function main() {
  if (!process.env.MONGODB_URI) throw new Error('Thiếu MONGODB_URI.');
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    const chuongTrinh = await KhuyenMai.find({ phamVi: PHAM_VI_KHUYEN_MAI.TOAN_SAN }).lean();
    if (!chuongTrinh.length) {
      console.log('Không có khuyến mãi Toàn sàn cần xóa.');
      return;
    }
    const ids = chuongTrinh.map((item) => item._id);
    const chiTiet = await ChiTietKhuyenMai.find({ khuyenMaiId: { $in: ids } }).lean();
    const thuMuc = path.join(__dirname, '../backups');
    fs.mkdirSync(thuMuc, { recursive: true });
    const tep = path.join(thuMuc, `khuyen-mai-toan-san-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    fs.writeFileSync(tep, JSON.stringify({ chuongTrinh, chiTiet }, null, 2), { encoding: 'utf8', flag: 'wx' });
    await ChiTietKhuyenMai.deleteMany({ khuyenMaiId: { $in: ids } });
    const ketQua = await KhuyenMai.deleteMany({ _id: { $in: ids }, phamVi: PHAM_VI_KHUYEN_MAI.TOAN_SAN });
    console.log(`Đã sao lưu ${chuongTrinh.length} chương trình và ${chiTiet.length} dòng sản phẩm vào ${tep}.`);
    console.log(`Đã xóa ${ketQua.deletedCount} chương trình Toàn sàn.`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((loi) => { console.error(loi); process.exitCode = 1; });
