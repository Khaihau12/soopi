require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');
const SanPham = require('../src/models/sanPham.model');
const BannerQuangCao = require('../src/models/bannerQuangCao.model');
const DanhMuc = require('../src/models/danhMuc.model');
const CuaHang = require('../src/models/cuaHang.model');

const duongDanDuLieu = path.join(__dirname, '../data/anhMau.json');
const laAnhMauCu = (url) => typeof url === 'string' && url.startsWith('/anh-demo/');
const laAnhDaDung = (url) => typeof url === 'string' && /^https?:\/\//.test(url);


const timBanGhi = async (item) => {
  const Model = item.loai === 'banner' ? BannerQuangCao : SanPham;
  const tenTruong = item.loai === 'banner' ? 'tieuDe' : 'tenSanPham';
  const theoId = await Model.findById(item.id).lean();
  if (theoId?.[tenTruong] === item.ten) return theoId;
  if (item.loai === 'banner') return Model.findOne({ tieuDe: item.ten }).lean();
  const cuaHang = await CuaHang.findOne({ tenCuaHang: item.tenCuaHang }, '_id').lean();
  return cuaHang ? Model.findOne({ tenSanPham: item.ten, cuaHangId: cuaHang._id }).lean() : null;
};

const layDanhMucDich = async (item) => {
  const theoId = await DanhMuc.findById(item.danhMucId, '_id tenDanhMuc').lean();
  if (theoId?.tenDanhMuc === item.tenDanhMuc) return theoId._id;
  const theoTen = await DanhMuc.findOne({ tenDanhMuc: item.tenDanhMuc }, '_id').lean();
  if (!theoTen) throw new Error(`Danh mục đích của banner ${item.ten} không tồn tại.`);
  return theoTen._id;
};

async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('Chỉ bổ sung ảnh mẫu ở môi trường phát triển.');
  if (!process.env.MONGODB_URI) throw new Error('Thiếu MONGODB_URI.');
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error('Thiếu cấu hình Cloudinary trong backend/.env.');
  }
  const danhSach = JSON.parse(fs.readFileSync(duongDanDuLieu, 'utf8'));
  await mongoose.connect(process.env.MONGODB_URI);
  let daGan = 0;
  let daBoQua = 0;
  try {
    for (const item of danhSach) {
      const Model = item.loai === 'banner' ? BannerQuangCao : SanPham;
      const banGhi = await timBanGhi(item);
      if (!banGhi) {
        console.log(`Bỏ qua ${item.ten}: không tìm thấy đúng bản ghi mẫu.`);
        daBoQua += 1;
        continue;
      }
      const anhCu = item.loai === 'banner' ? [banGhi.hinhAnh] : banGhi.hinhAnh || [];
      if (anhCu.some(laAnhDaDung) || anhCu.some((url) => url && !laAnhMauCu(url))) {
        daBoQua += 1;
        continue;
      }
      const danhMucDich = item.loai === 'banner' ? await layDanhMucDich(item) : null;
      const url = item.url;
      if (!url?.startsWith('https://res.cloudinary.com/')) {
        throw new Error(`Thiếu URL Cloudinary cho ảnh mẫu ${item.ten}.`);
      }
      const kiemTra = await fetch(url, { method: 'HEAD' });
      if (!kiemTra.ok || !kiemTra.headers.get('content-type')?.startsWith('image/')) {
        throw new Error(`Ảnh Cloudinary của ${item.ten} không truy cập được.`);
      }
      const capNhat = item.loai === 'banner'
        ? { hinhAnh: url, danhMucId: danhMucDich, noiDung: item.noiDung }
        : { hinhAnh: [url] };
      const ketQua = await Model.updateOne({ _id: banGhi._id, hinhAnh: banGhi.hinhAnh }, { $set: capNhat });
      if (ketQua.modifiedCount !== 1) {
        throw new Error(`Ảnh của ${item.ten} đã thay đổi trong lúc bổ sung, dừng để tránh ghi đè.`);
      }
      daGan += 1;
      console.log(`Đã gắn ảnh: ${item.ten}`);
    }
  } finally {
    await mongoose.disconnect();
  }
  console.log(`Hoàn tất: ${daGan} ảnh mới, bỏ qua ${daBoQua} bản ghi đã có ảnh hoặc không tìm thấy.`);
}

main().catch((loi) => { console.error(loi.message); process.exitCode = 1; });
