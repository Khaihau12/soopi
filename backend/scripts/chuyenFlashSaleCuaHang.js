require('dotenv').config();

const fs = require('node:fs/promises');
const path = require('node:path');
const mongoose = require('mongoose');
const KhuyenMai = require('../src/models/khuyenMai.model');
const { LOAI_KHUYEN_MAI, PHAM_VI_KHUYEN_MAI } = require('../src/constants/trangThai.constant');

async function main() {
  if (!process.env.MONGODB_URI) throw new Error('Thiếu MONGODB_URI trong backend/.env');
  await mongoose.connect(process.env.MONGODB_URI);
  const dieuKien = { loaiKhuyenMai: LOAI_KHUYEN_MAI.FLASH_SALE, phamVi: PHAM_VI_KHUYEN_MAI.CUA_HANG };
  const chuongTrinh = await KhuyenMai.find(dieuKien).lean();
  if (!chuongTrinh.length) { console.log('Không có Flash Sale cửa hàng cũ cần chuyển đổi.'); return; }

  const thuMucBackup = path.join(__dirname, '..', 'backups');
  await fs.mkdir(thuMucBackup, { recursive: true });
  const tenBackup = `flash-sale-cua-hang-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  await fs.writeFile(path.join(thuMucBackup, tenBackup), JSON.stringify(chuongTrinh, null, 2), 'utf8');

  let daChuyen = 0;
  for (const item of chuongTrinh) {
    const tenKhuyenMai = item.tenKhuyenMai.replace(/^Flash Sale\b/i, 'Giảm giá');
    const ketQua = await KhuyenMai.updateOne({ _id: item._id, ...dieuKien },
      { $set: { loaiKhuyenMai: LOAI_KHUYEN_MAI.GIAM_GIA, tenKhuyenMai } });
    daChuyen += ketQua.modifiedCount;
  }
  console.log(`Đã chuyển ${daChuyen} Flash Sale cửa hàng thành chương trình giảm giá. Backup: backend/backups/${tenBackup}`);
}

main().catch((loi) => { console.error('Không thể chuyển Flash Sale cửa hàng:', loi.message); process.exitCode = 1; })
  .finally(async () => { if (mongoose.connection.readyState !== 0) await mongoose.disconnect(); });
