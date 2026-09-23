import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '@/services/supabase';
import { backendApi } from '@/services/backend';
import { useRouter } from 'expo-router';
import { Head } from 'expo-router/head';

export default function ChuTroDashboard() {
  const router = useRouter();
  const [hoTen, setHoTen] = useState('');
  const [loading, setLoading] = useState(true);
  const [myRooms, setMyRooms] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, rented: 0, available: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }

      const { data: userData } = await supabase
        .from('nguoi_dung')
        .select('ho_ten, ma_nguoi_dung')
        .eq('ma_nguoi_dung', user.id)
        .single();

      if (userData) {
        setHoTen(userData.ho_ten);
      }

      const response = await backendApi.get('/api/phong-tro');
      if (response.data && response.data.rooms) {
        // Lọc các phòng thuộc về chủ trọ này
        const filtered = response.data.rooms.filter(
          (r: any) => String(r.khu_tro?.ma_chu_tro) === String(user.id)
        );
        setMyRooms(filtered);
        
        let rented = 0;
        let available = 0;
        filtered.forEach((r: any) => {
          if (r.trang_thai === 'ConTrong') available++;
          else rented++;
        });
        
        setStats({ total: filtered.length, rented, available });
      }
    } catch (error) {
      console.log('LOAD LANDLORD DATA ERROR:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Head><title>Tổng quan | Chủ trọ</title></Head>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.smallText}>Tổng quan</Text>
            <Text style={styles.userName}>Chào {hoTen || 'Chủ trọ'} 👋</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{hoTen ? hoTen.charAt(0).toUpperCase() : 'C'}</Text>
          </View>
        </View>

        {/* STATISTICS */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: '#EFF6FF' }]}>
            <View style={styles.statIconBox}><Text style={styles.statIcon}>🏠</Text></View>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Tổng phòng</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: '#DEF7EC' }]}>
            <View style={styles.statIconBox}><Text style={styles.statIcon}>✨</Text></View>
            <Text style={styles.statValue}>{stats.available}</Text>
            <Text style={styles.statLabel}>Còn trống</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: '#FDE8E8' }]}>
            <View style={styles.statIconBox}><Text style={styles.statIcon}>🔒</Text></View>
            <Text style={styles.statValue}>{stats.rented}</Text>
            <Text style={styles.statLabel}>Đã thuê</Text>
          </View>
        </View>

        {/* QUICK ACTIONS */}
        <Text style={styles.sectionTitle}>Lối tắt</Text>
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/chu-tro/add-room')}>
            <View style={[styles.actionIconBox, { backgroundColor: '#2563EB' }]}>
               <Text style={styles.actionIcon}>+</Text>
            </View>
            <Text style={styles.actionText}>Đăng phòng</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIconBox, { backgroundColor: '#8B5CF6' }]}>
               <Text style={styles.actionIcon}>📋</Text>
            </View>
            <Text style={styles.actionText}>Hợp đồng</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIconBox, { backgroundColor: '#F59E0B' }]}>
               <Text style={styles.actionIcon}>💰</Text>
            </View>
            <Text style={styles.actionText}>Thu tiền</Text>
          </TouchableOpacity>
        </View>

        {/* ROOM LIST */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Danh sách phòng của bạn</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>

        {myRooms.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>Bạn chưa có phòng trọ nào.</Text>
            <TouchableOpacity style={styles.addRoomBtn} onPress={() => router.push('/chu-tro/add-room')}>
               <Text style={styles.addRoomBtnText}>Đăng phòng đầu tiên</Text>
            </TouchableOpacity>
          </View>
        ) : (
          myRooms.map((room) => (
            <TouchableOpacity
              key={room.ma_phong}
              style={styles.roomCard}
              onPress={() => router.push(`/room/${room.ma_phong}` as any)}
            >
              <Image
                source={{ uri: room.anh_dai_dien || 'https://via.placeholder.com/300x200?text=No+Image' }}
                style={styles.roomImage}
              />
              <View style={styles.roomInfo}>
                <View style={styles.roomHeaderRow}>
                   <Text style={styles.roomName} numberOfLines={1}>
                     {room.tieu_de || `Phòng ${room.so_phong}`}
                   </Text>
                   <View style={[styles.statusBadge, { backgroundColor: room.trang_thai === 'ConTrong' ? '#DEF7EC' : '#FDE8E8' }]}>
                      <Text style={[styles.statusText, { color: room.trang_thai === 'ConTrong' ? '#03543F' : '#9B1C1C' }]}>
                         {room.trang_thai === 'ConTrong' ? 'Trống' : 'Đã thuê'}
                      </Text>
                   </View>
                </View>
                
                <Text style={styles.roomAddress} numberOfLines={1}>
                  📍 {room.khu_tro?.dia_chi || 'Chưa cập nhật địa chỉ'}
                </Text>
                
                <View style={styles.roomBottom}>
                  <Text style={styles.roomPrice}>
                    {room.gia_thue?.toLocaleString('vi-VN')} đ<Text style={styles.roomPriceMonth}>/th</Text>
                  </Text>
                  <Text style={styles.roomArea}>
                    {room.dien_tich ? `${room.dien_tich} m²` : '--'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}

      </ScrollView>
    </View>
  );
}

// =====================================================
// STYLE
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFCFE',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFCFE',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 90,
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  smallText: {
    fontSize: 14,
    color: '#8E9AAF',
    marginBottom: 4,
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    alignItems: 'flex-start',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    fontSize: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  seeAll: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '700',
  },
  
  quickActionsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
    marginBottom: 32,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
  },
  actionIconBox: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionIcon: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  
  roomCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 16,
    flexDirection: 'row',
    padding: 12,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F8FAFC',
  },
  roomImage: {
    width: 100,
    height: 100,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  roomInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  roomHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  roomName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  roomAddress: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 6,
    marginBottom: 10,
  },
  roomBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2563EB',
  },
  roomPriceMonth: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  roomArea: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  
  empty: {
    backgroundColor: '#FFFFFF',
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderStyle: 'dashed',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 24,
  },
  addRoomBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addRoomBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  }
});
