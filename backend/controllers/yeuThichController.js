const pool = require('../config/db');

const getMine = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, y.ngay_tao AS ngay_luu,
              k.ten_khu_tro, k.dia_chi AS dia_chi_khu_tro, k.quan_huyen, k.thanh_pho,
              (SELECT a.duong_dan_anh
               FROM anh_phong a
               WHERE a.ma_phong = p.ma_phong
               ORDER BY a.anh_chinh DESC, a.ngay_tao ASC
               LIMIT 1) AS anh_dai_dien
       FROM yeu_thich y
       JOIN phong_tro p ON p.ma_phong = y.ma_phong
       LEFT JOIN khu_tro k ON k.ma_khu_tro = p.ma_khu_tro
       WHERE y.ma_nguoi_dung = ? AND p.trang_thai_duyet = 'DaDuyet'
       ORDER BY y.ngay_tao DESC`,
      [req.user.id]
    );
    res.json(rows.map((room) => ({
      ...room,
      khu_tro: {
        ma_khu_tro: room.ma_khu_tro,
        ten_khu_tro: room.ten_khu_tro,
        dia_chi: room.dia_chi_khu_tro,
        quan_huyen: room.quan_huyen,
        thanh_pho: room.thanh_pho,
      },
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const add = async (req, res) => {
  try {
    const roomId = Number(req.params.maPhong);
    if (!Number.isInteger(roomId) || roomId < 1) {
      return res.status(400).json({ error: 'Mã phòng không hợp lệ.' });
    }

    const [rooms] = await pool.query(
      "SELECT ma_phong FROM phong_tro WHERE ma_phong = ? AND trang_thai_duyet = 'DaDuyet' LIMIT 1",
      [roomId]
    );
    if (!rooms[0]) return res.status(404).json({ error: 'Không tìm thấy phòng đã được duyệt.' });

    await pool.query(
      'INSERT IGNORE INTO yeu_thich (ma_nguoi_dung, ma_phong) VALUES (?, ?)',
      [req.user.id, roomId]
    );
    res.status(201).json({ success: true, ma_phong: roomId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM yeu_thich WHERE ma_nguoi_dung = ? AND ma_phong = ?',
      [req.user.id, req.params.maPhong]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getMine, add, remove };