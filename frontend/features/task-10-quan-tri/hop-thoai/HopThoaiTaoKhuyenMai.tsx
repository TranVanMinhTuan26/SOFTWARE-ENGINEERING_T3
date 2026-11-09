'use client';

import React from 'react';
import { X } from 'lucide-react';

interface PromotionFormModalProps {
  showAddPromoModal: boolean;
  setShowAddPromoModal: (val: boolean) => void;
  newPromoCode: string;
  setNewPromoCode: (val: string) => void;
  newPromoName: string;
  setNewPromoName: (val: string) => void;
  newPromoDiscount: string;
  setNewPromoDiscount: (val: string) => void;
  newPromoTime: string;
  setNewPromoTime: (val: string) => void;
  handleAddPromo: (e: React.FormEvent) => void;
}

export function PromotionFormModal({
  showAddPromoModal,
  setShowAddPromoModal,
  newPromoCode,
  setNewPromoCode,
  newPromoName,
  setNewPromoName,
  newPromoDiscount,
  setNewPromoDiscount,
  newPromoTime,
  setNewPromoTime,
  handleAddPromo,
}: PromotionFormModalProps) {
  if (!showAddPromoModal) return null;

  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal-card" style={{ maxWidth: '440px' }}>
        <button className="modal-close-btn" onClick={() => setShowAddPromoModal(false)}>
          <X size={18} />
        </button>
        <h2 className="modal-title">Tạo khuyến mãi mới</h2>

        <form onSubmit={handleAddPromo} style={{ marginTop: '16px' }}>
          <div style={{ marginBottom: '12px' }}>
            <label className="field-label">Mã Voucher (Khách hàng chọn hoặc nhập)</label>
            <input
              type="text"
              required
              className="modal-input"
              placeholder="Ví dụ: BREW20, COMBO15, TET2027"
              value={newPromoCode}
              onChange={(e) => setNewPromoCode(e.target.value.toUpperCase())}
              style={{ textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px' }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label className="field-label">Tên chương trình ưu đãi</label>
            <input
              type="text"
              required
              className="modal-input"
              placeholder="Ví dụ: Giảm 20% toàn bộ đồ uống"
              value={newPromoName}
              onChange={(e) => setNewPromoName(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label className="field-label">Mức giảm (% hoặc VNĐ)</label>
            <input
              type="text"
              required
              className="modal-input"
              placeholder="VD: 20% hoặc 15000đ"
              value={newPromoDiscount}
              onChange={(e) => setNewPromoDiscount(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-save-perms" style={{ width: '100%' }}>
            Lưu khuyến mãi
          </button>
        </form>
      </div>
    </div>
  );
}

