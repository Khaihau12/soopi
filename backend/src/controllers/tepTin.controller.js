const { taoLoi } = require('../utils/taoLoi');
const anhCloudinary = require('../services/anhCloudinary.service');

const chuKyAnhHopLe = (duLieu, loai) => {
  if (loai === 'image/jpeg') return duLieu[0] === 0xff && duLieu[1] === 0xd8 && duLieu[2] === 0xff;
  if (loai === 'image/png') return duLieu.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (loai === 'image/webp') return duLieu.toString('ascii', 0, 4) === 'RIFF' && duLieu.toString('ascii', 8, 12) === 'WEBP';
  return false;
};

const taiAnhLen = async (req, res, next) => {
  try {
    if (!req.file) throw taoLoi(400, 'Vui lòng chọn ảnh JPG, PNG hoặc WEBP');
    if (!chuKyAnhHopLe(req.file.buffer, req.file.mimetype)) {
      throw taoLoi(400, 'Tệp tải lên không phải ảnh JPG, PNG hoặc WEBP hợp lệ');
    }
    const duongDan = await anhCloudinary.taiAnhLen(req.file.buffer);
    res.status(201).json({ success: true, message: 'Tải ảnh thành công', data: { duongDan } });
  } catch (loi) { next(loi); }
};

module.exports = { taiAnhLen };
