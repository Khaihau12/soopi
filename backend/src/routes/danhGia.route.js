const express = require('express');
const controller = require('../controllers/danhGia.controller');
const { batBuocDangNhap } = require('../middlewares/auth.middleware');
const { camQuanTriMuaSam } = require('../middlewares/role.middleware');

const router = express.Router();
router.get('/', controller.layDanhSachDanhGia);
router.get('/co-the-danh-gia', batBuocDangNhap, camQuanTriMuaSam, controller.layDongCoTheDanhGia);
router.post('/', batBuocDangNhap, camQuanTriMuaSam, controller.taoDanhGia);

module.exports = router;
