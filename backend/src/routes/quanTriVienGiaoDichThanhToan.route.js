const express = require('express');
const controller = require('../controllers/giaoDichThanhToan.controller');
const { batBuocQuanTriVien } = require('../middlewares/role.middleware');
const router = express.Router();
router.use(...batBuocQuanTriVien);
router.get('/', controller.quanTriLayDanhSachGiaoDich);
router.get('/:id', controller.quanTriLayChiTietGiaoDich);
module.exports = router;
