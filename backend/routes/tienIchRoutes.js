const express = require('express');
const router = express.Router();
const tienIchController = require('../controllers/tienIchController');
const { requireRole } = require('../middleware/auth');

// Công khai: ai cũng xem được danh mục tiện ích
router.get('/', tienIchController.getAll);

// Chủ trọ & Admin: được thêm tiện ích mới
router.post('/', requireRole('ChuTro', 'QuanTri'), tienIchController.create);

// Chỉ Admin: sửa / xóa danh mục dùng chung
router.put('/:id', requireRole('QuanTri'), tienIchController.update);
router.delete('/:id', requireRole('QuanTri'), tienIchController.remove);

module.exports = router;
