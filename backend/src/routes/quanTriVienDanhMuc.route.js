const express = require('express');
const controller = require('../controllers/danhMuc.controller');
const { batBuocDangNhap } = require('../middlewares/auth.middleware');
const { batBuocVaiTro } = require('../middlewares/role.middleware');
const { VAI_TRO } = require('../constants/vaiTro.constant');

const router = express.Router();
router.use(batBuocDangNhap, batBuocVaiTro(VAI_TRO.QUAN_TRI_VIEN));
router.get('/', controller.quanTriLayDanhSachDanhMuc);
router.post('/', controller.quanTriTaoDanhMuc);
router.patch('/:id', controller.quanTriSuaDanhMuc);
router.delete('/:id', controller.quanTriXoaDanhMuc);

module.exports = router;
