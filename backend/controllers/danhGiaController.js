const pool = require('../config/db');

const getForRoom = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT dg.ma_danh_gia, dg.ma_nguoi_dung, dg.ma_phong, dg.so_sao, dg.noi_dung,
              dg.ngay_tao, nd.ho_ten
       FROM danh_gia dg
       JOIN nguoi_dung nd ON nd.ma_nguoi_dung = dg.ma_nguoi_dung
       JOIN phong_tro p ON p.ma_phong = dg.ma_phong
       WHERE dg.ma_phong = ? AND dg.trang_thai = 'HienThi' AND p.trang_thai_duyet = 'DaDuyet'
       ORDER BY dg.ngay_tao DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getMine = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT dg.*, p.tieu_de, p.so_phong
       FROM danh_gia dg
       LEFT JOIN phong_tro p ON p.ma_phong = dg.ma_phong
       WHERE dg.ma_nguoi_dung = ?
       ORDER BY dg.ngay_tao DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const maPhong = Number(req.body.ma_phong);
    const soSao = Number(req.body.so_sao);
    const noiDung = String(req.body.noi_dung || '').trim();

    if (!Number.isInteger(maPhong) || maPhong < 1) {
      return res.status(400).json({ error: 'Mã phòng không hợp lệ.' });
    }
    if (!Number.isInteger(soSao) || soSao < 1 || soSao > 5) {
      return res.status(400).json({ error: 'Số sao phải nằm trong khoảng 1 đến 5.' });
    }
    if (!noiDung) return res.status(400).json({ error: 'Vui lòng nhập nội dung đánh giá.' });

    const [rooms] = await pool.query(
      "SELECT ma_phong FROM phong_tro WHERE ma_phong = ? AND trang_thai_duyet = 'DaDuyet' LIMIT 1",
      [maPhong]
    );
    if (!rooms[0]) return res.status(404).json({ error: 'Không tìm thấy phòng đã được duyệt.' });

    const [bookings] = await pool.query(
      "SELECT ma_dat_phong FROM dat_phong WHERE ma_phong = ? AND ma_nguoi_thue = ? AND trang_thai = 'DaDuyet' LIMIT 1",
      [maPhong, req.user.id]
    );
    // Người đã đi xem phòng (lịch hẹn ở trạng thái DaXem) cũng được đánh giá
    const [viewed] = await pool.query(
      "SELECT ma_dat_lich FROM dat_lich_xem WHERE ma_phong = ? AND ma_nguoi_thue = ? AND trang_thai = 'DaXem' LIMIT 1",
      [maPhong, req.user.id]
    );
    if (!bookings[0] && !viewed[0]) {
      return res.status(403).json({ error: 'Bạn cần đã xem phòng hoặc có yêu cầu đặt phòng được chấp nhận mới có thể đánh giá.' });
    }

    const [existing] = await pool.query(
      'SELECT ma_danh_gia FROM danh_gia WHERE ma_phong = ? AND ma_nguoi_dung = ? LIMIT 1',
      [maPhong, req.user.id]
    );
    if (existing[0]) return res.status(409).json({ error: 'Bạn đã đánh giá phòng này rồi.' });

    const [result] = await pool.query(
      "INSERT INTO danh_gia (ma_nguoi_dung, ma_phong, so_sao, noi_dung, trang_thai) VALUES (?, ?, ?, ?, 'HienThi')",
      [req.user.id, maPhong, soSao, noiDung]
    );
    res.status(201).json({ success: true, ma_danh_gia: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getForAdmin = async (req, res) => {
  try {
    const status = req.query.status;
    let sql = `
      SELECT dg.*, nd.ho_ten, nd.email, p.tieu_de, p.so_phong
      FROM danh_gia dg
      LEFT JOIN nguoi_dung nd ON nd.ma_nguoi_dung = dg.ma_nguoi_dung
      LEFT JOIN phong_tro p ON p.ma_phong = dg.ma_phong`;
    const params = [];

    if (status === 'HienThi' || status === 'An') {
      sql += ' WHERE dg.trang_thai = ?';
      params.push(status);
    }
    sql += ' ORDER BY dg.ngay_tao DESC';

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['HienThi', 'An'].includes(status)) {
      return res.status(400).json({ error: 'Trạng thái phải là HienThi hoặc An.' });
    }

    const [result] = await pool.query(
      'UPDATE danh_gia SET trang_thai = ? WHERE ma_danh_gia = ?',
      [status, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Không tìm thấy đánh giá.' });
    res.json({ success: true, trang_thai: status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const removeMine = async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM danh_gia WHERE ma_danh_gia = ? AND ma_nguoi_dung = ?',
      [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Không tìm thấy đánh giá của bạn.' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getForRoom, getMine, create, getForAdmin, updateStatus, removeMine };