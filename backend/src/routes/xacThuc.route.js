const express = require('express');
const controller = require('../controllers/xacThuc.controller');
const { batBuocDangNhap } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/dang-ky', controller.dangKy);
router.post('/dang-nhap', controller.dangNhap);
router.post('/quen-mat-khau', controller.quenMatKhau);
router.post('/dat-lai-mat-khau', controller.datLaiMatKhau);
router.post('/dang-xuat', controller.dangXuat);
router.get('/toi', batBuocDangNhap, controller.layThongTinToi);

module.exports = router;
