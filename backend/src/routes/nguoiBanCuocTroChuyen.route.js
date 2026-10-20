const express = require('express');
const controller = require('../controllers/cuocTroChuyen.controller');
const { batBuocNguoiBan } = require('../middlewares/role.middleware');

const router = express.Router();
router.use(...batBuocNguoiBan);
router.get('/', controller.nguoiBanLayDanhSachCuocTroChuyen);
module.exports = router;
