const express = require('express');
const controller = require('../controllers/thongKe.controller');
const { batBuocNguoiBan } = require('../middlewares/role.middleware');

const router = express.Router();
router.use(...batBuocNguoiBan);
router.get('/tong-quan', controller.nguoiBanLayTongQuan);
router.get('/doanh-thu', controller.nguoiBanLayDoanhThu);
router.get('/san-pham-ban-chay', controller.nguoiBanLaySanPhamBanChay);
router.get('/lich-su-giao-dich', controller.nguoiBanLayLichSuGiaoDich);
module.exports = router;
