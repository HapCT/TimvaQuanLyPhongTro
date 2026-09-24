import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Image,
  useWindowDimensions,
} from 'react-native';

import { firebaseAuth } from '@/services/firebase';
import { backendApi } from '@/services/backend';
import { RoomWithDetails, RoomStatus, KhuTro, AnhPhong, TienIch, PhongTienIch, PhongTro } from '@/types';
import { styles } from '@/styles/admin/rooms-management.styles';
import { styles as formStyles } from '@/styles/admin/room-form.styles';
import RoomFormModal from '@/components/admin/RoomFormModal';
import ActionSheetModal from '@/components/common/ActionSheetModal';
import { showAlert } from '@/utils/alert';

interface RoomsManagementProps {
  onStatsUpdate?: (stats: { total: number; trong: number; daThue: number; baoTri: number }) => void;
}

// Các trạng thái chuẩn mà Admin có thể gán cho phòng
const STATUS_OPTIONS: { key: RoomStatus; label: string }[] = [
  { key: 'Trong', label: 'Còn trống' },
  { key: 'DaThue', label: 'Đã thuê' },
  { key: 'BaoTri', label: 'Bảo trì' },
];

export default function RoomsManagement({ onStatsUpdate }: RoomsManagementProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [rooms, setRooms] = useState<RoomWithDetails[]>([]);
  const [khuTroList, setKhuTroList] = useState<KhuTro[]>([]);
  const [tienIchList, setTienIchList] = useState<TienIch[]>([]);
  const [loading, setLoading] = useState(true);

  const [formVisible, setFormVisible] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomWithDetails | null>(null);
  const [statusSheetRoom, setStatusSheetRoom] = useState<RoomWithDetails | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [khuTroFilter, setKhuTroFilter] = useState<number | 'ALL'>('ALL');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(isMobile ? 'cards' : 'table');

  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    setViewMode(isMobile ? 'cards' : 'table');
  }, [isMobile]);

  useEffect(() => {
    loadData();
  }, []);

  // ==========================================
  // TẢI & GHÉP DỮ LIỆU
  // Vì phòng, khu trọ, ảnh, tiện ích nằm ở nhiều bảng khác nhau,
  // ta tải riêng từng bảng rồi ghép lại ở phía client cho chắc chắn.
  // ==========================================
  const loadData = async () => {
    try {
      setLoading(true);

      const response = await backendApi.get('/api/phong-tro');
      const { rooms, khuTroList, tienIchList } = response.data;
      
      setRooms(rooms || []);
      setKhuTroList(khuTroList || []);
      setTienIchList(tienIchList || []);
    } catch (e) {
      console.log('LOAD ROOMS ERROR:', e);
      showAlert('Lỗi', 'Có lỗi xảy ra khi tải danh sách phòng trọ.');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // THỐNG KÊ
  // ==========================================
  const stats = useMemo(() => {
    const total = rooms.length;
    const trong = rooms.filter((r) => normalizeStatus(r.trang_thai) === 'trong').length;
    const daThue = rooms.filter((r) => normalizeStatus(r.trang_thai) === 'dathue').length;
    const baoTri = rooms.filter((r) => normalizeStatus(r.trang_thai) === 'baotri').length;
    return { total, trong, daThue, baoTri };
  }, [rooms]);

  useEffect(() => {
    if (onStatsUpdate) onStatsUpdate(stats);
  }, [stats, onStatsUpdate]);

  // ==========================================
  // LỌC & TÌM KIẾM
  // ==========================================
  const filteredRooms = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return rooms.filter((room) => {
      const matchSearch =
        !keyword ||
        String(room.tieu_de || '').toLowerCase().includes(keyword) ||
        String(room.so_phong || '').toLowerCase().includes(keyword) ||
        String(room.khu_tro?.ten_khu_tro || '').toLowerCase().includes(keyword) ||
        String(room.khu_tro?.thanh_pho || '').toLowerCase().includes(keyword);

      const matchStatus = statusFilter === 'ALL' || normalizeStatus(room.trang_thai) === normalizeStatus(statusFilter);
      const matchKhuTro = khuTroFilter === 'ALL' || room.ma_khu_tro === khuTroFilter;

      return matchSearch && matchStatus && matchKhuTro;
    });
  }, [rooms, search, statusFilter, khuTroFilter]);

  // ==========================================
  // ĐỔI TRẠNG THÁI PHÒNG
  // ==========================================
  const changeStatus = (room: RoomWithDetails) => {
    setStatusSheetRoom(room);
  };

  const handleSelectStatus = async (statusKey: string) => {
    const room = statusSheetRoom;
    setStatusSheetRoom(null);
    if (!room) return;
    if (normalizeStatus(room.trang_thai) === normalizeStatus(statusKey)) return;

    try {
      setUpdatingId(room.ma_phong);
      await backendApi.patch(`/api/phong-tro/${room.ma_phong}/trang-thai`, {
        trang_thai: statusKey,
      });

      setRooms((prev) =>
        prev.map((r) => (r.ma_phong === room.ma_phong ? { ...r, trang_thai: statusKey } : r))
      );
    } catch (e: any) {
      console.log('CHANGE STATUS ERROR:', e);
      showAlert('Lỗi', 'Có lỗi xảy ra khi đổi trạng thái: ' + (e.response?.data?.error || e.message));
    } finally {
      setUpdatingId(null);
    }
  };

  // ==========================================
  // XÓA PHÒNG
  // ==========================================
  const handleDelete = async (id: number) => {
    try {
      setDeletingId(id);
      const response = await backendApi.delete(`/api/phong-tro/${id}`);
      if (response.data.success) {
        setRooms((prev) => prev.filter((r) => r.ma_phong !== id));
        showAlert('Thành công', 'Đã xóa phòng trọ.');
      }
    } catch (e: any) {
      console.log('DELETE ROOM ERROR:', e);
      showAlert('Lỗi', 'Không thể xóa phòng trọ: ' + (e.response?.data?.error || e.message));
    } finally {
      setDeletingId(null);
    }
  };

  const deleteRoom = (room: RoomWithDetails) => {
    showAlert(
      'Xóa phòng trọ',
      `Bạn có chắc muốn xóa phòng "${room.tieu_de || room.so_phong}" không? Toàn bộ ảnh và tiện ích liên kết với phòng này cũng sẽ bị xóa.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => handleDelete(room.ma_phong),
        },
      ]
    );
  };

  const openAddForm = () => {
    if (khuTroList.length === 0) {
      showAlert(
        'Chưa có khu trọ',
        'Bạn cần tạo ít nhất một khu trọ (bảng khu_tro) trước khi thêm phòng.'
      );
      return;
    }
    setEditingRoom(null);
    setFormVisible(true);
  };

  const openEditForm = (room: RoomWithDetails) => {
    setEditingRoom(room);
    setFormVisible(true);
  };

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ==========================================
  // HIỂN THỊ
  // ==========================================
  const formatMoney = (value?: number | null) => {
    if (value === null || value === undefined) return '--';
    return value.toLocaleString('vi-VN') + ' đ';
  };

  const getStatusInfo = (status: RoomStatus | null) => {
    switch (normalizeStatus(status)) {
      case 'controng':
        return { text: 'Còn trống', badge: styles.statusTrong, text_: styles.statusTrongText };
      case 'dathue':
        return { text: 'Đã thuê', badge: styles.statusDaThue, text_: styles.statusDaThueText };
      case 'baotri':
        return { text: 'Bảo trì', badge: styles.statusBaoTri, text_: styles.statusBaoTriText };
      default:
        return { text: status || 'Chưa xác định', badge: styles.statusUnknown, text_: styles.statusUnknownText };
    }
  };

  const renderThumb = (room: RoomWithDetails) =>
    room.anh_dai_dien ? (
      <Image source={{ uri: room.anh_dai_dien }} style={styles.roomThumb} />
    ) : (
      <View style={styles.roomThumbPlaceholder}>
        <Text style={styles.roomThumbPlaceholderText}>🏠</Text>
      </View>
    );

  const renderDetailPanel = (room: RoomWithDetails) => (
    <View style={styles.detailPanel}>
      {!!room.mo_ta && (
        <View>
          <Text style={styles.detailLabel}>Mô tả</Text>
          <Text style={styles.detailText}>{room.mo_ta}</Text>
        </View>
      )}

      <View>
        <Text style={styles.detailLabel}>Địa chỉ khu trọ</Text>
        <Text style={styles.detailText}>
          {[room.khu_tro?.dia_chi, room.khu_tro?.phuong, room.khu_tro?.quan_huyen, room.khu_tro?.thanh_pho]
            .filter(Boolean)
            .join(', ') || 'Chưa cập nhật'}
        </Text>
      </View>

      <View>
        <Text style={styles.detailLabel}>Chủ trọ</Text>
        <Text style={styles.detailText}>{room.ten_chu_tro || 'Chưa xác định'}</Text>
      </View>

      <View>
        <Text style={styles.detailLabel}>Tiện ích</Text>
        {room.danh_sach_tien_ich.length === 0 ? (
          <Text style={styles.emptyAmenityText}>Chưa có tiện ích nào được thêm.</Text>
        ) : (
          <View style={styles.amenityRow}>
            {room.danh_sach_tien_ich.map((t) => (
              <View key={t.ma_tien_ich} style={styles.amenityChip}>
                {!!t.bieu_tuong && <Text>{t.bieu_tuong}</Text>}
                <Text style={styles.amenityChipText}>{t.ten_tien_ich}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View>
        <Text style={styles.detailLabel}>Hình ảnh ({room.danh_sach_anh.length})</Text>
        {room.danh_sach_anh.length === 0 ? (
          <Text style={styles.emptyAmenityText}>Chưa có hình ảnh nào.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.detailImageRow}>
              {room.danh_sach_anh.map((a) => (
                <View key={a.ma_anh}>
                  <Image source={{ uri: a.duong_dan_anh }} style={styles.detailImage} />
                  {a.anh_chinh && (
                    <View style={styles.mainImageDot}>
                      <Text style={styles.mainImageDotText}>Chính</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    </View>
  );

  const renderActions = (room: RoomWithDetails) => (
    <View style={styles.actionCell}>
      <TouchableOpacity style={styles.detailButton} onPress={() => toggleExpand(room.ma_phong)}>
        <Text style={styles.detailButtonText}>{expandedIds.has(room.ma_phong) ? 'Thu gọn' : 'Chi tiết'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.detailButton} onPress={() => openEditForm(room)}>
        <Text style={styles.detailButtonText}>Sửa</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.statusButton}
        onPress={() => changeStatus(room)}
        disabled={updatingId === room.ma_phong}
      >
        {updatingId === room.ma_phong ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : (
          <Text style={styles.statusButtonText}>Đổi trạng thái</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteRoom(room)}
        disabled={deletingId === room.ma_phong}
      >
        {deletingId === room.ma_phong ? (
          <ActivityIndicator size="small" color="#E53935" />
        ) : (
          <Text style={styles.deleteText}>Xóa</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Đang tải danh sách phòng trọ...</Text>
      </View>
    );
  }

  return (
    <View>
      {/* HEADER & CHUYỂN CHẾ ĐỘ XEM */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Danh sách phòng trọ</Text>
          <Text style={styles.sectionSub}>Quản lý toàn bộ phòng trọ trên hệ thống.</Text>
        </View>

        <View style={styles.viewToggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'cards' && styles.toggleBtnActive]}
            onPress={() => setViewMode('cards')}
          >
            <Text style={[styles.toggleBtnText, viewMode === 'cards' && styles.toggleBtnTextActive]}>Thẻ</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'table' && styles.toggleBtnActive]}
            onPress={() => setViewMode('table')}
          >
            <Text style={[styles.toggleBtnText, viewMode === 'table' && styles.toggleBtnTextActive]}>Bảng</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* QUICK STATS */}
      <View style={styles.quickStatsRow}>
        <TouchableOpacity
          style={[styles.quickStatCard, statusFilter === 'ALL' && styles.quickStatCardActive]}
          onPress={() => setStatusFilter('ALL')}
        >
          <Text style={styles.quickStatTitle}>Tổng số phòng</Text>
          <Text style={styles.quickStatValue}>{stats.total}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickStatCard, statusFilter === 'Trong' && styles.quickStatCardActive]}
          onPress={() => setStatusFilter('Trong')}
        >
          <Text style={styles.quickStatTitle}>Còn trống</Text>
          <Text style={[styles.quickStatValue, { color: '#1D9A5E' }]}>{stats.trong}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickStatCard, statusFilter === 'DaThue' && styles.quickStatCardActive]}
          onPress={() => setStatusFilter('DaThue')}
        >
          <Text style={styles.quickStatTitle}>Đã thuê</Text>
          <Text style={[styles.quickStatValue, { color: '#007AFF' }]}>{stats.daThue}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickStatCard, statusFilter === 'BaoTri' && styles.quickStatCardActive]}
          onPress={() => setStatusFilter('BaoTri')}
        >
          <Text style={styles.quickStatTitle}>Bảo trì</Text>
          <Text style={[styles.quickStatValue, { color: '#B7791F' }]}>{stats.baoTri}</Text>
        </TouchableOpacity>
      </View>

      {/* SEARCH */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm theo tiêu đề, số phòng hoặc tên khu trọ..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* FILTER THEO KHU TRỌ */}
      {khuTroList.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Khu trọ:</Text>
            <TouchableOpacity
              style={[styles.filterButton, khuTroFilter === 'ALL' && styles.filterButtonActive]}
              onPress={() => setKhuTroFilter('ALL')}
            >
              <Text style={[styles.filterText, khuTroFilter === 'ALL' && styles.filterTextActive]}>Tất cả</Text>
            </TouchableOpacity>
            {khuTroList.map((k) => (
              <TouchableOpacity
                key={k.ma_khu_tro}
                style={[styles.filterButton, khuTroFilter === k.ma_khu_tro && styles.filterButtonActive]}
                onPress={() => setKhuTroFilter(k.ma_khu_tro)}
              >
                <Text style={[styles.filterText, khuTroFilter === k.ma_khu_tro && styles.filterTextActive]}>
                  {k.ten_khu_tro || `Khu #${k.ma_khu_tro}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      {/* RESULT & REFRESH */}
      <View style={styles.resultInfo}>
        <Text style={styles.resultText}>
          Hiển thị <Text style={styles.resultNumber}>{filteredRooms.length}</Text> / {rooms.length} phòng
        </Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadData}>
          <Text style={styles.refreshText}>Làm mới danh sách</Text>
        </TouchableOpacity>
      </View>

      {/* DANH SÁCH PHÒNG */}
      {filteredRooms.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🏠</Text>
          <Text style={styles.emptyTitle}>Không tìm thấy phòng nào</Text>
          <Text style={styles.emptyText}>
            {rooms.length === 0 ? 'Chưa có phòng trọ nào trong hệ thống.' : 'Thử thay đổi từ khóa hoặc bộ lọc.'}
          </Text>
        </View>
      ) : viewMode === 'cards' ? (
        /* DẠNG THẺ */
        <View style={styles.mobileCardList}>
          {filteredRooms.map((room) => {
            const status = getStatusInfo(room.trang_thai);
            const expanded = expandedIds.has(room.ma_phong);
            return (
              <View key={room.ma_phong} style={styles.mobileRoomCard}>
                <View style={styles.mobileCardHeader}>
                  {renderThumb(room)}
                  <View style={styles.mobileCardInfo}>
                    <Text style={styles.roomTitle} numberOfLines={1}>
                      {room.tieu_de || `Phòng ${room.so_phong}`}
                    </Text>
                    <Text style={styles.roomSub}>
                      {room.khu_tro?.ten_khu_tro || 'Chưa rõ khu trọ'} • Phòng {room.so_phong}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, status.badge]}>
                    <Text style={[styles.statusBadgeText, status.text_]}>{status.text}</Text>
                  </View>
                </View>

                <View style={styles.mobileCardMeta}>
                  <View style={styles.mobileMetaRow}>
                    <Text style={styles.mobileMetaLabel}>Giá thuê:</Text>
                    <Text style={styles.mobileMetaValue}>{formatMoney(room.gia_thue)} / tháng</Text>
                  </View>
                  <View style={styles.mobileMetaRow}>
                    <Text style={styles.mobileMetaLabel}>Diện tích:</Text>
                    <Text style={styles.mobileMetaValue}>{room.dien_tich ? `${room.dien_tich} m²` : '--'}</Text>
                  </View>
                  <View style={styles.mobileMetaRow}>
                    <Text style={styles.mobileMetaLabel}>Tầng:</Text>
                    <Text style={styles.mobileMetaValue}>{room.tang ?? '--'}</Text>
                  </View>
                  <View style={styles.mobileMetaRow}>
                    <Text style={styles.mobileMetaLabel}>Số người tối đa:</Text>
                    <Text style={styles.mobileMetaValue}>{room.so_nguoi_toi_da ?? '--'}</Text>
                  </View>
                </View>

                <View style={styles.mobileCardActions}>{renderActions(room)}</View>

                {expanded && renderDetailPanel(room)}
              </View>
            );
          })}
        </View>
      ) : (
        /* DẠNG BẢNG */
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tableScroll}
          contentContainerStyle={styles.tableScrollContent}
        >
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, styles.imageColumn, { textAlign: 'center' }]}>Ảnh</Text>
              <Text style={[styles.headerCell, styles.roomColumn]}>Phòng</Text>
              <Text style={[styles.headerCell, styles.khuTroColumn]}>Khu trọ</Text>
              <Text style={[styles.headerCell, styles.priceColumn]}>Giá thuê</Text>
              <Text style={[styles.headerCell, styles.statusColumn]}>Trạng thái</Text>
              <Text style={[styles.headerCell, styles.actionColumn]}>Thao tác</Text>
            </View>

            {filteredRooms.map((room) => {
              const status = getStatusInfo(room.trang_thai);
              const expanded = expandedIds.has(room.ma_phong);
              return (
                <View key={room.ma_phong}>
                  <View style={styles.tableRow}>
                    <View style={[styles.imageColumn, styles.cell]}>{renderThumb(room)}</View>
                    <View style={[styles.roomColumn, styles.cell]}>
                      <Text style={styles.roomTitle} numberOfLines={1}>
                        {room.tieu_de || `Phòng ${room.so_phong}`}
                      </Text>
                      <Text style={styles.roomSub}>
                        Phòng {room.so_phong} • Tầng {room.tang ?? '--'}
                      </Text>
                    </View>
                    <View style={[styles.khuTroColumn, styles.cell]}>
                      <Text style={styles.khuTroName} numberOfLines={1}>
                        {room.khu_tro?.ten_khu_tro || 'Chưa rõ'}
                      </Text>
                      <Text style={styles.khuTroAddress} numberOfLines={1}>
                        {room.khu_tro?.thanh_pho || ''}
                      </Text>
                    </View>
                    <View style={[styles.priceColumn, styles.cell]}>
                      <Text style={styles.priceText}>{formatMoney(room.gia_thue)}</Text>
                      <Text style={styles.priceSub}>Cọc: {formatMoney(room.tien_coc)}</Text>
                    </View>
                    <View style={[styles.statusColumn, styles.cell]}>
                      <View style={[styles.statusBadge, status.badge]}>
                        <Text style={[styles.statusBadgeText, status.text_]}>{status.text}</Text>
                      </View>
                    </View>
                    <View style={[styles.actionColumn, styles.cell]}>{renderActions(room)}</View>
                  </View>

                  {expanded && <View style={{ paddingHorizontal: 12, paddingBottom: 16 }}>{renderDetailPanel(room)}</View>}
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      <RoomFormModal
        visible={formVisible}
        khuTroList={khuTroList}
        tienIchList={tienIchList}
        editingRoom={editingRoom}
        onClose={() => setFormVisible(false)}
        onSaved={loadData}
      />

      <ActionSheetModal
        visible={!!statusSheetRoom}
        title="Đổi trạng thái phòng"
        message={statusSheetRoom ? `Chọn trạng thái mới cho phòng "${statusSheetRoom.tieu_de || statusSheetRoom.so_phong}"` : ''}
        options={STATUS_OPTIONS.map((opt) => ({ key: opt.key as string, label: opt.label }))}
        onSelect={handleSelectStatus}
        onCancel={() => setStatusSheetRoom(null)}
      />
    </View>
  );
}

// Chuẩn hóa chuỗi trạng thái để so sánh không phân biệt hoa/thường hoặc khoảng trắng
function normalizeStatus(status: RoomStatus | null | undefined): string {
  return String(status || '').trim().toLowerCase().replace(/\s+/g, '');
}
