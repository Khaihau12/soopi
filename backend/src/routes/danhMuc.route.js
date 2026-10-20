const express = require('express');
const controller = require('../controllers/danhMuc.controller');

const router = express.Router();
router.get('/', controller.layDanhSachDanhMuc);

module.exports = router;
