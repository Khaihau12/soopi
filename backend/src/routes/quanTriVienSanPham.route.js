const express = require('express');
const controller = require('../controllers/sanPham.controller');
const { batBuocQuanTriVien } = require('../middlewares/role.middleware');
const router = express.Router();
router.use(...batBuocQuanTriVien);
router.get('/', controller.quanTriLayDanhSachSanPham);
router.get('/:id', controller.quanTriLayChiTietSanPham);
router.patch('/:id/trang-thai', controller.quanTriCapNhatTrangThaiSanPham);
module.exports = router;
