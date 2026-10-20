const express = require('express');
const controller = require('../controllers/giaoDichThanhToan.controller');
const { batBuocDangNhap } = require('../middlewares/auth.middleware');

const router = express.Router();
router.get('/vnpay/ket-qua', controller.xuLyKetQuaVnpay);
router.use(batBuocDangNhap);
router.post('/vnpay/tao-thanh-toan', controller.taoThanhToanVnpay);
router.get('/:id', controller.layChiTietGiaoDich);

module.exports = router;
