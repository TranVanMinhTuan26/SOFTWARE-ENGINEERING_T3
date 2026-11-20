'use client';

import React from 'react';
import { Save, Store, CreditCard, Award, Printer } from 'lucide-react';
import type { StoreSettings } from '../kieu-quan-tri';

interface SettingsTabProps {
  storeSettings: StoreSettings;
  setStoreSettings: React.Dispatch<React.SetStateAction<StoreSettings>>;
  adminToast: string;
  handleSaveSettings: (e: React.FormEvent) => void;
  settingsLoading?: boolean;
  settingsSaving?: boolean;
  settingsError?: string;
}

export function SettingsTab({
  storeSettings,
  setStoreSettings,
  adminToast,
  handleSaveSettings,
  settingsLoading,
  settingsSaving,
  settingsError,
}: SettingsTabProps) {
  return (
    <div className="tab-settings">
      <div className="page-head-row">
        <div>
          <h1 className="page-heading">Cài đặt & Cấu hình hệ thống</h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
            Quản lý thông tin thương hiệu quán, cổng thanh toán VNPay và quy định tích điểm.
          </p>
        </div>
        <button className="btn-add-primary" onClick={handleSaveSettings} disabled={settingsSaving}>
          <Save size={16} />
          <span>{settingsSaving ? 'Đang lưu...' : 'Lưu cấu hình'}</span>
        </button>
      </div>

      {settingsError && (
        <div
          style={{
            padding: '12px 18px',
            background: '#fee2e2',
            color: '#991b1b',
            border: '1px solid #fca5a5',
            borderRadius: '10px',
            marginBottom: '20px',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          {settingsError}
        </div>
      )}

      {adminToast && (
        <div
          style={{
            padding: '12px 18px',
            background: '#dcfce7',
            color: '#166534',
            border: '1px solid #86efac',
            borderRadius: '10px',
            marginBottom: '20px',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          {adminToast}
        </div>
      )}

      <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Nhóm 1: Thông tin cửa hàng */}
        <div className="admin-table-card" style={{ padding: '24px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '16px',
              borderBottom: '1px solid #f1f5f9',
              paddingBottom: '12px',
            }}
          >
            <Store size={20} color="#166534" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
              1. Thông tin cửa hàng & Thương hiệu
            </h3>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
            }}
          >
            <div>
              <label className="field-label">Tên quán / Doanh nghiệp</label>
              <input
                type="text"
                className="modal-input"
                value={storeSettings.storeName}
                onChange={(e) => setStoreSettings({ ...storeSettings, storeName: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label">Hotline liên hệ đặt món</label>
              <input
                type="text"
                className="modal-input"
                value={storeSettings.hotline}
                onChange={(e) => setStoreSettings({ ...storeSettings, hotline: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label">Địa chỉ trụ sở quán</label>
              <input
                type="text"
                className="modal-input"
                value={storeSettings.address}
                onChange={(e) => setStoreSettings({ ...storeSettings, address: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label">Email hỗ trợ khách hàng</label>
              <input
                type="email"
                className="modal-input"
                value={storeSettings.email}
                onChange={(e) => setStoreSettings({ ...storeSettings, email: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label">Khung giờ mở cửa hoạt động</label>
              <input
                type="text"
                className="modal-input"
                value={storeSettings.openHours}
                onChange={(e) => setStoreSettings({ ...storeSettings, openHours: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label">Website thương hiệu</label>
              <input
                type="text"
                className="modal-input"
                placeholder="https://brewlite.vn"
                value={storeSettings.website || ''}
                onChange={(e) => setStoreSettings({ ...storeSettings, website: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label">Link Fanpage Facebook</label>
              <input
                type="text"
                className="modal-input"
                placeholder="https://facebook.com/brewlite"
                value={storeSettings.facebook || ''}
                onChange={(e) => setStoreSettings({ ...storeSettings, facebook: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label">Link Instagram</label>
              <input
                type="text"
                className="modal-input"
                placeholder="https://instagram.com/brewlite"
                value={storeSettings.instagram || ''}
                onChange={(e) => setStoreSettings({ ...storeSettings, instagram: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Nhóm 2: Cấu hình VNPay Sandbox */}
        <div className="admin-table-card" style={{ padding: '24px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '16px',
              borderBottom: '1px solid #f1f5f9',
              paddingBottom: '12px',
            }}
          >
            <CreditCard size={20} color="#166534" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
              2. Cấu hình Cổng thanh toán trực tuyến VNPay Sandbox
            </h3>
          </div>

          <div
            style={{
              background: '#f8fafc',
              padding: '16px 20px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              fontSize: '13px',
              color: '#475569',
            }}
          >
            <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#166534' }}>
              🔒 Bảo mật cấp độ máy chủ:
            </p>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              Thông tin nhạy cảm của cổng thanh toán VNPay (<code>VNPAY_TMN_CODE</code> và{' '}
              <code>VNPAY_HASH_SECRET</code>) được lưu trữ an toàn trong biến môi trường (file{' '}
              <code>.env</code>) phía máy chủ backend. Hệ thống không lưu trữ hay truyền tải chuỗi
              khóa bí mật qua trình duyệt để chống nguy cơ rò rỉ và giả mạo giao dịch.
            </p>
          </div>
        </div>

        {/* Nhóm 3: Tích điểm & Quy đổi */}
        <div className="admin-table-card" style={{ padding: '24px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '16px',
              borderBottom: '1px solid #f1f5f9',
              paddingBottom: '12px',
            }}
          >
            <Award size={20} color="#166534" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
              3. Chính sách Tích lũy Điểm thưởng & Khách hàng
            </h3>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '16px',
            }}
          >
            <div>
              <label className="field-label">Tỷ lệ tích điểm (VNĐ chi tiêu = 1 điểm)</label>
              <input
                type="number"
                min="1"
                step="1"
                className="modal-input"
                value={storeSettings.pointRate ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.includes('-')) return;
                  setStoreSettings({ ...storeSettings, pointRate: val });
                }}
                placeholder="1000"
              />
              <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                Mặc định: 1.000 VNĐ chi tiêu tích được 1 điểm thưởng
              </span>
            </div>
            <div>
              <label className="field-label">Đổi ngược điểm sang tiền (1 điểm = ? VNĐ)</label>
              <input
                type="number"
                min="1"
                step="1"
                className="modal-input"
                value={storeSettings.pointToMoneyRate ?? '100'}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.includes('-')) return;
                  setStoreSettings({ ...storeSettings, pointToMoneyRate: val });
                }}
                placeholder="100"
              />
              <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                Mặc định: 1 điểm = {Math.max(1, Number(storeSettings.pointToMoneyRate || 100)).toLocaleString('vi-VN')} VNĐ (ví dụ: 100 điểm = {(100 * Math.max(1, Number(storeSettings.pointToMoneyRate || 100))).toLocaleString('vi-VN')} VNĐ giảm giá)
              </span>
            </div>
            <div>
              <label className="field-label">Mức điểm tối thiểu để đổi mã giảm giá</label>
              <input
                type="number"
                min="1"
                step="1"
                className="modal-input"
                value={storeSettings.pointRedeem ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.includes('-')) return;
                  setStoreSettings({ ...storeSettings, pointRedeem: val });
                }}
                placeholder="100"
              />
              <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                Mặc định: 100 điểm (tương đương giảm {(Math.max(1, Number(storeSettings.pointRedeem || 100)) * Math.max(1, Number(storeSettings.pointToMoneyRate || 100))).toLocaleString('vi-VN')} VNĐ)
              </span>
            </div>
          </div>
        </div>

        {/* Nhóm 4: Vận hành & Thiết bị */}
        <div className="admin-table-card" style={{ padding: '24px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '16px',
              borderBottom: '1px solid #f1f5f9',
              paddingBottom: '12px',
            }}
          >
            <Printer size={20} color="#166534" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
              4. Tùy chọn Vận hành tại Quầy & Thiết bị
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              <input
                type="checkbox"
                checked={storeSettings.autoPrintBill}
                onChange={(e) =>
                  setStoreSettings({ ...storeSettings, autoPrintBill: e.target.checked })
                }
                style={{ width: '18px', height: '18px', accentColor: '#166534' }}
              />
              <span>Tự động xuất lệnh in hóa đơn ngay khi đơn hàng chuyển sang trạng thái PAID</span>
            </label>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              <input
                type="checkbox"
                checked={storeSettings.notificationSound}
                onChange={(e) =>
                  setStoreSettings({ ...storeSettings, notificationSound: e.target.checked })
                }
                style={{ width: '18px', height: '18px', accentColor: '#166534' }}
              />
              <span>Phát âm thanh chuông thông báo khi có khách đặt đơn hàng mới từ website</span>
            </label>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              <input
                type="checkbox"
                checked={storeSettings.allowTakeaway}
                onChange={(e) =>
                  setStoreSettings({ ...storeSettings, allowTakeaway: e.target.checked })
                }
                style={{ width: '18px', height: '18px', accentColor: '#166534' }}
              />
              <span>Cho phép khách hàng lựa chọn hình thức Mang về (Takeaway) khi thanh toán</span>
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
          <button
            type="submit"
            className="btn-add-primary"
            disabled={settingsSaving}
            style={{ padding: '12px 28px', fontSize: '14px' }}
          >
            <Save size={18} />
            <span>{settingsSaving ? 'Đang lưu tất cả thay đổi...' : 'Lưu tất cả thay đổi'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

