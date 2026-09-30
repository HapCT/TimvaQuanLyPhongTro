const express = require('express');
const router = express.Router();
const hoaDonController = require('../controllers/hoaDonController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/', requireAuth, hoaDonController.getAll);
router.post('/', requireRole('ChuTro', 'QuanTri'), hoaDonController.create);
router.post('/:id/thanh-toan', requireRole('NguoiThue'), hoaDonController.createPayment);
router.post('/:id/ghi-nhan', requireRole('ChuTro', 'QuanTri'), hoaDonController.recordPayment);
router.patch('/:id/thanh-toan/:paymentId', requireRole('ChuTro', 'QuanTri'), hoaDonController.updatePaymentStatus);

module.exports = router;
