import { formatMoneyInput, formatNumber, parseMoneyInput } from '@/utils/format';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { backendApi } from '@/services/backend';
import { showAlert } from '@/utils/alert';

type BillingPayment = {
  ma_thanh_toan: number;
  so_tien: number;
  phuong_thuc: string;
  ma_giao_dich?: string | null;
  noi_dung?: string | null;
  trang_thai: 'ChoXacNhan' | 'DaXacNhan' | 'TuChoi';
  ngay_tao: string;
};

type Invoice = {
  ma_hoa_don: number;
  ma_hop_dong: number;
  ky_thanh_toan: string;
  han_thanh_toan: string;
  tien_phong: number;
  chi_so_dien_cu: number;
  chi_so_dien_moi: number;
  don_gia_dien: number;
  tien_dien: number;
  chi_so_nuoc_cu: number;
  chi_so_nuoc_moi: number;
  don_gia_nuoc: number;
  tien_nuoc: number;
  phi_khac: number;
  tong_tien: number;
  da_thanh_toan: number;
  cho_xac_nhan: number;
  con_no: number;
  trang_thai: string;
  ghi_chu?: string | null;
  hop_dong: {
    ma_hop_dong: number;
    nguoi_thue?: string;
    phong?: string;
    so_phong?: string;
    ten_khu_tro?: string;
    dia_chi?: string;
    dien_tich?: number | null;
    tang?: number | null;
    so_nguoi_dang_o?: number;
    so_nguoi_toi_da?: number;
    so_cho_con_lai?: number;
  };
  thanh_toan: BillingPayment[];
};

type Contract = {
  ma_hop_dong: number;
  trang_thai: string;
  gia_thue: number;
  nguoi_thue?: { ho_ten?: string };
  phong?: {
    tieu_de?: string;
    so_phong?: string;
    ten_khu_tro?: string;
    dia_chi?: string;
    dien_tich?: number | null;
    tang?: number | null;
    so_nguoi_dang_o?: number;
    so_nguoi_toi_da?: number;
    so_cho_con_lai?: number;
  };
};

const STATUS_LABEL: Record<string, string> = {
  ChuaThanhToan: 'Chưa thanh toán',
  ChoXacNhan: 'Chờ xác nhận thanh toán',
  ThanhToanMotPhan: 'Đã thanh toán một phần',
  DaThanhToan: 'Đã thanh toán',
  QuaHan: 'Quá hạn',
};

const PAYMENT_STATUS_LABEL: Record<BillingPayment['trang_thai'], string> = {
  ChoXacNhan: 'Chờ xác nhận',
  DaXacNhan: 'Đã xác nhận',
  TuChoi: 'Từ chối',
};

const formatMoney = (value: number) => `${formatNumber(value || 0)} đ`;
const currentPeriod = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};
const nextDueDate = () => {
  const now = new Date();
  const dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 5);
  return `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-05`;
};

export default function BillingManagement({ tenantView = false }: { tenantView?: boolean }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyPaymentId, setBusyPaymentId] = useState<number | null>(null);
  const [invoiceContract, setInvoiceContract] = useState<Contract | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [recordAsLandlord, setRecordAsLandlord] = useState(false);

  const [period, setPeriod] = useState(currentPeriod());
  const [dueDate, setDueDate] = useState(nextDueDate());
  const [electricityPrevious, setElectricityPrevious] = useState('0');
  const [electricityCurrent, setElectricityCurrent] = useState('0');
  const [electricityRate, setElectricityRate] = useState('');
  const [waterPrevious, setWaterPrevious] = useState('0');
  const [waterCurrent, setWaterCurrent] = useState('0');
  const [waterRate, setWaterRate] = useState('');
  const [otherFee, setOtherFee] = useState('0');
  const [invoiceNote, setInvoiceNote] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Chuyển khoản');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const requests = [backendApi.get('/api/hoa-don')];
      if (!tenantView) requests.push(backendApi.get('/api/hop-dong'));
      const results = await Promise.all(requests);
      setInvoices(results[0].data || []);
      if (!tenantView) setContracts(results[1]?.data || []);
    } catch (error: any) {
      showAlert('Lỗi', error?.response?.data?.error || 'Không thể tải hóa đơn và công nợ.');
    } finally {
      setLoading(false);
    }
  }, [tenantView]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const resetInvoiceForm = (contract: Contract) => {
    setInvoiceContract(contract);
    setPeriod(currentPeriod());
    setDueDate(nextDueDate());
    setElectricityPrevious('0');
    setElectricityCurrent('0');
    setElectricityRate('');
    setWaterPrevious('0');
    setWaterCurrent('0');
    setWaterRate('');
    setOtherFee('0');
    setInvoiceNote('');
  };

  const createInvoice = async () => {
    if (!invoiceContract) return;
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period) || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      showAlert('Dữ liệu ngày không hợp lệ', 'Nhập kỳ hóa đơn dạng YYYY-MM và hạn thanh toán dạng YYYY-MM-DD.');
      return;
    }
    try {
      setSaving(true);
      await backendApi.post('/api/hoa-don', {
        ma_hop_dong: invoiceContract.ma_hop_dong,
        ky_thanh_toan: period,
        han_thanh_toan: dueDate,
        chi_so_dien_cu: electricityPrevious || 0,
        chi_so_dien_moi: electricityCurrent || 0,
        don_gia_dien: parseMoneyInput(electricityRate),
        chi_so_nuoc_cu: waterPrevious || 0,
        chi_so_nuoc_moi: waterCurrent || 0,
        don_gia_nuoc: parseMoneyInput(waterRate),
        phi_khac: parseMoneyInput(otherFee),
        ghi_chu: invoiceNote.trim() || null,
      });
      setInvoiceContract(null);
      await loadData();
      showAlert('Thành công', 'Đã phát hành hóa đơn.');
    } catch (error: any) {
      showAlert('Không thể tạo hóa đơn', error?.response?.data?.error || 'Vui lòng kiểm tra thông tin hóa đơn.');
    } finally {
      setSaving(false);
    }
  };

  const openPayment = (invoice: Invoice, asLandlord: boolean) => {
    const available = Math.max(0, Number(invoice.con_no) - Number(invoice.cho_xac_nhan));
    setPaymentInvoice(invoice);
    setRecordAsLandlord(asLandlord);
    setPaymentAmount(formatMoneyInput(String(available)));
    setPaymentMethod(asLandlord ? 'Tiền mặt' : 'Chuyển khoản');
    setPaymentReference('');
    setPaymentNote('');
  };

  const submitPayment = async () => {
    if (!paymentInvoice) return;
    const amount = parseMoneyInput(paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      showAlert('Số tiền không hợp lệ', 'Nhập số tiền nguyên đồng lớn hơn 0.');
      return;
    }
    try {
      setSaving(true);
      const endpoint = recordAsLandlord
        ? `/api/hoa-don/${paymentInvoice.ma_hoa_don}/ghi-nhan`
        : `/api/hoa-don/${paymentInvoice.ma_hoa_don}/thanh-toan`;
      await backendApi.post(endpoint, {
        so_tien: amount,
        phuong_thuc: paymentMethod,
        ma_giao_dich: paymentReference.trim() || null,
        noi_dung: paymentNote.trim() || null,
      });
      setPaymentInvoice(null);
      await loadData();
      showAlert('Thành công', recordAsLandlord ? 'Đã ghi nhận khoản tiền thực nhận.' : 'Đã gửi khoản thanh toán để chủ trọ xác nhận.');
    } catch (error: any) {
      showAlert('Không thể ghi nhận', error?.response?.data?.error || 'Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const updatePayment = async (invoice: Invoice, payment: BillingPayment, status: 'DaXacNhan' | 'TuChoi') => {
    try {
      setBusyPaymentId(payment.ma_thanh_toan);
      await backendApi.patch(`/api/hoa-don/${invoice.ma_hoa_don}/thanh-toan/${payment.ma_thanh_toan}`, { trang_thai: status });
      await loadData();
      showAlert('Thành công', status === 'DaXacNhan' ? 'Đã xác nhận thanh toán.' : 'Đã từ chối thanh toán.');
    } catch (error: any) {
      showAlert('Lỗi', error?.response?.data?.error || 'Không thể cập nhật thanh toán.');
    } finally {
      setBusyPaymentId(null);
    }
  };

  const activeContracts = contracts.filter((contract) => contract.trang_thai === 'DangHieuLuc');
  const statusColor = (status: string) => status === 'DaThanhToan' ? '#15803D' : status === 'QuaHan' ? '#B91C1C' : '#B45309';

  return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <View>
          <Text style={{ color: '#111827', fontSize: 20, fontWeight: '700' }}>{tenantView ? 'Hóa đơn & công nợ' : 'Hóa đơn, điện nước & công nợ'}</Text>
          <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 4 }}>{tenantView ? 'Theo dõi số phải trả và gửi khoản thanh toán.' : 'Lập hóa đơn theo kỳ, đối soát khoản thu và số còn nợ.'}</Text>
        </View>
        <TouchableOpacity onPress={loadData} disabled={loading} style={{ borderWidth: 1, borderColor: '#DDE1E6', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8 }}>
          <Text style={{ color: '#2563EB', fontSize: 13 }}>Làm mới</Text>
        </TouchableOpacity>
      </View>

      {!tenantView && (
        <View style={{ gap: 8 }}>
          <Text style={{ color: '#1F2937', fontSize: 15, fontWeight: '600' }}>Lập hóa đơn cho hợp đồng đang hiệu lực</Text>
          {activeContracts.length === 0 ? <Text style={{ color: '#6B7280', fontSize: 13 }}>Không có hợp đồng đang hiệu lực.</Text> : activeContracts.map((contract) => (
            <View key={contract.ma_hop_dong} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 6, padding: 12 }}>
              <View style={{ flex: 1, minWidth: 180 }}>
                <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '600' }}>{contract.phong?.tieu_de || `Phòng ${contract.phong?.so_phong || ''}`}</Text>
                <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 3 }}>Hợp đồng #{contract.ma_hop_dong} · {contract.nguoi_thue?.ho_ten || 'Người thuê'} · {formatMoney(contract.gia_thue)}/tháng</Text>
                <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 2 }}>
                  {contract.phong?.ten_khu_tro || 'Khu trọ'}{contract.phong?.dia_chi ? ` · ${contract.phong.dia_chi}` : ''}
                </Text>
                <Text style={{ color: '#4B5563', fontSize: 12, marginTop: 2 }}>
                  Phòng {contract.phong?.so_phong || '--'} · {contract.phong?.dien_tich ?? '--'} m² · Tầng {contract.phong?.tang ?? '--'}
                </Text>
                <Text style={{ color: '#4B5563', fontSize: 12, marginTop: 2 }}>
                  Đang ở/giữ chỗ {contract.phong?.so_nguoi_dang_o ?? 0}/{contract.phong?.so_nguoi_toi_da ?? '--'} · Còn {contract.phong?.so_cho_con_lai ?? '--'} chỗ
                </Text>
              </View>
              <TouchableOpacity onPress={() => resetInvoiceForm(contract)} style={{ backgroundColor: '#EAF3FF', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8 }}>
                <Text style={{ color: '#2563EB', fontSize: 13, fontWeight: '600' }}>Tạo hóa đơn</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={{ gap: 10 }}>
        <Text style={{ color: '#1F2937', fontSize: 15, fontWeight: '600' }}>Danh sách hóa đơn ({invoices.length})</Text>
        {loading ? <ActivityIndicator size="large" color="#2563EB" /> : invoices.length === 0 ? (
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 6, padding: 18 }}><Text style={{ color: '#6B7280', fontSize: 13 }}>Chưa có hóa đơn.</Text></View>
        ) : invoices.map((invoice) => (
          <View key={invoice.ma_hoa_don} style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 14, gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#1F2937', fontSize: 15, fontWeight: '700' }}>
                  Kỳ {String(invoice.ky_thanh_toan).slice(0, 7)} · {invoice.hop_dong?.phong || `Hợp đồng #${invoice.ma_hop_dong}`}{invoice.hop_dong?.so_phong ? ` · Phòng ${invoice.hop_dong.so_phong}` : ''}
                </Text>
                {!tenantView && <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 3 }}>{invoice.hop_dong?.nguoi_thue || 'Người thuê'} · {invoice.hop_dong?.ten_khu_tro || 'Khu trọ'}</Text>}
              </View>
              <Text style={{ color: statusColor(invoice.trang_thai), fontSize: 12, fontWeight: '700' }}>{STATUS_LABEL[invoice.trang_thai] || invoice.trang_thai}</Text>
            </View>
            {!!invoice.hop_dong?.dia_chi && <Text style={{ color: '#4B5563', fontSize: 12 }}>Địa chỉ: {invoice.hop_dong.dia_chi}</Text>}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              <Text style={{ color: '#6B7280', fontSize: 12 }}>Diện tích: {invoice.hop_dong?.dien_tich ?? '--'} m²</Text>
              <Text style={{ color: '#6B7280', fontSize: 12 }}>Tầng: {invoice.hop_dong?.tang ?? '--'}</Text>
              <Text style={{ color: '#6B7280', fontSize: 12 }}>
                Sức chứa: {invoice.hop_dong?.so_nguoi_dang_o ?? 0}/{invoice.hop_dong?.so_nguoi_toi_da ?? '--'} · còn {invoice.hop_dong?.so_cho_con_lai ?? '--'} chỗ
              </Text>
            </View>
            <Text style={{ color: '#4B5563', fontSize: 13 }}>Hạn thanh toán: {String(invoice.han_thanh_toan).slice(0, 10)}</Text>
            <View style={{ borderTopWidth: 1, borderTopColor: '#F0F1F3', paddingTop: 8, gap: 4 }}>
              <Text style={{ color: '#4B5563', fontSize: 13 }}>Tiền phòng: {formatMoney(invoice.tien_phong)}</Text>
              <Text style={{ color: '#4B5563', fontSize: 13 }}>Điện: {invoice.chi_so_dien_cu} → {invoice.chi_so_dien_moi} kWh × {formatMoney(invoice.don_gia_dien)} = {formatMoney(invoice.tien_dien)}</Text>
              <Text style={{ color: '#4B5563', fontSize: 13 }}>Nước: {invoice.chi_so_nuoc_cu} → {invoice.chi_so_nuoc_moi} m³ × {formatMoney(invoice.don_gia_nuoc)} = {formatMoney(invoice.tien_nuoc)}</Text>
              <Text style={{ color: '#4B5563', fontSize: 13 }}>Phí khác: {formatMoney(invoice.phi_khac)}</Text>
              <Text style={{ color: '#1F2937', fontSize: 14, fontWeight: '700', marginTop: 3 }}>Tổng: {formatMoney(invoice.tong_tien)}</Text>
              <Text style={{ color: '#15803D', fontSize: 13 }}>Đã xác nhận: {formatMoney(invoice.da_thanh_toan)}</Text>
              {!!invoice.cho_xac_nhan && <Text style={{ color: '#B45309', fontSize: 13 }}>Đang chờ xác nhận: {formatMoney(invoice.cho_xac_nhan)}</Text>}
              <Text style={{ color: Number(invoice.con_no) > 0 ? '#B91C1C' : '#15803D', fontSize: 14, fontWeight: '700' }}>Còn nợ: {formatMoney(invoice.con_no)}</Text>
            </View>
            {!!invoice.ghi_chu && <Text style={{ color: '#4B5563', fontSize: 13 }}>Ghi chú: {invoice.ghi_chu}</Text>}

            {!!invoice.thanh_toan?.length && (
              <View style={{ borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 8, gap: 8 }}>
                <Text style={{ color: '#1F2937', fontSize: 13, fontWeight: '600' }}>Các khoản thanh toán</Text>
                {invoice.thanh_toan.map((payment) => (
                  <View key={payment.ma_thanh_toan} style={{ gap: 5, paddingVertical: 5 }}>
                    <Text style={{ color: '#4B5563', fontSize: 12 }}>{payment.ngay_tao} · {formatMoney(payment.so_tien)} · {payment.phuong_thuc} · {PAYMENT_STATUS_LABEL[payment.trang_thai]}</Text>
                    {!!payment.ma_giao_dich && <Text style={{ color: '#6B7280', fontSize: 12 }}>Mã giao dịch: {payment.ma_giao_dich}</Text>}
                    {!!payment.noi_dung && <Text style={{ color: '#6B7280', fontSize: 12 }}>{payment.noi_dung}</Text>}
                    {!tenantView && payment.trang_thai === 'ChoXacNhan' && (
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity disabled={busyPaymentId === payment.ma_thanh_toan} onPress={() => updatePayment(invoice, payment, 'DaXacNhan')} style={{ backgroundColor: '#EAF3FF', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 7 }}>
                          <Text style={{ color: '#2563EB', fontSize: 12 }}>Xác nhận đã nhận</Text>
                        </TouchableOpacity>
                        <TouchableOpacity disabled={busyPaymentId === payment.ma_thanh_toan} onPress={() => updatePayment(invoice, payment, 'TuChoi')} style={{ backgroundColor: '#FEF2F2', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 7 }}>
                          <Text style={{ color: '#B91C1C', fontSize: 12 }}>Từ chối</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {Number(invoice.con_no) > 0 && (tenantView ? (
              <TouchableOpacity onPress={() => openPayment(invoice, false)} style={{ alignSelf: 'flex-start', backgroundColor: '#2563EB', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 9 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>Gửi thanh toán</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => openPayment(invoice, true)} style={{ alignSelf: 'flex-start', backgroundColor: '#EAF3FF', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 9 }}>
                <Text style={{ color: '#2563EB', fontSize: 13, fontWeight: '600' }}>Ghi nhận tiền đã thu</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      <Modal visible={!!invoiceContract} transparent animationType="fade" onRequestClose={() => setInvoiceContract(null)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 16 }}>
          <View style={{ width: '100%', maxWidth: 560, maxHeight: '92%', alignSelf: 'center', backgroundColor: '#FFFFFF', borderRadius: 8, padding: 18, gap: 10 }}>
            <Text style={{ color: '#111827', fontSize: 18, fontWeight: '700' }}>Lập hóa đơn điện nước</Text>
            <Text style={{ color: '#6B7280', fontSize: 13 }}>{invoiceContract?.phong?.tieu_de || `Hợp đồng #${invoiceContract?.ma_hop_dong}`}</Text>
            <ScrollView keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets contentContainerStyle={{ gap: 9 }}>
              <TextInput accessibilityLabel="Kỳ thanh toán" value={period} onChangeText={setPeriod} placeholder="Kỳ hóa đơn YYYY-MM" style={inputStyle} />
              <TextInput accessibilityLabel="Hạn thanh toán" value={dueDate} onChangeText={setDueDate} placeholder="Hạn YYYY-MM-DD" style={inputStyle} />
              <Text style={labelStyle}>Điện (kWh)</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput accessibilityLabel="Chỉ số điện cũ" value={electricityPrevious} onChangeText={setElectricityPrevious} keyboardType="decimal-pad" placeholder="Số cũ" style={[inputStyle, { flex: 1 }]} />
                <TextInput accessibilityLabel="Chỉ số điện mới" value={electricityCurrent} onChangeText={setElectricityCurrent} keyboardType="decimal-pad" placeholder="Số mới" style={[inputStyle, { flex: 1 }]} />
                <TextInput accessibilityLabel="Đơn giá điện" value={electricityRate} onChangeText={(v) => setElectricityRate(formatMoneyInput(v))} keyboardType="numeric" placeholder="đ/kWh" style={[inputStyle, { flex: 1 }]} />
              </View>
              <Text style={labelStyle}>Nước (m³)</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput accessibilityLabel="Chỉ số nước cũ" value={waterPrevious} onChangeText={setWaterPrevious} keyboardType="decimal-pad" placeholder="Số cũ" style={[inputStyle, { flex: 1 }]} />
                <TextInput accessibilityLabel="Chỉ số nước mới" value={waterCurrent} onChangeText={setWaterCurrent} keyboardType="decimal-pad" placeholder="Số mới" style={[inputStyle, { flex: 1 }]} />
                <TextInput accessibilityLabel="Đơn giá nước" value={waterRate} onChangeText={(v) => setWaterRate(formatMoneyInput(v))} keyboardType="numeric" placeholder="đ/m³" style={[inputStyle, { flex: 1 }]} />
              </View>
              <TextInput accessibilityLabel="Phí khác" value={otherFee} onChangeText={(v) => setOtherFee(formatMoneyInput(v))} keyboardType="numeric" placeholder="Phí khác (đ)" style={inputStyle} />
              <TextInput accessibilityLabel="Ghi chú hóa đơn" value={invoiceNote} onChangeText={setInvoiceNote} placeholder="Ghi chú (không bắt buộc)" multiline style={[inputStyle, { minHeight: 68, textAlignVertical: 'top' }]} />
              <Text style={{ color: '#6B7280', fontSize: 12 }}>Tiền điện nước được tính theo mức tiêu thụ × đơn giá; tiền phòng lấy từ hợp đồng.</Text>
            </ScrollView>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
              <TouchableOpacity onPress={() => setInvoiceContract(null)} style={{ paddingHorizontal: 12, paddingVertical: 9 }}><Text style={{ color: '#4B5563' }}>Hủy</Text></TouchableOpacity>
              <TouchableOpacity disabled={saving} onPress={createInvoice} style={{ backgroundColor: '#2563EB', borderRadius: 6, paddingHorizontal: 14, paddingVertical: 9 }}>
                {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Phát hành</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={!!paymentInvoice} transparent animationType="fade" onRequestClose={() => setPaymentInvoice(null)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 16 }}>
          <View style={{ width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: '#FFFFFF', borderRadius: 8, padding: 18, gap: 10 }}>
            <Text style={{ color: '#111827', fontSize: 18, fontWeight: '700' }}>{recordAsLandlord ? 'Ghi nhận tiền đã thu' : 'Gửi khoản thanh toán'}</Text>
            <Text style={{ color: '#6B7280', fontSize: 13 }}>Còn nợ {formatMoney(paymentInvoice?.con_no || 0)}</Text>
            <TextInput accessibilityLabel="Số tiền thanh toán" value={paymentAmount} onChangeText={(v) => setPaymentAmount(formatMoneyInput(v))} keyboardType="numeric" placeholder="Số tiền (đ)" style={inputStyle} />
            <Text style={labelStyle}>Phương thức</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {['Chuyển khoản', 'Tiền mặt'].map((method) => (
                <TouchableOpacity key={method} onPress={() => setPaymentMethod(method)} style={{ borderWidth: 1, borderColor: paymentMethod === method ? '#2563EB' : '#D1D5DB', backgroundColor: paymentMethod === method ? '#EFF6FF' : '#FFFFFF', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8 }}>
                  <Text style={{ color: paymentMethod === method ? '#1D4ED8' : '#4B5563', fontSize: 13 }}>{method}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput accessibilityLabel="Mã giao dịch" value={paymentReference} onChangeText={setPaymentReference} placeholder="Mã giao dịch (không bắt buộc)" style={inputStyle} />
            <TextInput accessibilityLabel="Nội dung thanh toán" value={paymentNote} onChangeText={setPaymentNote} placeholder="Nội dung (không bắt buộc)" multiline style={[inputStyle, { minHeight: 60, textAlignVertical: 'top' }]} />
            {!recordAsLandlord && <Text style={{ color: '#6B7280', fontSize: 12 }}>Khoản này chỉ được trừ công nợ sau khi chủ trọ xác nhận đã nhận tiền.</Text>}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
              <TouchableOpacity onPress={() => setPaymentInvoice(null)} style={{ paddingHorizontal: 12, paddingVertical: 9 }}><Text style={{ color: '#4B5563' }}>Hủy</Text></TouchableOpacity>
              <TouchableOpacity disabled={saving} onPress={submitPayment} style={{ backgroundColor: '#2563EB', borderRadius: 6, paddingHorizontal: 14, paddingVertical: 9 }}>
                {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>{recordAsLandlord ? 'Lưu khoản thu' : 'Gửi xác nhận'}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const inputStyle = { minHeight: 42, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 6, paddingHorizontal: 10, color: '#111827' } as const;
const labelStyle = { color: '#374151', fontSize: 13, fontWeight: '600' as const };
