const pool = require('../config/db');

const getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ma_thong_bao, tieu_de, noi_dung, loai_thong_bao, da_doc, ngay_tao
       FROM thong_bao WHERE ma_nguoi_dung = ?
       ORDER BY ngay_tao DESC, ma_thong_bao DESC LIMIT 100`,
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    console.error('NOTIFICATION GET ERROR:', error);
    res.status(500).json({ error: error.message });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS count FROM thong_bao WHERE ma_nguoi_dung = ? AND da_doc = 0',
      [req.user.id]
    );
    res.json({ count: Number(rows[0]?.count || 0) });
  } catch (error) {
    console.error('NOTIFICATION COUNT ERROR:', error);
    res.status(500).json({ error: error.message });
  }
};

const markRead = async (req, res) => {
  try {
    const [result] = await pool.query(
      'UPDATE thong_bao SET da_doc = 1 WHERE ma_thong_bao = ? AND ma_nguoi_dung = ?',
      [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) {
      const [rows] = await pool.query(
        'SELECT ma_thong_bao FROM thong_bao WHERE ma_thong_bao = ? AND ma_nguoi_dung = ? LIMIT 1',
        [req.params.id, req.user.id]
      );
      if (!rows[0]) return res.status(404).json({ error: 'Không tìm thấy thông báo.' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('NOTIFICATION READ ERROR:', error);
    res.status(500).json({ error: error.message });
  }
};

const markAllRead = async (req, res) => {
  try {
    const [result] = await pool.query(
      'UPDATE thong_bao SET da_doc = 1 WHERE ma_nguoi_dung = ? AND da_doc = 0',
      [req.user.id]
    );
    res.json({ success: true, updated: result.affectedRows });
  } catch (error) {
    console.error('NOTIFICATION READ ALL ERROR:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAll, getUnreadCount, markRead, markAllRead };
