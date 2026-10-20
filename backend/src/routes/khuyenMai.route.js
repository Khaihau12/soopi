const express = require('express');
const controller = require('../controllers/khuyenMai.controller');
const router = express.Router();
router.get('/', controller.layDanhSachKhuyenMaiDangDienRa);
module.exports = router;
