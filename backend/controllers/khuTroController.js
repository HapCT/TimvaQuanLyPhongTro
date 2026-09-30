const pool = require('../config/db');

const KHU_TRO_FIELDS = [
  'ten_khu_tro', 'dia_chi', 'phuong', 'quan_huyen',
  'thanh_pho', 'mo_ta', 'anh_dai_dien', 'trang_thai',
];

const pickFields = (obj, allowed) => {
  const out = {};
  for (const key of allowed) {
    if (obj[key] !== undefined) out[key] = obj[key];
  }
  return out;
};

const checkKhuTroAccess = async (req, id) => {
  if (req.user.role === 'QuanTri') return null;

  const [rows] = await pool.query(
    'SELECT ma_chu_tro FROM khu_tro WHERE ma_khu_tro = ? LIMIT 1',
    [id]
  );
  if (!rows[0]) return { status: 404, error: 'Không tìm thấy khu trọ.' };
  if (String(rows[0].ma_chu_tro) !== String(req.user.id)) {
    return { status: 403, error: 'Khu trọ này không thuộc về bạn.' };
  }
  return null;
};

const getAll = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM khu_tro ORDER BY ngay_tao DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const data = pickFields(req.body, KHU_TRO_FIELDS);
    data.ma_chu_tro = req.user.role === 'QuanTri' ? req.body.ma_chu_tro : req.user.id;

    if (!data.ma_chu_tro || !data.ten_khu_tro || !data.dia_chi) {
      return res.status(400).json({ error: 'Thiếu ma_chu_tro, ten_khu_tro hoặc dia_chi.' });
    }

    const [owners] = await pool.query(
      "SELECT vai_tro FROM nguoi_dung WHERE ma_nguoi_dung = ? LIMIT 1",
      [data.ma_chu_tro]
    );
    if (!owners[0] || owners[0].vai_tro !== 'ChuTro') {
      return res.status(400).json({ error: 'Chủ sở hữu khu trọ phải là tài khoản Chủ trọ hợp lệ.' });
    }

    const cols = Object.keys(data);
    const [result] = await pool.query(
      `INSERT INTO khu_tro (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
      cols.map((c) => data[c])
    );

    const [rows] = await pool.query('SELECT * FROM khu_tro WHERE ma_khu_tro = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const accessError = await checkKhuTroAccess(req, id);
    if (accessError) return res.status(accessError.status).json({ error: accessError.error });

    const data = pickFields(req.body, KHU_TRO_FIELDS);

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'Không có dữ liệu để cập nhật.' });
    }

    const setClause = Object.keys(data).map((c) => `${c} = ?`).join(', ');
    await pool.query(`UPDATE khu_tro SET ${setClause} WHERE ma_khu_tro = ?`, [...Object.values(data), id]);

    const [rows] = await pool.query('SELECT * FROM khu_tro WHERE ma_khu_tro = ?', [id]);
    res.json(rows[0] || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const accessError = await checkKhuTroAccess(req, id);
    if (accessError) return res.status(accessError.status).json({ error: accessError.error });

    await pool.query('DELETE FROM khu_tro WHERE ma_khu_tro = ?', [id]);
    res.json({ success: true, message: 'Đã xóa thành công' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAll, create, update, remove };