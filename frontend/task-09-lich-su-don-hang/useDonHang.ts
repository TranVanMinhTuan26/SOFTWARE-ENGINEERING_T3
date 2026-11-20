import { useMemo, useState } from 'react';
import type { HistoryOrder } from '../dung-chung/kieu-du-lieu-chung';
import { API } from '../dung-chung/cau-hinh-api';
import { DEMO_HISTORY } from '../task-03-thuc-don/du-lieu-danh-muc';
import { displayOrderCode } from '../dung-chung/ma-don-hang';

export function useOrders() {
  const [activeTracking, setActiveTracking] = useState<{
    code: string;
    total: number;
    paymentMethod: string;
    step: number; // 1: Đặt hàng, 2: Pha chế, 3: Đang giao, 4: Hoàn thành
  }>({
    code: '#BL123456',
    total: 95000,
    paymentMethod: 'Thanh toán khi nhận hàng',
    step: 3,
  });

  const [historyOrders, setHistoryOrders] = useState<HistoryOrder[]>(DEMO_HISTORY);
  const [historyFilter, setHistoryFilter] = useState<string>('Tất cả');

  const filteredHistory = useMemo(() => {
    if (historyFilter === 'Tất cả') return historyOrders;
    return historyOrders.filter((o) => {
      if (historyFilter === 'Đang xử lý') return o.status === 'PENDING';
      if (historyFilter === 'Đang giao') return o.status === 'DELIVERING' || o.status === 'READY';
      if (historyFilter === 'Hoàn thành') return o.status === 'COMPLETED' || o.status === 'PAID';
      if (historyFilter === 'Đã hủy') return o.status === 'CANCELLED' || o.status === 'PAYMENT_FAILED';
      return true;
    });
  }, [historyOrders, historyFilter]);

  async function loadUserOrders(authToken: string) {
    try {
      const res = await fetch(`${API}/orders/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const paidOrdersOnly = data.filter((o: any) => {
            if (o.status === 'PENDING' || o.status === 'PAYMENT_FAILED') return false;
            if (o.status === 'CANCELLED') {
              const pStatus = o.payment?.status;
              return pStatus === 'SUCCESS' || pStatus === 'REFUNDED' || pStatus === 'REFUND_PENDING';
            }
            return true;
          });
          const mapped: HistoryOrder[] = paidOrdersOnly.map((o: any) => ({
            id: o.id,
            code: displayOrderCode(o),
            date: new Date(o.createdAt).toLocaleString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
            total: o.total,
            status: o.status,
            statusText:
              o.status === 'PAID' || o.status === 'COMPLETED'
                ? 'Hoàn thành'
                : o.status === 'PREPARING'
                ? 'Đang pha chế'
                : o.status === 'READY'
                ? 'Đang giao'
                : o.status === 'CANCELLED' || o.status === 'PAYMENT_FAILED'
                ? 'Đã hủy'
                : 'Đang xử lý',
            badgeClass:
              o.status === 'PAID' || o.status === 'COMPLETED'
                ? 'done'
                : o.status === 'READY'
                ? 'delivering'
                : o.status === 'CANCELLED' || o.status === 'PAYMENT_FAILED'
                ? 'cancelled'
                : 'delivering',
            paymentMethod: o.payment?.method || 'Thanh toán khi nhận hàng',
          }));
          setHistoryOrders(mapped);
          if (mapped.length > 0) {
            setActiveTracking({
              code: mapped[0].code,
              total: mapped[0].total,
              paymentMethod: mapped[0].paymentMethod,
              step:
                mapped[0].status === 'COMPLETED' || mapped[0].status === 'PAID'
                  ? 4
                  : mapped[0].status === 'READY'
                  ? 3
                  : 2,
            });
          }
        }
      }
    } catch {
      // Ignore API fetch error, use demo history
    }
  }

  return {
    activeTracking,
    setActiveTracking,
    historyOrders,
    setHistoryOrders,
    historyFilter,
    setHistoryFilter,
    filteredHistory,
    loadUserOrders,
  };
}

