const mongoose = require('mongoose');
const { DO_DAI_TOI_DA } = require('../constants/cauHinh.constant');

const tinNhanSchema = new mongoose.Schema({
  noiDung: { type: String, required: true, trim: true, maxlength: DO_DAI_TOI_DA.NOI_DUNG },
  thoiGianGui: { type: Date, default: Date.now },
  cuocTroChuyenId: { type: mongoose.Schema.Types.ObjectId, ref: 'CuocTroChuyen', required: true },
  nguoiGuiId: { type: mongoose.Schema.Types.ObjectId, ref: 'TaiKhoan', required: true },
}, { collection: 'TinNhan' });

tinNhanSchema.index({ cuocTroChuyenId: 1, thoiGianGui: 1 });

module.exports = mongoose.model('TinNhan', tinNhanSchema);
