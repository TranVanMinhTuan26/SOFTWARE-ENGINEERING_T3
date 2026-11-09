'use client';

import React, { Suspense } from 'react';
import { X } from 'lucide-react';
import { useOrdersPage } from '../../task-09-lich-su-don-hang/hooks/useTrangDonHang';
import { OrdersHeader } from '../../task-09-lich-su-don-hang/thanh-phan/DauTrangDonHang';
import { OrderTrackingCard } from '../../task-09-lich-su-don-hang/thanh-phan/TheTheoDoiDonHang';
import { OrderHistoryList } from '../../task-09-lich-su-don-hang/thanh-phan/DanhSachLichSuDonHang';
import { OrdersNotLoggedIn } from '../../task-09-lich-su-don-hang/thanh-phan/ChuaDangNhapDonHang';
import { OrdersEmpty } from '../../task-09-lich-su-don-hang/thanh-phan/DonHangTrong';
import { OrderDetailModal } from '../../task-09-lich-su-don-hang/thanh-phan/HopThoaiChiTietDonHang';
import { PaymentGatewayModal } from '../../task-09-lich-su-don-hang/thanh-phan/HopThoaiCongThanhToan';
import { OrdersErrorBoundary } from '../../task-09-lich-su-don-hang/thanh-phan/RanhGioiLoiDonHang';

function OrdersContent() {
  const {
    isLoggedIn,
    currentUserEmail,
    banner,
    setBanner,
    historyOrders,
    filteredHistory,
    historyFilter,
    setHistoryFilter,
    activeTracking,
    selectOrderToTrack,
    activeOrderItems,
    expandedOrderIds,
    toggleExpandOrder,
    modal,
    setModal,
    handleRetryPayment,
    openRetryModal,
    closeRetryModal,
    retryModalOrder,
    handleConfirmRetryPayment,
    isRetrying,
  } = useOrdersPage();

  return (
    <div style={{ minHeight: '100vh', background: '#f8faf7', color: 'var(--text-main)' }}>
      {/* Site Header */}
      <OrdersHeader isLoggedIn={isLoggedIn} currentUserEmail={currentUserEmail} />

      {/* Main Content */}
      <main className="site-container" style={{ paddingTop: '28px', paddingBottom: '60px' }}>
        {/* Banner notification */}
        {banner && banner.show && (
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '14px',
              marginBottom: '24px',
              fontSize: '14px',
              lineHeight: 1.5,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: banner.type === 'success' ? '#f0fdf4' : '#fef2f2',
              color: banner.type === 'success' ? '#166534' : '#991b1b',
              border: `1.5px solid ${banner.type === 'success' ? '#86efac' : '#fca5a5'}`,
              boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
            }}
          >
            <span style={{ fontSize: '20px' }}>{banner.type === 'success' ? '🎉' : '⚠️'}</span>
            <div style={{ flex: 1 }}>{banner.message}</div>
            <button
              onClick={() => setBanner(null)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'inherit',
                padding: '4px',
              }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Page title */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '28px',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#166534',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '4px',
              }}
            >
              Trang cá nhân khách hàng
            </div>
            <h1
              style={{
                fontSize: '26px',
                fontWeight: 800,
                margin: '0 0 6px',
                color: 'var(--green, #173f35)',
              }}
            >
              Theo dõi & Chi tiết đơn hàng
            </h1>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted, #737a72)' }}>
              Xem trực tiếp danh sách món ăn, số lượng, topping và trạng thái pha chế của từng đơn
              hàng.
            </p>
          </div>

          {isLoggedIn && historyOrders.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span
                style={{
                  background: '#fff',
                  border: '1px solid #e2e8e0',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#374151',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                }}
              >
                📦 Tổng cộng:{' '}
                <strong style={{ color: 'var(--green, #173f35)' }}>
                  {historyOrders.length} đơn
                </strong>
              </span>
            </div>
          )}
        </div>

        {/* Content Body based on auth / empty status */}
        {!isLoggedIn ? (
          <OrdersNotLoggedIn />
        ) : historyOrders.length === 0 ? (
          <OrdersEmpty currentUserEmail={currentUserEmail} />
        ) : (
          <div
            className="bottom-dashboard"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
              gap: '28px',
            }}
          >
            {/* Column 1: Stepper & Active Order Items */}
            <OrderTrackingCard
              activeTracking={activeTracking}
              activeOrderItems={activeOrderItems}
              onRetryPayment={handleRetryPayment}
              isRetrying={isRetrying}
            />

            {/* Column 2: History Order List */}
            <OrderHistoryList
              filteredHistory={filteredHistory}
              historyFilter={historyFilter}
              setHistoryFilter={setHistoryFilter}
              activeTracking={activeTracking}
              selectOrderToTrack={selectOrderToTrack}
              expandedOrderIds={expandedOrderIds}
              toggleExpandOrder={toggleExpandOrder}
              onRetryPayment={handleRetryPayment}
              isRetrying={isRetrying}
            />
          </div>
        )}
      </main>

      {/* Modal detail */}
      <OrderDetailModal
        show={modal === 'tracking-detail'}
        onClose={() => setModal('')}
        activeTracking={activeTracking}
        activeOrderItems={activeOrderItems}
      />

      {/* Cổng thanh toán lại */}
      <PaymentGatewayModal
        show={!!retryModalOrder}
        onClose={closeRetryModal}
        order={retryModalOrder}
        onConfirmPayment={handleConfirmRetryPayment}
        isProcessing={isRetrying}
      />
    </div>
  );
}

export default function OrdersPage() {
  return (
    <OrdersErrorBoundary>
      <Suspense
        fallback={
          <div
            style={{
              padding: '60px',
              textAlign: 'center',
              fontSize: '15px',
              color: '#173f35',
            }}
          >
            Đang tải lịch sử đơn hàng BrewLite...
          </div>
        }
      >
        <OrdersContent />
      </Suspense>
    </OrdersErrorBoundary>
  );
}
