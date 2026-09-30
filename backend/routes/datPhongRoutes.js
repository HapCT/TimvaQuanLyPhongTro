const express = require('express');
const router = express.Router();
const datPhongController = require('../controllers/datPhongController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/', requireAuth, datPhongController.getAll);
router.post('/', requireRole('NguoiThue'), datPhongController.create);
router.put('/:id/status', requireRole('ChuTro', 'QuanTri'), datPhongController.updateStatus);

module.exports = router;
