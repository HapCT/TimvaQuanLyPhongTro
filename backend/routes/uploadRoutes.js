const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { uploadImage } = require('../controllers/uploadController');

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

router.post('/', handleMulterUpload, uploadImage);

module.exports = router;