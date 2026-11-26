const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  if (!process.env.MONGODB_URI) throw new Error('Thiếu MONGODB_URI');
  await mongoose.connect(process.env.MONGODB_URI);
  if (mongoose.connection.db.databaseName !== 'soopi') throw new Error('Chỉ được chuẩn hóa database soopi');

  const collection = mongoose.connection.db.collection('ChiTietDonHang');
  const dieuKien = { 'yeuCauDoiTra._id': { $exists: true }, 'yeuCauDoiTra.loaiYeuCau': { $ne: 'Đổi trả' } };
  const cacDong = await collection.find(dieuKien).toArray();
  if (!cacDong.length) { console.log('Không có yêu cầu đổi trả cần chuẩn hóa.'); return; }
  if (cacDong.some((dong) => dong.yeuCauDoiTra.loaiYeuCau !== 'Khiếu nại')) {
    throw new Error('Có loại yêu cầu không nhận diện được; chưa thay đổi dữ liệu');
  }
  console.log(`Có ${cacDong.length} yêu cầu cũ cần chuẩn hóa.`);
  if (!process.argv.includes('--apply')) { console.log('Chạy với --apply để sao lưu và cập nhật.'); return; }

  const thuMucSaoLuu = path.join(__dirname, '..', 'backups');
  fs.mkdirSync(thuMucSaoLuu, { recursive: true });
  const duongDanSaoLuu = path.join(thuMucSaoLuu, `yeu-cau-doi-tra-${Date.now()}.json`);
  fs.writeFileSync(duongDanSaoLuu, mongoose.mongo.BSON.EJSON.stringify(cacDong, null, 2), { flag: 'wx' });

  const ketQua = await collection.updateMany(dieuKien, { $set: { 'yeuCauDoiTra.loaiYeuCau': 'Đổi trả' } });
  const sauCapNhat = await collection.find({ _id: { $in: cacDong.map((dong) => dong._id) } }).toArray();
  const theoId = new Map(sauCapNhat.map((dong) => [String(dong._id), dong]));
  for (const dong of cacDong) {
    const sau = theoId.get(String(dong._id));
    if (!sau) throw new Error('Thiếu dòng đơn hàng sau cập nhật');
    const mongDoi = { ...dong, yeuCauDoiTra: { ...dong.yeuCauDoiTra, loaiYeuCau: 'Đổi trả' } };
    if (mongoose.mongo.BSON.EJSON.stringify(sau) !== mongoose.mongo.BSON.EJSON.stringify(mongDoi)) {
      throw new Error('Dữ liệu sau cập nhật không khớp bản sao lưu');
    }
  }
  console.log(`Đã chuẩn hóa ${ketQua.modifiedCount} yêu cầu; bản sao lưu: ${duongDanSaoLuu}`);
}

run().catch((loi) => { console.error(loi.message); process.exitCode = 1; })
  .finally(async () => { if (mongoose.connection.readyState) await mongoose.disconnect(); });
