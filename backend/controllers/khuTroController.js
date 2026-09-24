const pool = require('../config/db');
// Lấy danh sách khu trọ (lọc theo ma_chu_tro nếu có req.query.ma_chu_tro)
const getAll = async (req, res) => {
  try {
    const { ma_chu_tro } = req.query;
    let sql = 'SELECT * FROM khu_tro';
    const params = [];

    if (ma_chu_tro) {
      sql += ' WHERE ma_chu_tro = ?';
      params.push(ma_chu_tro);
    }

    sql += ' ORDER BY ngay_tao DESC';

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error('KHU TRO GET ALL ERROR:', error);
    res.status(500).json({ error: error.message });
  }
};

// Thêm khu trọ mới
const create = async (req, res) => {
  try {
    const khuTro = req.body;
    if (!khuTro.ma_chu_tro) {
      return res.status(400).json({ error: 'Thiếu ma_chu_tro.' });
    }

    // Đảm bảo ma_chu_tro tồn tại trong nguoi_dung để tránh lỗi khóa ngoại
    const [userRows] = await pool.query('SELECT ma_nguoi_dung FROM nguoi_dung WHERE ma_nguoi_dung = ? LIMIT 1', [khuTro.ma_chu_tro]);
    if (userRows.length === 0) {
      await pool.query(
        `INSERT INTO nguoi_dung (ma_nguoi_dung, ho_ten, vai_tro) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE vai_tro = VALUES(vai_tro)`,
        [khuTro.ma_chu_tro, 'Chủ trọ', 'ChuTro']
      );
    }

    const [result] = await pool.query('INSERT INTO khu_tro SET ?', [khuTro]);
    const [rows] = await pool.query('SELECT * FROM khu_tro WHERE ma_khu_tro = ?', [result.insertId]);

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('KHU TRO CREATE ERROR:', error);
    res.status(500).json({ error: error.message });
  }
};

// Sửa khu trọ
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, ngay_cap_nhat: new Date() };

    await pool.query('UPDATE khu_tro SET ? WHERE ma_khu_tro = ?', [updateData, id]);
    const [rows] = await pool.query('SELECT * FROM khu_tro WHERE ma_khu_tro = ?', [id]);

    res.json(rows[0] || {});
  } catch (error) {
    console.error('KHU TRO UPDATE ERROR:', error);
    res.status(500).json({ error: error.message });
  }
};

// Xóa khu trọ
const remove = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM khu_tro WHERE ma_khu_tro = ?', [id]);
    res.json({ success: true, message: 'Đã xóa thành công' });
  } catch (error) {
    console.error('KHU TRO REMOVE ERROR:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAll,
  create,
  update,
  remove,
};
