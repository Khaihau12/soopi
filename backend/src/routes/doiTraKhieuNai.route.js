const express = require('express');
const controller = require('../controllers/doiTraKhieuNai.controller');
const { batBuocDangNhap } = require('../middlewares/auth.middleware');
const { camQuanTriMuaSam } = require('../middlewares/role.middleware');

const router = express.Router();
router.use(batBuocDangNhap, camQuanTriMuaSam);
router.get('/', controller.layDanhSachYeuCauCuaToi);
router.post('/', controller.guiYeuCauDoiTraKhieuNai);
router.get('/:id', controller.layChiTietYeuCauCuaToi);
module.exports = router;
