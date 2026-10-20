const express = require('express');
const controller = require('../controllers/donHang.controller');
const { batBuocNguoiBan } = require('../middlewares/role.middleware');

const router = express.Router();
router.use(...batBuocNguoiBan);
router.get('/', controller.nguoiBanLayDanhSachDonHang);
router.get('/:id', controller.nguoiBanLayChiTietDonHang);

module.exports = router;
