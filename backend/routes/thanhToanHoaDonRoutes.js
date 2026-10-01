const express = require('express');
const router = express.Router();
const thanhToanHoaDonController = require('../controllers/thanhToanHoaDonController');

router.get('/', thanhToanHoaDonController.getAll);
router.get('/hoa-don/:id', thanhToanHoaDonController.getByHoaDon);
router.post('/', thanhToanHoaDonController.create);

module.exports = router;
