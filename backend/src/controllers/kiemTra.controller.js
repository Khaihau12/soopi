const kiemTraService = require('../services/kiemTra.service');

const kiemTraHeThong = (req, res, next) => {
  try {
    const data = kiemTraService.layTrangThaiHeThong();
    res.json({ success: true, message: 'Soopi API đang hoạt động', data });
  } catch (loi) {
    next(loi);
  }
};

module.exports = { kiemTraHeThong };
