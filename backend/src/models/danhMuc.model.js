const mongoose = require('mongoose');
const { DO_DAI_TOI_DA } = require('../constants/cauHinh.constant');

const danhMucSchema = new mongoose.Schema({
  tenDanhMuc: { type: String, required: true, trim: true, maxlength: DO_DAI_TOI_DA.TEN_DANH_MUC },
}, { collection: 'DanhMuc' });

module.exports = mongoose.model('DanhMuc', danhMucSchema);
