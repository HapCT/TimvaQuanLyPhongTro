-- =========================================================
-- SCHEMA MYSQL HOAN CHINH CHO db_phongtro
-- Yeu cau: MySQL 8.0.16+ (CHECK constraint)
-- ma_nguoi_dung = Firebase UID (chuoi)
-- Chay toan bo file tren database db_phongtro (khoi tao sach).
-- =========================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------
-- 1. Nguoi dung
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS nguoi_dung (
  ma_nguoi_dung   VARCHAR(128) PRIMARY KEY,
  ho_ten          VARCHAR(255) NULL,
  so_dien_thoai   VARCHAR(20)  NULL,
  anh_dai_dien    TEXT NULL,
  dia_chi         TEXT NULL,
  vai_tro         VARCHAR(20)  NOT NULL DEFAULT 'NguoiThue', -- NguoiThue | ChuTro | QuanTri
  email           VARCHAR(255) NULL,
  trang_thai      TINYINT(1) DEFAULT 1,
  ngay_tao        DATETIME DEFAULT CURRENT_TIMESTAMP,
  ngay_cap_nhat   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_nguoi_dung_email (email),
  CONSTRAINT chk_vai_tro CHECK (vai_tro IN ('NguoiThue', 'ChuTro', 'QuanTri'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------
-- 2. Khu tro
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS khu_tro (
  ma_khu_tro      INT AUTO_INCREMENT PRIMARY KEY,
  ma_chu_tro      VARCHAR(128) NOT NULL,
  ten_khu_tro     VARCHAR(255) NULL,
  mo_ta           TEXT NULL,
  dia_chi         VARCHAR(500) NULL,
  phuong          VARCHAR(100) NULL,
  quan_huyen      VARCHAR(100) NULL,
  thanh_pho       VARCHAR(100) NULL,
  vi_do           DOUBLE NULL,
  kinh_do         DOUBLE NULL,
  anh_dai_dien    TEXT NULL,
  trang_thai      VARCHAR(50) DEFAULT 'DangHoatDong',
  ngay_tao        DATETIME DEFAULT CURRENT_TIMESTAMP,
  ngay_cap_nhat   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_khu_tro_chu_tro FOREIGN KEY (ma_chu_tro)
    REFERENCES nguoi_dung(ma_nguoi_dung) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------
-- 3. Phong tro
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS phong_tro (
  ma_phong          INT AUTO_INCREMENT PRIMARY KEY,
  ma_khu_tro        INT NOT NULL,
  so_phong          VARCHAR(50) NULL,
  tieu_de           VARCHAR(255) NULL,
  mo_ta             TEXT NULL,
  dien_tich         DOUBLE NULL,
  gia_thue          DECIMAL(14,0) NOT NULL DEFAULT 0,
  tien_coc          DECIMAL(14,0) NOT NULL DEFAULT 0,
  tang              INT NULL,
  so_nguoi_toi_da   INT NOT NULL DEFAULT 1,
  trang_thai        VARCHAR(50) DEFAULT 'ConTrong',       -- ConTrong | DaThue | BaoTri
  trang_thai_duyet  VARCHAR(20) DEFAULT 'ChoDuyet',       -- ChoDuyet | DaDuyet | TuChoi
  ly_do_tu_choi     TEXT NULL,
  ngay_duyet        DATETIME NULL,
  nguoi_duyet       VARCHAR(128) NULL,
  ngay_tao          DATETIME DEFAULT CURRENT_TIMESTAMP,
  ngay_cap_nhat     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_phong_tro_khu_tro FOREIGN KEY (ma_khu_tro)
    REFERENCES khu_tro(ma_khu_tro) ON DELETE CASCADE,
  CONSTRAINT fk_phong_tro_nguoi_duyet FOREIGN KEY (nguoi_duyet)
    REFERENCES nguoi_dung(ma_nguoi_dung) ON DELETE SET NULL,
  CONSTRAINT chk_dien_tich CHECK (dien_tich IS NULL OR dien_tich > 0),
  CONSTRAINT chk_gia_thue CHECK (gia_thue >= 0),
  CONSTRAINT chk_tien_coc CHECK (tien_coc >= 0),
  CONSTRAINT chk_so_nguoi_toi_da CHECK (so_nguoi_toi_da > 0),
  CONSTRAINT chk_trang_thai_duyet CHECK (trang_thai_duyet IN ('ChoDuyet', 'DaDuyet', 'TuChoi'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------
-- 4. Anh phong
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS anh_phong (
  ma_anh          INT AUTO_INCREMENT PRIMARY KEY,
  ma_phong        INT NOT NULL,
  duong_dan_anh   TEXT NOT NULL,
  anh_chinh       TINYINT(1) DEFAULT 0,
  ngay_tao        DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_anh_phong_phong FOREIGN KEY (ma_phong)
    REFERENCES phong_tro(ma_phong) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------
-- 5. Tien ich
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS tien_ich (
  ma_tien_ich   INT AUTO_INCREMENT PRIMARY KEY,
  ten_tien_ich  VARCHAR(255) NOT NULL,
  bieu_tuong    VARCHAR(255) NULL,
  mo_ta         TEXT NULL,
  ngay_tao      DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_ten_tien_ich (ten_tien_ich)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------
-- 6. Tien ich cua tung phong (n-n)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS phong_tien_ich (
  ma_phong      INT NOT NULL,
  ma_tien_ich   INT NOT NULL,
  PRIMARY KEY (ma_phong, ma_tien_ich),
  CONSTRAINT fk_pti_phong FOREIGN KEY (ma_phong)
    REFERENCES phong_tro(ma_phong) ON DELETE CASCADE,
  CONSTRAINT fk_pti_tien_ich FOREIGN KEY (ma_tien_ich)
    REFERENCES tien_ich(ma_tien_ich) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------
-- 7. Yeu thich
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS yeu_thich (
  ma_nguoi_dung VARCHAR(128) NOT NULL,
  ma_phong      INT NOT NULL,
  ngay_tao      DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (ma_nguoi_dung, ma_phong),
  CONSTRAINT fk_yt_nguoi_dung FOREIGN KEY (ma_nguoi_dung)
    REFERENCES nguoi_dung(ma_nguoi_dung) ON DELETE CASCADE,
  CONSTRAINT fk_yt_phong FOREIGN KEY (ma_phong)
    REFERENCES phong_tro(ma_phong) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------
-- 8. Dat phong
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS dat_phong (
  ma_dat_phong              INT AUTO_INCREMENT PRIMARY KEY,
  ma_phong                  INT NOT NULL,
  ma_nguoi_thue             VARCHAR(128) NOT NULL,
  ngay_dat                  DATETIME DEFAULT CURRENT_TIMESTAMP,
  ngay_du_kien_nhan_phong   DATETIME NULL,
  ngay_du_kien_tra          DATETIME NULL,
  so_nguoi                  INT NOT NULL DEFAULT 1,
  ghi_chu                   TEXT NULL,
  trang_thai                VARCHAR(20) DEFAULT 'ChoDuyet', -- ChoDuyet | DaDuyet | TuChoi
  ngay_tao                  DATETIME DEFAULT CURRENT_TIMESTAMP,
  ngay_cap_nhat             DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_dat_phong_phong FOREIGN KEY (ma_phong)
    REFERENCES phong_tro(ma_phong) ON DELETE CASCADE,
  CONSTRAINT fk_dat_phong_nguoi_thue FOREIGN KEY (ma_nguoi_thue)
    REFERENCES nguoi_dung(ma_nguoi_dung) ON DELETE CASCADE,
  CONSTRAINT chk_so_nguoi_dat CHECK (so_nguoi > 0),
  CONSTRAINT chk_ngay_dat_phong CHECK (
    ngay_du_kien_tra IS NULL
    OR ngay_du_kien_nhan_phong IS NULL
    OR ngay_du_kien_tra >= ngay_du_kien_nhan_phong
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------
-- 9. Hop dong
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS hop_dong (
  ma_hop_dong     INT AUTO_INCREMENT PRIMARY KEY,
  ma_dat_phong    INT NULL,
  ma_nguoi_thue   VARCHAR(128) NOT NULL,
  ma_phong        INT NOT NULL,
  ngay_bat_dau    DATE NOT NULL,
  ngay_ket_thuc   DATE NULL,
  gia_thue        DECIMAL(14,0) NOT NULL,
  tien_coc        DECIMAL(14,0) NOT NULL DEFAULT 0,
  dieu_khoan      TEXT NULL,
  trang_thai      VARCHAR(30) DEFAULT 'DangHieuLuc',
  ngay_tao        DATETIME DEFAULT CURRENT_TIMESTAMP,
  ngay_cap_nhat   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_hd_dat_phong FOREIGN KEY (ma_dat_phong)
    REFERENCES dat_phong(ma_dat_phong) ON DELETE SET NULL,
  CONSTRAINT fk_hd_nguoi_thue FOREIGN KEY (ma_nguoi_thue)
    REFERENCES nguoi_dung(ma_nguoi_dung) ON DELETE CASCADE,
  CONSTRAINT fk_hd_phong FOREIGN KEY (ma_phong)
    REFERENCES phong_tro(ma_phong) ON DELETE CASCADE,
  CONSTRAINT chk_gia_hop_dong CHECK (gia_thue >= 0),
  CONSTRAINT chk_coc_hop_dong CHECK (tien_coc >= 0),
  CONSTRAINT chk_ngay_hop_dong CHECK (ngay_ket_thuc IS NULL OR ngay_ket_thuc >= ngay_bat_dau)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------
-- 10. Thanh toan
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS thanh_toan (
  ma_thanh_toan     INT AUTO_INCREMENT PRIMARY KEY,
  ma_hop_dong       INT NOT NULL,
  so_tien           DECIMAL(14,0) NOT NULL,
  ngay_thanh_toan   DATETIME DEFAULT CURRENT_TIMESTAMP,
  phuong_thuc       VARCHAR(50) NULL,
  noi_dung          TEXT NULL,
  ma_giao_dich      VARCHAR(150) NULL,
  trang_thai        VARCHAR(30) DEFAULT 'ChoThanhToan',
  ngay_tao          DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tt_hop_dong FOREIGN KEY (ma_hop_dong)
    REFERENCES hop_dong(ma_hop_dong) ON DELETE CASCADE,
  CONSTRAINT chk_so_tien_thanh_toan CHECK (so_tien > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------
-- 11. Danh gia
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS danh_gia (
  ma_danh_gia     INT AUTO_INCREMENT PRIMARY KEY,
  ma_nguoi_dung   VARCHAR(128) NOT NULL,
  ma_phong        INT NOT NULL,
  so_sao          INT NOT NULL,
  noi_dung        TEXT NULL,
  ngay_tao        DATETIME DEFAULT CURRENT_TIMESTAMP,
  ngay_cap_nhat   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_dg_nguoi_dung FOREIGN KEY (ma_nguoi_dung)
    REFERENCES nguoi_dung(ma_nguoi_dung) ON DELETE CASCADE,
  CONSTRAINT fk_dg_phong FOREIGN KEY (ma_phong)
    REFERENCES phong_tro(ma_phong) ON DELETE CASCADE,
  CONSTRAINT chk_so_sao CHECK (so_sao BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------
-- 12. Thong bao
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS thong_bao (
  ma_thong_bao    INT AUTO_INCREMENT PRIMARY KEY,
  ma_nguoi_dung   VARCHAR(128) NOT NULL,
  tieu_de         VARCHAR(200) NOT NULL,
  noi_dung        TEXT NOT NULL,
  loai_thong_bao  VARCHAR(50) NULL,
  da_doc          TINYINT(1) DEFAULT 0,
  ngay_tao        DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tb_nguoi_dung FOREIGN KEY (ma_nguoi_dung)
    REFERENCES nguoi_dung(ma_nguoi_dung) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------
-- 13. Ho so phap ly (giay to dang bai, luu tren Firebase Storage)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS ho_so_phap_ly (
  ma_ho_so      INT AUTO_INCREMENT PRIMARY KEY,
  ma_phong      INT NOT NULL,
  loai_giay_to  VARCHAR(50) NOT NULL,
  duong_dan     TEXT NOT NULL,
  ngay_tao      DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ho_so_phong FOREIGN KEY (ma_phong)
    REFERENCES phong_tro(ma_phong) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- =========================================================
-- INDEX
-- =========================================================
CREATE INDEX idx_khu_tro_chu_tro          ON khu_tro(ma_chu_tro);
CREATE INDEX idx_phong_tro_khu_tro        ON phong_tro(ma_khu_tro);
CREATE INDEX idx_phong_tro_trang_thai     ON phong_tro(trang_thai, trang_thai_duyet);
CREATE INDEX idx_phong_tro_gia_thue       ON phong_tro(gia_thue);
CREATE INDEX idx_anh_phong_phong          ON anh_phong(ma_phong);
CREATE INDEX idx_dat_phong_nguoi_thue     ON dat_phong(ma_nguoi_thue);
CREATE INDEX idx_dat_phong_phong          ON dat_phong(ma_phong);
CREATE INDEX idx_hop_dong_nguoi_thue      ON hop_dong(ma_nguoi_thue);
CREATE INDEX idx_hop_dong_phong           ON hop_dong(ma_phong);
CREATE INDEX idx_thanh_toan_hop_dong      ON thanh_toan(ma_hop_dong);
CREATE INDEX idx_danh_gia_phong           ON danh_gia(ma_phong);
CREATE INDEX idx_thong_bao_nguoi_dung     ON thong_bao(ma_nguoi_dung, da_doc);
CREATE INDEX idx_ho_so_phap_ly_phong      ON ho_so_phap_ly(ma_phong);

-- =========================================================
-- DU LIEU TIEN ICH MAU
-- =========================================================
INSERT IGNORE INTO tien_ich (ten_tien_ich, bieu_tuong, mo_ta) VALUES
('Wifi', 'wifi', 'Co Wifi'),
('May lanh', 'air-conditioner', 'Co may lanh'),
('May giat', 'washing-machine', 'Co may giat'),
('Tu lanh', 'refrigerator', 'Co tu lanh'),
('Giu xe', 'car', 'Co khu vuc giu xe'),
('Nha ve sinh rieng', 'bathroom', 'Nha ve sinh rieng trong phong'),
('Ban cong', 'balcony', 'Phong co ban cong'),
('Noi that', 'bed', 'Phong co noi that co ban');