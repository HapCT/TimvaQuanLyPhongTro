
import React, { useEffect, useMemo, useState } from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';

import { supabase } from '../../../services/supabase';

type User = {
  ma_nguoi_dung: string;
  ho_ten: string | null;
  so_dien_thoai: string | null;
  anh_dai_dien: string | null;
  vai_tro: string | null;
  ngay_tao: string | null;
  ngay_cap_nhat: string | null;
};

type RoleFilter = 'ALL' | 'NguoiThue' | 'ChuTro' | 'Admin';

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] =
    useState<RoleFilter>('ALL');

  const [currentAdminId, setCurrentAdminId] =
    useState<string | null>(null);

  const [updatingId, setUpdatingId] =
    useState<string | null>(null);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  // =========================
  // LOAD USERS
  // =========================

  useEffect(() => {
    loadUsers();
    loadCurrentAdmin();
  }, []);

  // =========================
  // LẤY ADMIN HIỆN TẠI
  // =========================

  const loadCurrentAdmin = async () => {
    try {
      const {
        data: authData,
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.log(
          'CURRENT ADMIN ERROR:',
          error
        );

        return;
      }

      if (authData?.user) {
        setCurrentAdminId(authData.user.id);
      }
    } catch (error) {
      console.log(
        'CURRENT ADMIN CATCH ERROR:',
        error
      );
    }
  };

  // =========================
  // LOAD DANH SÁCH NGƯỜI DÙNG
  // =========================

  const loadUsers = async () => {
    try {
      setLoading(true);

      const {
        data,
        error,
      } = await supabase
        .from('nguoi_dung')
        .select(
          `
          ma_nguoi_dung,
          ho_ten,
          so_dien_thoai,
          anh_dai_dien,
          vai_tro,
          ngay_tao,
          ngay_cap_nhat
          `
        )
        .order(
          'ngay_tao',
          {
            ascending: false,
          }
        );

      console.log(
        'USERS DATA:',
        data
      );

      console.log(
        'USERS ERROR:',
        error
      );

      if (error) {
        Alert.alert(
          'Lỗi',
          'Không thể tải danh sách người dùng.'
        );

        return;
      }

      setUsers(
        (data || []) as User[]
      );

    } catch (error) {
      console.log(
        'LOAD USERS ERROR:',
        error
      );

      Alert.alert(
        'Lỗi',
        'Có lỗi xảy ra khi tải danh sách người dùng.'
      );

    } finally {
      setLoading(false);
    }
  };

  // =========================
  // LỌC + TÌM KIẾM
  // =========================

  const filteredUsers = useMemo(() => {
    const keyword =
      search
        .trim()
        .toLowerCase();

    return users.filter((user) => {
      const matchSearch =
        !keyword ||
        String(
          user.ho_ten || ''
        )
          .toLowerCase()
          .includes(keyword) ||
        String(
          user.so_dien_thoai || ''
        )
          .toLowerCase()
          .includes(keyword);

      const matchRole =
        roleFilter === 'ALL' ||
        user.vai_tro === roleFilter;

      return (
        matchSearch &&
        matchRole
      );
    });
  }, [
    users,
    search,
    roleFilter,
  ]);

  // =========================
  // ĐỔI VAI TRÒ
  // =========================

  const changeRole = (
    user: User
  ) => {
    // Không cho Admin tự đổi quyền của mình
    if (
      user.ma_nguoi_dung ===
      currentAdminId
    ) {
      Alert.alert(
        'Không thể thực hiện',
        'Bạn không thể thay đổi vai trò của chính tài khoản Admin đang đăng nhập.'
      );

      return;
    }

    const currentRole =
      user.vai_tro || '';

    const nextRole =
      currentRole === 'NguoiThue'
        ? 'ChuTro'
        : currentRole === 'ChuTro'
        ? 'NguoiThue'
        : 'NguoiThue';

    Alert.alert(
      'Đổi vai trò',
      `Bạn có muốn đổi vai trò của "${user.ho_ten || 'người dùng'}" từ "${currentRole}" sang "${nextRole}" không?`,
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Đổi vai trò',
          onPress: () =>
            updateRole(
              user.ma_nguoi_dung,
              nextRole
            ),
        },
      ]
    );
  };

  const updateRole = async (
    userId: string,
    newRole: string
  ) => {
    try {
      setUpdatingId(userId);

      const {
        error,
      } = await supabase
        .from('nguoi_dung')
        .update({
          vai_tro: newRole,
          ngay_cap_nhat:
            new Date().toISOString(),
        })
        .eq(
          'ma_nguoi_dung',
          userId
        );

      if (error) {
        console.log(
          'UPDATE ROLE ERROR:',
          error
        );

        Alert.alert(
          'Lỗi',
          'Không thể thay đổi vai trò người dùng.'
        );

        return;
      }

      setUsers(
        (prev) =>
          prev.map((user) =>
            user.ma_nguoi_dung ===
            userId
              ? {
                  ...user,
                  vai_tro: newRole,
                  ngay_cap_nhat:
                    new Date().toISOString(),
                }
              : user
          )
      );

      Alert.alert(
        'Thành công',
        `Đã chuyển vai trò sang "${newRole}".`
      );

    } catch (error) {
      console.log(
        'UPDATE ROLE CATCH ERROR:',
        error
      );

      Alert.alert(
        'Lỗi',
        'Có lỗi xảy ra khi đổi vai trò.'
      );

    } finally {
      setUpdatingId(null);
    }
  };

  // =========================
  // XÓA NGƯỜI DÙNG
  // =========================

  const deleteUser = (
    user: User
  ) => {
    // Không cho Admin tự xóa mình
    if (
      user.ma_nguoi_dung ===
      currentAdminId
    ) {
      Alert.alert(
        'Không thể thực hiện',
        'Bạn không thể xóa tài khoản Admin đang đăng nhập.'
      );

      return;
    }

    Alert.alert(
      'Xóa người dùng',
      `Bạn có chắc muốn xóa "${user.ho_ten || 'người dùng này'}" không?`,
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () =>
            confirmDeleteUser(
              user.ma_nguoi_dung
            ),
        },
      ]
    );
  };

  const confirmDeleteUser = async (
    userId: string
  ) => {
    try {
      setDeletingId(userId);

      const {
        error,
      } = await supabase
        .from('nguoi_dung')
        .delete()
        .eq(
          'ma_nguoi_dung',
          userId
        );

      if (error) {
        console.log(
          'DELETE USER ERROR:',
          error
        );

        Alert.alert(
          'Lỗi',
          'Không thể xóa người dùng.'
        );

        return;
      }

      setUsers(
        (prev) =>
          prev.filter(
            (user) =>
              user.ma_nguoi_dung !==
              userId
          )
      );

      Alert.alert(
        'Thành công',
        'Đã xóa người dùng.'
      );

    } catch (error) {
      console.log(
        'DELETE USER CATCH ERROR:',
        error
      );

      Alert.alert(
        'Lỗi',
        'Có lỗi xảy ra khi xóa người dùng.'
      );

    } finally {
      setDeletingId(null);
    }
  };

  // =========================
  // FORMAT NGÀY
  // =========================

  const formatDate = (
    date: string | null
  ) => {
    if (!date) {
      return '--';
    }

    const d =
      new Date(date);

    if (
      Number.isNaN(
        d.getTime()
      )
    ) {
      return '--';
    }

    return d.toLocaleDateString(
      'vi-VN'
    );
  };

  // =========================
  // ROLE TEXT
  // =========================

  const getRoleText = (
    role: string | null
  ) => {
    switch (role) {
      case 'NguoiThue':
        return 'Người thuê';

      case 'ChuTro':
        return 'Chủ trọ';

      case 'Admin':
        return 'Admin';

      default:
        return role || 'Chưa xác định';
    }
  };

  // =========================
  // ROLE STYLE
  // =========================

  const getRoleStyle = (
    role: string | null
  ) => {
    switch (role) {
      case 'Admin':
        return styles.roleAdmin;

      case 'ChuTro':
        return styles.roleChuTro;

      case 'NguoiThue':
        return styles.roleNguoiThue;

      default:
        return styles.roleUnknown;
    }
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <View
        style={
          styles.loadingContainer
        }
      >
        <ActivityIndicator
          size="large"
          color="#007AFF"
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Đang tải danh sách người dùng...
        </Text>
      </View>
    );
  }

  // =========================
  // UI
  // =========================

  return (
    <View>
      {/* HEADER */}

      <View
        style={
          styles.sectionHeader
        }
      >
        <View>
          <Text
            style={
              styles.sectionTitle
            }
          >
            Danh sách người dùng
          </Text>

          <Text
            style={
              styles.sectionSub
            }
          >
            Quản lý tài khoản người thuê,
            chủ trọ và quản trị viên.
          </Text>
        </View>
      </View>

      {/* SEARCH */}

      <View
        style={
          styles.searchContainer
        }
      >
        <Text
          style={
            styles.searchIcon
          }
        >
          🔎
        </Text>

        <TextInput
          style={
            styles.searchInput
          }
          placeholder="Tìm theo họ tên hoặc số điện thoại..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={
            setSearch
          }
        />

        {search.length > 0 && (
          <TouchableOpacity
            onPress={() =>
              setSearch('')
            }
          >
            <Text
              style={
                styles.clearText
              }
            >
              ✕
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* FILTER */}

      <View
        style={
          styles.filterRow
        }
      >
        <Text
          style={
            styles.filterLabel
          }
        >
          Vai trò:
        </Text>

        <TouchableOpacity
          style={[
            styles.filterButton,
            roleFilter === 'ALL' &&
              styles.filterButtonActive,
          ]}
          onPress={() =>
            setRoleFilter(
              'ALL'
            )
          }
        >
          <Text
            style={[
              styles.filterText,
              roleFilter ===
                'ALL' &&
                styles.filterTextActive,
            ]}
          >
            Tất cả
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            roleFilter ===
              'NguoiThue' &&
              styles.filterButtonActive,
          ]}
          onPress={() =>
            setRoleFilter(
              'NguoiThue'
            )
          }
        >
          <Text
            style={[
              styles.filterText,
              roleFilter ===
                'NguoiThue' &&
                styles.filterTextActive,
            ]}
          >
            Người thuê
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            roleFilter ===
              'ChuTro' &&
              styles.filterButtonActive,
          ]}
          onPress={() =>
            setRoleFilter(
              'ChuTro'
            )
          }
        >
          <Text
            style={[
              styles.filterText,
              roleFilter ===
                'ChuTro' &&
                styles.filterTextActive,
            ]}
          >
            Chủ trọ
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            roleFilter ===
              'Admin' &&
              styles.filterButtonActive,
          ]}
          onPress={() =>
            setRoleFilter(
              'Admin'
            )
          }
        >
          <Text
            style={[
              styles.filterText,
              roleFilter ===
                'Admin' &&
                styles.filterTextActive,
            ]}
          >
            Admin
          </Text>
        </TouchableOpacity>
      </View>

      {/* RESULT */}

      <View
        style={
          styles.resultInfo
        }
      >
        <Text
          style={
            styles.resultText
          }
        >
          Hiển thị{' '}
          <Text
            style={
              styles.resultNumber
            }
          >
            {filteredUsers.length}
          </Text>{' '}
          / {users.length} người dùng
        </Text>

        <TouchableOpacity
          style={
            styles.refreshButton
          }
          onPress={
            loadUsers
          }
        >
          <Text
            style={
              styles.refreshText
            }
          >
            ↻ Làm mới
          </Text>
        </TouchableOpacity>
      </View>

      {/* TABLE */}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator
      >
        <View
          style={
            styles.table
          }
        >
          {/* TABLE HEADER */}

          <View
            style={
              styles.tableHeader
            }
          >
            <Text
              style={[
                styles.headerCell,
                styles.avatarColumn,
              ]}
            >
              Ảnh
            </Text>

            <Text
              style={[
                styles.headerCell,
                styles.nameColumn,
              ]}
            >
              Họ tên
            </Text>

            <Text
              style={[
                styles.headerCell,
                styles.phoneColumn,
              ]}
            >
              Số điện thoại
            </Text>

            <Text
              style={[
                styles.headerCell,
                styles.roleColumn,
              ]}
            >
              Vai trò
            </Text>

            <Text
              style={[
                styles.headerCell,
                styles.dateColumn,
              ]}
            >
              Ngày tạo
            </Text>

            <Text
              style={[
                styles.headerCell,
                styles.actionColumn,
              ]}
            >
              Thao tác
            </Text>
          </View>

          {/* TABLE DATA */}

          {filteredUsers.length ===
          0 ? (
            <View
              style={
                styles.emptyContainer
              }
            >
              <Text
                style={
                  styles.emptyIcon
                }
              >
                👥
              </Text>

              <Text
                style={
                  styles.emptyTitle
                }
              >
                Không tìm thấy người dùng
              </Text>

              <Text
                style={
                  styles.emptyText
                }
              >
                Thử thay đổi từ khóa tìm kiếm
                hoặc bộ lọc vai trò.
              </Text>
            </View>
          ) : (
            filteredUsers.map(
              (user) => {
                const isCurrentAdmin =
                  user.ma_nguoi_dung ===
                  currentAdminId;

                return (
                  <View
                    key={
                      user.ma_nguoi_dung
                    }
                    style={
                      styles.tableRow
                    }
                  >
                    {/* AVATAR */}

                    <View
                      style={[
                        styles.avatarColumn,
                        styles.cell,
                      ]}
                    >
                      {user.anh_dai_dien ? (
                        <Image
                          source={{
                            uri:
                              user.anh_dai_dien,
                          }}
                          style={
                            styles.userAvatar
                          }
                        />
                      ) : (
                        <View
                          style={
                            styles.defaultAvatar
                          }
                        >
                          <Text
                            style={
                              styles.defaultAvatarText
                            }
                          >
                            {(
                              user.ho_ten ||
                              'U'
                            )
                              .charAt(
                                0
                              )
                              .toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* NAME */}

                    <View
                      style={[
                        styles.nameColumn,
                        styles.cell,
                      ]}
                    >
                      <Text
                        style={
                          styles.nameText
                        }
                        numberOfLines={1}
                      >
                        {user.ho_ten ||
                          'Chưa cập nhật'}
                      </Text>

                      {isCurrentAdmin && (
                        <Text
                          style={
                            styles.currentAdminText
                          }
                        >
                          Tài khoản hiện tại
                        </Text>
                      )}
                    </View>

                    {/* PHONE */}

                    <Text
                      style={[
                        styles.phoneColumn,
                        styles.cell,
                        styles.phoneText,
                      ]}
                    >
                      {user.so_dien_thoai ||
                        'Chưa cập nhật'}
                    </Text>

                    {/* ROLE */}

                    <View
                      style={[
                        styles.roleColumn,
                        styles.cell,
                      ]}
                    >
                      <View
                        style={[
                          styles.roleBadge,
                          getRoleStyle(
                            user.vai_tro
                          ),
                        ]}
                      >
                        <Text
                          style={
                            styles.roleBadgeText
                          }
                        >
                          {getRoleText(
                            user.vai_tro
                          )}
                        </Text>
                      </View>
                    </View>

                    {/* DATE */}

                    <Text
                      style={[
                        styles.dateColumn,
                        styles.cell,
                        styles.dateText,
                      ]}
                    >
                      {formatDate(
                        user.ngay_tao
                      )}
                    </Text>

                    {/* ACTION */}

                    <View
                      style={[
                        styles.actionColumn,
                        styles.cell,
                        styles.actionCell,
                      ]}
                    >
                      {isCurrentAdmin ? (
                        <View
                          style={
                            styles.lockedButton
                          }
                        >
                          <Text
                            style={
                              styles.lockedButtonText
                            }
                          >
                            🔒
                          </Text>

                          <Text
                            style={
                              styles.lockedText
                            }
                          >
                            Tài khoản của bạn
                          </Text>
                        </View>
                      ) : (
                        <>
                          <TouchableOpacity
                            style={
                              styles.changeRoleButton
                            }
                            onPress={() =>
                              changeRole(
                                user
                              )
                            }
                            disabled={
                              updatingId ===
                                user.ma_nguoi_dung ||
                              deletingId ===
                                user.ma_nguoi_dung
                            }
                          >
                            {updatingId ===
                            user.ma_nguoi_dung ? (
                              <ActivityIndicator
                                size="small"
                                color="#007AFF"
                              />
                            ) : (
                              <Text
                                style={
                                  styles.changeRoleText
                                }
                              >
                                ↕ Đổi vai trò
                              </Text>
                            )}
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={
                              styles.deleteButton
                            }
                            onPress={() =>
                              deleteUser(
                                user
                              )
                            }
                            disabled={
                              updatingId ===
                                user.ma_nguoi_dung ||
                              deletingId ===
                                user.ma_nguoi_dung
                            }
                          >
                            {deletingId ===
                            user.ma_nguoi_dung ? (
                              <ActivityIndicator
                                size="small"
                                color="#E53935"
                              />
                            ) : (
                              <Text
                                style={
                                  styles.deleteText
                                }
                              >
                                🗑 Xóa
                              </Text>
                            )}
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>
                );
              }
            )
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    minHeight: 400,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#666',
  },

  // =========================
  // HEADER
  // =========================

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#222',
  },

  sectionSub: {
    fontSize: 13,
    color: '#888',
    marginTop: 5,
  },

  // =========================
  // SEARCH
  // =========================

  searchContainer: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E0E3E7',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 15,
  },

  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },

  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: '#222',
    outlineStyle: 'none',
  },

  clearText: {
    fontSize: 17,
    color: '#999',
    paddingLeft: 10,
  },

  // =========================
  // FILTER
  // =========================

  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },

  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginRight: 5,
  },

  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F3F5',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  filterButtonActive: {
    backgroundColor: '#EAF3FF',
    borderColor: '#007AFF',
  },

  filterText: {
    fontSize: 13,
    color: '#666',
  },

  filterTextActive: {
    color: '#007AFF',
    fontWeight: 'bold',
  },

  // =========================
  // RESULT
  // =========================

  resultInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  resultText: {
    fontSize: 13,
    color: '#777',
  },

  resultNumber: {
    fontWeight: 'bold',
    color: '#007AFF',
  },

  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#DDE1E6',
    borderRadius: 7,
    backgroundColor: '#FFF',
  },

  refreshText: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '600',
  },

  // =========================
  // TABLE
  // =========================

  table: {
    minWidth: 1000,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },

  tableHeader: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F8FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },

  tableRow: {
    minHeight: 75,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },

  headerCell: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    paddingHorizontal: 12,
  },

  cell: {
    paddingHorizontal: 12,
  },

  avatarColumn: {
    width: 80,
    justifyContent: 'center',
  },

  nameColumn: {
    width: 220,
    justifyContent: 'center',
  },

  phoneColumn: {
    width: 180,
    justifyContent: 'center',
  },

  roleColumn: {
    width: 150,
    justifyContent: 'center',
  },

  dateColumn: {
    width: 130,
    justifyContent: 'center',
  },

  actionColumn: {
    width: 240,
    justifyContent: 'center',
  },

  // =========================
  // AVATAR
  // =========================

  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },

  defaultAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EAF3FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  defaultAvatarText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#007AFF',
  },

  // =========================
  // TEXT
  // =========================

  nameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
  },

  currentAdminText: {
    fontSize: 11,
    color: '#007AFF',
    marginTop: 3,
  },

  phoneText: {
    fontSize: 13,
    color: '#555',
  },

  dateText: {
    fontSize: 13,
    color: '#666',
  },

  // =========================
  // ROLE
  // =========================

  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
  },

  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },

  roleAdmin: {
    backgroundColor: '#FDECEC',
  },

  roleChuTro: {
    backgroundColor: '#FFF4E5',
  },

  roleNguoiThue: {
    backgroundColor: '#EAF3FF',
  },

  roleUnknown: {
    backgroundColor: '#F1F1F1',
  },

  // =========================
  // ACTION
  // =========================

  actionCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  changeRoleButton: {
    minWidth: 105,
    height: 34,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#BBD9FF',
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FAFF',
  },

  changeRoleText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },

  deleteButton: {
    minWidth: 75,
    height: 34,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#F5C2C0',
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8F8',
  },

  deleteText: {
    fontSize: 12,
    color: '#E53935',
    fontWeight: '600',
  },

  lockedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  lockedButtonText: {
    fontSize: 14,
  },

  lockedText: {
    fontSize: 11,
    color: '#999',
  },

  // =========================
  // EMPTY
  // =========================

  emptyContainer: {
    minHeight: 300,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },

  emptyIcon: {
    fontSize: 42,
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#444',
  },

  emptyText: {
    fontSize: 13,
    color: '#999',
    marginTop: 6,
    textAlign: 'center',
  },
});

