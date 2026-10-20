const express = require('express');
const controller = require('../controllers/cuaHang.controller');
const { batBuocQuanTriVien } = require('../middlewares/role.middleware');

const router = express.Router();
router.use(...batBuocQuanTriVien);
router.get('/', controller.quanTriLayDanhSachCuaHang);
router.patch('/:id/trang-thai', controller.quanTriCapNhatTrangThaiCuaHang);
module.exports = router;
