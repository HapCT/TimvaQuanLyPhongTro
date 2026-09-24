
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';

import { backendApi } from '@/services/backend';
import { firebaseAuth } from '@/services/firebase';
import { styles } from '@/styles/admin/admin-users.styles';
import { showAlert } from '@/utils/alert';
import { router } from 'expo-router';

type User = {
  ma_nguoi_dung: string;
  ho_ten: string;
  so_dien_thoai: string;
  vai_tro: 'NguoiThue' | 'ChuTro' | 'QuanTri';
  is_locked?: boolean;
};

export default function AdminUsersScreen() {
  const { width } = useWindowDimensions();

  const isMobile = width < 700;

  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('TatCa');

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterRole, users]);

  // ==========================================
  // KIỂM TRA QUYỀN ADMIN
  // ==========================================

  const checkAdmin = async () => {
    try {
      const user = firebaseAuth.currentUser;

      if (!user) {
        router.replace('/login');
        return;
      }

      const { data, status } = await backendApi.get('/api/users/me');

      if (status !== 200 || !data) {
        Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng.');
        router.replace('/(tabs)');
        return;
      }

      if (data.vai_tro !== 'QuanTri' && data.vai_tro !== 'Admin') {
        Alert.alert(
          'Không có quyền',
          'Bạn không có quyền truy cập trang quản trị.'
        );

        router.replace('/(tabs)');
        return;
      }

      getUsers();
    } catch (error) {
      console.log('CHECK ADMIN ERROR:', error);

      Alert.alert(
        'Lỗi',
        'Không thể kiểm tra quyền quản trị.'
      );
    }
  };

  // ==========================================
  // LẤY DANH SÁCH NGƯỜI DÙNG
  // ==========================================

  const getUsers = async () => {
    try {
      setLoading(true);

      const response = await backendApi.get('/api/users');
      setUsers(response.data || []);
    } catch (error) {
      console.log('GET USERS ERROR:', error);
      showAlert('Lỗi', 'Không thể tải danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // TÌM KIẾM + LỌC
  // ==========================================

  const filterUsers = () => {
    let result = [...users];

    const keyword = search.trim().toLowerCase();

    if (keyword) {
      result = result.filter((user) => {
        return (
          user.ho_ten?.toLowerCase().includes(keyword) ||
          user.so_dien_thoai?.includes(keyword)
        );
      });
    }

    if (filterRole !== 'TatCa') {
      result = result.filter(
        (user) => user.vai_tro === filterRole
      );
    }

    setFilteredUsers(result);
  };

  // ==========================================
  // ĐỔI VAI TRÒ
  // ==========================================

  const changeRole = async (
    user: User,
    newRole: User['vai_tro']
  ) => {
    if (user.vai_tro === newRole) {
      return;
    }

    Alert.alert(
      'Thay đổi vai trò',
      `Bạn có chắc muốn đổi vai trò của "${user.ho_ten}" thành "${getRoleName(
        newRole
      )}" không?`,
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xác nhận',
          onPress: async () => {
            try {
              await backendApi.put(`/api/users/${user.ma_nguoi_dung}/role`, { vai_tro: newRole });

              Alert.alert(
                'Thành công',
                'Đã thay đổi vai trò người dùng.'
              );

              getUsers();
            } catch (error) {
              console.log(
                'CHANGE ROLE ERROR:',
                error
              );
            }
          },
        },
      ]
    );
  };

  // ==========================================
  // KHÓA / MỞ KHÓA NGƯỜI DÙNG
  // ==========================================

  const toggleLockUser = async (user: User) => {
    const isLocking = !user.is_locked;
    const actionText = isLocking ? 'Khóa' : 'Mở khóa';
    
    showAlert(
      `${actionText} người dùng`,
      `Bạn có chắc muốn ${actionText.toLowerCase()} tài khoản "${user.ho_ten}" không?`,
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: actionText,
          style: isLocking ? 'destructive' : 'default',
          onPress: async () => {
            try {
              const currentUser = firebaseAuth.currentUser;

              // Không cho Admin tự khóa chính mình
              if (currentUser?.uid === user.ma_nguoi_dung) {
                showAlert(
                  'Không hợp lệ',
                  'Bạn không thể tự khóa tài khoản Admin đang đăng nhập.'
                );
                return;
              }

              await backendApi.put(`/api/users/${user.ma_nguoi_dung}/toggle-lock`, {
                is_locked: isLocking
              });

              showAlert(
                'Thành công',
                `Đã ${actionText.toLowerCase()} người dùng.`
              );

              getUsers();
            } catch (error) {
              console.log('TOGGLE LOCK USER ERROR:', error);
              showAlert('Lỗi', `Không thể ${actionText.toLowerCase()} người dùng.`);
            }
          },
        },
      ]
    );
  };

  // ==========================================
  // TÊN VAI TRÒ
  // ==========================================

  const getRoleName = (
    role: User['vai_tro']
  ) => {
    switch (role) {
      case 'QuanTri':
        return 'Quản trị viên';

      case 'ChuTro':
        return 'Chủ trọ';

      case 'NguoiThue':
        return 'Người thuê';

      default:
        return role;
    }
  };

  // ==========================================
  // MÀU VAI TRÒ
  // ==========================================

  const getRoleStyle = (
    role: User['vai_tro']
  ) => {
    switch (role) {
      case 'QuanTri':
        return styles.roleAdmin;

      case 'ChuTro':
        return styles.roleOwner;

      case 'NguoiThue':
        return styles.roleTenant;

      default:
        return styles.roleTenant;
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#007AFF"
        />

        <Text style={styles.loadingText}>
          Đang tải danh sách người dùng...
        </Text>
      </View>
    );
  }

  // ==========================================
  // GIAO DIỆN
  // ==========================================

  return (
    <View style={styles.container}>
      {/* HEADER */}

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>
            Quản lý người dùng
          </Text>

          <Text style={styles.headerSubtitle}>
            Quản lý tài khoản và phân quyền người dùng
          </Text>
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/admin')}
        >
          <Text style={styles.backButtonText}>
            ← Quay lại
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* THỐNG KÊ */}

        <View
          style={[
            styles.statsContainer,
            isMobile && styles.statsMobile,
          ]}
        >
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {users.length}
            </Text>

            <Text style={styles.statLabel}>
              Tổng người dùng
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {
                users.filter(
                  (user) =>
                    user.vai_tro === 'NguoiThue'
                ).length
              }
            </Text>

            <Text style={styles.statLabel}>
              Người thuê
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {
                users.filter(
                  (user) =>
                    user.vai_tro === 'ChuTro'
                ).length
              }
            </Text>

            <Text style={styles.statLabel}>
              Chủ trọ
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {
                users.filter(
                  (user) =>
                    user.vai_tro === 'QuanTri'
                ).length
              }
            </Text>

            <Text style={styles.statLabel}>
              Quản trị viên
            </Text>
          </View>
        </View>

        {/* TÌM KIẾM */}

        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>
            🔍
          </Text>

          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo họ tên hoặc số điện thoại..."
            placeholderTextColor="#999"
            value={search}
            onChangeText={setSearch}
          />

          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearch('')}
            >
              <Text style={styles.clearText}>
                ✕
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* FILTER */}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterRole === 'TatCa' &&
                styles.filterButtonActive,
            ]}
            onPress={() =>
              setFilterRole('TatCa')
            }
          >
            <Text
              style={[
                styles.filterText,
                filterRole === 'TatCa' &&
                  styles.filterTextActive,
              ]}
            >
              Tất cả
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              filterRole === 'NguoiThue' &&
                styles.filterButtonActive,
            ]}
            onPress={() =>
              setFilterRole('NguoiThue')
            }
          >
            <Text
              style={[
                styles.filterText,
                filterRole === 'NguoiThue' &&
                  styles.filterTextActive,
              ]}
            >
              Người thuê
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              filterRole === 'ChuTro' &&
                styles.filterButtonActive,
            ]}
            onPress={() =>
              setFilterRole('ChuTro')
            }
          >
            <Text
              style={[
                styles.filterText,
                filterRole === 'ChuTro' &&
                  styles.filterTextActive,
              ]}
            >
              Chủ trọ
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              filterRole === 'QuanTri' &&
                styles.filterButtonActive,
            ]}
            onPress={() =>
              setFilterRole('QuanTri')
            }
          >
            <Text
              style={[
                styles.filterText,
                filterRole === 'QuanTri' &&
                  styles.filterTextActive,
              ]}
            >
              Quản trị viên
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={getUsers}
          >
            <Text style={styles.refreshText}>
              ↻ Làm mới
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* SỐ LƯỢNG */}

        <View style={styles.resultHeader}>
          <Text style={styles.resultText}>
            Danh sách người dùng
          </Text>

          <Text style={styles.resultCount}>
            {filteredUsers.length} người dùng
          </Text>
        </View>

        {/* DANH SÁCH */}

        {filteredUsers.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>
              👤
            </Text>

            <Text style={styles.emptyTitle}>
              Không tìm thấy người dùng
            </Text>

            <Text style={styles.emptyText}>
              Thử thay đổi từ khóa hoặc bộ lọc.
            </Text>
          </View>
        ) : (
          <View style={styles.userList}>
            {filteredUsers.map((user, index) => (
              <View
                key={user.ma_nguoi_dung}
                style={styles.userCard}
              >
                {/* STT */}

                <View style={styles.number}>
                  <Text style={styles.numberText}>
                    {index + 1}
                  </Text>
                </View>

                {/* AVATAR */}

                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {user.ho_ten
                      ? user.ho_ten
                          .charAt(0)
                          .toUpperCase()
                      : '?'}
                  </Text>
                </View>

                {/* THÔNG TIN */}

                <View style={styles.userInfo}>
                  <Text style={styles.userName}>
                    {user.ho_ten || 'Chưa cập nhật'}
                  </Text>

                  <Text style={styles.userPhone}>
                    📞 {user.so_dien_thoai || 'Chưa cập nhật'}
                  </Text>

                  {!isMobile && (
                    <Text
                      style={styles.userId}
                      numberOfLines={1}
                    >
                      ID: {user.ma_nguoi_dung}
                    </Text>
                  )}
                </View>

                {/* ROLE */}

                <View
                  style={[
                    styles.roleBadge,
                    getRoleStyle(user.vai_tro),
                  ]}
                >
                  <Text style={styles.roleText}>
                    {getRoleName(user.vai_tro)}
                  </Text>
                </View>
                
                {user.is_locked && (
                  <View style={[styles.roleBadge, { backgroundColor: '#ffe5e5', marginLeft: 8 }]}>
                    <Text style={[styles.roleText, { color: '#d32f2f' }]}>🔒 Bị khóa</Text>
                  </View>
                )}

                {/* ACTION */}

                <View
                  style={[
                    styles.actions,
                    isMobile && styles.actionsMobile,
                  ]}
                >
                  <TouchableOpacity
                    style={styles.roleButton}
                    onPress={() => {
                      Alert.alert(
                        'Thay đổi vai trò',
                        'Chọn vai trò mới',
                        [
                          {
                            text: 'Người thuê',
                            onPress: () =>
                              changeRole(
                                user,
                                'NguoiThue'
                              ),
                          },
                          {
                            text: 'Chủ trọ',
                            onPress: () =>
                              changeRole(
                                user,
                                'ChuTro'
                              ),
                          },
                          {
                            text: 'Quản trị viên',
                            onPress: () =>
                              changeRole(
                                user,
                                'QuanTri'
                              ),
                          },
                          {
                            text: 'Hủy',
                            style: 'cancel',
                          },
                        ]
                      );
                    }}
                  >
                    <Text style={styles.roleButtonText}>
                      Phân quyền
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.deleteButton, user.is_locked ? { backgroundColor: '#4CAF50' } : {}]}
                    onPress={() => toggleLockUser(user)}
                  >
                    <Text style={styles.deleteButtonText}>
                      {user.is_locked ? 'Mở khóa' : 'Khóa'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}


