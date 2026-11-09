import React from 'react';

export type PaymentMethodType = 'VNPay';

type PaymentMethodPickerProps = {
  selectedPaymentMethod: PaymentMethodType;
  setSelectedPaymentMethod: (method: PaymentMethodType) => void;
};

export function PaymentMethodPicker({
  selectedPaymentMethod,
  setSelectedPaymentMethod,
}: PaymentMethodPickerProps) {
  const options: { id: PaymentMethodType; title: string; subtitle: string; icon: string }[] = [
    {
      id: 'VNPay',
      title: 'VNPay Sandbox',
      subtitle: 'Cổng thanh toán QR / Online (VNPAY-QR, Thẻ ATM nội địa, Thẻ quốc tế)',
      icon: '🏦',
    },
  ];

  return (
    <div style={{ margin: '14px 0' }}>
      <div style={{ fontSize: '13px', fontWeight: 800, color: '#173f35', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Phương thức thanh toán</span>
        <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 700, background: '#dcfce7', padding: '2px 8px', borderRadius: '12px' }}>
          Không dùng tiền mặt
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
        {options.map((opt) => {
          const isSelected = selectedPaymentMethod === opt.id || true;
          return (
            <div
              key={opt.id}
              onClick={() => setSelectedPaymentMethod(opt.id)}
              style={{
                cursor: 'pointer',
                padding: '10px 14px',
                background: '#f0fdf4',
                borderRadius: '10px',
                border: '2px solid #16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>{opt.icon}</span>
                <div>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#166534',
                    }}
                  >
                    {opt.title}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{opt.subtitle}</div>
                </div>
              </div>

              <input
                type="radio"
                name="paymentMethod"
                checked={true}
                onChange={() => setSelectedPaymentMethod(opt.id)}
                style={{ accentColor: '#16a34a', width: '16px', height: '16px', cursor: 'pointer' }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
