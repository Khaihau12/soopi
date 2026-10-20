const express = require('express');
const controller = require('../controllers/thongKe.controller');
const { batBuocQuanTriVien } = require('../middlewares/role.middleware');

const router = express.Router();
router.use(...batBuocQuanTriVien);
router.get('/tong-quan', controller.quanTriLayTongQuan);
router.get('/doanh-thu', controller.quanTriLayDoanhThu);
router.get('/san-pham-ban-chay', controller.quanTriLaySanPhamBanChay);
router.get('/danh-muc-quan-tam', controller.quanTriLayDanhMucQuanTam);
router.get('/hieu-suat-nguoi-ban', controller.quanTriLayHieuSuatNguoiBan);
module.exports = router;
