const express = require('express');
const controller = require('../controllers/donHang.controller');
const { batBuocDangNhap } = require('../middlewares/auth.middleware');
const { batBuocVaiTro, batBuocCuaHang, camQuanTriMuaSam } = require('../middlewares/role.middleware');
const { VAI_TRO } = require('../constants/vaiTro.constant');

const router = express.Router();
router.use(batBuocDangNhap, camQuanTriMuaSam);
router.post('/xem-truoc', controller.xemTruocDonHang);
router.post('/', controller.datHang);
router.get('/', controller.layDanhSachDonHangCuaToi);
router.patch('/:id/huy', controller.huyDonHangCuaToi);
router.patch('/:id/trang-thai', batBuocVaiTro(VAI_TRO.NGUOI_BAN), batBuocCuaHang, controller.capNhatTrangThaiXuLyDonHang);
router.get('/:id', controller.layChiTietDonHangCuaToi);

module.exports = router;
