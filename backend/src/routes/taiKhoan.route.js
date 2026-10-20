const express = require('express');
const controller = require('../controllers/taiKhoan.controller');
const { batBuocDangNhap } = require('../middlewares/auth.middleware');

const router = express.Router();
router.use(batBuocDangNhap);
router.get('/ho-so', controller.layHoSo);
router.patch('/ho-so', controller.capNhatHoSo);
router.patch('/doi-mat-khau', controller.doiMatKhau);

module.exports = router;
