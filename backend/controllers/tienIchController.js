const pool = require('../config/db');

const getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM tien_ich ORDER BY ma_tien_ich ASC'
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const { ten_tien_ich } = req.body;
    if (!ten_tien_ich) {
      return res.status(400).json({ error: 'Tên tiện ích không được để trống' });
    }

    const [result] = await pool.query(
      'INSERT INTO tien_ich SET ?',
      [{ ten_tien_ich }]
    );
    const [rows] = await pool.query(
      'SELECT * FROM tien_ich WHERE ma_tien_ich = ?',
      [result.insertId]
    );
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { ten_tien_ich } = req.body;

    if (!ten_tien_ich) {
      return res.status(400).json({ error: 'Tên tiện ích không được để trống' });
    }

    await pool.query(
      'UPDATE tien_ich SET ? WHERE ma_tien_ich = ?',
      [{ ten_tien_ich }, id]
    );
    const [rows] = await pool.query(
      'SELECT * FROM tien_ich WHERE ma_tien_ich = ?',
      [id]
    );
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra xem tiện ích có đang được sử dụng ở phong_tien_ich không
    const [usageRows] = await pool.query(
      'SELECT ma_tien_ich FROM phong_tien_ich WHERE ma_tien_ich = ? LIMIT 1',
      [id]
    );

    if (usageRows.length > 0) {
      return res.status(400).json({
        error: 'Không thể xóa do tiện ích đang được sử dụng bởi các phòng trọ.'
      });
    }

    await pool.query('DELETE FROM tien_ich WHERE ma_tien_ich = ?', [id]);

    res.json({ success: true, message: 'Đã xóa tiện ích thành công' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAll,
  create,
  update,
  remove
};
