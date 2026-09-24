const cloudinary = require('../config/cloudinary');

const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      console.error('LỖI UPLOAD: req.file bị undefined.');
      return res.status(400).json({ error: 'Chưa chọn file hoặc sai định dạng gửi.' });
    }

    const folder = req.body.folder || 'phong-tro';

    console.log(`📸 Đang upload ảnh lên Cloudinary (Size: ${req.file.size} bytes, Mime: ${req.file.mimetype})...`);

    const uploadFromBuffer = () => new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'auto' },
        (error, result) => {
          if (error) {
            console.error('LỖI STREAM CLOUDINARY:', error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      stream.end(req.file.buffer);
    });

    const result = await uploadFromBuffer();
    console.log('✅ Upload Cloudinary thành công:', result.secure_url);
    res.json({ url: result.secure_url, public_id: result.public_id });
  } catch (error) {
    console.error('LỖI UPLOAD CONTROLLER:', error);
    const msg = error?.message || (typeof error === 'string' ? error : 'Upload ảnh thất bại.');
    res.status(500).json({ error: msg });
  }
};

module.exports = { uploadImage };