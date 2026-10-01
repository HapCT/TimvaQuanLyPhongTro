const pool = require('../config/db');

// Lấy danh sách giao dịch thanh toán
const getAll = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM thanh_toan ORDER BY ngay_thanh_toan DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Lấy chi tiết 1 thanh toán theo ID
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM thanh_toan WHERE ma_thanh_toan = ? LIMIT 1', [id]);
    if (!rows[0]) return res.status(404).json({ error: 'Không tìm thấy thanh toán.' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Tạo ghi nhận thanh toán mới
const create = async (req, res) => {
  try {
    const { ma_hop_dong, so_tien, phuong_thuc, noi_dung, ma_giao_dich, trang_thai } = req.body;
    if (!ma_hop_dong || !so_tien) {
      return res.status(400).json({ error: 'Thiếu mã hợp đồng hoặc số tiền.' });
    }
    const [result] = await pool.query(
      `INSERT INTO thanh_toan (ma_hop_dong, so_tien, phuong_thuc, noi_dung, ma_giao_dich, trang_thai)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [ma_hop_dong, so_tien, phuong_thuc || 'ChuyenKhoan', noi_dung || null, ma_giao_dich || null, trang_thai || 'ThanhCong']
    );
    const [rows] = await pool.query('SELECT * FROM thanh_toan WHERE ma_thanh_toan = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAll, getById, create };
