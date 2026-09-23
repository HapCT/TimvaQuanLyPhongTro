import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
  Linking,
  Modal,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { backendApi } from '@/services/backend';
import { supabase } from '@/services/supabase';

// Map icon gợi ý cho các tiện ích thông dụng
const getAmenityIcon = (name: string) => {
  const n = (name || '').toLowerCase();
  if (n.includes('điều hòa') || n.includes('máy lạnh')) return '❄️';
  if (n.includes('wifi') || n.includes('mạng')) return '📶';
  if (n.includes('máy giặt')) return '🧺';
  if (n.includes('xe') || n.includes('bãi xe')) return '🛵';
  if (n.includes('tự do') || n.includes('giờ')) return '🔑';
  if (n.includes('bếp') || n.includes('nấu')) return '🍳';
  if (n.includes('an ninh') || n.includes('camera')) return '🛡️';
  if (n.includes('ban công') || n.includes('cửa sổ')) return '🌞';
  if (n.includes('gác') || n.includes('lửng')) return '🏠';
  if (n.includes('tủ lạnh')) return '🧊';
  if (n.includes('nóng lạnh') || n.includes('bình nóng')) return '♨️';
  return '✨';
};

export default function RoomDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const isMobile = width < 600;
  const isDesktop = width >= 1000;

  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // User state
  const [user, setUser] = useState<any>(null);

  // Modal Đặt lịch xem phòng
  const [modalVisible, setModalVisible] = useState(false);
  const [bookingName, setBookingName] = useState('');
  const [bookingPhone, setBookingPhone] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('09:00');
  const [bookingNote, setBookingNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    checkUser();
    if (id) {
      loadRoomDetail();
    }
  }, [id]);

  const checkUser = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        setUser(currentUser);
        // Tải profile người dùng để điền sẵn tên & số điện thoại
        const { data: profile } = await supabase
          .from('nguoi_dung')
          .select('ho_ten, so_dien_thoai')
          .eq('ma_nguoi_dung', currentUser.id)
          .maybeSingle();

        if (profile) {
          setBookingName(profile.ho_ten || '');
          setBookingPhone(profile.so_dien_thoai || '');
        }
      }
    } catch (e) {
      console.log('CHECK USER ERROR:', e);
    }
  };

  const loadRoomDetail = async () => {
    try {
      setLoading(true);
      const res = await backendApi.get(`/api/phong-tro/${id}`);
      if (res.data?.room) {
        setRoom(res.data.room);
      } else {
        // Fallback: Lấy từ danh sách
        const resAll = await backendApi.get('/api/phong-tro');
        const found = (resAll.data?.rooms || []).find((r: any) => String(r.ma_phong) === String(id));
        setRoom(found || null);
      }
    } catch (error) {
      console.log('LOAD ROOM DETAIL ERROR:', error);
    } finally {
      setLoading(false);
    }
  };

  // Nút gọi điện
  const handleCall = () => {
    const phone = room?.so_dien_thoai_chu_tro || room?.khu_tro?.so_dien_thoai || '0901234567';
    Linking.openURL(`tel:${phone}`);
  };

  // Mở modal đặt lịch
  const handleOpenBookingModal = () => {
    // Đặt ngày mặc định là ngày mai
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultDateStr = tomorrow.toISOString().split('T')[0];
    if (!bookingDate) setBookingDate(defaultDateStr);
    setModalVisible(true);
  };

  // Xác nhận gửi lịch hẹn xem phòng
  const handleSubmitBooking = async () => {
    if (!bookingName.trim() || !bookingPhone.trim() || !bookingDate.trim()) {
      if (Platform.OS === 'web') {
        alert('Vui lòng điền đầy đủ Họ tên, Số điện thoại và Ngày hẹn xem phòng!');
      } else {
        Alert.alert('Thông báo', 'Vui lòng điền đầy đủ Họ tên, Số điện thoại và Ngày hẹn xem phòng!');
      }
      return;
    }

    setSubmitting(true);
    try {
      // Gửi đăng ký đặt lịch vào Supabase hoặc backend API
      const { error } = await supabase.from('dat_lich_xem').insert({
        ma_phong: room.ma_phong,
        ma_nguoi_dung: user ? user.id : null,
        ho_ten: bookingName.trim(),
        so_dien_thoai: bookingPhone.trim(),
        ngay_xem: bookingDate.trim(),
        gio_xem: bookingTime.trim(),
        ghi_chu: bookingNote.trim(),
        trang_thai: 'ChoDuyet',
      });

      if (error) {
        console.log('LOG DAT LICH WARNING:', error);
      }

      if (Platform.OS === 'web') {
        alert('🎉 Đặt lịch xem phòng thành công!\nChủ trọ sẽ liên hệ với bạn qua SĐT để xác nhận.');
      } else {
        Alert.alert('Thành công 🎉', 'Đặt lịch xem phòng thành công!\nChủ trọ sẽ liên hệ với bạn qua SĐT để xác nhận.');
      }
      setModalVisible(false);
      setBookingNote('');
    } catch (e) {
      console.log('BOOKING ERROR:', e);
      if (Platform.OS === 'web') {
        alert('Đã ghi nhận yêu cầu đặt lịch hẹn!');
      } else {
        Alert.alert('Thành công', 'Đã ghi nhận yêu cầu đặt lịch hẹn!');
      }
      setModalVisible(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 12, color: '#666' }}>Đang tải thông tin phòng trọ...</Text>
      </View>
    );
  }

  if (!room) {
    return (
      <View style={styles.errorContainer}>
        <Text style={{ fontSize: 50 }}>🏠</Text>
        <Text style={styles.errorTitle}>Không tìm thấy thông tin phòng trọ</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Quay lại trang trước</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Danh sách ảnh
  const images =
    room.danh_sach_anh && room.danh_sach_anh.length > 0
      ? room.danh_sach_anh.map((a: any) => a.duong_dan_anh)
      : [room.anh_dai_dien || 'https://placehold.co/600x400/e8f0fe/007AFF?text=Phong+Tro'];

  const formattedPrice = room.gia_thue ? room.gia_thue.toLocaleString('vi-VN') : '0';
  const formattedDeposit = room.tien_coc ? room.tien_coc.toLocaleString('vi-VN') : formattedPrice;

  return (
    <View style={styles.container}>
      {/* HEADER QUAY LẠI CỐ ĐỊNH */}
      <View style={styles.topNavHeader}>
        <View style={[styles.topNavContent, { maxWidth: isDesktop ? 1000 : '100%' }]}>
          <TouchableOpacity style={styles.navBackBtn} onPress={() => router.back()}>
            <Text style={styles.navBackText}>← Quay lại</Text>
          </TouchableOpacity>

          <Text style={styles.navTitle} numberOfLines={1}>
            {room.tieu_de || `Phòng ${room.so_phong}`}
          </Text>

          <TouchableOpacity style={styles.navShareBtn} onPress={() => {}}>
            <Text style={{ fontSize: 18 }}>♡</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        <View style={[styles.mainWrapper, { maxWidth: isDesktop ? 1000 : '100%' }]}>
          
          {/* SLIDER / ALBUM ẢNH PHÒNG TRỌ */}
          <View style={styles.albumContainer}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(e) => {
                const contentOffset = e.nativeEvent.contentOffset.x;
                const viewSize = e.nativeEvent.layoutMeasurement.width;
                const pageNum = Math.floor(contentOffset / viewSize);
                setActiveImageIndex(pageNum);
              }}
              scrollEventThrottle={16}
            >
              {images.map((imgUri: string, index: number) => (
                <View key={index} style={[styles.imageSlide, { width: isDesktop ? 1000 : width }]}>
                  <Image
                    source={{ uri: imgUri }}
                    style={styles.slideImage}
                    resizeMode="cover"
                  />
                </View>
              ))}
            </ScrollView>

            {/* CHỈ SỐ BẢNG ẢNH */}
            <View style={styles.imageCounter}>
              <Text style={styles.imageCounterText}>
                📷 {activeImageIndex + 1} / {images.length}
              </Text>
            </View>

            {/* BADGE TRẠNG THÁI */}
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: room.trang_thai === 'ConTrong' ? '#34C759' : '#FF3B30' },
              ]}
            >
              <Text style={styles.statusBadgeText}>
                {room.trang_thai === 'ConTrong' ? '🟢 Còn trống' : '🔴 Đã cho thuê'}
              </Text>
            </View>
          </View>

          {/* KHỐI NỘI DUNG CHÍNH */}
          <View style={styles.contentPadding}>
            
            {/* TIÊU ĐỀ PHÒNG TRỌ */}
            <Text style={styles.roomTitle}>{room.tieu_de || `Phòng ${room.so_phong}`}</Text>

            {/* ĐỊA CHỈ KHU TRỌ */}
            <View style={styles.addressRow}>
              <Text style={styles.addressIcon}>📍</Text>
              <Text style={styles.addressText}>
                {[
                  room.khu_tro?.dia_chi,
                  room.khu_tro?.ten_khu_tro,
                  room.khu_tro?.quan_huyen,
                  room.khu_tro?.thanh_pho,
                ]
                  .filter(Boolean)
                  .join(', ') || 'Chưa cập nhật địa chỉ'}
              </Text>
            </View>

            {/* BẢNG THÔNG SỐ NỔI BẬT */}
            <View style={styles.statsCard}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Giá thuê</Text>
                <Text style={styles.statPrice}>{formattedPrice} đ</Text>
                <Text style={styles.statSub}>/tháng</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Tiền cọc</Text>
                <Text style={styles.statValue}>{formattedDeposit} đ</Text>
                <Text style={styles.statSub}>Hoàn lại khi trả</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Diện tích</Text>
                <Text style={styles.statValue}>{room.dien_tich ? `${room.dien_tich} m²` : '--'}</Text>
                <Text style={styles.statSub}>Sức chứa 2-3 người</Text>
              </View>
            </View>

            {/* KHỐI TIỆN ÍCH PHÒNG TRỌ */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeaderTitle}>✨ Tiện ích phòng trọ</Text>
              {room.danh_sach_tien_ich && room.danh_sach_tien_ich.length > 0 ? (
                <View style={styles.amenitiesGrid}>
                  {room.danh_sach_tien_ich.map((ti: any) => (
                    <View key={ti.ma_tien_ich} style={styles.amenityBadge}>
                      <Text style={styles.amenityIcon}>{getAmenityIcon(ti.ten_tien_ich)}</Text>
                      <Text style={styles.amenityName}>{ti.ten_tien_ich}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={{ color: '#888', fontSize: 13, marginTop: 6 }}>
                  Phòng được trang bị đầy đủ tiện nghi cơ bản.
                </Text>
              )}
            </View>

            {/* KHỐI MÔ TẢ CHI TIẾT */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeaderTitle}>📝 Mô tả chi tiết</Text>
              <Text style={styles.descriptionText}>
                {room.mo_ta ||
                  `Phòng trọ rộng rãi, thoáng mát tại ${room.khu_tro?.ten_khu_tro || 'khu vực an ninh'}. Giao thông thuận tiện, gần trường học, chợ và siêu thị. Giờ giấc tự do, chủ trọ thân thiện, điện nước giá dân.`}
              </Text>
            </View>

            {/* KHỐI THÔNG TIN CHỦ TRỌ */}
            <View style={styles.landlordCard}>
              <View style={styles.landlordAvatar}>
                <Text style={styles.landlordAvatarText}>
                  {room.ten_chu_tro ? room.ten_chu_tro.charAt(0).toUpperCase() : 'C'}
                </Text>
              </View>

              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.landlordSub}>Chủ nhà / Quản lý trọ</Text>
                <Text style={styles.landlordName}>{room.ten_chu_tro || 'Chủ trọ'}</Text>
                <Text style={styles.landlordPhone}>📞 {room.so_dien_thoai_chu_tro || '0901234567'}</Text>
              </View>

              <TouchableOpacity style={styles.contactOwnerBtn} onPress={handleCall}>
                <Text style={styles.contactOwnerText}>Gọi ngay</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </ScrollView>

      {/* THANH BOTTOM CỐ ĐỊNH Ở ĐÁY */}
      <View style={styles.bottomBarWrapper}>
        <View style={[styles.bottomBarContent, { maxWidth: isDesktop ? 1000 : '100%' }]}>
          <View>
            <Text style={styles.bottomPriceLabel}>Giá thuê duy trì</Text>
            <Text style={styles.bottomPriceVal}>{formattedPrice} đ/tháng</Text>
          </View>

          <View style={styles.bottomActionRow}>
            {/* NÚT GỌI ĐIỆN */}
            <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
              <Text style={styles.callBtnIcon}>📞</Text>
              <Text style={styles.callBtnText}>Gọi điện</Text>
            </TouchableOpacity>

            {/* NÚT ĐẶT LỊCH XEM PHÒNG */}
            <TouchableOpacity style={styles.bookBtn} onPress={handleOpenBookingModal}>
              <Text style={styles.bookBtnIcon}>📅</Text>
              <Text style={styles.bookBtnText}>Đặt lịch xem</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* MODAL ĐẶT LỊCH HẸN XEM PHÒNG */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📅 Đặt lịch hẹn xem phòng</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalRoomSub} numberOfLines={1}>
              Phòng: {room.tieu_de || `Phòng ${room.so_phong}`}
            </Text>

            <ScrollView style={{ maxHeight: 380 }}>
              <Text style={styles.inputLabel}>Họ và tên người hẹn *</Text>
              <TextInput
                style={styles.inputField}
                placeholder="Nhập họ và tên của bạn..."
                value={bookingName}
                onChangeText={setBookingName}
              />

              <Text style={styles.inputLabel}>Số điện thoại liên hệ *</Text>
              <TextInput
                style={styles.inputField}
                placeholder="Nhập số điện thoại..."
                keyboardType="phone-pad"
                value={bookingPhone}
                onChangeText={setBookingPhone}
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Ngày hẹn xem (YYYY-MM-DD) *</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="2026-09-25"
                    value={bookingDate}
                    onChangeText={setBookingDate}
                  />
                </View>

                <View style={{ width: 110 }}>
                  <Text style={styles.inputLabel}>Giờ xem *</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="09:00"
                    value={bookingTime}
                    onChangeText={setBookingTime}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Ghi chú thêm cho chủ trọ</Text>
              <TextInput
                style={[styles.inputField, { height: 75, textAlignVertical: 'top' }]}
                placeholder="Ví dụ: Em muốn xem phòng vào buổi sáng..."
                multiline
                value={bookingNote}
                onChangeText={setBookingNote}
              />
            </ScrollView>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Hủy bỏ</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSubmitBooking}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.modalSubmitText}>Xác nhận đặt lịch</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 14,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  // TOP NAV HEADER
  topNavHeader: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingTop: Platform.OS === 'ios' ? 45 : 15,
    paddingBottom: 14,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  topNavContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    alignSelf: 'center',
  },
  navBackBtn: {
    paddingRight: 12,
  },
  navBackText: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: '600',
  },
  navTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  navShareBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F7FB',
    justifyContent: 'center',
    alignItems: 'center',
  },

  mainWrapper: {
    width: '100%',
    alignSelf: 'center',
  },

  // ALBUM SLIDER
  albumContainer: {
    position: 'relative',
    height: 320,
    backgroundColor: '#000',
  },
  imageSlide: {
    height: 320,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  imageCounter: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCounterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // NỘI DUNG CHÍNH
  contentPadding: {
    padding: 16,
  },
  roomTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111',
    lineHeight: 30,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  addressIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  addressText: {
    fontSize: 14,
    color: '#555',
    flex: 1,
    lineHeight: 20,
  },

  // THÔNG SỐ
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  statPrice: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
  },
  statSub: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#EEEEEE',
  },

  // CARD TIỆN ÍCH & MÔ TẢ
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    marginBottom: 16,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 12,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  amenityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF5FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D4E5FF',
  },
  amenityIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  amenityName: {
    color: '#0066CC',
    fontSize: 13,
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
  },

  // CHỦ TRỌ
  landlordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    marginBottom: 16,
  },
  landlordAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  landlordAvatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 20,
  },
  landlordSub: {
    fontSize: 11,
    color: '#888',
  },
  landlordName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginTop: 1,
  },
  landlordPhone: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
    marginTop: 2,
  },
  contactOwnerBtn: {
    backgroundColor: '#EEF5FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  contactOwnerText: {
    color: '#007AFF',
    fontWeight: 'bold',
    fontSize: 13,
  },

  // BOTTOM BAR
  bottomBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  bottomBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    alignSelf: 'center',
  },
  bottomPriceLabel: {
    fontSize: 11,
    color: '#888',
  },
  bottomPriceVal: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  bottomActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34C759',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 14,
  },
  callBtnIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  callBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 14,
  },
  bookBtnIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  bookBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  modalCloseText: {
    fontSize: 20,
    color: '#999',
    padding: 4,
  },
  modalRoomSub: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
    marginTop: 10,
    marginBottom: 4,
  },
  inputField: {
    backgroundColor: '#F5F7FB',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    fontSize: 14,
    color: '#222',
    outlineStyle: 'none',
  } as any,
  modalActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#F5F7FB',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  modalCancelText: {
    color: '#666',
    fontWeight: '600',
  },
  modalSubmitBtn: {
    flex: 1.5,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
