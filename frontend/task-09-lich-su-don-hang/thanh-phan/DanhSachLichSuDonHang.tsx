'use client';

import React from 'react';
import { Clock, ChevronDown, ChevronUp, Package, RotateCcw } from 'lucide-react';
import type { ActiveTrackingOrder, HistoryOrder } from '../kieu-don-hang';
import { formatMoney, getFallbackItemsForOrder } from '../tro-giup-don-hang';

interface OrderHistoryListProps {
  filteredHistory: HistoryOrder[];
  historyFilter: 'Tất cả' | 'Đang xử lý' | 'Sẵn sàng nhận' | 'Hoàn thành' | 'Đã hủy';
  setHistoryFilter: (filter: 'Tất cả' | 'Đang xử lý' | 'Sẵn sàng nhận' | 'Hoàn thành' | 'Đã hủy') => void;
  activeTracking: ActiveTrackingOrder | null;
  selectOrderToTrack: (item: any) => void;
  expandedOrderIds: Set<string>;
  toggleExpandOrder: (id: string) => void;
  onRetryPayment?: (orderId: string, method?: string) => Promise<void>;
  isRetrying?: boolean;
}

export function OrderHistoryList({
  filteredHistory,
  historyFilter,
  setHistoryFilter,
  activeTracking,
  selectOrderToTrack,
  expandedOrderIds,
  toggleExpandOrder,
  onRetryPayment,
  isRetrying,
}: OrderHistoryListProps) {
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
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div>
          <h3
            className="dash-title"
            style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#173f35' }}
          >
            Lịch sử tất cả đơn hàng
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#71717a' }}>
            Bấm vào đơn hàng để xem tiến trình hoặc bấm "Xem chi tiết món"
          </p>
        </div>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 700,
            color: '#166534',
            background: '#eaf4eb',
            padding: '4px 10px',
            borderRadius: '8px',
          }}
        >
          {filteredHistory.length} đơn
        </span>
      </div>

      {/* Tabs Bộ Lọc */}
      <div className="history-tabs" style={{ marginBottom: '18px' }}>
        {(['Tất cả', 'Đang xử lý', 'Sẵn sàng nhận', 'Hoàn thành', 'Đã hủy'] as const).map(
          (tab) => (
            <button
              key={tab}
              className={`tab-btn ${historyFilter === tab ? 'active' : ''}`}
              onClick={() => setHistoryFilter(tab)}
              style={{ fontSize: '12px', padding: '6px 14px' }}
            >
              {tab}
            </button>
          )
        )}
      </div>

      {/* Danh sách các đơn hàng */}
      <div
        className="history-list"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          maxHeight: '680px',
          overflowY: 'auto',
          paddingRight: '4px',
        }}
      >
        {filteredHistory.map((item, idx) => {
          if (!item) return null;
          const safeId = item.id || `hist-${idx}`;
          const safeCode = item.code || item.id || `#BL-${idx}`;
          const isCurrentActive = Boolean(activeTracking && activeTracking.code === safeCode);
          const isExpanded = expandedOrderIds.has(safeId);
          const safeTotal =
            typeof item.total === 'number' && !isNaN(item.total) ? item.total : 0;
          const safeStatusText = item.statusText || item.status || 'Đang xử lý';
          const safeBadgeClass =
            item.badgeClass ||
            (item.status === 'COMPLETED' || item.status === 'PAID' ? 'done' : 'pending');
          const safeDate = item.date || 'Hôm nay';
          const safePaymentMethod = item.paymentMethod || 'VNPay Sandbox';
          const orderItems =
            Array.isArray(item.items) && item.items.length > 0
              ? item.items
              : getFallbackItemsForOrder(safeCode, safeTotal);

          return (
            <div
              key={safeId}
              style={{
                border: `1.5px solid ${isCurrentActive ? '#22c55e' : '#e5e7eb'}`,
                borderRadius: '16px',
                background: isCurrentActive ? '#f9fefb' : '#ffffff',
                overflow: 'visible',
                minHeight: 'auto',
                boxShadow: isCurrentActive
                  ? '0 4px 16px rgba(34, 197, 94, 0.08)'
                  : '0 2px 6px rgba(0,0,0,0.02)',
              }}
            >
              {/* Hàng thông tin tóm tắt đơn hàng */}
              <div
                style={{
                  padding: '16px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
                onClick={() => selectOrderToTrack(item)}
                title="Bấm để đưa lên Stepper theo dõi tiến trình"
              >
                <div
                  className="history-left"
                  style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      className="h-code"
                      style={{ fontSize: '15px', fontWeight: 800, color: '#173f35' }}
                    >
                      {safeCode}
                    </span>
                    {isCurrentActive && (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          background: '#22c55e',
                          color: '#fff',
                          padding: '2px 8px',
                          borderRadius: '12px',
                        }}
                      >
                        Đang theo dõi
                      </span>
                    )}
                  </div>
                  <span className="h-date" style={{ fontSize: '12px', color: '#6b7280' }}>
                    <Clock
                      size={12}
                      style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }}
                    />
                    {safeDate}
                  </span>
                  <span style={{ fontSize: '11px', color: '#4b5563', fontWeight: 500 }}>
                    {safePaymentMethod}
                  </span>
                </div>

                <div
                  className="history-right"
                  style={{
                    textAlign: 'right',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '6px',
                  }}
                >
                  <span
                    className="h-total"
                    style={{ fontSize: '16px', fontWeight: 800, color: '#15803d' }}
                  >
                    {formatMoney(safeTotal)}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span
                      className={`h-badge ${safeBadgeClass}`}
                      style={{
                        fontSize: '11px',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        lineHeight: '1.25',
                        display: 'inline-flex',
                        alignItems: 'center',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {safeStatusText}
                    </span>
                    {(item.status === 'PAYMENT_FAILED' || item.status === 'PENDING') && onRetryPayment && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRetryPayment(item.id, item.paymentMethod);
                        }}
                        disabled={isRetrying}
                        style={{
                          background: '#15803d',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '4px 10px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: isRetrying ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          boxShadow: '0 2px 6px rgba(21, 128, 61, 0.2)',
                          transition: 'background 0.15s',
                        }}
                        title="Thanh toán lại đơn hàng này"
                      >
                        <RotateCcw size={11} /> Thanh toán lại
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Thanh thao tác dưới mỗi đơn */}
              <div
                style={{
                  padding: '8px 16px',
                  background: isCurrentActive ? '#eaf8ee' : '#f9fafb',
                  borderTop: '1px solid #f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    selectOrderToTrack(item);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#166534',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: '4px 0',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  👁️ {isCurrentActive ? 'Đang hiển thị ở Stepper' : 'Theo dõi tiến độ đơn này'}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpandOrder(safeId);
                  }}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    color: '#374151',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '4px 10px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                  }}
                >
                  {isExpanded ? (
                    <>
                      Thu gọn <ChevronUp size={12} />
                    </>
                  ) : (
                    <>
                      Xem {orderItems.length} món <ChevronDown size={12} />
                    </>
                  )}
                </button>
              </div>

              {/* Vùng mở rộng hiển thị trực tiếp danh sách món của đơn này */}
              {isExpanded && (
                <div
                  style={{
                    padding: '12px 16px',
                    background: '#ffffff',
                    borderTop: '1px solid #f3f4f6',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#6b7280',
                      textTransform: 'uppercase',
                    }}
                  >
                    Danh sách món ({orderItems.length}):
                  </div>
                  {orderItems.map((it, iIdx) => (
                    <div
                      key={iIdx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        padding: '6px 8px',
                        background: '#f9fafb',
                        borderRadius: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img
                          src={
                            it?.imageUrl ||
                            'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=120&q=80'
                          }
                          alt={it?.name || 'Món nước'}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '6px',
                            objectFit: 'cover',
                          }}
                        />
                        <div>
                          <span style={{ fontWeight: 700, color: '#1f2937' }}>
                            {it?.name || 'Món nước'}
                          </span>
                          <span style={{ color: '#6b7280', marginLeft: '6px', fontSize: '11px' }}>
                            (Size {it?.size || 'M'})
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ color: '#6b7280', marginRight: '8px' }}>
                          x{it?.qty ?? it?.quantity ?? 1}
                        </span>
                        <strong style={{ color: '#173f35' }}>
                          {formatMoney(
                            it?.lineTotal ||
                              (it?.unitPrice || 45000) * (it?.qty ?? it?.quantity ?? 1)
                          )}
                        </strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {filteredHistory.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: 'var(--text-muted)',
              fontSize: '13px',
            }}
          >
            <Package size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
            <div>Không tìm thấy đơn hàng nào trong mục này.</div>
          </div>
        )}
      </div>
    </div>
  );
}

