const express = require('express');
const controller = require('../controllers/voucher.controller');
const router = express.Router();
router.get('/', controller.layDanhSachVoucherDangDung);
module.exports = router;
