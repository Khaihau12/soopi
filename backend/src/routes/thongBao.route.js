const express = require('express');
const controller = require('../controllers/thongBao.controller');
const { batBuocDangNhap } = require('../middlewares/auth.middleware');

const router = express.Router();
router.use(batBuocDangNhap);
router.get('/chua-doc', controller.demChuaDoc);
router.get('/', controller.layDanhSach);
router.patch('/da-doc', controller.danhDauTatCaDaDoc);
router.patch('/:id/da-doc', controller.danhDauDaDoc);
module.exports = router;
