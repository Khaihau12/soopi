const express = require('express');
const controller = require('../controllers/yeuCauDangKyNguoiBan.controller');
const { batBuocDangNhap } = require('../middlewares/auth.middleware');

const router = express.Router();
router.use(batBuocDangNhap);
router.post('/', controller.guiYeuCauDangKyNguoiBan);
router.get('/cua-toi', controller.layYeuCauCuaToi);

module.exports = router;
