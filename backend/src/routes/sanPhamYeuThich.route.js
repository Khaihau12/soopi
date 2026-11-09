const express = require('express');
const controller = require('../controllers/sanPhamYeuThich.controller');
const { batBuocDangNhap } = require('../middlewares/auth.middleware');
const { camQuanTriMuaSam } = require('../middlewares/role.middleware');

const router = express.Router();
router.use(batBuocDangNhap, camQuanTriMuaSam);
router.get('/', controller.layDanhSach);
router.get('/ids', controller.layCacIdDaLuu);
router.get('/:id', controller.layTrangThai);
router.post('/:id', controller.luuSanPham);
router.delete('/:id', controller.boLuuSanPham);
module.exports = router;
