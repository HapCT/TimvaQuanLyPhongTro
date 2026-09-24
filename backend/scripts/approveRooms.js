const pool = require('../config/db');
async function run() {
  const [r] = await pool.query("UPDATE phong_tro SET trang_thai_duyet = 'DaDuyet' WHERE trang_thai_duyet = 'ChoDuyet'");
  console.log('Updated rows:', r.affectedRows);
  const [rows] = await pool.query('SELECT ma_phong, tieu_de, trang_thai_duyet FROM phong_tro');
  console.log('All rooms:', JSON.stringify(rows, null, 2));
  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
