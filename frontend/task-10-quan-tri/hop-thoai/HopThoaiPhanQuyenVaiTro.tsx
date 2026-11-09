'use client';

import React from 'react';
import { X, CheckSquare, Square } from 'lucide-react';
import { ALL_AVAILABLE_PERMISSIONS } from '../hang-so-quan-tri';

interface RolePermissionsModalProps {
  showRoleModal: boolean;
  setShowRoleModal: (val: boolean) => void;
  activePermissions: string[];
  togglePermission: (perm: string) => void;
  selectedRoleForPerms: string;
  handleRoleChangeInModal: (role: string) => void;
  handleSavePermissions: () => void;
}

export function RolePermissionsModal({
  showRoleModal,
  setShowRoleModal,
  activePermissions,
  togglePermission,
  selectedRoleForPerms,
  handleRoleChangeInModal,
  handleSavePermissions,
}: RolePermissionsModalProps) {
  if (!showRoleModal) return null;

  return (
    <div
      className="admin-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) setShowRoleModal(false);
      }}
    >
      <div className="admin-modal-card permissions-modal">
        <button className="modal-close-btn" onClick={() => setShowRoleModal(false)}>
          <X size={18} />
        </button>

        <h2 className="modal-title">Phân quyền vai trò</h2>

        <div className="permissions-modal-body">
          {/* Left Column: Checkboxes */}
          <div className="perms-checkbox-list">
            <div className="perms-list-title">Danh sách quyền hạn:</div>

            {ALL_AVAILABLE_PERMISSIONS.map((perm) => {
              const isChecked = activePermissions.includes(perm);
              return (
                <div
                  key={perm}
                  className={`perm-checkbox-item ${isChecked ? 'checked' : ''}`}
                  onClick={() => togglePermission(perm)}
                >
                  <div className="checkbox-icon">
                    {isChecked ? (
                      <CheckSquare size={18} color="#166534" />
                    ) : (
                      <Square size={18} color="#cbd5e1" />
                    )}
                  </div>
                  <span className="perm-label">{perm}</span>
                </div>
              );
            })}
          </div>

          {/* Right Column: Role Select */}
          <div className="perms-role-selector">
            <label className="field-label">Chọn vai trò</label>
            <select
              className="role-select-box"
              value={selectedRoleForPerms}
              onChange={(e) => handleRoleChangeInModal(e.target.value)}
            >
              <option value="Nhân viên">Nhân viên bán hàng</option>
              <option value="Manager">Quản lý cửa hàng</option>
              <option value="Admin">Quản trị viên (Admin)</option>
              <option value="Kho">Quản lý kho</option>
              <option value="Pha chế">Nhân viên pha chế</option>
            </select>

            <div className="role-desc-box">
              <strong>Mô tả vai trò:</strong>
              <p>
                {selectedRoleForPerms === 'Admin'
                  ? 'Toàn quyền cấu hình hệ thống, quản trị tài khoản và phân quyền cho mọi nhân viên.'
                  : selectedRoleForPerms === 'Manager'
                  ? 'Quản lý doanh thu, duyệt đơn hàng, quản lý sản phẩm và khuyến mãi.'
                  : selectedRoleForPerms === 'Nhân viên'
                  ? 'Tiếp nhận đơn hàng của khách, kiểm tra danh sách sản phẩm và hỗ trợ thanh toán.'
                  : selectedRoleForPerms === 'Kho'
                  ? 'Theo dõi lượng tồn kho, cập nhật số lượng nguyên liệu và cảnh báo thiếu hàng.'
                  : 'Nhận đơn pha chế đồ uống theo yêu cầu và cập nhật trạng thái đơn hàng.'}
              </p>
            </div>
          </div>
        </div>

        <div className="permissions-modal-foot">
          <button className="btn-save-perms" onClick={handleSavePermissions}>
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}

