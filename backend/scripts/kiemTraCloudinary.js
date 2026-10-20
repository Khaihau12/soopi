const assert = require('node:assert/strict');
const mongoose = require('mongoose');
require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const BannerQuangCao = require('../src/models/bannerQuangCao.model');
const SanPham = require('../src/models/sanPham.model');
const { taiAnhLen, layPublicId, xoaAnhNeuKhongDung } = require('../src/services/anhCloudinary.service');
const { nguoiBanXoaSanPham } = require('../src/services/sanPham.service');
const { quanTriCapNhatBanner, quanTriXoaBanner } = require('../src/services/bannerQuangCao.service');

const uri = new URL(process.env.MONGODB_URI);
uri.pathname = `/soopi_cloudinary_test_${Date.now()}`;
const anhPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==', 'base64');

async function run() {
  if (!process.env.CLOUDINARY_API_SECRET) throw new Error('Chưa có cấu hình Cloudinary trong backend/.env');
  await mongoose.connect(uri.toString());
  let publicId;
  let publicIdMoi;
  try {
    const duongDan = await taiAnhLen(anhPng);
    publicId = layPublicId(duongDan);
    assert.ok(publicId, 'Ảnh mới phải có public ID thuộc thư mục soopi');
    const anhMoi = await taiAnhLen(anhPng);
    publicIdMoi = layPublicId(anhMoi);
    const a = await BannerQuangCao.create({ tieuDe: 'Ảnh dùng chung A', hinhAnh: duongDan });
    const cuaHangId = new mongoose.Types.ObjectId();
    const sanPham = await SanPham.create({ tenSanPham: 'Ảnh dùng chung', hinhAnh: [duongDan], giaGoc: 1000,
      soLuongTon: 1, cuaHangId, danhMucId: new mongoose.Types.ObjectId() });
    await xoaAnhNeuKhongDung(duongDan);
    assert.equal((await cloudinary.api.resource(publicId)).public_id, publicId);
    await quanTriCapNhatBanner(a._id, { hinhAnh: anhMoi });
    assert.equal((await cloudinary.api.resource(publicId)).public_id, publicId);
    await nguoiBanXoaSanPham(cuaHangId, sanPham._id);
    await assert.rejects(() => cloudinary.api.resource(publicId));
    await quanTriXoaBanner(a._id);
    await assert.rejects(() => cloudinary.api.resource(publicIdMoi));
    console.log('Cloudinary: tải ảnh, thay banner, giữ ảnh dùng chung và xóa khi sản phẩm/banner bỏ dùng.');
  } finally {
    for (const id of [publicId, publicIdMoi].filter(Boolean)) await cloudinary.uploader.destroy(id).catch(() => {});
  }
}

run().catch((loi) => { console.error('Lỗi kiểm tra Cloudinary:', loi?.message || loi); process.exitCode = 1; }).finally(async () => {
  if (mongoose.connection.readyState === 1) await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});
