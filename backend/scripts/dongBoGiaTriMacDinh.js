require('dotenv').config();

const mongoose = require('mongoose');
const TaiKhoan = require('../src/models/taiKhoan.model');
const Voucher = require('../src/models/voucher.model');

const canBoSung = { $exists: false };

const main = async () => {
  if (!process.env.MONGODB_URI) throw new Error('Thiếu MONGODB_URI');
  await mongoose.connect(process.env.MONGODB_URI);

  const [taiKhoan, voucher] = await Promise.all([
    TaiKhoan.collection.countDocuments({ phienBanToken: canBoSung }),
    Voucher.collection.countDocuments({ danhMucId: canBoSung }),
  ]);
  console.log(`Cần bổ sung: ${taiKhoan} tài khoản thiếu phiên bản token; ${voucher} voucher thiếu phạm vi danh mục.`);
  if (!process.argv.includes('--apply')) {
    console.log('Chỉ kiểm tra. Chạy lại với --apply để bổ sung giá trị mặc định.');
    return;
  }

  const [ketQuaTaiKhoan, ketQuaVoucher] = await Promise.all([
    TaiKhoan.collection.updateMany({ phienBanToken: canBoSung }, { $set: { phienBanToken: 0 } }),
    Voucher.collection.updateMany({ danhMucId: canBoSung }, { $set: { danhMucId: null } }),
  ]);
  console.log(`Đã bổ sung: ${ketQuaTaiKhoan.modifiedCount} tài khoản; ${ketQuaVoucher.modifiedCount} voucher.`);
};

main().catch((loi) => { console.error('Không thể đồng bộ dữ liệu:', loi.message); process.exitCode = 1; })
  .finally(async () => { if (mongoose.connection.readyState !== 0) await mongoose.disconnect(); });
