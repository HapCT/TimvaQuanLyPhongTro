const pool = require('../config/db');

const notifyUser = async ({ userId, title, body, type }) => {
  if (!userId || !String(title || '').trim() || !String(body || '').trim()) return;
  try {
    await pool.query(
      `INSERT INTO thong_bao (ma_nguoi_dung, tieu_de, noi_dung, loai_thong_bao)
       VALUES (?, ?, ?, ?)`,
      [userId, String(title).trim().slice(0, 200), String(body).trim(), String(type || 'HeThong').slice(0, 50)]
    );
  } catch (error) {
    console.error('NOTIFICATION CREATE ERROR:', error.message);
  }
};

module.exports = { notifyUser };
