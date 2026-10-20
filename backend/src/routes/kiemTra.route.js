const express = require('express');
const kiemTraController = require('../controllers/kiemTra.controller');

const router = express.Router();

router.get('/', kiemTraController.kiemTraHeThong);

module.exports = router;
