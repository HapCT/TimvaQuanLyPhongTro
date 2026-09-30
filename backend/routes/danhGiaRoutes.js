const express = require('express');
const router = express.Router();
const danhGiaController = require('../controllers/danhGiaController');
const { requireRole } = require('../middleware/auth');

router.get('/admin', requireRole('QuanTri'), danhGiaController.getForAdmin);
router.patch('/:id/status', requireRole('QuanTri'), danhGiaController.updateStatus);
router.get('/mine', requireRole('NguoiThue'), danhGiaController.getMine);
router.delete('/:id', requireRole('NguoiThue'), danhGiaController.removeMine);
router.get('/phong/:id', danhGiaController.getForRoom);
router.post('/', requireRole('NguoiThue'), danhGiaController.create);

module.exports = router;