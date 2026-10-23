const express = require('express');
const controller = require('../controllers/cuocTroChuyen.controller');
const { batBuocDangNhap } = require('../middlewares/auth.middleware');
const { camQuanTriMuaSam } = require('../middlewares/role.middleware');

const router = express.Router();
router.use(batBuocDangNhap, camQuanTriMuaSam);
router.get('/', controller.layDanhSachCuocTroChuyenCuaToi);
router.post('/', controller.taoCuocTroChuyenVaGuiTinNhan);
router.get('/:id/tin-nhan', controller.layTinNhan);
router.post('/:id/tin-nhan', controller.guiTinNhan);
module.exports = router;
