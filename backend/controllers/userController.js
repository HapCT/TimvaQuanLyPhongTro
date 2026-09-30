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
      console.warn('Khong lay duoc danh sach Firebase Auth:', error.message);
    }
    res.json(rows.map((user) => ({ ...user, is_locked: authMap[user.ma_nguoi_dung] || false })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const syncProfile = async (req, res) => {
  try {
    const { ho_ten, so_dien_thoai, email, vai_tro } = req.body;
    const role = ['NguoiThue', 'ChuTro'].includes(vai_tro) ? vai_tro : 'NguoiThue';
    await pool.query(
      `INSERT INTO nguoi_dung (ma_nguoi_dung, ho_ten, so_dien_thoai, email, vai_tro)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE ho_ten = VALUES(ho_ten), so_dien_thoai = VALUES(so_dien_thoai), email = VALUES(email)`,
      [req.user.id, ho_ten || '', so_dien_thoai || null, email || null, role]
    );
    const [rows] = await pool.query('SELECT * FROM nguoi_dung WHERE ma_nguoi_dung = ?', [req.user.id]);
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM nguoi_dung WHERE ma_nguoi_dung = ? LIMIT 1', [req.user.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Khong tim thay ho so nguoi dung.' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateMe = async (req, res) => {
  try {
    const hoTen = String(req.body.ho_ten || '').trim();
    const soDienThoai = String(req.body.so_dien_thoai || '').trim();

    if (hoTen.length < 2) return res.status(400).json({ error: 'Họ tên phải có ít nhất 2 ký tự.' });
    if (soDienThoai && !/^0[0-9]{9}$/.test(soDienThoai)) {
      return res.status(400).json({ error: 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0.' });
    }

    await pool.query(
      'UPDATE nguoi_dung SET ho_ten = ?, so_dien_thoai = ? WHERE ma_nguoi_dung = ?',
      [hoTen, soDienThoai || null, req.user.id]
    );
    const [rows] = await pool.query(
      'SELECT * FROM nguoi_dung WHERE ma_nguoi_dung = ? LIMIT 1',
      [req.user.id]
    );
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    try { await auth.deleteUser(req.params.id); } catch (error) { console.warn('Firebase delete warning:', error.message); }
    await pool.query('DELETE FROM nguoi_dung WHERE ma_nguoi_dung = ?', [req.params.id]);
    res.json({ success: true, message: 'Da xoa nguoi dung' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const toggleLock = async (req, res) => {
  try {
    await auth.updateUser(req.params.id, { disabled: !!req.body.is_locked });
    res.json({ success: true, message: req.body.is_locked ? 'Da khoa tai khoan' : 'Da mo khoa tai khoan' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateRole = async (req, res) => {
  try {
    const { vai_tro } = req.body;
    if (!['NguoiThue', 'ChuTro', 'QuanTri'].includes(vai_tro)) {
      return res.status(400).json({ error: 'Vai trò không hợp lệ.' });
    }
    await pool.query('UPDATE nguoi_dung SET vai_tro = ? WHERE ma_nguoi_dung = ?', [vai_tro, req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAll, syncProfile, getMe, updateMe, remove, toggleLock, updateRole };
