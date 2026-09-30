const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { uploadImage } = require('../controllers/uploadController');
const { requireRole } = require('../middleware/auth');

// Xử lý lỗi từ Multer (ví dụ sai tên field, file quá 10MB)
const handleMulterUpload = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error('LỖI MULTER:', err);
      return res.status(400).json({ error: `Lỗi upload file: ${err.message}` });
    }
    next();
  });
};

// Chỉ chủ trọ / quản trị được upload (tránh người lạ dùng quota Cloudinary)
router.post('/', requireRole('ChuTro', 'QuanTri'), handleMulterUpload, uploadImage);

module.exports = router;