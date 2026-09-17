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

import { supabase } from '@/services/supabase';
import { backendApi } from '@/services/backend';
import { User, RoleFilter } from '@/types';
import { styles } from '@/styles/admin/users-management.styles';
import { showAlert } from '@/utils/alert';

interface UsersManagementProps {
  onStatsUpdate?: (stats: { total: number; owners: number; tenants: number; admins: number }) => void;
}

export default function UsersManagement({ onStatsUpdate }: UsersManagementProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(isMobile ? 'cards' : 'table');

  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setViewMode(isMobile ? 'cards' : 'table');
  }, [isMobile]);

  useEffect(() => {
    loadUsers();
    loadCurrentAdmin();
  }, []);

  const loadCurrentAdmin = async () => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) setCurrentAdminId(authData.user.id);
    } catch (e) {
      console.log('GET CURRENT ADMIN ERROR:', e);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await backendApi.get('/api/users');
      setUsers(response.data || []);
    } catch (e) {
      console.log('LOAD USERS ERROR:', e);
      showAlert('Lỗi', 'Có lỗi xảy ra khi tải danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  };

  // Thống kê nhanh theo vai trò
  const stats = useMemo(() => {
    const total = users.length;
    const tenants = users.filter((u) => u.vai_tro === 'NguoiThue').length;
    const owners = users.filter((u) => u.vai_tro === 'ChuTro').length;
    const admins = users.filter((u) => u.vai_tro === 'Admin' || u.vai_tro === 'QuanTri').length;
    return { total, tenants, owners, admins };
  }, [users]);

  useEffect(() => {
    if (onStatsUpdate) onStatsUpdate(stats);
  }, [stats, onStatsUpdate]);

  // Bộ lọc tìm kiếm
  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchSearch =
        !keyword ||
        String(user.ho_ten || '').toLowerCase().includes(keyword) ||
        String(user.so_dien_thoai || '').toLowerCase().includes(keyword) ||
        String(user.ma_nguoi_dung || '').toLowerCase().includes(keyword);

      const matchRole =
        roleFilter === 'ALL' ||
        (roleFilter === 'Admin'
          ? user.vai_tro === 'Admin' || user.vai_tro === 'QuanTri'
          : user.vai_tro === roleFilter);

      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  const toggleLockUser = async (user: User) => {
    if (user.ma_nguoi_dung === currentAdminId) {
      showAlert('Không hợp lệ', 'Bạn không thể tự khóa tài khoản của chính mình.');
      return;
    }

    const isLocking = !user.is_locked;
    const actionText = isLocking ? 'Khóa' : 'Mở khóa';

    showAlert(
      `${actionText} tài khoản`,
      `Bạn có chắc muốn ${actionText.toLowerCase()} tài khoản "${user.ho_ten || 'này'}" không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: actionText,
          style: isLocking ? 'destructive' : 'default',
          onPress: async () => {
            try {
              setDeletingId(user.ma_nguoi_dung);
              await backendApi.put(`/api/users/${user.ma_nguoi_dung}/toggle-lock`, {
                is_locked: isLocking
              });
              
              showAlert('Thành công', `Đã ${actionText.toLowerCase()} tài khoản.`);
              loadUsers();
            } catch (e: any) {
              console.log('TOGGLE LOCK ERROR:', e);
              const msg = e.response?.data?.error || `Có lỗi xảy ra khi ${actionText.toLowerCase()} người dùng.`;
              showAlert('Lỗi', msg);
            } finally {
              setDeletingId(null);
            }
          }
        }
      ]
    );
  };

  // Helper format hiển thị
  const formatDate = (date?: string | null) => {
    if (!date) return '--';
    const d = new Date(date);
    return Number.isNaN(d.getTime()) ? '--' : d.toLocaleDateString('vi-VN');
  };

  const getRoleInfo = (user: User) => {
    const roleObj = (() => {
      switch (user.vai_tro) {
        case 'NguoiThue':
          return { text: 'Người thuê', badgeStyle: styles.roleNguoiThue };
        case 'ChuTro':
          return { text: 'Chủ trọ', badgeStyle: styles.roleChuTro };
        case 'Admin':
        case 'QuanTri':
          return { text: 'Quản trị viên', badgeStyle: styles.roleAdmin };
        default:
          return { text: user.vai_tro || 'Chưa xác định', badgeStyle: styles.roleUnknown };
      }
    })();

    if (user.is_locked) {
      return { text: '🔒 Bị khóa', badgeStyle: { backgroundColor: '#FEE2E2' } };
    }
    
    return roleObj;
  };

  const renderAvatar = (user: User) => (
    user.anh_dai_dien ? (
      <Image source={{ uri: user.anh_dai_dien }} style={styles.userAvatar} />
    ) : (
      <View style={styles.defaultAvatar}>
        <Text style={styles.defaultAvatarText}>{(user.ho_ten || 'U').charAt(0).toUpperCase()}</Text>
      </View>
    )
  );

  const renderAction = (user: User) => (
    user.ma_nguoi_dung === currentAdminId ? (
      <View style={styles.lockedButton}>
        <Text style={styles.lockedText}>Tài khoản của bạn</Text>
      </View>
    ) : (
      <TouchableOpacity
        style={[styles.deleteButton, user.is_locked ? { backgroundColor: '#E0F2FE', borderColor: '#BAE6FD' } : {}]}
        onPress={() => toggleLockUser(user)}
        disabled={deletingId === user.ma_nguoi_dung}
      >
        {deletingId === user.ma_nguoi_dung ? (
          <ActivityIndicator size="small" color={user.is_locked ? "#0284C7" : "#E53935"} />
        ) : (
          <Text style={[styles.deleteText, user.is_locked ? { color: '#0369A1' } : {}]}>
            {user.is_locked ? 'Mở khóa' : 'Khóa'}
          </Text>
        )}
      </TouchableOpacity>
    )
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Đang tải danh sách tài khoản...</Text>
      </View>
    );
  }

  return (
    <View>
      {/* HEADER & CHUYỂN CHẾ ĐỘ XEM */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Danh sách tất cả tài khoản</Text>
          <Text style={styles.sectionSub}>Quản lý toàn bộ tài khoản người thuê, chủ trọ và quản trị viên.</Text>
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
        <TouchableOpacity style={styles.quickStatCard} onPress={() => setRoleFilter('ALL')}>
          <Text style={styles.quickStatTitle}>Tổng tài khoản</Text>
          <Text style={styles.quickStatValue}>{stats.total}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickStatCard} onPress={() => setRoleFilter('NguoiThue')}>
          <Text style={styles.quickStatTitle}>Người thuê</Text>
          <Text style={[styles.quickStatValue, { color: '#007AFF' }]}>{stats.tenants}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickStatCard} onPress={() => setRoleFilter('ChuTro')}>
          <Text style={styles.quickStatTitle}>Chủ trọ</Text>
          <Text style={[styles.quickStatValue, { color: '#F59E0B' }]}>{stats.owners}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickStatCard} onPress={() => setRoleFilter('Admin')}>
          <Text style={styles.quickStatTitle}>Quản trị viên</Text>
          <Text style={[styles.quickStatValue, { color: '#EF4444' }]}>{stats.admins}</Text>
        </TouchableOpacity>
      </View>

      {/* SEARCH */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm theo họ tên, số điện thoại hoặc mã người dùng..."
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

      {/* FILTER BUTTONS */}
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Vai trò:</Text>
        {(
          [
            { key: 'ALL', label: `Tất cả (${users.length})` },
            { key: 'NguoiThue', label: `Người thuê (${stats.tenants})` },
            { key: 'ChuTro', label: `Chủ trọ (${stats.owners})` },
            { key: 'Admin', label: `Quản trị viên (${stats.admins})` },
          ] as const
        ).map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.filterButton, roleFilter === tab.key && styles.filterButtonActive]}
            onPress={() => setRoleFilter(tab.key)}
          >
            <Text style={[styles.filterText, roleFilter === tab.key && styles.filterTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* RESULT & REFRESH */}
      <View style={styles.resultInfo}>
        <Text style={styles.resultText}>
          Hiển thị <Text style={styles.resultNumber}>{filteredUsers.length}</Text> / {users.length} tài khoản
        </Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadUsers}>
          <Text style={styles.refreshText}>Làm mới danh sách</Text>
        </TouchableOpacity>
      </View>

      {/* DANH SÁCH TÀI KHOẢN */}
      {filteredUsers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Không tìm thấy tài khoản nào</Text>
          <Text style={styles.emptyText}>
            {users.length === 0 ? 'Chưa có tài khoản nào trong hệ thống.' : 'Thử thay đổi từ khóa hoặc bộ lọc.'}
          </Text>
        </View>
      ) : viewMode === 'cards' ? (
        /* DẠNG THẺ (MOBILE) */
        <View style={styles.mobileCardList}>
          {filteredUsers.map((user) => {
            const role = getRoleInfo(user);
            const isCurrentAdmin = user.ma_nguoi_dung === currentAdminId;
            return (
              <View key={user.ma_nguoi_dung} style={styles.mobileUserCard}>
                <View style={styles.mobileCardHeader}>
                  {renderAvatar(user)}
                  <View style={styles.mobileCardInfo}>
                    <Text style={styles.nameText} numberOfLines={1}>{user.ho_ten || 'Chưa cập nhật tên'}</Text>
                    <Text style={styles.phoneText}>{user.so_dien_thoai || 'Chưa có số ĐT'}</Text>
                    {isCurrentAdmin && <Text style={styles.currentAdminText}>Tài khoản của bạn</Text>}
                  </View>
                  <View style={[styles.roleBadge, role.badgeStyle]}>
                    <Text style={[styles.roleBadgeText, user.is_locked ? { color: '#DC2626' } : {}]}>{role.text}</Text>
                  </View>
                </View>

                <View style={styles.mobileCardMeta}>
                  <View style={styles.mobileMetaRow}>
                    <Text style={styles.mobileMetaLabel}>Mã người dùng:</Text>
                    <Text style={styles.mobileMetaValue} numberOfLines={1}>{user.ma_nguoi_dung}</Text>
                  </View>
                  <View style={styles.mobileMetaRow}>
                    <Text style={styles.mobileMetaLabel}>Ngày đăng ký:</Text>
                    <Text style={styles.mobileMetaValue}>{formatDate(user.ngay_tao)}</Text>
                  </View>
                </View>

                <View style={styles.mobileCardActions}>{renderAction(user)}</View>
              </View>
            );
          })}
        </View>
      ) : (
        /* DẠNG BẢNG (DESKTOP FULL WIDTH) */
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tableScroll}
          contentContainerStyle={styles.tableScrollContent}
        >
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, styles.avatarColumn, { textAlign: 'center' }]}>Ảnh</Text>
              <Text style={[styles.headerCell, styles.nameColumn]}>Họ tên</Text>
              <Text style={[styles.headerCell, styles.phoneColumn]}>Số điện thoại</Text>
              <Text style={[styles.headerCell, styles.roleColumn]}>Vai trò</Text>
              <Text style={[styles.headerCell, styles.dateColumn]}>Ngày tạo</Text>
              <Text style={[styles.headerCell, styles.actionColumn]}>Thao tác</Text>
            </View>

            {filteredUsers.map((user) => {
              const isCurrentAdmin = user.ma_nguoi_dung === currentAdminId;
              return (
                <View key={user.ma_nguoi_dung} style={styles.tableRow}>
                  <View style={[styles.avatarColumn, styles.cell]}>{renderAvatar(user)}</View>
                  <View style={[styles.nameColumn, styles.cell]}>
                    <Text style={styles.nameText} numberOfLines={1}>{user.ho_ten || 'Chưa cập nhật'}</Text>
                    {isCurrentAdmin && <Text style={styles.currentAdminText}>Tài khoản hiện tại</Text>}
                  </View>
                  <Text style={[styles.phoneColumn, styles.cell, styles.phoneText]}>
                    {user.so_dien_thoai || 'Chưa cập nhật'}
                  </Text>
                  <View style={[styles.roleColumn, styles.cell]}>
                    {(() => {
                      const info = getRoleInfo(user);
                      return (
                        <View style={[styles.roleBadge, info.badgeStyle]}>
                          <Text style={[
                            styles.roleBadgeText,
                            user.is_locked ? { color: '#DC2626' } : {}
                          ]}>{info.text}</Text>
                        </View>
                      );
                    })()}
                  </View>
                  <Text style={[styles.dateColumn, styles.cell, styles.dateText]}>{formatDate(user.ngay_tao)}</Text>
                  <View style={[styles.actionColumn, styles.cell, styles.actionCell]}>{renderAction(user)}</View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
