require('dotenv').config();
const express = require('express');
const cors = require('cors');

const khuTroRoutes = require('./routes/khuTroRoutes');
const phongTroRoutes = require('./routes/phongTroRoutes');
const userRoutes = require('./routes/userRoutes');
const tienIchRoutes = require('./routes/tienIchRoutes');
const datPhongRoutes = require('./routes/datPhongRoutes');
const datLichRoutes = require('./routes/datLichRoutes');
const danhGiaRoutes = require('./routes/danhGiaRoutes');
const hoTroRoutes = require('./routes/hoTroRoutes');
const hopDongRoutes = require('./routes/hopDongRoutes');
const hoaDonRoutes = require('./routes/hoaDonRoutes');
const thongBaoRoutes = require('./routes/thongBaoRoutes');
const yeuThichRoutes = require('./routes/yeuThichRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const anhPhongRoutes = require('./routes/anhPhongRoutes');
const phongTienIchRoutes = require('./routes/phongTienIchRoutes');
const hoSoPhapLyRoutes = require('./routes/hoSoPhapLyRoutes');
const thanhToanRoutes = require('./routes/thanhToanRoutes');
const thanhToanHoaDonRoutes = require('./routes/thanhToanHoaDonRoutes');

const app = express();
const port = process.env.PORT || 3000;

// Middlewares cơ bản
app.use(cors());
app.use(express.json());

// Đăng ký các Routes
app.use('/api/khu-tro', khuTroRoutes);
app.use('/api/phong-tro', phongTroRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tien-ich', tienIchRoutes);
app.use('/api/dat-phong', datPhongRoutes);
app.use('/api/dat-lich', datLichRoutes);
app.use('/api/danh-gia', danhGiaRoutes);
app.use('/api/ho-tro', hoTroRoutes);
app.use('/api/hop-dong', hopDongRoutes);
app.use('/api/hoa-don', hoaDonRoutes);
app.use('/api/thong-bao', thongBaoRoutes);
app.use('/api/yeu-thich', yeuThichRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/anh-phong', anhPhongRoutes);
app.use('/api/phong-tien-ich', phongTienIchRoutes);
app.use('/api/ho-so-phap-ly', hoSoPhapLyRoutes);
app.use('/api/thanh-toan', thanhToanRoutes);
app.use('/api/thanh-toan-hoa-don', thanhToanHoaDonRoutes);

// Route mặc định kiểm tra health
app.get('/', (req, res) => {
  res.send('API Quản lý trọ đang hoạt động!');
});

// Khởi động server
app.listen(port, () => {
  console.log(`Backend Server chạy tại http://localhost:${port}`);
});