const express = require('express');
const controller = require('../controllers/sanPham.controller');
const { batBuocNguoiBan } = require('../middlewares/role.middleware');

const router = express.Router();
router.use(...batBuocNguoiBan);
router.get('/', controller.nguoiBanLayDanhSachSanPham);
router.post('/', controller.nguoiBanTaoSanPham);
router.get('/:id', controller.nguoiBanLayChiTietSanPham);
router.patch('/:id', controller.nguoiBanCapNhatSanPham);
router.patch('/:id/ton-kho', controller.nguoiBanCapNhatTonKho);
router.delete('/:id', controller.nguoiBanXoaSanPham);

module.exports = router;
