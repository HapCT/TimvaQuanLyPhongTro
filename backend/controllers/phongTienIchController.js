const pool = require('../config/db');

// Lấy toàn bộ danh sách phòng - tiện ích
const getAll = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM phong_tien_ich');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Lấy danh sách tiện ích của 1 phòng
const getByPhong = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT t.* FROM tien_ich t
       JOIN phong_tien_ich pti ON t.ma_tien_ich = pti.ma_tien_ich
       WHERE pti.ma_phong = ?`,
      [id]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Gán tiện ích cho phòng
const create = async (req, res) => {
  try {
    const { ma_phong, ma_tien_ich } = req.body;
    if (!ma_phong || !ma_tien_ich) {
      return res.status(400).json({ error: 'Thiếu mã phòng hoặc mã tiện ích.' });
    }
    await pool.query(
      'INSERT INTO phong_tien_ich (ma_phong, ma_tien_ich) VALUES (?, ?) ON DUPLICATE KEY UPDATE ma_phong = ma_phong',
      [ma_phong, ma_tien_ich]
    );
    res.status(201).json({ message: 'Gán tiện ích thành công.', ma_phong, ma_tien_ich });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Xóa tiện ích khỏi phòng
const remove = async (req, res) => {
  try {
    const { ma_phong, ma_tien_ich } = req.body;
    await pool.query('DELETE FROM phong_tien_ich WHERE ma_phong = ? AND ma_tien_ich = ?', [ma_phong, ma_tien_ich]);
    res.json({ message: 'Gỡ tiện ích thành công.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAll, getByPhong, create, remove };
