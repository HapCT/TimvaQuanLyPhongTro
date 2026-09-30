const express = require('express');
const router = express.Router();
const datLichController = require('../controllers/datLichController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/', requireAuth, datLichController.getAll);
router.post('/', requireRole('NguoiThue'), datLichController.create);
router.put('/:id/status', requireRole('NguoiThue', 'ChuTro', 'QuanTri'), datLichController.updateStatus);
router.put('/:id/reschedule', requireRole('NguoiThue', 'ChuTro', 'QuanTri'), datLichController.reschedule);

module.exports = router;
