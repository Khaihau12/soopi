const express = require('express');
const controller = require('../controllers/cuocTroChuyen.controller');
const { batBuocDangNhap } = require('../middlewares/auth.middleware');

const router = express.Router();
router.use(batBuocDangNhap);
router.get('/', controller.layDanhSachCuocTroChuyenCuaToi);
router.post('/', controller.taoCuocTroChuyenVaGuiTinNhan);
router.get('/:id/tin-nhan', controller.layTinNhan);
router.post('/:id/tin-nhan', controller.guiTinNhan);
module.exports = router;
