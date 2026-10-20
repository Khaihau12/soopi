const express = require('express');
const controller = require('../controllers/doiTraKhieuNai.controller');
const { batBuocDangNhap } = require('../middlewares/auth.middleware');

const router = express.Router();
router.use(batBuocDangNhap);
router.get('/', controller.layDanhSachYeuCauCuaToi);
router.post('/', controller.guiYeuCauDoiTraKhieuNai);
router.get('/:id', controller.layChiTietYeuCauCuaToi);
module.exports = router;
