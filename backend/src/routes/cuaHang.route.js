const express = require('express');
const controller = require('../controllers/cuaHang.controller');

const router = express.Router();
router.get('/', controller.layDanhSachCuaHangCongKhai);
router.get('/:id/danh-gia', controller.layDanhGiaCuaCuaHang);
router.get('/:id', controller.layCuaHangCongKhai);

module.exports = router;
