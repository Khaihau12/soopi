const mongoose = require('mongoose');

const sanPhamYeuThichSchema = new mongoose.Schema({
  taiKhoanId: { type: mongoose.Schema.Types.ObjectId, ref: 'TaiKhoan', required: true },
  sanPhamId: { type: mongoose.Schema.Types.ObjectId, ref: 'SanPham', required: true },
  ngayLuu: { type: Date, default: Date.now },
}, { collection: 'SanPhamYeuThich' });

sanPhamYeuThichSchema.index({ taiKhoanId: 1, sanPhamId: 1 }, { unique: true });
sanPhamYeuThichSchema.index({ taiKhoanId: 1, ngayLuu: -1 });

module.exports = mongoose.model('SanPhamYeuThich', sanPhamYeuThichSchema);
