const express = require('express');
const controller = require('../controllers/bannerQuangCao.controller');

const router = express.Router();
router.get('/', controller.layDanhSachBanner);

module.exports = router;
