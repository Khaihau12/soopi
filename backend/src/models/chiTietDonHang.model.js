const mongoose = require('mongoose');
const { laSoNguyen } = require('../utils/kiemTra');
const { LOAI_YEU_CAU, TRANG_THAI_XU_LY_YEU_CAU, KET_QUA_XU_LY } = require('../constants/trangThai.constant');
const { DO_DAI_TOI_DA } = require('../constants/cauHinh.constant');

const yeuCauDoiTraSchema = new mongoose.Schema({
  loaiYeuCau: { type: String, enum: Object.values(LOAI_YEU_CAU), required: true },
  noiDung: { type: String, required: true, trim: true, maxlength: DO_DAI_TOI_DA.NOI_DUNG },
  ngayTao: { type: Date, default: Date.now },
  trangThaiXuLy: { type: String, enum: Object.values(TRANG_THAI_XU_LY_YEU_CAU), default: TRANG_THAI_XU_LY_YEU_CAU.CHO_XU_LY },
  ketQuaXuLy: { type: String, enum: Object.values(KET_QUA_XU_LY) },
});

const chiTietDonHangSchema = new mongoose.Schema({
  soLuong: { type: Number, required: true, min: 1, validate: { validator: laSoNguyen, message: 'Số lượng phải là số nguyên' } },
  giaGocTaiThoiDiemDat: { type: Number, required: true, min: 0, validate: { validator: laSoNguyen, message: 'Giá gốc phải là số nguyên' } },
  giaBanThucTe: { type: Number, required: true, min: 0, validate: { validator: laSoNguyen, message: 'Giá bán phải là số nguyên' } },
  thanhTien: { type: Number, required: true, min: 0, validate: { validator: laSoNguyen, message: 'Thành tiền phải là số nguyên' } },
  donHangId: { type: mongoose.Schema.Types.ObjectId, ref: 'DonHang', required: true },
  sanPhamId: { type: mongoose.Schema.Types.ObjectId, ref: 'SanPham', required: true },
  yeuCauDoiTra: yeuCauDoiTraSchema,
}, { collection: 'ChiTietDonHang' });

chiTietDonHangSchema.index({ donHangId: 1 });
chiTietDonHangSchema.index({ sanPhamId: 1 });
chiTietDonHangSchema.index({ 'yeuCauDoiTra._id': 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('ChiTietDonHang', chiTietDonHangSchema);
