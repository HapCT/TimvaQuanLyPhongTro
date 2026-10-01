const pool = require('../config/db');

const contractColumns = [
  ['nguoi_thue_xac_nhan_boi', 'VARCHAR(128) NULL'],
  ['ngay_nguoi_thue_xac_nhan', 'DATETIME NULL'],
  ['chu_tro_xac_nhan_boi', 'VARCHAR(128) NULL'],
  ['ngay_chu_tro_xac_nhan', 'DATETIME NULL'],
  ['nguoi_tu_choi', 'VARCHAR(128) NULL'],
  ['ngay_tu_choi', 'DATETIME NULL'],
  ['ly_do_tu_choi', 'TEXT NULL'],
];

async function migrate() {
  for (const [column, definition] of contractColumns) {
    const [rows] = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'hop_dong'
         AND COLUMN_NAME = ?`,
      [column]
    );
    if (rows.length === 0) {
      await pool.query(`ALTER TABLE hop_dong ADD COLUMN ${column} ${definition}`);
    }
  }

  console.log('Contract approval migration completed.');
}

migrate()
  .catch((error) => {
    console.error('Contract approval migration failed:', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
