import React, { useEffect, useState } from 'react';
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
import { KhuTro } from '@/types';
import { styles } from '@/styles/admin/rooms-management.styles';
import { styles as formStyles } from '@/styles/admin/room-form.styles';
import KhuTroFormModal from '@/components/admin/KhuTroFormModal';
import ActionSheetModal from '@/components/common/ActionSheetModal';
import { showAlert } from '@/utils/alert';

export default function KhuTroManagement() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [khuTroList, setKhuTroList] = useState<KhuTro[]>([]);
  const [loading, setLoading] = useState(true);

  const [formVisible, setFormVisible] = useState(false);
  const [editingKhuTro, setEditingKhuTro] = useState<KhuTro | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(isMobile ? 'cards' : 'table');

  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    setViewMode(isMobile ? 'cards' : 'table');
  }, [isMobile]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const response = await backendApi.get('/api/khu-tro');
      setKhuTroList(response.data || []);
    } catch (error) {
      console.log('Lỗi tải danh sách khu trọ:', error);
      showAlert('Lỗi', 'Không thể tải danh sách khu trọ.');
    } finally {
      setLoading(false);
    }
  };

  const filteredList = khuTroList.filter((k) => {
    const keyword = search.toLowerCase();
    const matchSearch =
      String(k.ten_khu_tro || '').toLowerCase().includes(keyword) ||
      String(k.dia_chi || '').toLowerCase().includes(keyword) ||
      String(k.thanh_pho || '').toLowerCase().includes(keyword);

    const matchStatus = statusFilter === 'ALL' || k.trang_thai === statusFilter;

    return matchSearch && matchStatus;
  });

  const stats = {
    total: khuTroList.length,
    active: khuTroList.filter((k) => k.trang_thai === 'HoatDong').length,
  };

  const openAddForm = () => {
    setEditingKhuTro(null);
    setFormVisible(true);
  };

  const openEditForm = (k: KhuTro) => {
    setEditingKhuTro(k);
    setFormVisible(true);
  };

  const confirmDelete = (k: KhuTro) => {
    showAlert(
      'Xóa khu trọ',
      `Bạn có chắc chắn muốn xóa khu trọ "${k.ten_khu_tro}" không? Việc này có thể ảnh hưởng đến các phòng thuộc khu trọ này.`,
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa', style: 'destructive', onPress: () => handleDelete(k.ma_khu_tro) },
      ]
    );
  };

  const handleDelete = async (id: number) => {
    try {
      setDeletingId(id);

      // Kiểm tra xem có phòng nào thuộc khu trọ này không qua backend
      const roomsRes = await backendApi.get(`/api/phong-tro?ma_khu_tro=${id}`);
      const roomCount = (roomsRes.data?.rooms || []).length;

      if (roomCount > 0) {
        showAlert('Không thể xóa', `Khu trọ này đang có ${roomCount} phòng. Vui lòng xóa các phòng trước.`);
        return;
      }

      const response = await backendApi.delete(`/api/khu-tro/${id}`);
      if (response.data.success) {
        setKhuTroList((prev) => prev.filter((k) => k.ma_khu_tro !== id));
        showAlert('Thành công', 'Đã xóa khu trọ.');
      }
    } catch (error: any) {
      console.log('Lỗi xóa khu trọ:', error);
      showAlert('Lỗi', 'Không thể xóa khu trọ: ' + (error.response?.data?.error || error.message));
    } finally {
      setDeletingId(null);
    }
  };

  const renderTable = () => (
    <ScrollView 
      style={styles.tableScroll} 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.tableScrollContent}
    >
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, { width: 50 }]}>ID</Text>
            <Text style={[styles.headerCell, styles.imageColumn, { textAlign: 'center' }]}>Ảnh</Text>
            <Text style={[styles.headerCell, styles.roomColumn]}>Tên khu trọ</Text>
            <Text style={[styles.headerCell, styles.khuTroColumn]}>Địa chỉ</Text>
            <Text style={[styles.headerCell, styles.statusColumn]}>Trạng thái</Text>
            <Text style={[styles.headerCell, styles.actionColumn, { textAlign: 'center' }]}>Thao tác</Text>
          </View>

          {/* Table Body */}
          {filteredList.length === 0 ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: '#888' }}>Không tìm thấy khu trọ nào.</Text>
            </View>
          ) : (
            filteredList.map((k) => (
              <View key={k.ma_khu_tro} style={styles.tableRow}>
                <View style={[styles.cell, { width: 50 }]}>
                  <Text style={{ fontSize: 13, color: '#555' }}>#{k.ma_khu_tro}</Text>
                </View>

                <View style={[styles.cell, styles.imageColumn]}>
                  {k.anh_dai_dien ? (
                    <Image source={{ uri: k.anh_dai_dien }} style={styles.roomThumb} />
                  ) : (
                    <View style={styles.roomThumbPlaceholder}>
                      <Text style={styles.roomThumbPlaceholderText}>🏠</Text>
                    </View>
                  )}
                </View>

                <View style={[styles.cell, styles.roomColumn]}>
                  <Text style={styles.roomTitle}>{k.ten_khu_tro || 'Chưa đặt tên'}</Text>
                </View>

                <View style={[styles.cell, styles.khuTroColumn]}>
                  <Text style={styles.khuTroName}>{k.dia_chi || 'Chưa có địa chỉ'}</Text>
                  <Text style={styles.khuTroAddress}>
                    {[k.phuong, k.quan_huyen, k.thanh_pho].filter(Boolean).join(', ')}
                  </Text>
                </View>

                <View style={[styles.cell, styles.statusColumn]}>
                  <View style={[
                    styles.statusBadge,
                    k.trang_thai === 'HoatDong' ? styles.statusTrong : styles.statusBaoTri
                  ]}>
                    <Text style={[
                      styles.statusBadgeText,
                      k.trang_thai === 'HoatDong' ? styles.statusTrongText : styles.statusBaoTriText
                    ]}>
                      {k.trang_thai === 'HoatDong' ? 'Hoạt động' : 'Tạm dừng'}
                    </Text>
                  </View>
                </View>

                <View style={[styles.cell, styles.actionColumn]}>
                  <View style={styles.actionCell}>
                    <TouchableOpacity style={styles.detailButton} onPress={() => openEditForm(k)}>
                      <Text style={styles.detailButtonText}>Sửa</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.deleteButton} 
                      onPress={() => confirmDelete(k)}
                      disabled={deletingId === k.ma_khu_tro}
                    >
                      {deletingId === k.ma_khu_tro ? (
                        <ActivityIndicator size="small" color="#E53935" />
                      ) : (
                        <Text style={styles.deleteText}>Xóa</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
    </ScrollView>
  );

  const renderCards = () => (
    <View style={styles.mobileCardList}>
      {filteredList.length === 0 ? (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text style={{ color: '#888' }}>Không tìm thấy khu trọ nào.</Text>
        </View>
      ) : (
        filteredList.map((k) => (
          <View key={k.ma_khu_tro} style={styles.mobileRoomCard}>
            <View style={styles.mobileCardHeader}>
              {k.anh_dai_dien ? (
                <Image source={{ uri: k.anh_dai_dien }} style={styles.roomThumb} />
              ) : (
                <View style={styles.roomThumbPlaceholder}>
                  <Text style={styles.roomThumbPlaceholderText}>🏠</Text>
                </View>
              )}
              <View style={styles.mobileCardInfo}>
                <Text style={styles.roomTitle}>{k.ten_khu_tro || 'Chưa đặt tên'} <Text style={{fontSize: 12, color: '#888'}}>#{k.ma_khu_tro}</Text></Text>
                <Text style={styles.roomSub}>
                  {k.dia_chi}
                </Text>
                <Text style={styles.roomSub}>
                  {[k.phuong, k.quan_huyen, k.thanh_pho].filter(Boolean).join(', ')}
                </Text>
              </View>
            </View>

            <View style={styles.mobileCardMeta}>
              <View style={styles.mobileMetaRow}>
                <Text style={styles.mobileMetaLabel}>Trạng thái</Text>
                <Text style={[
                  styles.mobileMetaValue, 
                  { color: k.trang_thai === 'HoatDong' ? '#1D9A5E' : '#B7791F' }
                ]}>
                  {k.trang_thai === 'HoatDong' ? 'Hoạt động' : 'Tạm dừng'}
                </Text>
              </View>
            </View>

            <View style={styles.mobileCardActions}>
              <TouchableOpacity style={[styles.detailButton, { flex: 1 }]} onPress={() => openEditForm(k)}>
                <Text style={styles.detailButtonText}>Sửa</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.deleteButton, { flex: 1 }]} 
                onPress={() => confirmDelete(k)}
                disabled={deletingId === k.ma_khu_tro}
              >
                {deletingId === k.ma_khu_tro ? (
                  <ActivityIndicator size="small" color="#E53935" />
                ) : (
                  <Text style={styles.deleteText}>Xóa</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </View>
  );

  return (
    <View>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Danh sách khu trọ</Text>
          <Text style={styles.sectionSub}>Quản lý các khu trọ để thêm phòng vào.</Text>
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

          {/* Admin chỉ xem danh sách khu trọ do các chủ trọ sở hữu */}
        </View>
      </View>

      <View style={styles.quickStatsRow}>
        <TouchableOpacity
          style={[styles.quickStatCard, statusFilter === 'ALL' && styles.quickStatCardActive]}
          onPress={() => setStatusFilter('ALL')}
        >
          <Text style={styles.quickStatTitle}>Tổng khu trọ</Text>
          <Text style={styles.quickStatValue}>{stats.total}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickStatCard, statusFilter === 'HoatDong' && styles.quickStatCardActive]}
          onPress={() => setStatusFilter('HoatDong')}
        >
          <Text style={styles.quickStatTitle}>Đang hoạt động</Text>
          <Text style={[styles.quickStatValue, { color: '#1D9A5E' }]}>{stats.active}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm tên khu trọ, địa chỉ..."
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={styles.clearText}>×</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Đang tải danh sách khu trọ...</Text>
        </View>
      ) : (
        <>
          <View style={styles.resultInfo}>
            <Text style={styles.resultText}>
              Tìm thấy <Text style={styles.resultNumber}>{filteredList.length}</Text> kết quả
            </Text>
            <TouchableOpacity style={styles.refreshButton} onPress={loadData}>
              <Text style={styles.refreshText}>↻ Làm mới</Text>
            </TouchableOpacity>
          </View>
          
          {viewMode === 'table' ? renderTable() : renderCards()}
        </>
      )}

      {/* MODAL THÊM / SỬA KHU TRỌ */}
      {formVisible && (
        <KhuTroFormModal
          visible={formVisible}
          editingKhuTro={editingKhuTro}
          onClose={() => setFormVisible(false)}
          onSaved={() => {
            setFormVisible(false);
            loadData();
          }}
        />
      )}
    </View>
  );
}
