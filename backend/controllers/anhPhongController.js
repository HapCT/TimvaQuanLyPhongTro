const pool = require('../config/db');

// Lấy danh sách tất cả ảnh phòng
const getAll = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM anh_phong ORDER BY ma_anh DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Lấy danh sách ảnh theo mã phòng
const getByPhong = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM anh_phong WHERE ma_phong = ?', [id]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Thêm ảnh mới cho phòng
const create = async (req, res) => {
  try {
    const { ma_phong, duong_dan_anh, la_anh_dai_dien } = req.body;
    if (!ma_phong || !duong_dan_anh) {
      return res.status(400).json({ error: 'Thiếu mã phòng hoặc đường dẫn ảnh.' });
    }
    const [result] = await pool.query(
      'INSERT INTO anh_phong (ma_phong, duong_dan_anh, la_anh_dai_dien) VALUES (?, ?, ?)',
      [ma_phong, duong_dan_anh, la_anh_dai_dien ? 1 : 0]
    );
    const [rows] = await pool.query('SELECT * FROM anh_phong WHERE ma_anh = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Xóa ảnh theo mã ảnh
const remove = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM anh_phong WHERE ma_anh = ?', [id]);
    res.json({ message: 'Xóa ảnh thành công.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAll, getByPhong, create, remove };
