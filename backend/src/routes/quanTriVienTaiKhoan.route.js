const express = require('express');
const controller = require('../controllers/taiKhoan.controller');
const { batBuocQuanTriVien } = require('../middlewares/role.middleware');

const router = express.Router();
router.use(...batBuocQuanTriVien);
router.get('/', controller.quanTriLayDanhSachTaiKhoan);
router.get('/:id', controller.quanTriLayChiTietTaiKhoan);
router.patch('/:id/trang-thai', controller.quanTriCapNhatTrangThaiTaiKhoan);
router.patch('/:id/mat-khau', controller.quanTriDatLaiMatKhau);
module.exports = router;
