const pool = require('../config/db');
const { notifyUser } = require('../services/notifications');

const create = async (req, res) => {
  try {
    const tieuDe = String(req.body.tieu_de || '').trim();
    const noiDung = String(req.body.noi_dung || '').trim();
    if (!tieuDe || !noiDung) {
      return res.status(400).json({ error: 'Vui lòng nhập tiêu đề và nội dung yêu cầu.' });
    }

    const [result] = await pool.query(
      'INSERT INTO yeu_cau_ho_tro (ma_nguoi_dung, tieu_de, noi_dung) VALUES (?, ?, ?)',
      [req.user.id, tieuDe, noiDung]
    );
    const [admins] = await pool.query(
      "SELECT ma_nguoi_dung FROM nguoi_dung WHERE vai_tro = 'QuanTri' AND trang_thai = 1"
    );
    await Promise.all(admins.map((admin) => notifyUser({
      userId: admin.ma_nguoi_dung,
      title: 'Yêu cầu hỗ trợ mới',
      body: `Có yêu cầu hỗ trợ mới: ${tieuDe}.`,
      type: 'HoTro',
    })));
    res.status(201).json({ success: true, ma_yeu_cau: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getMine = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM yeu_cau_ho_tro WHERE ma_nguoi_dung = ? ORDER BY ngay_tao DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getForAdmin = async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT h.*, u.ho_ten, u.email, u.so_dien_thoai, xu_ly.ho_ten AS ten_nguoi_xu_ly
       FROM yeu_cau_ho_tro h
       JOIN nguoi_dung u ON u.ma_nguoi_dung = h.ma_nguoi_dung
       LEFT JOIN nguoi_dung xu_ly ON xu_ly.ma_nguoi_dung = h.nguoi_xu_ly
       ORDER BY FIELD(h.trang_thai, 'Moi', 'DangXuLy', 'DaGiaiQuyet'), h.ngay_tao DESC`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const { status, response } = req.body;
    if (!['Moi', 'DangXuLy', 'DaGiaiQuyet'].includes(status)) {
      return res.status(400).json({ error: 'Trạng thái xử lý không hợp lệ.' });
    }

    const [requestRows] = await pool.query(
      'SELECT ma_nguoi_dung, tieu_de FROM yeu_cau_ho_tro WHERE ma_yeu_cau = ? LIMIT 1',
      [req.params.id]
    );
    if (!requestRows[0]) return res.status(404).json({ error: 'Không tìm thấy yêu cầu hỗ trợ.' });

    const [result] = await pool.query(
      `UPDATE yeu_cau_ho_tro
       SET trang_thai = ?, phan_hoi_admin = ?, nguoi_xu_ly = ?
       WHERE ma_yeu_cau = ?`,
      [status, String(response || '').trim() || null, req.user.id, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(409).json({ error: 'Yêu cầu hỗ trợ vừa được cập nhật.' });
    await notifyUser({
      userId: requestRows[0].ma_nguoi_dung,
      title: 'Cập nhật yêu cầu hỗ trợ',
      body: `Yêu cầu "${requestRows[0].tieu_de}" đã được cập nhật: ${String(response || '').trim() || status}.`,
      type: 'HoTro',
    });
    res.json({ success: true, trang_thai: status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { create, getMine, getForAdmin, update };