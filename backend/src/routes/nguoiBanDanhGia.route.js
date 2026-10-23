const express = require('express');
const controller = require('../controllers/danhGia.controller');
const { batBuocNguoiBan } = require('../middlewares/role.middleware');

const router = express.Router();
router.use(...batBuocNguoiBan);
router.get('/san-pham', controller.nguoiBanLayDanhSachSanPhamDanhGia);
router.get('/', controller.nguoiBanLayDanhSachDanhGia);

module.exports = router;
