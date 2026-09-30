const pool = require('../config/db');

async function migrate() {
  const [columns] = await pool.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'danh_gia'
       AND COLUMN_NAME = 'trang_thai'`
  );

  if (columns.length === 0) {
    await pool.query(
      "ALTER TABLE danh_gia ADD COLUMN trang_thai VARCHAR(20) NOT NULL DEFAULT 'HienThi' AFTER noi_dung"
    );
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS yeu_cau_ho_tro (
      ma_yeu_cau INT AUTO_INCREMENT PRIMARY KEY,
      ma_nguoi_dung VARCHAR(128) NOT NULL,
      tieu_de VARCHAR(200) NOT NULL,
      noi_dung TEXT NOT NULL,
      trang_thai VARCHAR(20) NOT NULL DEFAULT 'Moi',
      phan_hoi_admin TEXT NULL,
      nguoi_xu_ly VARCHAR(128) NULL,
      ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
      ngay_cap_nhat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_ho_tro_nguoi_gui FOREIGN KEY (ma_nguoi_dung)
        REFERENCES nguoi_dung(ma_nguoi_dung) ON DELETE CASCADE,
      CONSTRAINT fk_ho_tro_nguoi_xu_ly FOREIGN KEY (nguoi_xu_ly)
        REFERENCES nguoi_dung(ma_nguoi_dung) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS dat_lich_xem (
      ma_dat_lich INT AUTO_INCREMENT PRIMARY KEY,
      ma_phong INT NOT NULL,
      ma_nguoi_thue VARCHAR(128) NOT NULL,
      thoi_gian_hen DATETIME NOT NULL,
      so_dien_thoai VARCHAR(20) NOT NULL,
      ghi_chu TEXT NULL,
      trang_thai VARCHAR(20) NOT NULL DEFAULT 'ChoXacNhan',
      ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
      ngay_cap_nhat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_dlx_phong FOREIGN KEY (ma_phong)
        REFERENCES phong_tro(ma_phong) ON DELETE CASCADE,
      CONSTRAINT fk_dlx_nguoi_thue FOREIGN KEY (ma_nguoi_thue)
        REFERENCES nguoi_dung(ma_nguoi_dung) ON DELETE CASCADE,
      CONSTRAINT chk_dlx_trang_thai CHECK (trang_thai IN ('ChoXacNhan', 'ChoKhachXacNhan', 'DaXacNhan', 'DaXem', 'TuChoi', 'DaHuy'))
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Nếu cột trang_thai từng là ENUM thì đổi sang VARCHAR để nhận trạng thái mới
  const [statusColumn] = await pool.query(
    `SELECT DATA_TYPE
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'dat_lich_xem'
       AND COLUMN_NAME = 'trang_thai'`
  );
  if (statusColumn[0] && String(statusColumn[0].DATA_TYPE).toLowerCase() === 'enum') {
    await pool.query("ALTER TABLE dat_lich_xem MODIFY trang_thai VARCHAR(20) NOT NULL DEFAULT 'ChoXacNhan'");
  }

  // Xóa MỌI CHECK constraint cũ của bảng (kể cả khi tên khác chk_dlx_trang_thai)
  const [appointmentChecks] = await pool.query(
    `SELECT CONSTRAINT_NAME
     FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE()
       AND TABLE_NAME = 'dat_lich_xem'
       AND CONSTRAINT_TYPE = 'CHECK'`
  );
  for (const check of appointmentChecks) {
    const name = check.CONSTRAINT_NAME;
    try {
      await pool.query(`ALTER TABLE dat_lich_xem DROP CHECK \`${name}\``);
    } catch (_error) {
      // MariaDB dùng DROP CONSTRAINT
      await pool.query(`ALTER TABLE dat_lich_xem DROP CONSTRAINT \`${name}\``);
    }
  }
  await pool.query(
    `ALTER TABLE dat_lich_xem
     ADD CONSTRAINT chk_dlx_trang_thai
     CHECK (trang_thai IN ('ChoXacNhan', 'ChoKhachXacNhan', 'DaXacNhan', 'DaXem', 'TuChoi', 'DaHuy'))`
  );

  console.log('Admin workflow migration completed.');
}

migrate()
  .catch((error) => {
    console.error('Admin workflow migration failed:', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());