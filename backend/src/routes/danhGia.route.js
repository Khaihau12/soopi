const express = require('express');
const controller = require('../controllers/danhGia.controller');
const { batBuocDangNhap } = require('../middlewares/auth.middleware');

const router = express.Router();
router.get('/', controller.layDanhSachDanhGia);
router.get('/co-the-danh-gia', batBuocDangNhap, controller.layDongCoTheDanhGia);
router.post('/', batBuocDangNhap, controller.taoDanhGia);

module.exports = router;
