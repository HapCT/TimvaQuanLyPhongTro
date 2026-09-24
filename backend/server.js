require('dotenv').config();
const express = require('express');
const cors = require('cors');
const os = require('os');

const khuTroRoutes = require('./routes/khuTroRoutes');
const phongTroRoutes = require('./routes/phongTroRoutes');
const userRoutes = require('./routes/userRoutes');
const tienIchRoutes = require('./routes/tienIchRoutes');
const datLichRoutes = require('./routes/datLichRoutes');
const datPhongRoutes = require('./routes/datPhongRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();
const port = process.env.PORT || 3000;
const host = '0.0.0.0'; // Bind trên tất cả interfaces để mobile trong LAN truy cập được

// Lấy IP LAN để hiển thị
function getLanIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

// Middlewares cơ bản
app.use(cors());
app.use(express.json());

// Đăng ký các Routes
app.use('/api/khu-tro', khuTroRoutes);
app.use('/api/phong-tro', phongTroRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tien-ich', tienIchRoutes);
app.use('/api/dat-lich', datLichRoutes);
app.use('/api/dat-phong', datPhongRoutes);
app.use('/api/upload', uploadRoutes);

// Route mặc định kiểm tra health
app.get('/', (req, res) => {
  res.send('API Quản lý trọ đang hoạt động!');
});

// Khởi động server
app.listen(port, host, () => {
  const lanIp = getLanIp();
  console.log(`🚀 Backend Server chạy tại:`);
  console.log(`   - Local :  http://localhost:${port}`);
  console.log(`   - Mobile:  http://${lanIp}:${port}  ← dùng IP này cho điện thoại`);
});
