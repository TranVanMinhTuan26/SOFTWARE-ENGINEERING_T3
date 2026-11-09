'use client';

import React, { useState } from 'react';
import { X, QrCode, ShieldCheck, AlertCircle, RotateCcw } from 'lucide-react';
import { formatMoney } from '../tro-giup-don-hang';

export interface PaymentGatewayModalProps {
  show: boolean;
  onClose: () => void;
  order: {
    id: string;
    code: string;
    total: number;
    paymentMethod?: string;
  } | null;
  onConfirmPayment: (orderId: string, method: string) => Promise<void>;
  isProcessing: boolean;
}

export function PaymentGatewayModal({
  show,
  onClose,
  order,
  onConfirmPayment,
  isProcessing,
}: PaymentGatewayModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<'VNPay'>('VNPay');

  if (!show || !order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirmPayment(order.id, selectedMethod);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div
        className="modal-dialog"
        style={{
          maxWidth: '460px',
          width: '95%',
          background: '#ffffff',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          position: 'relative',
        }}
      >
        {/* Nút đóng */}
        <button
          onClick={onClose}
          disabled={isProcessing}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: '#f1f5f9',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            color: '#64748b',
          }}
          title="Đóng cổng thanh toán"
        >
          <X size={16} />
        </button>

        {/* Tiêu đề Cổng thanh toán */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: '#eaf4eb',
              color: '#166534',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '8px',
            }}
          >
            <ShieldCheck size={28} />
          </div>
          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#173f35' }}>
            Cổng thanh toán BrewLite
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>
            Chọn phương thức để thanh toán lại cho đơn hàng của bạn
          </p>
        </div>

        {/* Hộp tóm tắt đơn hàng */}
        <div
          style={{
            background: '#f8faf7',
            border: '1px solid #e2ece0',
            borderRadius: '14px',
            padding: '14px 18px',
            marginBottom: '18px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
            <span style={{ color: '#64748b' }}>Mã đơn hàng:</span>
            <strong style={{ color: '#173f35', fontSize: '14px' }}>{order.code}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
            <span style={{ color: '#64748b' }}>Số tiền cần thanh toán:</span>
            <strong style={{ color: '#15803d', fontSize: '18px', fontWeight: 800 }}>
              {formatMoney(order.total)}
            </strong>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Lựa chọn phương thức thanh toán */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
              Chọn phương thức thanh toán:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Option: VNPay Sandbox */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '2px solid #15803d',
                  background: '#f0fdf4',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <input
                  type="radio"
                  name="retryPaymentMethod"
                  value="VNPay"
                  checked={true}
                  readOnly
                  style={{ accentColor: '#15803d' }}
                />
                <QrCode size={20} color="#15803d" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#173f35' }}>
                    Cổng VNPay Sandbox
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Quét mã VNPAY-QR hoặc cổng thanh toán quốc gia (ATM / Visa)</div>
                </div>
              </label>
            </div>
          </div>

          {/* Nút hành động */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              style={{
                background: '#f1f5f9',
                color: '#475569',
                border: 'none',
                borderRadius: '12px',
                padding: '12px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: isProcessing ? 'not-allowed' : 'pointer',
              }}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              style={{
                background: isProcessing
                  ? '#9ca3af'
                  : 'linear-gradient(135deg, #15803d 0%, #166534 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '12px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(21, 128, 61, 0.25)',
              }}
            >
              <RotateCcw size={16} />
              {isProcessing
                ? 'Đang xử lý...'
                : selectedMethod === 'VNPay'
                ? 'Chuyển sang VNPay'
                : 'Xác nhận thanh toán'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
