const { auth } = require('../config/firebaseAdmin');
const pool = require('../config/db');

const normalizeRole = (role) => {
  const r = String(role || '').trim();
  if (r === 'Admin' || r === 'QuanTri') return 'QuanTri';
  return r || 'NguoiThue';
};

async function resolveUser(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  if (!token) return null;

  const decoded = await auth.verifyIdToken(token);
  const [rows] = await pool.query(
    'SELECT vai_tro FROM nguoi_dung WHERE ma_nguoi_dung = ? LIMIT 1',
    [decoded.uid]
  );

  if (!rows[0]) {
    // Tự động tạo record trong MySQL nếu người dùng mới đăng nhập Firebase chưa có record
    const email = decoded.email || '';
    const isDbAdmin = email.toLowerCase().includes('admin');
    const defaultRole = isDbAdmin ? 'QuanTri' : 'NguoiThue';

    await pool.query(
      `INSERT INTO nguoi_dung (ma_nguoi_dung, email, ho_ten, vai_tro) 
       VALUES (?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE vai_tro = VALUES(vai_tro)`,
      [decoded.uid, email || null, decoded.name || email || 'Người dùng', defaultRole]
    );
    return { id: decoded.uid, role: defaultRole };
  }

  return { id: decoded.uid, role: normalizeRole(rows[0]?.vai_tro) };
}

const optionalAuth = async (req, _res, next) => {
  try {
    req.user = await resolveUser(req);
  } catch (_error) {
    req.user = null;
  }
  next();
};

const requireAuth = async (req, res, next) => {
  try {
    const user = await resolveUser(req);
    if (!user) return res.status(401).json({ error: 'Bạn cần đăng nhập.' });
    req.user = user;
    next();
  } catch (_error) {
    res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn.' });
  }
};

const requireRole = (...roles) => async (req, res, next) => {
  try {
    const user = await resolveUser(req);
    if (!user) return res.status(401).json({ error: 'Bạn cần đăng nhập.' });

    const normalizedAllowedRoles = roles.map(normalizeRole);
    if (!normalizedAllowedRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Bạn không có quyền thực hiện thao tác này.' });
    }

    req.user = user;
    next();
  } catch (_error) {
    res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn.' });
  }
};

module.exports = { optionalAuth, requireAuth, requireRole };
