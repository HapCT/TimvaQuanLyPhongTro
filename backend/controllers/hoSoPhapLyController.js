const pool = require('../config/db');

// Lấy danh sách toàn bộ hồ sơ pháp lý
const getAll = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM ho_so_phap_ly ORDER BY ma_ho_so DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Lấy danh sách hồ sơ pháp lý theo phòng
const getByPhong = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM ho_so_phap_ly WHERE ma_phong = ?', [id]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Thêm hồ sơ mới
const create = async (req, res) => {
  try {
    const { ma_phong, loai_giay_to, duong_dan } = req.body;
    if (!ma_phong || !duong_dan) {
      return res.status(400).json({ error: 'Thiếu mã phòng hoặc đường dẫn tài liệu.' });
    }
    const [result] = await pool.query(
      'INSERT INTO ho_so_phap_ly (ma_phong, loai_giay_to, duong_dan) VALUES (?, ?, ?)',
      [ma_phong, loai_giay_to || 'Giấy tờ khác', duong_dan]
    );
    const [rows] = await pool.query('SELECT * FROM ho_so_phap_ly WHERE ma_ho_so = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Xóa hồ sơ
const remove = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM ho_so_phap_ly WHERE ma_ho_so = ?', [id]);
    res.json({ message: 'Xóa hồ sơ pháp lý thành công.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAll, getByPhong, create, remove };
