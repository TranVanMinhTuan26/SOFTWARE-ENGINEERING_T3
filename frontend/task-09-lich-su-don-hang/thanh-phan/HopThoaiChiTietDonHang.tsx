'use client';

import React from 'react';
import { X } from 'lucide-react';
import type { ActiveTrackingOrder, OrderItemDetail } from '../kieu-don-hang';
import { formatMoney } from '../tro-giup-don-hang';

interface OrderDetailModalProps {
  show: boolean;
  onClose: () => void;
  activeTracking: ActiveTrackingOrder | null;
  activeOrderItems: OrderItemDetail[];
}

export function OrderDetailModal({
  show,
  onClose,
  activeTracking,
  activeOrderItems,
}: OrderDetailModalProps) {
  if (!show || !activeTracking) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container"
        style={{ maxWidth: '480px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Chi tiết đơn {activeTracking.code}</h2>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: '20px', fontSize: '13px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '10px',
            }}
          >
            <span style={{ color: 'var(--text-muted)' }}>Trạng thái:</span>
            <span style={{ fontWeight: 700, color: 'var(--green)' }}>
              {activeTracking.step === 4
                ? 'Hoàn thành / Đã nhận đồ'
                : activeTracking.step === 3
                ? 'Sẵn sàng nhận tại quầy'
                : activeTracking.step === 2
                ? 'Đang pha chế (Barista)'
                : 'Đặt hàng thành công'}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '10px',
            }}
          >
            <span style={{ color: 'var(--text-muted)' }}>Hình thức thanh toán:</span>
            <strong>{activeTracking.paymentMethod}</strong>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <span style={{ color: 'var(--text-muted)' }}>Tổng thanh toán:</span>
            <strong style={{ fontSize: '16px', color: 'var(--green)' }}>
              {formatMoney(activeTracking.total)}
            </strong>
          </div>

          <div
            style={{
              borderTop: '1px solid #eee',
              paddingTop: '12px',
              marginBottom: '16px',
            }}
          >
            <h4 style={{ margin: '0 0 10px', fontSize: '13px', color: '#374151' }}>
              Sản phẩm ({activeOrderItems.length} món):
            </h4>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                maxHeight: '220px',
                overflowY: 'auto',
              }}
            >
              {activeOrderItems.map((it, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#f9f9f9',
                    padding: '6px 10px',
                    borderRadius: '8px',
                  }}
                >
                  <span>
                    {it?.name || 'Món nước'} (Size {it?.size || 'M'}) x
                    {it?.qty ?? it?.quantity ?? 1}
                  </span>
                  <strong>
                    {formatMoney(
                      it?.lineTotal ||
                        (it?.unitPrice || 0) * (it?.qty ?? it?.quantity ?? 1)
                    )}
                  </strong>
                </div>
              ))}
            </div>
          </div>

          <button className="btn-full" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

