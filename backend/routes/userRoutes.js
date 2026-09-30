const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireRole, requireAuth } = require('../middleware/auth');

router.post('/sync-profile', requireAuth, userController.syncProfile);
router.get('/me', requireAuth, userController.getMe);
router.put('/me', requireAuth, userController.updateMe);

router.get('/', requireRole('QuanTri'), userController.getAll);
router.delete('/:id', requireRole('QuanTri'), userController.remove);
router.put('/:id/toggle-lock', requireRole('QuanTri'), userController.toggleLock);
router.put('/:id/role', requireRole('QuanTri'), userController.updateRole);

module.exports = router;