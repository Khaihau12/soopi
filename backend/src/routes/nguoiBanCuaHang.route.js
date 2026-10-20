const express = require('express');
const controller = require('../controllers/cuaHang.controller');
const { batBuocNguoiBan } = require('../middlewares/role.middleware');

const router = express.Router();
router.use(...batBuocNguoiBan);
router.get('/', controller.nguoiBanLayCuaHang);
router.patch('/', controller.nguoiBanCapNhatCuaHang);

module.exports = router;
