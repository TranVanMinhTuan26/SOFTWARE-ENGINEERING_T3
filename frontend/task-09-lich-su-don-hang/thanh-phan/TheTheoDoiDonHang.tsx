'use client';

import React from 'react';
import { Package, Coffee, ShoppingBag, Check, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react';
import type { ActiveTrackingOrder, OrderItemDetail } from '../kieu-don-hang';
import { formatMoney } from '../tro-giup-don-hang';

interface OrderTrackingCardProps {
  activeTracking: ActiveTrackingOrder | null;
  activeOrderItems: OrderItemDetail[];
  onRetryPayment?: (orderId: string, method?: string) => Promise<void>;
  isRetrying?: boolean;
}

export function OrderTrackingCard({
  activeTracking,
  activeOrderItems,
  onRetryPayment,
  isRetrying,
}: OrderTrackingCardProps) {
  if (!activeTracking) {
    return (
      <div
        className="dash-card"
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8e0',
          padding: '48px 24px',
          textAlign: 'center',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <div>
          <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>📦</span>
          <h3 style={{ margin: '0 0 8px', color: '#173f35', fontSize: '18px', fontWeight: 800 }}>
            Chọn đơn hàng để theo dõi
          </h3>
          <p
            style={{
              fontSize: '13px',
              margin: 0,
              color: '#6b7280',
              maxWidth: '320px',
              lineHeight: 1.5,
            }}
          >
            Bấm vào bất kỳ đơn hàng nào từ danh sách lịch sử bên phải để xem tiến độ pha chế và danh
            sách món chi tiết.
          </p>
        </div>
      </div>
    );
  }

  const isPaid =
    activeTracking.status === 'PAID' ||
    activeTracking.status === 'PREPARING' ||
    activeTracking.status === 'READY' ||
    activeTracking.status === 'COMPLETED';
  const isFailed = activeTracking.status === 'PAYMENT_FAILED';
  const isPending = activeTracking.status === 'PENDING';
  const isCancelled = activeTracking.status === 'CANCELLED';

  return (
    <div
      className="dash-card"
      style={{
        background: '#ffffff',
        borderRadius: '20px',
        border: '1px solid #e2e8e0',
        padding: '24px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.03)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '18px',
        }}
      >
        <div>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.1em',
              color: '#166534',
              textTransform: 'uppercase',
            }}
          >
            Đang hiển thị tiến độ
          </span>
          <h3
            className="dash-title"
            style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: 800, color: '#173f35' }}
          >
            Tiến độ đơn hàng {activeTracking.code}
          </h3>
        </div>
        <span
          style={{
            background:
              activeTracking.status === 'CANCELLED' || activeTracking.status === 'PAYMENT_FAILED'
                ? '#fee2e2'
                : activeTracking.status === 'COMPLETED'
                ? '#dcfce7'
                : activeTracking.status === 'READY'
                ? '#e0f2fe'
                : activeTracking.status === 'PREPARING'
                ? '#fef3c7'
                : '#eaf4eb',
            color:
              activeTracking.status === 'CANCELLED' || activeTracking.status === 'PAYMENT_FAILED'
                ? '#b91c1c'
                : activeTracking.status === 'COMPLETED'
                ? '#15803d'
                : activeTracking.status === 'READY'
                ? '#0369a1'
                : activeTracking.status === 'PREPARING'
                ? '#b45309'
                : '#1b6338',
            padding: '5px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 700,
          }}
        >
          {activeTracking.status === 'CANCELLED'
            ? ' Đã hủy'
            : activeTracking.status === 'PAYMENT_FAILED'
            ? ' Thanh toán thất bại'
            : activeTracking.status === 'COMPLETED'
            ? '✓ Hoàn thành'
            : activeTracking.status === 'READY'
            ? ' Sẵn sàng nhận tại quầy'
            : activeTracking.status === 'PREPARING'
            ? ' Đang pha chế'
            : activeTracking.status === 'PAID'
            ? ' Đã thanh toán'
            : ' Chờ thanh toán'}
        </span>
      </div>

      {/* Stepper Tiến trình hoặc Thông báo đã hủy */}
      {isCancelled ? (
        <div
          style={{
            background: '#fef2f2',
            border: '1.5px solid #fca5a5',
            borderRadius: '16px',
            padding: '16px 20px',
            marginBottom: '22px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            ✕
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#991b1b' }}>
              Đơn hàng này đã bị hủy
            </div>
            <div style={{ fontSize: '12px', color: '#7f1d1d', marginTop: '2px', lineHeight: 1.4 }}>
              Đơn hàng đã được đánh dấu hủy và không còn hiệu lực. Quý khách không cần thanh toán cho đơn hàng này.
            </div>
          </div>
        </div>
      ) : (
        <div className="stepper" style={{ marginBottom: '22px' }}>
          <div
            className="stepper-progress"
            style={{
              width:
                isFailed
                  ? '0%'
                  : activeTracking.step === 1
                  ? '0%'
                  : activeTracking.step === 2
                  ? '33.33%'
                  : activeTracking.step === 3
                  ? '66.66%'
                  : '100%',
              background: isFailed ? '#ef4444' : undefined,
            }}
          />

          <div className="step-item">
            <div
              className={`step-circle ${
                isFailed ? 'warning' : activeTracking.step >= 1 ? 'completed' : ''
              }`}
              style={
                isFailed
                  ? {
                      background: '#fef2f2',
                      borderColor: '#ef4444',
                      color: '#dc2626',
                    }
                  : undefined
              }
            >
              {isFailed ? <AlertTriangle size={14} /> : <Package size={14} />}
            </div>
            <span className="step-label">Đặt hàng</span>
            <span
              className="step-time"
              style={{
                color: isFailed ? '#dc2626' : isPaid ? '#15803d' : '#d97706',
                fontWeight: isFailed ? 700 : 500,
              }}
            >
              {isFailed
                ? 'Thanh toán lỗi'
                : isPaid
                ? 'Thành công'
                : 'Chờ thanh toán'}
            </span>
          </div>

          <div className="step-item">
            <div
              className={`step-circle ${
                !isFailed && activeTracking.step >= 2
                  ? 'completed'
                  : !isFailed && activeTracking.step === 1
                  ? 'active'
                  : ''
              }`}
            >
              <Coffee size={14} />
            </div>
            <span className="step-label">Đang pha chế</span>
            <span className="step-time">Barista</span>
          </div>

          <div className="step-item">
            <div
              className={`step-circle ${
                !isFailed && activeTracking.step >= 3
                  ? 'completed'
                  : !isFailed && activeTracking.step === 2
                  ? 'active'
                  : ''
              }`}
            >
              <ShoppingBag size={14} />
            </div>
            <span className="step-label">Sẵn sàng nhận</span>
            <span className="step-time">Tại quầy</span>
          </div>

          <div className="step-item">
            <div
              className={`step-circle ${
                !isFailed && activeTracking.step === 4 ? 'completed' : ''
              }`}
            >
              <Check size={14} />
            </div>
            <span className="step-label">Hoàn thành</span>
            <span className="step-time">Nhận đồ</span>
          </div>
        </div>
      )}

      {/* Meta Thông Tin Đơn Hàng */}
      <div
        className="order-meta-box"
        style={{
          background: '#f7faf7',
          border: '1px solid #e5ede5',
          borderRadius: '14px',
          padding: '16px 18px',
          marginBottom: '20px',
        }}
      >
        <div
          className="meta-row"
          style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}
        >
          <div>
            <span className="meta-label" style={{ fontSize: '11px', color: '#6b7280' }}>
              Mã đơn hàng
            </span>
            <div
              className="meta-code"
              style={{ fontSize: '18px', fontWeight: 800, color: '#173f35', marginTop: '2px' }}
            >
              {activeTracking.code}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className="meta-label" style={{ fontSize: '11px', color: '#6b7280' }}>
              {isCancelled
                ? 'Giá trị đơn đã hủy'
                : isPaid
                ? 'Tổng tiền thanh toán'
                : 'Tổng tiền cần thanh toán'}
            </span>
            <div
              className="meta-total"
              style={{
                fontSize: '18px',
                fontWeight: 800,
                color: isCancelled ? '#64748b' : isPaid ? '#15803d' : '#b45309',
                textDecoration: isCancelled ? 'line-through' : 'none',
                marginTop: '2px',
              }}
            >
              {formatMoney(activeTracking.total)}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '10px',
            borderTop: '1px dashed #d1e2d1',
            fontSize: '12px',
          }}
        >
          <span style={{ color: '#4b5563' }}>
            Phương thức: <strong>{activeTracking.paymentMethod}</strong>
          </span>
          {isPaid ? (
            <span
              style={{
                color: '#15803d',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <CheckCircle2 size={14} />{' '}
              {activeTracking.paymentMethod.includes('COD')
                ? 'Thu tiền tại quầy/bàn'
                : 'Đã xác thực'}
            </span>
          ) : (
            <span
              style={{
                color: isFailed ? '#dc2626' : isCancelled ? '#991b1b' : '#d97706',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {isFailed ? '⚠️ Chưa thanh toán' : isCancelled ? '✕ Đã hủy' : '⏳ Chờ thanh toán'}
            </span>
          )}
        </div>
      </div>

      {/* Danh sách các món đã đặt */}
      <div style={{ borderTop: '2px solid #edf2ec', paddingTop: '20px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '14px',
          }}
        >
          <h4
            style={{
              margin: 0,
              fontSize: '15px',
              fontWeight: 800,
              color: '#173f35',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <ShoppingBag size={18} color="#173f35" /> Chi tiết các món đã đặt (
            {activeOrderItems.length} món)
          </h4>
          <span
            style={{
              fontSize: '12px',
              color: '#6b7280',
              background: '#f1f5f1',
              padding: '3px 8px',
              borderRadius: '6px',
            }}
          >
            Tổng số lượng:{' '}
            {activeOrderItems.reduce((s, it) => s + (it?.qty ?? it?.quantity ?? 1), 0)} món
          </span>
        </div>

        {/* Danh sách từng món của đơn hàng */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            maxHeight: '420px',
            overflowY: 'auto',
            paddingRight: '4px',
          }}
        >
          {activeOrderItems.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                background: '#fbfdfb',
                borderRadius: '12px',
                border: '1px solid #e9eee8',
                transition: 'transform 0.15s ease',
              }}
            >
              <img
                src={
                  item?.imageUrl ||
                  'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=120&q=80'
                }
                alt={item?.name || 'Món nước'}
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '10px',
                  objectFit: 'cover',
                  flexShrink: 0,
                }}
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '14px', color: '#1f2937' }}>
                  {item?.name || 'Món nước'}
                </div>

                <div
                  style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    marginTop: '3px',
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      background: '#e8f5e9',
                      color: '#1b5e20',
                      padding: '2px 7px',
                      borderRadius: '5px',
                      fontWeight: 700,
                      fontSize: '11px',
                    }}
                  >
                    Size {item?.size || 'M'}
                  </span>
                  {item?.toppings && item.toppings.length > 0 ? (
                    <span style={{ color: '#4b5563', fontSize: '11px' }}>
                      Topping: {item.toppings.join(', ')}
                    </span>
                  ) : null}
                </div>
              </div>

              <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>
                  Số lượng:{' '}
                  <strong style={{ color: '#111827' }}>
                    x{item?.qty ?? item?.quantity ?? 1}
                  </strong>
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 800,
                    color: '#173f35',
                    marginTop: '2px',
                  }}
                >
                  {formatMoney(
                    item?.lineTotal ||
                      (item?.unitPrice || 0) * (item?.qty ?? item?.quantity ?? 1)
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tóm tắt thanh toán */}
        <div
          style={{
            marginTop: '18px',
            padding: '14px 18px',
            background: isCancelled ? '#f8fafc' : isPaid ? '#f0fdf4' : '#fffbeb',
            borderRadius: '12px',
            border: isCancelled ? '1px solid #e2e8f0' : isPaid ? '1px solid #bbf7d0' : '1px solid #fde68a',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '13px',
              color: '#4b5563',
              marginBottom: '6px',
            }}
          >
            <span>Tạm tính tiền món:</span>
            <span style={{ textDecoration: isCancelled ? 'line-through' : 'none', color: isCancelled ? '#94a3b8' : 'inherit' }}>
              {formatMoney(activeTracking.total)}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '13px',
              color: '#4b5563',
              marginBottom: '8px',
            }}
          >
            <span>Phí dịch vụ & đóng gói:</span>
            <span style={{ color: isCancelled ? '#94a3b8' : '#16a34a', fontWeight: 600 }}>Miễn phí</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '8px',
              borderTop: isCancelled ? '1px solid #e2e8f0' : isPaid ? '1px solid #dcfce7' : '1px solid #fef3c7',
            }}
          >
            <span
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: isCancelled ? '#991b1b' : isPaid ? '#166534' : '#b45309',
              }}
            >
              {isCancelled ? 'Tình trạng đơn:' : isPaid ? 'Tổng cộng đã thanh toán:' : 'Cần thanh toán:'}
            </span>
            <span
              style={{
                fontSize: isCancelled ? '15px' : '18px',
                fontWeight: 800,
                color: isCancelled ? '#991b1b' : isPaid ? '#15803d' : '#b45309',
              }}
            >
              {isCancelled ? 'Đã hủy — Không thu tiền' : formatMoney(activeTracking.total)}
            </span>
          </div>
          {isCancelled && (
            <div style={{ marginTop: '6px', fontSize: '11px', color: '#64748b', textAlign: 'right' }}>
              Đơn hàng này đã bị hủy, không phát sinh bất kỳ khoản phí nào.
            </div>
          )}
        </div>

        {/* Nút Thanh toán lại dưới ô tổng tiền */}
        {(isFailed || isPending) && onRetryPayment && (
          <div style={{ marginTop: '16px' }}>
            <button
              onClick={() =>
                onRetryPayment(
                  activeTracking.id || activeTracking.code,
                  activeTracking.paymentMethod
                )
              }
              disabled={isRetrying}
              style={{
                width: '100%',
                background: isRetrying
                  ? '#9ca3af'
                  : 'linear-gradient(135deg, #15803d 0%, #166534 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 18px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: isRetrying ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(21, 128, 61, 0.25)',
                transition: 'all 0.2s',
              }}
            >
              <RotateCcw size={16} />
              {isRetrying ? 'Đang kết nối cổng thanh toán...' : '💳 Thanh toán lại đơn hàng'}
            </button>
            <p
              style={{
                margin: '6px 0 0',
                fontSize: '11px',
                color: '#6b7280',
                textAlign: 'center',
              }}
            >
              Bấm để mở lại cổng thanh toán cho đơn hàng này mà không cần đặt lại món.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

