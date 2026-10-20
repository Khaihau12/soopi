const crypto = require('node:crypto');
const cloudinary = require('cloudinary').v2;
const SanPham = require('../models/sanPham.model');
const BannerQuangCao = require('../models/bannerQuangCao.model');
const { taoLoi } = require('../utils/taoLoi');

const daCauHinh = () => Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
const cauHinh = () => {
  if (!daCauHinh()) throw taoLoi(503, 'Chưa cấu hình Cloudinary để tải ảnh');
  cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET, secure: true });
};

const layPublicId = (duongDan) => {
  if (!daCauHinh() || typeof duongDan !== 'string') return null;
  const khop = /^https:\/\/res\.cloudinary\.com\/([^/]+)\/image\/upload\/v\d+\/(soopi\/[a-f0-9-]{36})\.(?:jpg|jpeg|png|webp)$/.exec(duongDan);
  return khop && khop[1] === process.env.CLOUDINARY_CLOUD_NAME ? khop[2] : null;
};

const taiAnhLen = (buffer) => {
  cauHinh();
  return new Promise((resolve, reject) => {
    const luong = cloudinary.uploader.upload_stream({ public_id: `soopi/${crypto.randomUUID()}`,
      resource_type: 'image', overwrite: false }, (loi, ketQua) => {
      if (loi || !ketQua?.secure_url) return reject(taoLoi(502, 'Không thể tải ảnh lên Cloudinary. Vui lòng thử lại.'));
      resolve(ketQua.secure_url);
    });
    luong.end(buffer);
  });
};

const conDuocSuDung = async (duongDan) => Boolean((await SanPham.exists({ hinhAnh: duongDan }))
  || (await BannerQuangCao.exists({ hinhAnh: duongDan })));

const xoaAnhNeuKhongDung = async (duongDan) => {
  const publicId = layPublicId(duongDan);
  if (!publicId || await conDuocSuDung(duongDan)) return;
  cauHinh();
  const ketQua = await cloudinary.uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
  if (!['ok', 'not found'].includes(ketQua?.result)) throw new Error('Cloudinary chưa xóa ảnh không còn dùng');
};

const donAnhCu = async (cacAnhCu, cacAnhMoi = []) => {
  for (const duongDan of new Set(cacAnhCu || [])) {
    if (cacAnhMoi.includes(duongDan)) continue;
    try { await xoaAnhNeuKhongDung(duongDan); }
    catch (loi) { console.error('Không thể xóa ảnh cũ trên Cloudinary:', loi.message); }
  }
};

// Ảnh tải lên nhưng bỏ dở biểu mẫu được quét lại sau 24 giờ; lỗi xóa sẽ được thử lại ở lần quét sau.
const quetAnhKhongDung = async () => {
  if (!daCauHinh()) return;
  cauHinh();
  let cursor;
  const quaHan = Date.now() - 24 * 60 * 60 * 1000;
  do {
    const ketQua = await cloudinary.api.resources({ resource_type: 'image', type: 'upload', prefix: 'soopi/',
      max_results: 500, ...(cursor ? { next_cursor: cursor } : {}) });
    for (const anh of ketQua.resources || []) {
      const taoLuc = Date.parse(anh.created_at);
      if (!/^soopi\/[a-f0-9-]{36}$/.test(anh.public_id) || !Number.isFinite(taoLuc) || taoLuc > quaHan) continue;
      try { await xoaAnhNeuKhongDung(anh.secure_url); }
      catch (loi) { console.error('Không thể dọn ảnh Cloudinary:', loi.message); }
    }
    cursor = ketQua.next_cursor;
  } while (cursor);
};

module.exports = { taiAnhLen, layPublicId, xoaAnhNeuKhongDung, donAnhCu, quetAnhKhongDung };
