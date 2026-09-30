const express = require('express');
const router = express.Router();
const hopDongController = require('../controllers/hopDongController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/', requireAuth, hopDongController.getAll);
router.post('/', requireRole('ChuTro', 'QuanTri'), hopDongController.create);
router.patch('/:id/status', requireRole('ChuTro', 'QuanTri'), hopDongController.updateStatus);

module.exports = router;