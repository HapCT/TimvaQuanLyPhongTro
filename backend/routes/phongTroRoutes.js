const express = require('express');
const router = express.Router();
const phongTroController = require('../controllers/phongTroController');
const { optionalAuth, requireRole } = require('../middleware/auth');

// --- Admin: chỉ xem hồ sơ & duyệt (khai báo TRƯỚC '/:id') ---
router.get('/admin/review', requireRole('QuanTri'), phongTroController.listForReview);
router.patch('/:id/duyet', requireRole('QuanTri'), phongTroController.review);
router.patch('/:id/trang-thai', phongTroController.updateStatus);
router.patch('/:id', phongTroController.updateStatus);

// --- Công khai: người thuê chỉ thấy bài đã duyệt; chủ trọ thấy thêm bài của mình ---
router.get('/', optionalAuth, phongTroController.getAll);
router.get('/:id', optionalAuth, phongTroController.getById);

// --- Chủ trọ: đăng / sửa / xóa bài của chính mình ---
router.post('/', requireRole('ChuTro'), phongTroController.create);
router.put('/:id', requireRole('ChuTro'), phongTroController.update);
router.delete('/:id', requireRole('ChuTro'), phongTroController.remove);

module.exports = router;