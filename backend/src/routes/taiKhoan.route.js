const express = require('express');
const controller = require('../controllers/taiKhoan.controller');
const { batBuocDangNhap } = require('../middlewares/auth.middleware');
const { camQuanTriMuaSam } = require('../middlewares/role.middleware');

const router = express.Router();
router.use(batBuocDangNhap);
router.get('/ho-so', controller.layHoSo);
router.patch('/ho-so', controller.capNhatHoSo);
router.get('/so-dia-chi', camQuanTriMuaSam, controller.laySoDiaChi);
router.post('/so-dia-chi', camQuanTriMuaSam, controller.themDiaChi);
router.patch('/so-dia-chi/:id', camQuanTriMuaSam, controller.suaDiaChi);
router.patch('/so-dia-chi/:id/mac-dinh', camQuanTriMuaSam, controller.datDiaChiMacDinh);
router.delete('/so-dia-chi/:id', camQuanTriMuaSam, controller.xoaDiaChi);
router.get('/san-pham-da-xem', camQuanTriMuaSam, controller.laySanPhamDaXem);
router.post('/san-pham-da-xem/:id', camQuanTriMuaSam, controller.ghiNhanSanPhamDaXem);
router.patch('/doi-mat-khau', controller.doiMatKhau);

module.exports = router;
