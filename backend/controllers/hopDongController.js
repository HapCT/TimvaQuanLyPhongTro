const pool = require('../config/db');
const { notifyUser } = require('../services/notifications');

const getAll = async (req, res) => {
  try {
    let sql = `
      SELECT hd.*, nd.ho_ten AS nguoi_thue_ho_ten, nd.so_dien_thoai AS nguoi_thue_so_dien_thoai,
             p.tieu_de, p.so_phong, p.gia_thue AS gia_thue_phong, k.ten_khu_tro, k.ma_chu_tro
      FROM hop_dong hd
      JOIN nguoi_dung nd ON nd.ma_nguoi_dung = hd.ma_nguoi_thue
      JOIN phong_tro p ON p.ma_phong = hd.ma_phong
      JOIN khu_tro k ON k.ma_khu_tro = p.ma_khu_tro`;
    const params = [];

    if (req.user.role === 'ChuTro') {
      sql += ' WHERE k.ma_chu_tro = ?';
      params.push(req.user.id);
    } else if (req.user.role !== 'QuanTri') {
      sql += ' WHERE hd.ma_nguoi_thue = ?';
      params.push(req.user.id);
    }
    sql += ' ORDER BY hd.ngay_tao DESC';

    const [contracts] = await pool.query(sql, params);
    if (contracts.length === 0) return res.json([]);

    const ids = contracts.map((contract) => contract.ma_hop_dong);
    const [payments] = await pool.query(
      `SELECT * FROM thanh_toan WHERE ma_hop_dong IN (${ids.map(() => '?').join(',')}) ORDER BY ngay_tao DESC`,
      ids
    );
    const paymentsByContract = {};
    payments.forEach((payment) => {
      if (!paymentsByContract[payment.ma_hop_dong]) paymentsByContract[payment.ma_hop_dong] = [];
      paymentsByContract[payment.ma_hop_dong].push(payment);
    });

    res.json(contracts.map((contract) => ({
      ...contract,
      nguoi_thue: {
        ho_ten: contract.nguoi_thue_ho_ten,
        so_dien_thoai: contract.nguoi_thue_so_dien_thoai,
      },
      phong: {
        ma_phong: contract.ma_phong,
        tieu_de: contract.tieu_de,
        so_phong: contract.so_phong,
        gia_thue: contract.gia_thue_phong,
        ten_khu_tro: contract.ten_khu_tro,
      },
      thanh_toan: paymentsByContract[contract.ma_hop_dong] || [],
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const maDatPhong = Number(req.body.ma_dat_phong);
    const ngayBatDau = String(req.body.ngay_bat_dau || '').trim();
    const ngayKetThuc = String(req.body.ngay_ket_thuc || '').trim() || null;
    const dieuKhoan = String(req.body.dieu_khoan || '').trim() || null;

    if (!Number.isInteger(maDatPhong) || maDatPhong < 1) {
      return res.status(400).json({ error: 'Yêu cầu đặt phòng không hợp lệ.' });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ngayBatDau)) {
      return res.status(400).json({ error: 'Ngày bắt đầu không hợp lệ.' });
    }
    if (ngayKetThuc && (!/^\d{4}-\d{2}-\d{2}$/.test(ngayKetThuc) || ngayKetThuc < ngayBatDau)) {
      return res.status(400).json({ error: 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.' });
    }

    const [bookingRows] = await pool.query(
      `SELECT dp.ma_dat_phong, dp.ma_nguoi_thue, dp.trang_thai,
              p.ma_phong, p.gia_thue, p.tien_coc, k.ma_chu_tro
       FROM dat_phong dp
       JOIN phong_tro p ON p.ma_phong = dp.ma_phong
       JOIN khu_tro k ON k.ma_khu_tro = p.ma_khu_tro
       WHERE dp.ma_dat_phong = ? LIMIT 1`,
      [maDatPhong]
    );
    const booking = bookingRows[0];
    if (!booking) return res.status(404).json({ error: 'Không tìm thấy yêu cầu đặt phòng.' });
    if (booking.trang_thai !== 'DaDuyet') {
      return res.status(409).json({ error: 'Chỉ yêu cầu đã được chấp nhận mới tạo được hợp đồng.' });
    }
    if (req.user.role !== 'QuanTri' && String(booking.ma_chu_tro) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Yêu cầu này không thuộc khu trọ của bạn.' });
    }

    const [existing] = await pool.query(
      'SELECT ma_hop_dong FROM hop_dong WHERE ma_dat_phong = ? LIMIT 1',
      [maDatPhong]
    );
    if (existing[0]) return res.status(409).json({ error: 'Yêu cầu này đã có hợp đồng.' });

    const giaThue = Number(req.body.gia_thue ?? booking.gia_thue);
    const tienCoc = Number(req.body.tien_coc ?? booking.tien_coc ?? 0);
    if (!Number.isFinite(giaThue) || giaThue <= 0 || !Number.isFinite(tienCoc) || tienCoc < 0) {
      return res.status(400).json({ error: 'Giá thuê hoặc tiền cọc không hợp lệ.' });
    }

    const [result] = await pool.query(
      `INSERT INTO hop_dong
       (ma_dat_phong, ma_nguoi_thue, ma_phong, ngay_bat_dau, ngay_ket_thuc, gia_thue, tien_coc, dieu_khoan)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [maDatPhong, booking.ma_nguoi_thue, booking.ma_phong, ngayBatDau, ngayKetThuc, giaThue, tienCoc, dieuKhoan]
    );
    await pool.query('UPDATE phong_tro SET trang_thai = \'DaThue\' WHERE ma_phong = ?', [booking.ma_phong]);
    await notifyUser({
      userId: booking.ma_nguoi_thue,
      title: 'Hợp đồng thuê mới',
      body: `Chủ trọ đã tạo hợp đồng thuê phòng với giá ${Number(giaThue).toLocaleString('vi-VN')} đ/tháng.`,
      type: 'HopDong',
    });
    res.status(201).json({ success: true, ma_hop_dong: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getContractForOwner = async (req, id) => {
  const [rows] = await pool.query(
    `SELECT hd.ma_hop_dong, hd.ma_nguoi_thue, hd.ma_phong, k.ma_chu_tro
     FROM hop_dong hd
     JOIN phong_tro p ON p.ma_phong = hd.ma_phong
     JOIN khu_tro k ON k.ma_khu_tro = p.ma_khu_tro
     WHERE hd.ma_hop_dong = ? LIMIT 1`,
    [id]
  );
  const contract = rows[0];
  if (!contract) return { status: 404, error: 'Không tìm thấy hợp đồng.' };
  if (req.user.role !== 'QuanTri' && String(contract.ma_chu_tro) !== String(req.user.id)) {
    return { status: 403, error: 'Hợp đồng này không thuộc khu trọ của bạn.' };
  }
  return { contract };
};

const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['DangHieuLuc', 'KetThuc', 'Huy'].includes(status)) {
      return res.status(400).json({ error: 'Trạng thái hợp đồng không hợp lệ.' });
    }
    const access = await getContractForOwner(req, req.params.id);
    if (access.error) return res.status(access.status).json({ error: access.error });

    await pool.query('UPDATE hop_dong SET trang_thai = ? WHERE ma_hop_dong = ?', [status, req.params.id]);
    if (status === 'KetThuc' || status === 'Huy') {
      const [activeContracts] = await pool.query(
        "SELECT ma_hop_dong FROM hop_dong WHERE ma_phong = ? AND trang_thai = 'DangHieuLuc' LIMIT 1",
        [access.contract.ma_phong]
      );
      if (activeContracts.length === 0) {
        await pool.query("UPDATE phong_tro SET trang_thai = 'ConTrong' WHERE ma_phong = ?", [access.contract.ma_phong]);
      }
    }
    await notifyUser({
      userId: access.contract.ma_nguoi_thue,
      title: 'Cập nhật hợp đồng',
      body: status === 'DangHieuLuc' ? 'Hợp đồng của bạn đang có hiệu lực.' : status === 'KetThuc' ? 'Hợp đồng thuê của bạn đã kết thúc.' : 'Hợp đồng thuê của bạn đã bị hủy.',
      type: 'HopDong',
    });
    res.json({ success: true, trang_thai: status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const addPayment = async (req, res) => {
  try {
    const access = await getContractForOwner(req, req.params.id);
    if (access.error) return res.status(access.status).json({ error: access.error });

    const amount = Number(req.body.so_tien);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Số tiền thanh toán phải lớn hơn 0.' });
    }

    const [result] = await pool.query(
      `INSERT INTO thanh_toan (ma_hop_dong, so_tien, phuong_thuc, noi_dung, trang_thai)
       VALUES (?, ?, ?, ?, 'DaThanhToan')`,
      [req.params.id, amount, String(req.body.phuong_thuc || '').trim() || null, String(req.body.noi_dung || '').trim() || null]
    );
    res.status(201).json({ success: true, ma_thanh_toan: result.insertId, trang_thai: 'DaThanhToan' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAll, create, updateStatus, addPayment };