const express = require('express');
const { batBuocDangNhap } = require('../middlewares/auth.middleware');
const { batBuocVaiTro } = require('../middlewares/role.middleware');
const { taiAnhLen } = require('../middlewares/upload.middleware');
const { VAI_TRO } = require('../constants/vaiTro.constant');
const controller = require('../controllers/tepTin.controller');

const router = express.Router();
router.use(batBuocDangNhap, batBuocVaiTro(VAI_TRO.NGUOI_BAN, VAI_TRO.QUAN_TRI_VIEN));
router.post('/hinh-anh', taiAnhLen, controller.taiAnhLen);

module.exports = router;
