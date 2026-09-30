const pool = require('../config/db');

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS hoa_don (
      ma_hoa_don INT AUTO_INCREMENT PRIMARY KEY,
      ma_hop_dong INT NOT NULL,
      ky_thanh_toan DATE NOT NULL,
      han_thanh_toan DATE NOT NULL,
      tien_phong DECIMAL(14,0) NOT NULL,
      chi_so_dien_cu DECIMAL(12,3) NOT NULL DEFAULT 0,
      chi_so_dien_moi DECIMAL(12,3) NOT NULL DEFAULT 0,
      don_gia_dien DECIMAL(14,0) NOT NULL DEFAULT 0,
      tien_dien DECIMAL(14,0) NOT NULL DEFAULT 0,
      chi_so_nuoc_cu DECIMAL(12,3) NOT NULL DEFAULT 0,
      chi_so_nuoc_moi DECIMAL(12,3) NOT NULL DEFAULT 0,
      don_gia_nuoc DECIMAL(14,0) NOT NULL DEFAULT 0,
      tien_nuoc DECIMAL(14,0) NOT NULL DEFAULT 0,
      phi_khac DECIMAL(14,0) NOT NULL DEFAULT 0,
      tong_tien DECIMAL(14,0) NOT NULL,
      ghi_chu TEXT NULL,
      nguoi_tao VARCHAR(128) NULL,
      ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_hoa_don_hop_dong_ky (ma_hop_dong, ky_thanh_toan),
      KEY idx_hoa_don_ky_han (ky_thanh_toan, han_thanh_toan),
      CONSTRAINT fk_hoa_don_hop_dong FOREIGN KEY (ma_hop_dong)
        REFERENCES hop_dong(ma_hop_dong) ON DELETE CASCADE,
      CONSTRAINT fk_hoa_don_nguoi_tao FOREIGN KEY (nguoi_tao)
        REFERENCES nguoi_dung(ma_nguoi_dung) ON DELETE SET NULL,
      CONSTRAINT chk_hoa_don_tien CHECK (tien_phong >= 0 AND tien_dien >= 0 AND tien_nuoc >= 0 AND phi_khac >= 0 AND tong_tien >= 0),
      CONSTRAINT chk_hoa_don_chi_so CHECK (chi_so_dien_moi >= chi_so_dien_cu AND chi_so_nuoc_moi >= chi_so_nuoc_cu)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS thanh_toan_hoa_don (
      ma_thanh_toan INT AUTO_INCREMENT PRIMARY KEY,
      ma_hoa_don INT NOT NULL,
      ma_nguoi_nop VARCHAR(128) NULL,
      nguoi_tao VARCHAR(128) NULL,
      nguoi_xac_nhan VARCHAR(128) NULL,
      so_tien DECIMAL(14,0) NOT NULL,
      phuong_thuc VARCHAR(50) NOT NULL,
      ma_giao_dich VARCHAR(150) NULL,
      noi_dung TEXT NULL,
      trang_thai VARCHAR(20) NOT NULL DEFAULT 'ChoXacNhan',
      ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
      ngay_xac_nhan DATETIME NULL,
      KEY idx_tthd_hoa_don_trang_thai (ma_hoa_don, trang_thai),
      CONSTRAINT fk_tthd_hoa_don FOREIGN KEY (ma_hoa_don)
        REFERENCES hoa_don(ma_hoa_don) ON DELETE CASCADE,
      CONSTRAINT fk_tthd_nguoi_nop FOREIGN KEY (ma_nguoi_nop)
        REFERENCES nguoi_dung(ma_nguoi_dung) ON DELETE SET NULL,
      CONSTRAINT fk_tthd_nguoi_tao FOREIGN KEY (nguoi_tao)
        REFERENCES nguoi_dung(ma_nguoi_dung) ON DELETE SET NULL,
      CONSTRAINT fk_tthd_nguoi_xac_nhan FOREIGN KEY (nguoi_xac_nhan)
        REFERENCES nguoi_dung(ma_nguoi_dung) ON DELETE SET NULL,
      CONSTRAINT chk_tthd_so_tien CHECK (so_tien > 0),
      CONSTRAINT chk_tthd_trang_thai CHECK (trang_thai IN ('ChoXacNhan', 'DaXacNhan', 'TuChoi'))
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  const nullableAuditColumns = [
    { table: 'hoa_don', column: 'nguoi_tao', constraint: 'fk_hoa_don_nguoi_tao' },
    { table: 'thanh_toan_hoa_don', column: 'ma_nguoi_nop', constraint: 'fk_tthd_nguoi_nop' },
    { table: 'thanh_toan_hoa_don', column: 'nguoi_tao', constraint: 'fk_tthd_nguoi_tao' },
  ];
  for (const item of nullableAuditColumns) {
    const [columns] = await pool.query(
      `SELECT IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [item.table, item.column]
    );
    if (columns[0]?.IS_NULLABLE === 'NO') {
      await pool.query(`ALTER TABLE ${item.table} DROP FOREIGN KEY ${item.constraint}`);
      await pool.query(`ALTER TABLE ${item.table} MODIFY ${item.column} VARCHAR(128) NULL`);
      await pool.query(
        `ALTER TABLE ${item.table}
         ADD CONSTRAINT ${item.constraint} FOREIGN KEY (${item.column})
         REFERENCES nguoi_dung(ma_nguoi_dung) ON DELETE SET NULL`
      );
    }
  }

  console.log('Billing migration completed.');
}

migrate()
  .catch((error) => {
    console.error('Billing migration failed:', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
