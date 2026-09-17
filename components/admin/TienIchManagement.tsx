import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { styles } from '@/styles/admin/rooms-management.styles';
import { TienIch } from '@/types/room';
import { backendApi } from '@/services/backend';
import { showAlert } from '@/utils/alert';
import TienIchFormModal from './TienIchFormModal';

export default function TienIchManagement() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [tienIchs, setTienIchs] = useState<TienIch[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTienIch, setEditingTienIch] = useState<TienIch | null>(null);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  // We can force cards on mobile, table on desktop, or let user toggle
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(isMobile ? 'cards' : 'table');

  useEffect(() => {
    setViewMode(isMobile ? 'cards' : 'table');
  }, [isMobile]);

  useEffect(() => {
    fetchTienIchs();
  }, []);

  const fetchTienIchs = async () => {
    try {
      setLoading(true);
      const response = await backendApi.get('/api/tien-ich');
      setTienIchs(response.data || []);
    } catch (error) {
      console.log('FETCH TIEN ICH ERROR:', error);
      showAlert('Lỗi', 'Không thể tải danh sách tiện ích.');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingTienIch(null);
    setModalVisible(true);
  };

  const openEditModal = (tienIch: TienIch) => {
    setEditingTienIch(tienIch);
    setModalVisible(true);
  };

  const confirmDelete = (tienIch: TienIch) => {
    showAlert(
      'Xóa tiện ích',
      `Bạn có chắc muốn xóa tiện ích "${tienIch.ten_tien_ich}" không? Thao tác này không thể hoàn tác.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(tienIch.ma_tien_ich);
              await backendApi.delete(`/api/tien-ich/${tienIch.ma_tien_ich}`);
              showAlert('Thành công', 'Đã xóa tiện ích.');
              fetchTienIchs();
            } catch (error: any) {
              console.log('DELETE TIEN ICH ERROR:', error);
              const msg = error.response?.data?.error || 'Không thể xóa tiện ích lúc này.';
              showAlert('Lỗi', msg);
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const renderTable = () => (
    <View style={{ width: '100%' }}>
      <View style={styles.table}>
          {/* HEADER */}
          <View style={styles.tableHeader}>
            <View style={[styles.cell, { width: 80 }]}><Text style={styles.headerCell}>ID</Text></View>
            <View style={[styles.cell, { flex: 1, minWidth: 300 }]}><Text style={styles.headerCell}>Tên Tiện Ích</Text></View>
            <View style={[styles.cell, styles.actionColumn]}><Text style={styles.headerCell}>Thao tác</Text></View>
          </View>

          {/* ROWS */}
          {tienIchs.length === 0 ? (
            <View style={{ padding: 30, alignItems: 'center' }}>
              <Text style={{ color: '#888' }}>Không có tiện ích nào.</Text>
            </View>
          ) : (
            tienIchs.map((t) => (
              <View key={t.ma_tien_ich} style={styles.tableRow}>
                <View style={[styles.cell, { width: 80 }]}>
                  <Text style={{ fontSize: 13, color: '#555' }}>#{t.ma_tien_ich}</Text>
                </View>

                <View style={[styles.cell, { flex: 1, minWidth: 300 }]}>
                  <Text style={styles.roomTitle}>{t.ten_tien_ich}</Text>
                </View>

                <View style={[styles.cell, styles.actionColumn]}>
                  <View style={styles.actionCell}>
                    <TouchableOpacity style={styles.detailButton} onPress={() => openEditModal(t)}>
                      <Text style={styles.detailButtonText}>Sửa</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.deleteButton} 
                      onPress={() => confirmDelete(t)}
                      disabled={deletingId === t.ma_tien_ich}
                    >
                      {deletingId === t.ma_tien_ich ? (
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
    </View>
  );

  const renderCards = () => (
    <View style={styles.mobileCardList}>
      {tienIchs.length === 0 ? (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text style={{ color: '#888' }}>Không tìm thấy tiện ích nào.</Text>
        </View>
      ) : (
        tienIchs.map((t) => (
          <View key={t.ma_tien_ich} style={styles.mobileRoomCard}>
            <View style={styles.mobileCardHeader}>
              <View style={styles.mobileCardInfo}>
                <Text style={styles.roomTitle}>
                  {t.ten_tien_ich} <Text style={{fontSize: 12, color: '#888'}}>#{t.ma_tien_ich}</Text>
                </Text>
              </View>
            </View>

            <View style={styles.mobileCardActions}>
              <TouchableOpacity style={[styles.detailButton, { flex: 1 }]} onPress={() => openEditModal(t)}>
                <Text style={styles.detailButtonText}>Sửa</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.deleteButton, { flex: 1 }]} 
                onPress={() => confirmDelete(t)}
                disabled={deletingId === t.ma_tien_ich}
              >
                {deletingId === t.ma_tien_ich ? (
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
    <View style={{ flex: 1 }}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Danh sách tiện ích</Text>
          <Text style={styles.sectionSub}>Quản lý danh mục các tiện ích (Wifi, Chỗ để xe...) để gán cho các phòng trọ.</Text>
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

      <View style={styles.resultInfo}>
        <Text style={styles.resultText}>
          Tìm thấy <Text style={styles.resultNumber}>{tienIchs.length}</Text> tiện ích
        </Text>
        <TouchableOpacity style={styles.refreshButton} onPress={openAddModal}>
          <Text style={styles.refreshText}>+ Thêm mới</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {viewMode === 'table' ? renderTable() : renderCards()}
        </ScrollView>
      )}

      <TienIchFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSaved={fetchTienIchs}
        editingTienIch={editingTienIch}
      />
    </View>
  );
}
