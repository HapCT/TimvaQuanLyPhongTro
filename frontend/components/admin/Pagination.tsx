import React, { useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export const ADMIN_PAGE_SIZE = 6;

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
}

export default function Pagination({
  currentPage,
  totalItems,
  onPageChange,
  pageSize = ADMIN_PAGE_SIZE,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) onPageChange(totalPages);
  }, [currentPage, onPageChange, totalPages]);

  if (totalItems === 0) return null;

  const firstItem = (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, totalItems);
  const buttonStyle = {
    minWidth: 76,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#DDE1E6',
    borderRadius: 6,
    alignItems: 'center' as const,
    backgroundColor: '#FFFFFF',
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
      }}
    >
      <Text style={{ color: '#6B7280', fontSize: 13 }}>
        Hiển thị {firstItem}-{lastItem} / {totalItems}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Trang trước"
          disabled={currentPage <= 1}
          onPress={() => onPageChange(currentPage - 1)}
          style={[buttonStyle, currentPage <= 1 && { opacity: 0.45 }]}
        >
          <Text style={{ color: '#374151', fontSize: 13 }}>Trước</Text>
        </TouchableOpacity>
        <Text style={{ minWidth: 76, textAlign: 'center', color: '#374151', fontSize: 13 }}>
          Trang {currentPage} / {totalPages}
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Trang sau"
          disabled={currentPage >= totalPages}
          onPress={() => onPageChange(currentPage + 1)}
          style={[buttonStyle, currentPage >= totalPages && { opacity: 0.45 }]}
        >
          <Text style={{ color: '#374151', fontSize: 13 }}>Sau</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}