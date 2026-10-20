const express = require('express');
const controller = require('../controllers/sanPham.controller');

const router = express.Router();
router.get('/', controller.layDanhSachSanPham);
router.get('/:id', controller.layChiTietSanPham);

module.exports = router;
