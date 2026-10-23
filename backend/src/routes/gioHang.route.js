const express = require('express');
const controller = require('../controllers/gioHang.controller');
const { batBuocDangNhap } = require('../middlewares/auth.middleware');
const { camQuanTriMuaSam } = require('../middlewares/role.middleware');

const router = express.Router();
router.use(batBuocDangNhap, camQuanTriMuaSam);
router.get('/', controller.layGioHang);
router.post('/chi-tiet', controller.themSanPhamVaoGio);
router.patch('/chi-tiet/:id', controller.capNhatSoLuongDongGio);
router.delete('/chi-tiet/:id', controller.xoaDongGio);
router.patch('/chon', controller.chonDongGio);

module.exports = router;
