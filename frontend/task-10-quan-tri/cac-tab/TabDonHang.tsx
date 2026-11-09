import { CheckCircle, Coffee, Truck } from 'lucide-react';
import type { AdminRole, OrderItem } from '../kieu-quan-tri';
import { money } from '../hang-so-quan-tri';

type OrdersTabProps = {
  orders: OrderItem[];
  currentAdminRole: AdminRole;
  orderStatusFilter: string;
  setOrderStatusFilter: (status: any) => void;
  handleUpdateOrderStatus: (orderId: string, nextStatus: string) => void;
};

export function OrdersTab(props: OrdersTabProps) {
  const {
    orders,
    currentAdminRole,
    orderStatusFilter,
    setOrderStatusFilter,
    handleUpdateOrderStatus,
  } = props;

  const filteredOrders = orders.filter(order => {
    if (orderStatusFilter === 'Chờ thanh toán') return order.status === 'PENDING';
    if (orderStatusFilter === 'Thanh toán lỗi') return order.status === 'PAYMENT_FAILED';
    if (orderStatusFilter === 'Cần pha chế') return order.status === 'PAID' || order.status === 'PREPARING';
    if (orderStatusFilter === 'Chờ khách nhận') return order.status === 'READY';
    if (orderStatusFilter === 'Hoàn tất') return order.status === 'COMPLETED';
    if (orderStatusFilter === 'Đã hủy') return order.status === 'CANCELLED';
    if (orderStatusFilter === 'Chờ hoàn tiền') return order.status === 'CANCELLED' && order.payment?.status === 'REFUND_PENDING';
    return true;
  });
  const canCancel = ['Admin', 'Manager', 'Nhân viên'].includes(currentAdminRole);

  return (
    <div className="tab-orders">
      <div className="page-head-row">
        <div>
          <h1 className="page-heading">
            {currentAdminRole === 'Pha chế'
              ? '☕ Màn hình pha chế Barista (KDS)'
              : 'Quản lý đơn hàng'}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
            {currentAdminRole === 'Pha chế'
              ? 'Tiếp nhận đơn từ khách hàng và cập nhật tiến trình pha chế ngay tại quầy bar.'
              : 'Đồng bộ 2 chiều thời gian thực với ứng dụng đặt hàng và thanh toán VNPay của khách.'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '12px',
              background: '#dcfce7',
              color: '#166534',
              fontWeight: 700,
              padding: '6px 14px',
              borderRadius: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#22c55e',
                display: 'inline-block',
              }}
            />
            Live Sync Khách ⇄ Admin
          </span>
        </div>
      </div>

      {/* Thông báo riêng cho Barista nếu đang ở vai trò Pha chế */}
      {currentAdminRole === 'Pha chế' && (
        <div
          style={{
            padding: '14px 18px',
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '12px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#92400e',
          }}
        >
          <Coffee size={24} color="#d97706" />
          <div>
            <strong style={{ fontSize: '14px' }}>Chế độ Quầy Barista (KDS):</strong>
            <div style={{ fontSize: '12px', marginTop: '2px' }}>
              Có{' '}
              <strong>
                {
                  orders.filter(
                    (o) => o.status === 'PAID' || o.status === 'PREPARING'
                  ).length
                }{' '}
                đơn
              </strong>{' '}
              đang đợi pha chế. Bấm nút <strong>"☕ Bắt đầu pha"</strong> khi nhận đơn
              và <strong>"🛵 Đã pha xong"</strong> khi hoàn tất.
            </div>
          </div>
        </div>
      )}

      {/* 4 Stat Cards Đơn hàng */}
      <div className="stat-cards-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <div className="stat-label">Tổng đơn hàng</div>
          <div className="stat-value">{orders.length}</div>
          <div className="stat-sub positive">
            <span>Toàn bộ hệ thống</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Cần pha chế (Barista)</div>
          <div className="stat-value" style={{ color: '#d97706' }}>
            {orders.filter((o) => o.status === 'PAID' || o.status === 'PREPARING').length}
          </div>
          <div className="stat-sub" style={{ color: '#d97706', fontWeight: 600 }}>
            <span>Đang đợi tại quầy</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Chờ khách nhận</div>
          <div className="stat-value" style={{ color: '#0284c7' }}>
            {orders.filter((o) => o.status === 'READY').length}
          </div>
          <div className="stat-sub" style={{ color: '#0284c7' }}>
            <span>Gọi khách tại bàn/quầy</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Đã hoàn tất</div>
          <div className="stat-value" style={{ color: '#16a34a' }}>
            {orders.filter((o) => o.status === 'COMPLETED').length}
          </div>
          <div className="stat-sub positive">
            <span>Đã nhận đồ uống</span>
          </div>
        </div>
      </div>

      {/* Tabs lọc trạng thái */}
      <div
        className="history-tabs"
        style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}
      >
        {(['Tất cả', 'Chờ thanh toán', 'Thanh toán lỗi', 'Cần pha chế', 'Chờ khách nhận', 'Hoàn tất', 'Đã hủy', 'Chờ hoàn tiền'] as const).map(
          (tab) => (
            <button
              key={tab}
              onClick={() => setOrderStatusFilter(tab)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                border:
                  orderStatusFilter === tab
                    ? '1.5px solid #166534'
                    : '1px solid #cbd5e1',
                background: orderStatusFilter === tab ? '#eaf4eb' : '#fff',
                color: orderStatusFilter === tab ? '#166534' : '#475569',
              }}
            >
              {tab}
            </button>
          )
        )}
      </div>

      {/* Bảng danh sách đơn hàng */}
      <div className="admin-table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Khách hàng</th>
              <th>Sản phẩm trong đơn</th>
              <th>Thời gian</th>
              <th>Tổng tiền</th>
              <th>Trạng thái hiện tại</th>
              <th style={{ textAlign: 'center' }}>Thao tác nhanh</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders
              .map((o) => {
                const itemsSummary =
                  o.items && o.items.length > 0
                    ? o.items
                        .map(
                          (it: any) =>
                            `${it.name} (${it.size || 'M'}) x${it.quantity}`
                        )
                        .join(', ')
                    : 'Đồ uống BrewLite';

                return (
                  <tr key={o.id}>
                    <td>
                      <span
                        style={{
                          fontWeight: 800,
                          fontFamily: 'monospace',
                          color: '#166534',
                          fontSize: '14px',
                        }}
                      >
                        {o.code}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>
                        {o.customer}
                      </div>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        {o.paymentMethod || 'VNPay Sandbox'}
                      </span>
                    </td>
                    <td style={{ maxWidth: '280px' }}>
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#334155',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={itemsSummary}
                      >
                        {itemsSummary}
                      </div>
                      {o.items && o.items.length > 0 && (
                        <span
                          style={{
                            fontSize: '11px',
                            color: '#166534',
                            fontWeight: 600,
                          }}
                        >
                          Tổng:{' '}
                          {o.items.reduce(
                            (s: number, it: any) => s + (it.quantity || 1),
                            0
                          )}{' '}
                          ly
                        </span>
                      )}
                    </td>
                    <td style={{ color: '#64748b', fontSize: '12px' }}>
                      {o.createdAt}
                    </td>
                    <td>
                      <strong style={{ color: '#166534', fontSize: '14px' }}>
                        {money(o.total)}
                      </strong>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          o.status === 'COMPLETED'
                            ? 'badge-green'
                            : o.status === 'PAID'
                            ? 'badge-blue'
                            : o.status === 'PREPARING'
                            ? 'badge-yellow'
                            : o.status === 'READY'
                            ? 'badge-blue'
                            : o.status === 'CANCELLED'
                            ? 'badge-gray'
                            : 'badge-yellow'
                        }`}
                      >
                        {o.status === 'PAID'
                          ? 'Đã thanh toán'
                          : o.status === 'PREPARING'
                          ? 'Đang pha chế'
                          : o.status === 'READY'
                          ? 'Chờ khách nhận'
                          : o.status === 'COMPLETED'
                          ? 'Hoàn tất'
                          : o.status === 'CANCELLED'
                          ? 'Đã hủy'
                          : o.status === 'PAYMENT_FAILED'
                          ? 'Thanh toán lỗi'
                          : 'Chờ thanh toán'}
                      </span>
                      {o.status === 'CANCELLED' && o.payment?.status === 'REFUND_PENDING' && (
                        <div style={{ color: '#b45309', fontSize: '11px', fontWeight: 700, marginTop: '6px' }}>Chờ hoàn tiền</div>
                      )}
                      {o.status === 'CANCELLED' && o.payment?.status === 'REFUNDED' && (
                        <div style={{ color: '#15803d', fontSize: '11px', marginTop: '6px' }}>Đã hoàn tiền</div>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {o.status === 'PAID' && (
                        <button
                          onClick={() =>
                            handleUpdateOrderStatus(o.id || o.code, 'PREPARING')
                          }
                          style={{
                            background: '#fef3c7',
                            color: '#b45309',
                            border: '1px solid #fde68a',
                            padding: '5px 12px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          title="Chuyển sang trạng thái Barista đang pha chế"
                        >
                          <Coffee size={13} /> Bắt đầu pha
                        </button>
                      )}
                      {o.status === 'PREPARING' && (
                        <button
                          onClick={() =>
                            handleUpdateOrderStatus(o.id || o.code, 'READY')
                          }
                          style={{
                            background: '#e0f2fe',
                            color: '#0369a1',
                            border: '1px solid #bae6fd',
                            padding: '5px 12px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          title="Đã pha xong, gọi khách hoặc bàn giao phục vụ"
                        >
                          <Truck size={13} /> Đã pha xong
                        </button>
                      )}
                      {o.status === 'READY' && (
                        <button
                          onClick={() =>
                            handleUpdateOrderStatus(o.id || o.code, 'COMPLETED')
                          }
                          style={{
                            background: '#dcfce7',
                            color: '#15803d',
                            border: '1px solid #bbf7d0',
                            padding: '5px 12px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          title="Khách hàng đã nhận đồ uống"
                        >
                          <CheckCircle size={13} /> Hoàn thành
                        </button>
                      )}
                      {canCancel && ['PENDING', 'PAID', 'PAYMENT_FAILED'].includes(o.status) && (
                        <button
                          onClick={() => {
                            const message = o.status === 'PAID'
                              ? 'Hủy đơn đã thanh toán? Đơn sẽ chờ hoàn tiền; tiền chưa được hoàn tự động qua VNPay.'
                              : 'Bạn muốn hủy đơn chưa thanh toán này?';
                            if (window.confirm(message)) handleUpdateOrderStatus(o.id || o.code, 'CANCELLED');
                          }}
                          style={{ marginLeft: '8px', marginTop: '4px', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', padding: '5px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                        >Hủy đơn</button>
                      )}
                      {o.status === 'CANCELLED' && <span style={{ fontSize: '11px', color: '#64748b' }}>Đã kết thúc</span>}
                      {o.status === 'COMPLETED' && (
                        <span
                          style={{
                            fontSize: '11px',
                            color: '#16a34a',
                            fontWeight: 700,
                          }}
                        >
                          ✓ Đã nhận đồ
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            {filteredOrders.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}
                >
                  Không có đơn hàng phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

