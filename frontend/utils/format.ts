/**
 * Định dạng số tiền kiểu Việt Nam: 1500000 -> "1.500.000".
 * Không dùng toLocaleString('vi-VN') vì trên Android (Hermes) nhiều máy
 * không hỗ trợ Intl đầy đủ nên mất dấu chấm ngăn cách hàng nghìn.
 */
export function formatNumber(value: unknown): string {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return '0';
  const sign = n < 0 ? '-' : '';
  return sign + Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** 1500000 -> "1.500.000 đ" */
export function formatVND(value: unknown): string {
  return `${formatNumber(value)} đ`;
}
