const express = require('express');
const router = express.Router();
const hoTroController = require('../controllers/hoTroController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.post('/', requireAuth, hoTroController.create);
router.get('/mine', requireAuth, hoTroController.getMine);
router.get('/admin', requireRole('QuanTri'), hoTroController.getForAdmin);
router.patch('/:id', requireRole('QuanTri'), hoTroController.update);

module.exports = router;