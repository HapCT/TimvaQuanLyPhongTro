const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireRole, requireAuth } = require('../middleware/auth');

// Gọi ngay sau khi Firebase tạo tài khoản (đăng ký) để đồng bộ profile vào MySQL
router.post('/sync-profile', requireAuth, userController.syncProfile);
router.get('/me', requireAuth, userController.getMe);

// Quản lý tài khoản: chỉ Quản trị (chấp nhận cả QuanTri và Admin)
router.get('/', requireRole('QuanTri', 'Admin'), userController.getAll);
router.delete('/:id', requireRole('QuanTri', 'Admin'), userController.remove);
router.put('/:id/toggle-lock', requireRole('QuanTri', 'Admin'), userController.toggleLock);
router.put('/:id/role', requireRole('QuanTri', 'Admin'), userController.updateRole);

module.exports = router;