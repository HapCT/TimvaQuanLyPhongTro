const pool = require('../config/db');

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS thong_bao (
      ma_thong_bao INT AUTO_INCREMENT PRIMARY KEY,
      ma_nguoi_dung VARCHAR(128) NOT NULL,
      tieu_de VARCHAR(200) NOT NULL,
      noi_dung TEXT NOT NULL,
      loai_thong_bao VARCHAR(50) NULL,
      da_doc TINYINT(1) NOT NULL DEFAULT 0,
      ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_tb_nguoi_dung FOREIGN KEY (ma_nguoi_dung)
        REFERENCES nguoi_dung(ma_nguoi_dung) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  const [indexes] = await pool.query(
    `SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'thong_bao'
       AND INDEX_NAME = 'idx_thong_bao_nguoi_dung'`
  );
  if (indexes.length === 0) {
    await pool.query(
      'CREATE INDEX idx_thong_bao_nguoi_dung ON thong_bao(ma_nguoi_dung, da_doc)'
    );
  }

  console.log('Notification migration completed.');
}

migrate()
  .catch((error) => {
    console.error('Notification migration failed:', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
