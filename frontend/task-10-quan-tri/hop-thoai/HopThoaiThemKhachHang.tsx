'use client';

import React from 'react';
import { X } from 'lucide-react';
import type { CustomerItem } from '../kieu-quan-tri';

interface CustomerFormModalProps {
  showAddCustomerModal: boolean;
  setShowAddCustomerModal: (val: boolean) => void;
  newCustName: string;
  setNewCustName: (val: string) => void;
  newCustPhone: string;
  setNewCustPhone: (val: string) => void;
  custPhoneError: string;
  setCustPhoneError: (val: string) => void;
  newCustEmail: string;
  setNewCustEmail: (val: string) => void;
  custEmailError: string;
  setCustEmailError: (val: string) => void;
  newCustTier: CustomerItem['tier'];
  setNewCustTier: (val: CustomerItem['tier']) => void;
  handleAddCustomer: (e: React.FormEvent) => void;
}

export function CustomerFormModal({
  showAddCustomerModal,
  setShowAddCustomerModal,
  newCustName,
  setNewCustName,
  newCustPhone,
  setNewCustPhone,
  custPhoneError,
  setCustPhoneError,
  newCustEmail,
  setNewCustEmail,
  custEmailError,
  setCustEmailError,
  newCustTier,
  setNewCustTier,
  handleAddCustomer,
}: CustomerFormModalProps) {
  if (!showAddCustomerModal) return null;

  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal-card" style={{ maxWidth: '440px' }}>
        <button
          className="modal-close-btn"
          onClick={() => {
            setShowAddCustomerModal(false);
            setCustEmailError('');
            setCustPhoneError('');
          }}
        >
          <X size={18} />
        </button>
        <h2 className="modal-title">Thêm khách hàng thành viên</h2>

        <form onSubmit={handleAddCustomer} style={{ marginTop: '16px' }}>
          <div style={{ marginBottom: '12px' }}>
            <label className="field-label">Họ và tên khách hàng</label>
            <input
              type="text"
              required
              className="modal-input"
              placeholder="Ví dụ: Nguyễn Văn An"
              value={newCustName}
              onChange={(e) => setNewCustName(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label className="field-label">
              Số điện thoại <span style={{ color: '#ef4444' }}>* (10 số, bắt đầu bằng 0)</span>
            </label>
            <input
              type="tel"
              required
              maxLength={10}
              pattern="0[0-9]{9}"
              title="Số điện thoại phải gồm đúng 10 chữ số và bắt đầu bằng số 0 (ví dụ: 0901234567)"
              className="modal-input"
              style={custPhoneError ? { borderColor: '#ef4444', background: '#fef2f2' } : {}}
              placeholder="0901234567"
              value={newCustPhone}
              onChange={(e) => {
                setNewCustPhone(e.target.value.replace(/[^\d]/g, '').slice(0, 10));
                setCustPhoneError('');
              }}
            />
            {custPhoneError && (
              <div
                style={{
                  color: '#dc2626',
                  fontSize: '12px',
                  marginTop: '5px',
                  fontWeight: 600,
                }}
              >
                ⚠️ {custPhoneError}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label className="field-label">
              Email liên hệ <span style={{ color: '#ef4444' }}>* (Mỗi email chỉ 1 khách hàng duy nhất)</span>
            </label>
            <input
              type="email"
              required
              className="modal-input"
              style={custEmailError ? { borderColor: '#ef4444', background: '#fef2f2' } : {}}
              placeholder="khachhang@gmail.com"
              value={newCustEmail}
              onChange={(e) => {
                setNewCustEmail(e.target.value);
                setCustEmailError('');
              }}
            />
            {custEmailError && (
              <div
                style={{
                  color: '#dc2626',
                  fontSize: '12px',
                  marginTop: '5px',
                  fontWeight: 600,
                }}
              >
                ⚠️ {custEmailError}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label className="field-label">Hạng thành viên khởi tạo</label>
            <select
              className="modal-input"
              value={newCustTier}
              onChange={(e) => setNewCustTier(e.target.value as CustomerItem['tier'])}
            >
              <option value="Mới">Khách mới</option>
              <option value="Đồng">Đồng</option>
              <option value="Bạc">Bạc</option>
              <option value="Vàng">Vàng</option>
              <option value="Kim cương">Kim cương</option>
            </select>
          </div>

          <div
            style={{
              marginBottom: '16px',
              padding: '10px 12px',
              background: '#ecfdf5',
              border: '1px dashed #34d399',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#065f46',
            }}
          >
            🔑 <strong>Mật khẩu đăng nhập mặc định:</strong>{' '}
            <code
              style={{
                background: '#d1fae5',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: 800,
              }}
            >
              password123
            </code>
            <div style={{ marginTop: '3px', fontSize: '11px', color: '#047857' }}>
              Khách hàng dùng email đã đăng ký và mật khẩu này để đăng nhập, có thể đổi mật khẩu
              sau khi vào hệ thống.
            </div>
          </div>

          <button type="submit" className="btn-save-perms" style={{ width: '100%' }}>
            Lưu khách hàng
          </button>
        </form>
      </div>
    </div>
  );
}

