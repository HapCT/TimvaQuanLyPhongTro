require('dotenv').config();
const express = require('express');
const cors = require('cors');

const khuTroRoutes = require('./routes/khuTroRoutes');
const phongTroRoutes = require('./routes/phongTroRoutes');
const userRoutes = require('./routes/userRoutes');
const tienIchRoutes = require('./routes/tienIchRoutes');
const datLichRoutes = require('./routes/datLichRoutes');

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
app.use('/api/dat-lich', datLichRoutes);

// Route mặc định kiểm tra health
app.get('/', (req, res) => {
  res.send('API Quản lý trọ đang hoạt động!');
});

// Khởi động server
app.listen(port, () => {
  console.log(`🚀 Backend Server chạy tại http://localhost:${port}`);
});
