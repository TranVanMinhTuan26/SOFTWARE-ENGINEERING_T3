'use client';

import React from 'react';
import { X } from 'lucide-react';
import type { CreatableUserRole } from '../kieu-quan-tri';

interface UserFormModalProps {
  showAddUserModal: boolean;
  setShowAddUserModal: (val: boolean) => void;
  newUserEmail: string;
  setNewUserEmail: (val: string) => void;
  addUserError: string;
  setAddUserError: (val: string) => void;
  newUserRole: CreatableUserRole;
  setNewUserRole: (val: CreatableUserRole) => void;
  newUserPassword: string;
  setNewUserPassword: (val: string) => void;
  confirmNewUserPassword: string;
  setConfirmNewUserPassword: (val: string) => void;
  isCreatingUser: boolean;
  handleAddUser: (e: React.FormEvent) => void;
}

export function UserFormModal({
  showAddUserModal,
  setShowAddUserModal,
  newUserEmail,
  setNewUserEmail,
  addUserError,
  setAddUserError,
  newUserRole,
  setNewUserRole,
  newUserPassword,
  setNewUserPassword,
  confirmNewUserPassword,
  setConfirmNewUserPassword,
  isCreatingUser,
  handleAddUser,
}: UserFormModalProps) {
  if (!showAddUserModal) return null;

  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal-card" style={{ maxWidth: '440px' }}>
        <button
          className="modal-close-btn"
          onClick={() => {
            setAddUserError('');
            setShowAddUserModal(false);
          }}
        >
          <X size={18} />
        </button>
        <h2 className="modal-title">Thêm tài khoản</h2>

        {addUserError && (
          <div
            id="add-user-error"
            role="alert"
            style={{
              color: '#b91c1c',
              background: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              marginTop: '12px',
              padding: '10px 12px',
            }}
          >
            {addUserError}
          </div>
        )}

        <form onSubmit={handleAddUser} style={{ marginTop: '16px' }}>
          <div style={{ marginBottom: '12px' }}>
            <label className="field-label">Email tài khoản</label>
            <input
              type="email"
              required
              className="modal-input"
              placeholder="nhanvien@brewlite.local"
              value={newUserEmail}
              onChange={(e) => {
                setNewUserEmail(e.target.value);
                setAddUserError('');
              }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label className="field-label">Mật khẩu</label>
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className="modal-input"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label className="field-label">Xác nhận mật khẩu</label>
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className="modal-input"
              value={confirmNewUserPassword}
              onChange={(e) => setConfirmNewUserPassword(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label className="field-label">Vai trò phân công</label>
            <select
              className="modal-input"
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value as CreatableUserRole)}
            >
              <option value="Khách hàng">Khách hàng</option>
              <option value="Nhân viên">Nhân viên bán hàng</option>
              <option value="Manager">Manager</option>
              <option value="Kho">Kho</option>
              <option value="Pha chế">Pha chế</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn-save-perms"
            style={{ width: '100%' }}
            disabled={isCreatingUser}
          >
            {isCreatingUser ? 'Đang tạo...' : 'Tạo tài khoản'}
          </button>
        </form>
      </div>
    </div>
  );
}
