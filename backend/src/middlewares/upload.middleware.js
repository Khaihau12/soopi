const path = require('node:path');
const multer = require('multer');
const { ANH } = require('../constants/cauHinh.constant');
const { taoLoi } = require('../utils/taoLoi');

const duoiTheoLoai = { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] };

const luuAnh = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, done) => {
    const cacDuoi = duoiTheoLoai[file.mimetype];
    if (!cacDuoi || !cacDuoi.includes(path.extname(file.originalname).toLowerCase())) {
      return done(taoLoi(400, 'Chỉ nhận ảnh JPG, PNG, WEBP'));
    }
    done(null, true);
  },
  limits: { fileSize: ANH.DUNG_LUONG_TOI_DA_MB * 1024 * 1024, files: 1 },
}).single('hinhAnh');

const taiAnhLen = (req, res, next) => luuAnh(req, res, (loi) => {
  if (!loi) return next();
  if (loi.code === 'LIMIT_FILE_SIZE') return next(taoLoi(400, `Ảnh vượt quá ${ANH.DUNG_LUONG_TOI_DA_MB} MB`));
  if (loi instanceof multer.MulterError) return next(taoLoi(400, 'Chỉ tải lên một ảnh trong trường hinhAnh'));
  next(loi);
});

module.exports = { taiAnhLen };
