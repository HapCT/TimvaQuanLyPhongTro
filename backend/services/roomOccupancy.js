const getRoomOccupancy = async (queryable, roomId) => {
  const [rows] = await queryable.query(
    `SELECT
       COALESCE((
         SELECT SUM(COALESCE(dp.so_nguoi, 1))
         FROM hop_dong hd
         LEFT JOIN dat_phong dp ON dp.ma_dat_phong = hd.ma_dat_phong
         WHERE hd.ma_phong = ?
           AND hd.trang_thai IN ('ChoNguoiThueXacNhan', 'ChoChuTroXacNhan', 'DangHieuLuc')
       ), 0)
       + COALESCE((
         SELECT SUM(dp.so_nguoi)
         FROM dat_phong dp
         WHERE dp.ma_phong = ? AND dp.trang_thai = 'DaDuyet'
           AND NOT EXISTS (
             SELECT 1 FROM hop_dong hd WHERE hd.ma_dat_phong = dp.ma_dat_phong
           )
       ), 0) AS so_nguoi_dang_o`,
    [roomId, roomId]
  );
  return Number(rows[0]?.so_nguoi_dang_o || 0);
};

const getRoomOccupancyMap = async (queryable) => {
  const [rows] = await queryable.query(
    `SELECT occupied.ma_phong, SUM(occupied.so_nguoi) AS so_nguoi_dang_o
     FROM (
       SELECT hd.ma_phong, COALESCE(dp.so_nguoi, 1) AS so_nguoi
       FROM hop_dong hd
       LEFT JOIN dat_phong dp ON dp.ma_dat_phong = hd.ma_dat_phong
      WHERE hd.trang_thai IN ('ChoNguoiThueXacNhan', 'ChoChuTroXacNhan', 'DangHieuLuc')

       UNION ALL

       SELECT dp.ma_phong, dp.so_nguoi
       FROM dat_phong dp
       WHERE dp.trang_thai = 'DaDuyet'
         AND NOT EXISTS (
           SELECT 1 FROM hop_dong hd WHERE hd.ma_dat_phong = dp.ma_dat_phong
         )
     ) occupied
     GROUP BY occupied.ma_phong`
  );
  return new Map(rows.map((row) => [Number(row.ma_phong), Number(row.so_nguoi_dang_o)]));
};

module.exports = { getRoomOccupancy, getRoomOccupancyMap };
