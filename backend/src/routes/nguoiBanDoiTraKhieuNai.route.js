const express = require('express');
const controller = require('../controllers/doiTraKhieuNai.controller');
const { batBuocNguoiBan } = require('../middlewares/role.middleware');

const router = express.Router();
router.use(...batBuocNguoiBan);
router.get('/', controller.nguoiBanLayDanhSachYeuCau);
router.get('/:id', controller.nguoiBanLayChiTietYeuCau);
router.patch('/:id/xu-ly', controller.nguoiBanXuLyYeuCau);
module.exports = router;
