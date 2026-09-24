const { auth } = require('../config/firebaseAdmin');
const pool = require('../config/db');

const getAll = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM nguoi_dung ORDER BY ngay_tao DESC');
    const authMap = {};
    try {
      let pageToken;
      do {
        const result = await auth.listUsers(1000, pageToken);
        result.users.forEach((user) => { authMap[user.uid] = !!user.disabled; });
        pageToken = result.pageToken;
      } while (pageToken);
    } catch (error) {
      console.warn('Không lấy được danh sách Firebase Auth (sẽ lấy trạng thái mặc định từ DB):', error.message);
    }
    res.json(rows.map((user) => ({ ...user, is_locked: authMap[user.ma_nguoi_dung] || false })));
  } catch (error) {
    console.error('LỖI GET ALL USERS:', error);
    res.status(500).json({ error: error.message });
  }
};

const syncProfile = async (req, res) => {
  try {
    const { ho_ten, so_dien_thoai, email, vai_tro } = req.body;
    const role = ['NguoiThue', 'ChuTro', 'QuanTri', 'Admin'].includes(vai_tro) 
      ? (vai_tro === 'Admin' ? 'QuanTri' : vai_tro) 
      : 'NguoiThue';

    await pool.query(
      `INSERT INTO nguoi_dung (ma_nguoi_dung, ho_ten, so_dien_thoai, email, vai_tro)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE ho_ten = VALUES(ho_ten), so_dien_thoai = VALUES(so_dien_thoai), email = VALUES(email), vai_tro = VALUES(vai_tro)`,
      [req.user.id, ho_ten || '', so_dien_thoai || null, email || null, role]
    );
    const [rows] = await pool.query('SELECT * FROM nguoi_dung WHERE ma_nguoi_dung = ?', [req.user.id]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('LỖI SYNC PROFILE:', error);
    res.status(500).json({ error: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    let [rows] = await pool.query('SELECT * FROM nguoi_dung WHERE ma_nguoi_dung = ? LIMIT 1', [req.user.id]);
    if (!rows[0]) {
      const role = req.user.role || 'NguoiThue';
      await pool.query(
        'INSERT INTO nguoi_dung (ma_nguoi_dung, ho_ten, vai_tro) VALUES (?, ?, ?)',
        [req.user.id, 'Người dùng', role]
      );
      [rows] = await pool.query('SELECT * FROM nguoi_dung WHERE ma_nguoi_dung = ? LIMIT 1', [req.user.id]);
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('LỖI GET ME:', error);
    res.status(500).json({ error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    try { await auth.deleteUser(req.params.id); } catch (error) { console.warn('Firebase delete warning:', error.message); }
    await pool.query('DELETE FROM nguoi_dung WHERE ma_nguoi_dung = ?', [req.params.id]);
    res.json({ success: true, message: 'Đã xóa người dùng' });
  } catch (error) {
    console.error('LỖI REMOVE USER:', error);
    res.status(500).json({ error: error.message });
  }
};

const toggleLock = async (req, res) => {
  try {
    await auth.updateUser(req.params.id, { disabled: !!req.body.is_locked });
    res.json({ success: true, message: req.body.is_locked ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản' });
  } catch (error) {
    console.error('LỖI TOGGLE LOCK:', error);
    res.status(500).json({ error: error.message });
  }
};

const updateRole = async (req, res) => {
  try {
    let { vai_tro } = req.body;
    if (vai_tro === 'Admin') vai_tro = 'QuanTri';
    if (!['NguoiThue', 'ChuTro', 'QuanTri'].includes(vai_tro)) {
      return res.status(400).json({ error: 'Vai trò không hợp lệ.' });
    }
    await pool.query('UPDATE nguoi_dung SET vai_tro = ? WHERE ma_nguoi_dung = ?', [vai_tro, req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('LỖI UPDATE ROLE:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAll, syncProfile, getMe, remove, toggleLock, updateRole };
