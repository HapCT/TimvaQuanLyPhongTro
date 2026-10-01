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

/**
 * Dùng cho TextInput nhập tiền — tự thêm dấu chấm ngăn cách khi gõ.
 * Nhận chuỗi thô người dùng gõ, trả về chuỗi đã format.
 * Ví dụ: "3000000" -> "3.000.000"
 */
export function formatMoneyInput(raw: string): string {
  // Chỉ giữ lại chữ số
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  // Thêm dấu chấm mỗi 3 chữ số từ phải sang
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Chuyển chuỗi đã format ("3.000.000") về số nguyên (3000000) để submit.
 */
export function parseMoneyInput(formatted: string): number {
  const digits = formatted.replace(/\./g, '').replace(/\D/g, '');
  const n = parseInt(digits, 10);
  return Number.isFinite(n) ? n : 0;
}

