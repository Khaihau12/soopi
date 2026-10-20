const express = require('express');
const controller = require('../controllers/yeuCauDangKyNguoiBan.controller');
const { batBuocDangNhap } = require('../middlewares/auth.middleware');
const { batBuocVaiTro } = require('../middlewares/role.middleware');
const { VAI_TRO } = require('../constants/vaiTro.constant');

const router = express.Router();
router.use(batBuocDangNhap, batBuocVaiTro(VAI_TRO.QUAN_TRI_VIEN));
router.get('/', controller.quanTriLayDanhSachYeuCau);
router.get('/:id', controller.quanTriLayChiTietYeuCau);
router.patch('/:id/xet-duyet', controller.quanTriXetDuyetYeuCau);

module.exports = router;
