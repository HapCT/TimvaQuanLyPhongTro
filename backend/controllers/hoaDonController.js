const pool = require('../config/db');
const { notifyUser } = require('../services/notifications');

const parseDate = (value) => {
  const text = String(value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const [year, month, day] = text.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? text : null;
};

const parsePeriod = (value) => {
  const text = String(value || '').trim();
  if (!/^\d{4}-\d{2}$/.test(text)) return null;
  const date = new Date(`${text}-01T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 7) === text ? `${text}-01` : null;
};

const parseNonNegative = (value, label) => {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number) || number < 0) throw new Error(`${label} phải là số không âm.`);
  return number;
};

const getInvoiceForUpdate = async (connection, id) => {
  const [rows] = await connection.query(
    `SELECT hd.*, h.ma_nguoi_thue, k.ma_chu_tro
     FROM hoa_don hd
     JOIN hop_dong h ON h.ma_hop_dong = hd.ma_hop_dong
     JOIN phong_tro p ON p.ma_phong = h.ma_phong
     JOIN khu_tro k ON k.ma_khu_tro = p.ma_khu_tro
     WHERE hd.ma_hoa_don = ? LIMIT 1 FOR UPDATE`,
    [id]
  );
  return rows[0] || null;
};

const checkInvoiceAccess = (req, res, invoice) => {
  const isAdmin = req.user.role === 'QuanTri';
  const isOwner = req.user.role === 'ChuTro' && String(invoice.ma_chu_tro) === String(req.user.id);
  const isTenant = req.user.role === 'NguoiThue' && String(invoice.ma_nguoi_thue) === String(req.user.id);
  if (!isAdmin && !isOwner && !isTenant) {
    res.status(403).json({ error: 'Bạn không có quyền thao tác hóa đơn này.' });
    return false;
  }
  return { isAdmin, isOwner, isTenant };
};

const getAll = async (req, res) => {
  try {
    let sql = `
      SELECT hd.*, h.ma_nguoi_thue, k.ma_chu_tro,
             nd.ho_ten AS nguoi_thue_ho_ten,
             p.tieu_de AS phong_tieu_de, p.so_phong AS phong_so_phong,
             k.ten_khu_tro,
             COALESCE(tt.da_thanh_toan, 0) AS da_thanh_toan,
             COALESCE(tt.cho_xac_nhan, 0) AS cho_xac_nhan,
             (hd.han_thanh_toan < CURDATE()) AS qua_han
      FROM hoa_don hd
      JOIN hop_dong h ON h.ma_hop_dong = hd.ma_hop_dong
      JOIN nguoi_dung nd ON nd.ma_nguoi_dung = h.ma_nguoi_thue
      JOIN phong_tro p ON p.ma_phong = h.ma_phong
      JOIN khu_tro k ON k.ma_khu_tro = p.ma_khu_tro
      LEFT JOIN (
        SELECT ma_hoa_don,
               SUM(CASE WHEN trang_thai = 'DaXacNhan' THEN so_tien ELSE 0 END) AS da_thanh_toan,
               SUM(CASE WHEN trang_thai = 'ChoXacNhan' THEN so_tien ELSE 0 END) AS cho_xac_nhan
        FROM thanh_toan_hoa_don GROUP BY ma_hoa_don
      ) tt ON tt.ma_hoa_don = hd.ma_hoa_don`;
    const params = [];
    if (req.user.role === 'ChuTro') {
      sql += ' WHERE k.ma_chu_tro = ?';
      params.push(req.user.id);
    } else if (req.user.role !== 'QuanTri') {
      sql += ' WHERE h.ma_nguoi_thue = ?';
      params.push(req.user.id);
    }
    sql += ' ORDER BY hd.ky_thanh_toan DESC, hd.ngay_tao DESC';

    const [rows] = await pool.query(sql, params);
    if (rows.length === 0) return res.json([]);

    const invoiceIds = rows.map((row) => row.ma_hoa_don);
    const [payments] = await pool.query(
      `SELECT tt.*, nd.ho_ten AS nguoi_tao_ho_ten
       FROM thanh_toan_hoa_don tt
       LEFT JOIN nguoi_dung nd ON nd.ma_nguoi_dung = tt.nguoi_tao
       WHERE tt.ma_hoa_don IN (${invoiceIds.map(() => '?').join(',')})
       ORDER BY tt.ngay_tao DESC`,
      invoiceIds
    );
    const paymentsByInvoice = {};
    payments.forEach((payment) => {
      if (!paymentsByInvoice[payment.ma_hoa_don]) paymentsByInvoice[payment.ma_hoa_don] = [];
      paymentsByInvoice[payment.ma_hoa_don].push(payment);
    });

    res.json(rows.map((row) => {
      const total = Number(row.tong_tien);
      const paid = Number(row.da_thanh_toan);
      const pending = Number(row.cho_xac_nhan);
      const balance = Math.max(0, total - paid);
      let status = 'ChuaThanhToan';
      if (balance === 0) status = 'DaThanhToan';
      else if (Number(row.qua_han)) status = 'QuaHan';
      else if (pending > 0) status = 'ChoXacNhan';
      else if (paid > 0) status = 'ThanhToanMotPhan';

      return {
        ...row,
        tong_tien: total,
        da_thanh_toan: paid,
        cho_xac_nhan: pending,
        con_no: balance,
        trang_thai: status,
        hop_dong: {
          ma_hop_dong: row.ma_hop_dong,
          ma_nguoi_thue: row.ma_nguoi_thue,
          nguoi_thue: row.nguoi_thue_ho_ten,
          phong: row.phong_tieu_de || `Phòng ${row.phong_so_phong || ''}`,
          ten_khu_tro: row.ten_khu_tro,
        },
        thanh_toan: paymentsByInvoice[row.ma_hoa_don] || [],
      };
    }));
  } catch (error) {
    console.error('HOA DON GET ERROR:', error);
    res.status(500).json({ error: error.message });
  }
};

const create = async (req, res) => {
  let connection;
  try {
    const contractId = Number(req.body.ma_hop_dong);
    const period = parsePeriod(req.body.ky_thanh_toan);
    const dueDate = parseDate(req.body.han_thanh_toan);
    if (!Number.isInteger(contractId) || contractId < 1) return res.status(400).json({ error: 'Hợp đồng không hợp lệ.' });
    if (!period || !dueDate) return res.status(400).json({ error: 'Kỳ hóa đơn hoặc hạn thanh toán không hợp lệ.' });
    if (dueDate < period) return res.status(400).json({ error: 'Hạn thanh toán không được trước kỳ hóa đơn.' });

    const electricityPrevious = parseNonNegative(req.body.chi_so_dien_cu, 'Chỉ số điện cũ');
    const electricityCurrent = parseNonNegative(req.body.chi_so_dien_moi, 'Chỉ số điện mới');
    const electricityRate = parseNonNegative(req.body.don_gia_dien, 'Đơn giá điện');
    const waterPrevious = parseNonNegative(req.body.chi_so_nuoc_cu, 'Chỉ số nước cũ');
    const waterCurrent = parseNonNegative(req.body.chi_so_nuoc_moi, 'Chỉ số nước mới');
    const waterRate = parseNonNegative(req.body.don_gia_nuoc, 'Đơn giá nước');
    const otherFee = parseNonNegative(req.body.phi_khac, 'Phí khác');
    if (![electricityRate, waterRate, otherFee].every(Number.isInteger)) {
      return res.status(400).json({ error: 'Đơn giá và phí khác phải là số nguyên đồng.' });
    }
    if (electricityCurrent < electricityPrevious || waterCurrent < waterPrevious) {
      return res.status(400).json({ error: 'Chỉ số mới phải lớn hơn hoặc bằng chỉ số cũ.' });
    }

    const electricityAmount = Math.round((electricityCurrent - electricityPrevious) * electricityRate);
    const waterAmount = Math.round((waterCurrent - waterPrevious) * waterRate);
    const note = String(req.body.ghi_chu || '').trim() || null;

    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [contractRows] = await connection.query(
      `SELECT h.ma_hop_dong, h.ma_nguoi_thue, h.ma_phong, h.ngay_bat_dau, h.ngay_ket_thuc,
              h.gia_thue, h.trang_thai, k.ma_chu_tro
       FROM hop_dong h
       JOIN phong_tro p ON p.ma_phong = h.ma_phong
       JOIN khu_tro k ON k.ma_khu_tro = p.ma_khu_tro
       WHERE h.ma_hop_dong = ? LIMIT 1 FOR UPDATE`,
      [contractId]
    );
    const contract = contractRows[0];
    if (!contract) {
      await connection.rollback();
      return res.status(404).json({ error: 'Không tìm thấy hợp đồng.' });
    }
    if (req.user.role !== 'QuanTri' && String(contract.ma_chu_tro) !== String(req.user.id)) {
      await connection.rollback();
      return res.status(403).json({ error: 'Hợp đồng không thuộc khu trọ của bạn.' });
    }
    if (contract.trang_thai !== 'DangHieuLuc') {
      await connection.rollback();
      return res.status(409).json({ error: 'Chỉ hợp đồng đang hiệu lực mới lập được hóa đơn.' });
    }
    const contractStartPeriod = String(contract.ngay_bat_dau).slice(0, 7);
    const contractEndPeriod = contract.ngay_ket_thuc ? String(contract.ngay_ket_thuc).slice(0, 7) : null;
    if (period.slice(0, 7) < contractStartPeriod || (contractEndPeriod && period.slice(0, 7) > contractEndPeriod)) {
      await connection.rollback();
      return res.status(400).json({ error: 'Kỳ hóa đơn nằm ngoài thời hạn hợp đồng.' });
    }

    const roomAmount = Number(contract.gia_thue);
    const totalAmount = roomAmount + electricityAmount + waterAmount + otherFee;
    const [result] = await connection.query(
      `INSERT INTO hoa_don
       (ma_hop_dong, ky_thanh_toan, han_thanh_toan, tien_phong,
        chi_so_dien_cu, chi_so_dien_moi, don_gia_dien, tien_dien,
        chi_so_nuoc_cu, chi_so_nuoc_moi, don_gia_nuoc, tien_nuoc,
        phi_khac, tong_tien, ghi_chu, nguoi_tao)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [contractId, period, dueDate, roomAmount, electricityPrevious, electricityCurrent, electricityRate, electricityAmount,
        waterPrevious, waterCurrent, waterRate, waterAmount, otherFee, totalAmount, note, req.user.id]
    );
    await connection.commit();
    await notifyUser({
      userId: contract.ma_nguoi_thue,
      title: 'Hóa đơn mới',
      body: `Hóa đơn kỳ ${period.slice(0, 7)} đã phát hành: ${totalAmount.toLocaleString('vi-VN')} đ, hạn ${dueDate}.`,
      type: 'HoaDon',
    });
    res.status(201).json({ success: true, ma_hoa_don: result.insertId, tong_tien: totalAmount });
  } catch (error) {
    if (connection) await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Kỳ này đã có hóa đơn cho hợp đồng.' });
    if (error.message.includes('phải là số không âm')) return res.status(400).json({ error: error.message });
    console.error('HOA DON CREATE ERROR:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

const createPayment = async (req, res) => {
  let connection;
  try {
    const amount = Number(req.body.so_tien);
    const method = String(req.body.phuong_thuc || '').trim();
    const note = String(req.body.noi_dung || '').trim() || null;
    const reference = String(req.body.ma_giao_dich || '').trim() || null;
    if (!Number.isInteger(amount) || amount <= 0) return res.status(400).json({ error: 'Số tiền phải là số nguyên đồng lớn hơn 0.' });
    if (!method || method.length > 50) return res.status(400).json({ error: 'Phương thức thanh toán không hợp lệ.' });

    connection = await pool.getConnection();
    await connection.beginTransaction();
    const invoice = await getInvoiceForUpdate(connection, req.params.id);
    if (!invoice) {
      await connection.rollback();
      return res.status(404).json({ error: 'Không tìm thấy hóa đơn.' });
    }
    const access = checkInvoiceAccess(req, res, invoice);
    if (!access) {
      await connection.rollback();
      return;
    }
    if (!access.isTenant) {
      await connection.rollback();
      return res.status(403).json({ error: 'Chỉ người thuê có thể gửi xác nhận thanh toán.' });
    }

    const [totals] = await connection.query(
      `SELECT
         COALESCE(SUM(CASE WHEN trang_thai = 'DaXacNhan' THEN so_tien ELSE 0 END), 0) AS da_thanh_toan,
         COALESCE(SUM(CASE WHEN trang_thai = 'ChoXacNhan' THEN so_tien ELSE 0 END), 0) AS cho_xac_nhan
       FROM thanh_toan_hoa_don WHERE ma_hoa_don = ?`,
      [invoice.ma_hoa_don]
    );
    const available = Number(invoice.tong_tien) - Number(totals[0].da_thanh_toan) - Number(totals[0].cho_xac_nhan);
    if (amount > available) {
      await connection.rollback();
      return res.status(409).json({ error: `Số tiền vượt số dư có thể thanh toán (${Math.max(0, available).toLocaleString('vi-VN')} đ).` });
    }

    const [result] = await connection.query(
      `INSERT INTO thanh_toan_hoa_don
       (ma_hoa_don, ma_nguoi_nop, nguoi_tao, so_tien, phuong_thuc, ma_giao_dich, noi_dung, trang_thai)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'ChoXacNhan')`,
      [invoice.ma_hoa_don, req.user.id, req.user.id, amount, method, reference, note]
    );
    await connection.commit();
    await notifyUser({
      userId: invoice.ma_chu_tro,
      title: 'Có khoản thanh toán cần xác nhận',
      body: `Người thuê đã gửi ${amount.toLocaleString('vi-VN')} đ cho hóa đơn #${invoice.ma_hoa_don}.`,
      type: 'ThanhToan',
    });
    res.status(201).json({ success: true, ma_thanh_toan: result.insertId, trang_thai: 'ChoXacNhan' });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('HOA DON PAYMENT CREATE ERROR:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

const recordPayment = async (req, res) => {
  let connection;
  try {
    const amount = Number(req.body.so_tien);
    const method = String(req.body.phuong_thuc || 'Tiền mặt').trim();
    const note = String(req.body.noi_dung || '').trim() || null;
    const reference = String(req.body.ma_giao_dich || '').trim() || null;
    if (!Number.isInteger(amount) || amount <= 0) return res.status(400).json({ error: 'Số tiền phải là số nguyên đồng lớn hơn 0.' });

    connection = await pool.getConnection();
    await connection.beginTransaction();
    const invoice = await getInvoiceForUpdate(connection, req.params.id);
    if (!invoice) {
      await connection.rollback();
      return res.status(404).json({ error: 'Không tìm thấy hóa đơn.' });
    }
    const access = checkInvoiceAccess(req, res, invoice);
    if (!access) {
      await connection.rollback();
      return;
    }
    if (!access.isOwner && !access.isAdmin) {
      await connection.rollback();
      return res.status(403).json({ error: 'Chỉ chủ trọ hoặc quản trị viên được ghi nhận tiền đã thu.' });
    }

    const [totals] = await connection.query(
      `SELECT
         COALESCE(SUM(CASE WHEN trang_thai = 'DaXacNhan' THEN so_tien ELSE 0 END), 0) AS da_thanh_toan,
         COALESCE(SUM(CASE WHEN trang_thai = 'ChoXacNhan' THEN so_tien ELSE 0 END), 0) AS cho_xac_nhan
       FROM thanh_toan_hoa_don WHERE ma_hoa_don = ?`,
      [invoice.ma_hoa_don]
    );
    const available = Number(invoice.tong_tien) - Number(totals[0].da_thanh_toan) - Number(totals[0].cho_xac_nhan);
    if (amount > available) {
      await connection.rollback();
      return res.status(409).json({ error: `Số tiền vượt số dư có thể ghi nhận (${Math.max(0, available).toLocaleString('vi-VN')} đ).` });
    }

    const [result] = await connection.query(
      `INSERT INTO thanh_toan_hoa_don
       (ma_hoa_don, ma_nguoi_nop, nguoi_tao, nguoi_xac_nhan, so_tien, phuong_thuc,
        ma_giao_dich, noi_dung, trang_thai, ngay_xac_nhan)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'DaXacNhan', NOW())`,
      [invoice.ma_hoa_don, invoice.ma_nguoi_thue, req.user.id, req.user.id, amount, method, reference, note]
    );
    await connection.commit();
    await notifyUser({
      userId: invoice.ma_nguoi_thue,
      title: 'Thanh toán đã được ghi nhận',
      body: `Chủ trọ đã ghi nhận ${amount.toLocaleString('vi-VN')} đ cho hóa đơn #${invoice.ma_hoa_don}.`,
      type: 'ThanhToan',
    });
    res.status(201).json({ success: true, ma_thanh_toan: result.insertId, trang_thai: 'DaXacNhan' });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('HOA DON PAYMENT RECORD ERROR:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

const updatePaymentStatus = async (req, res) => {
  let connection;
  try {
    const status = String(req.body.trang_thai || '').trim();
    if (!['DaXacNhan', 'TuChoi'].includes(status)) return res.status(400).json({ error: 'Trạng thái thanh toán không hợp lệ.' });

    connection = await pool.getConnection();
    await connection.beginTransaction();
    const invoice = await getInvoiceForUpdate(connection, req.params.id);
    if (!invoice) {
      await connection.rollback();
      return res.status(404).json({ error: 'Không tìm thấy hóa đơn.' });
    }
    const access = checkInvoiceAccess(req, res, invoice);
    if (!access) {
      await connection.rollback();
      return;
    }
    if (!access.isOwner && !access.isAdmin) {
      await connection.rollback();
      return res.status(403).json({ error: 'Chỉ chủ trọ hoặc quản trị viên được xác nhận khoản thanh toán.' });
    }

    const [paymentRows] = await connection.query(
      'SELECT * FROM thanh_toan_hoa_don WHERE ma_thanh_toan = ? AND ma_hoa_don = ? LIMIT 1 FOR UPDATE',
      [req.params.paymentId, invoice.ma_hoa_don]
    );
    const payment = paymentRows[0];
    if (!payment) {
      await connection.rollback();
      return res.status(404).json({ error: 'Không tìm thấy khoản thanh toán.' });
    }
    if (payment.trang_thai !== 'ChoXacNhan') {
      await connection.rollback();
      return res.status(409).json({ error: 'Khoản thanh toán đã được xử lý.' });
    }

    if (status === 'DaXacNhan') {
      const [totals] = await connection.query(
        `SELECT COALESCE(SUM(CASE WHEN trang_thai = 'DaXacNhan' THEN so_tien ELSE 0 END), 0) AS da_thanh_toan
         FROM thanh_toan_hoa_don WHERE ma_hoa_don = ?`,
        [invoice.ma_hoa_don]
      );
      if (Number(totals[0].da_thanh_toan) + Number(payment.so_tien) > Number(invoice.tong_tien)) {
        await connection.rollback();
        return res.status(409).json({ error: 'Xác nhận khoản này sẽ vượt tổng hóa đơn.' });
      }
    }

    await connection.query(
      `UPDATE thanh_toan_hoa_don
       SET trang_thai = ?, nguoi_xac_nhan = ?, ngay_xac_nhan = NOW()
       WHERE ma_thanh_toan = ?`,
      [status, req.user.id, payment.ma_thanh_toan]
    );
    await connection.commit();
    await notifyUser({
      userId: invoice.ma_nguoi_thue,
      title: status === 'DaXacNhan' ? 'Thanh toán đã được xác nhận' : 'Thanh toán bị từ chối',
      body: `Khoản ${Number(payment.so_tien).toLocaleString('vi-VN')} đ của hóa đơn #${invoice.ma_hoa_don} ${status === 'DaXacNhan' ? 'đã được xác nhận.' : 'chưa được xác nhận.'}`,
      type: 'ThanhToan',
    });
    res.json({ success: true, trang_thai: status });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('HOA DON PAYMENT STATUS ERROR:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = { getAll, create, createPayment, recordPayment, updatePaymentStatus };
