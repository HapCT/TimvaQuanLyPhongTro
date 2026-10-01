const pool = require('../config/db');

// Lấy danh sách lịch sử thanh toán hóa đơn
const getAll = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM thanh_toan_hoa_don ORDER BY ngay_tao DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Lấy danh sách thanh toán theo mã hóa đơn
const getByHoaDon = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM thanh_toan_hoa_don WHERE ma_hoa_don = ?', [id]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Tạo thanh toán hóa đơn mới
const create = async (req, res) => {
  try {
    const { ma_hoa_don, ma_nguoi_nop, so_tien, phuong_thuc, ma_giao_dich, noi_dung, trang_thai } = req.body;
    if (!ma_hoa_don || !so_tien) {
      return res.status(400).json({ error: 'Thiếu mã hóa đơn hoặc số tiền.' });
    }
    const [result] = await pool.query(
      `INSERT INTO thanh_toan_hoa_don (ma_hoa_don, ma_nguoi_nop, so_tien, phuong_thuc, ma_giao_dich, noi_dung, trang_thai)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [ma_hoa_don, ma_nguoi_nop || null, so_tien, phuong_thuc || 'ChuyenKhoan', ma_giao_dich || null, noi_dung || null, trang_thai || 'DaThanhToan']
    );
    const [rows] = await pool.query('SELECT * FROM thanh_toan_hoa_don WHERE ma_thanh_toan = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAll, getByHoaDon, create };
