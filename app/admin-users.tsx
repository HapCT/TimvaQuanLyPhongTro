
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from 'react-native';

import { router } from 'expo-router';
import { supabase } from '../services/supabase';

type User = {
  ma_nguoi_dung: string;
  ho_ten: string;
  so_dien_thoai: string;
  vai_tro: 'NguoiThue' | 'ChuTro' | 'QuanTri';
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
  }, []);

  useEffect(() => {
    filterUsers();
  }, [search, filterRole, users]);

  // ==========================================
  // KIỂM TRA QUYỀN ADMIN
  // ==========================================

  const checkAdmin = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/auth/login');
        return;
      }

      const { data, error } = await supabase
        .from('nguoi_dung')
        .select('vai_tro')
        .eq('ma_nguoi_dung', user.id)
        .single();

      if (error || !data) {
        Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng.');
        router.replace('/home');
        return;
      }

      if (data.vai_tro !== 'QuanTri') {
        Alert.alert(
          'Không có quyền',
          'Bạn không có quyền truy cập trang quản trị.'
        );

        router.replace('/home');
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

      const { data, error } = await supabase
        .from('nguoi_dung')
        .select(
          'ma_nguoi_dung, ho_ten, so_dien_thoai, vai_tro'
        )
        .order('ho_ten', {
          ascending: true,
        });

      if (error) {
        console.log('GET USERS ERROR:', error);

        Alert.alert(
          'Lỗi',
          'Không thể tải danh sách người dùng.'
        );

        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.log('GET USERS ERROR:', error);
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
              const { error } = await supabase
                .from('nguoi_dung')
                .update({
                  vai_tro: newRole,
                })
                .eq(
                  'ma_nguoi_dung',
                  user.ma_nguoi_dung
                );

              if (error) {
                console.log(
                  'CHANGE ROLE ERROR:',
                  error
                );

                Alert.alert(
                  'Lỗi',
                  'Không thể thay đổi vai trò.'
                );

                return;
              }

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
  // XÓA NGƯỜI DÙNG
  // ==========================================

  const deleteUser = async (user: User) => {
    Alert.alert(
      'Xóa người dùng',
      `Bạn có chắc muốn xóa "${user.ho_ten}" không?`,
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              const {
                data: { currentUser },
              } = await supabase.auth.getUser();

              // Không cho Admin tự xóa chính mình
              if (
                currentUser?.id ===
                user.ma_nguoi_dung
              ) {
                Alert.alert(
                  'Không thể xóa',
                  'Bạn không thể tự xóa tài khoản Admin đang đăng nhập.'
                );

                return;
              }

              const { error } = await supabase
                .from('nguoi_dung')
                .delete()
                .eq(
                  'ma_nguoi_dung',
                  user.ma_nguoi_dung
                );

              if (error) {
                console.log(
                  'DELETE USER ERROR:',
                  error
                );

                Alert.alert(
                  'Lỗi',
                  'Không thể xóa người dùng. Có thể người dùng đang có dữ liệu liên quan.'
                );

                return;
              }

              Alert.alert(
                'Thành công',
                'Đã xóa người dùng.'
              );

              getUsers();
            } catch (error) {
              console.log(
                'DELETE USER ERROR:',
                error
              );
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
                    style={styles.deleteButton}
                    onPress={() => deleteUser(user)}
                  >
                    <Text style={styles.deleteButtonText}>
                      Xóa
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

// ==================================================
// STYLE
// ==================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FB',
  },

  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 14,
  },

  // HEADER

  header: {
    minHeight: 90,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 30,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#222',
  },

  headerSubtitle: {
    marginTop: 5,
    color: '#777',
    fontSize: 13,
  },

  backButton: {
    backgroundColor: '#F0F2F5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 9,
  },

  backButtonText: {
    color: '#333',
    fontWeight: '600',
  },

  scrollContent: {
    width: '100%',
    maxWidth: 1300,
    alignSelf: 'center',
    padding: 25,
    paddingBottom: 60,
  },

  // STATS

  statsContainer: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 22,
  },

  statsMobile: {
    flexWrap: 'wrap',
  },

  statCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },

  statNumber: {
    fontSize: 27,
    fontWeight: 'bold',
    color: '#007AFF',
  },

  statLabel: {
    marginTop: 6,
    fontSize: 13,
    color: '#777',
  },

  // SEARCH

  searchContainer: {
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 15,
  },

  searchIcon: {
    fontSize: 18,
    marginRight: 9,
  },

  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 14,
    color: '#222',
    outlineStyle: 'none',
  } as any,

  clearText: {
    color: '#888',
    fontSize: 18,
    padding: 5,
  },

  // FILTER

  filterScroll: {
    marginBottom: 20,
  },

  filterButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 9,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
  },

  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },

  filterText: {
    color: '#555',
    fontSize: 13,
    fontWeight: '600',
  },

  filterTextActive: {
    color: '#FFFFFF',
  },

  refreshButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 9,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  refreshText: {
    color: '#007AFF',
    fontWeight: '600',
  },

  // RESULT

  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  resultText: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#222',
  },

  resultCount: {
    fontSize: 13,
    color: '#777',
  },

  // USER LIST

  userList: {
    gap: 10,
  },

  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 90,
  },

  number: {
    width: 28,
    alignItems: 'center',
  },

  numberText: {
    color: '#999',
    fontSize: 12,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
  },

  avatarText: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: 'bold',
  },

  userInfo: {
    flex: 1,
    minWidth: 0,
  },

  userName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
  },

  userPhone: {
    fontSize: 12,
    color: '#777',
    marginTop: 5,
  },

  userId: {
    fontSize: 10,
    color: '#AAA',
    marginTop: 5,
  },

  // ROLE

  roleBadge: {
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 7,
    marginHorizontal: 10,
  },

  roleAdmin: {
    backgroundColor: '#FDECEC',
  },

  roleOwner: {
    backgroundColor: '#FFF4DD',
  },

  roleTenant: {
    backgroundColor: '#E8F4EA',
  },

  roleText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#444',
  },

  // ACTION

  actions: {
    flexDirection: 'row',
    gap: 7,
  },

  actionsMobile: {
    flexDirection: 'column',
  },

  roleButton: {
    backgroundColor: '#EAF3FF',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 7,
  },

  roleButtonText: {
    color: '#007AFF',
    fontSize: 11,
    fontWeight: 'bold',
  },

  deleteButton: {
    backgroundColor: '#FDECEC',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 7,
  },

  deleteButtonText: {
    color: '#D9363E',
    fontSize: 11,
    fontWeight: 'bold',
  },

  // EMPTY

  empty: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 60,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },

  emptyIcon: {
    fontSize: 45,
  },

  emptyTitle: {
    marginTop: 15,
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
  },

  emptyText: {
    marginTop: 7,
    fontSize: 13,
    color: '#888',
  },
});

