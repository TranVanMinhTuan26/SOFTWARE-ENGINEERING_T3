'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import type { HistoryOrder, ActiveTrackingOrder, OrderItemDetail } from '../kieu-don-hang';
import { getOrderStatusMeta, getFallbackItemsForOrder } from '../tro-giup-don-hang';
import { displayOrderCode } from '../../dung-chung/ma-don-hang';
import { getConfirmedPayment } from '../../dung-chung/xac-minh-thanh-toan';
import { useCartContext } from '../../task-05-gio-hang/NguCanhGioHang';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export function useOrdersPage() {
  const searchParams = useSearchParams();
  const { clearCart } = useCartContext();

  const [historyOrders, setHistoryOrders] = useState<HistoryOrder[]>([]);
  const [historyFilter, setHistoryFilter] = useState<
    'Tất cả' | 'Đang xử lý' | 'Sẵn sàng nhận' | 'Hoàn thành' | 'Đã hủy'
  >('Tất cả');
  const [activeTracking, setActiveTracking] = useState<ActiveTrackingOrder | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');

  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<string>('');
  const [refreshIndex, setRefreshIndex] = useState<number>(0);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [retryModalOrder, setRetryModalOrder] = useState<{
    id: string;
    code: string;
    total: number;
    paymentMethod?: string;
  } | null>(null);

  const [banner, setBanner] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const batTatMoRongDonHang = (id: string) => {
    setExpandedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const chonDonHangTheoDoi = (item: any) => {
    if (!item) return;
    const safeCode = item.code || item.id || '#BL-ORDER';
    const safeTotal = typeof item.total === 'number' && !isNaN(item.total) ? item.total : 0;
    const safeDate = item.date || 'Hôm nay';
    const safeMethod = item.paymentMethod || 'VNPay Sandbox';
    const items =
      Array.isArray(item.items) && item.items.length > 0
        ? item.items
        : getFallbackItemsForOrder(safeCode, safeTotal);

    const meta = getOrderStatusMeta(item.status);

    const newTracking: ActiveTrackingOrder = {
      id: item.id,
      code: safeCode,
      total: safeTotal,
      paymentMethod: safeMethod,
      step: meta.step,
      status: item.status || 'PAID',
      statusText: item.statusText || meta.label,
      badgeClass: item.badgeClass || meta.badgeClass,
      date: safeDate,
      items,
    };

    setActiveTracking(newTracking);

    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      try {
        window.scrollTo({ top: 120, behavior: 'smooth' });
      } catch {}
    }
  };

  const selectOrderToTrack = chonDonHangTheoDoi;

  useEffect(() => {
    const storedToken =
      localStorage.getItem('brewlite-token') || localStorage.getItem('brewlite_token');
    const storedEmail = (localStorage.getItem('brewlite-email') || '').trim();
    if (!storedToken || !storedEmail) {
      setIsLoggedIn(false);
      setCurrentUserEmail('');
      setHistoryOrders([]);
      setActiveTracking(null);
      return;
    }
    setIsLoggedIn(true);
    setCurrentUserEmail(storedEmail);

    const vnpayStatus = searchParams.get('vnpay');
    const responseCode = searchParams.get('vnp_ResponseCode') || searchParams.get('code');
    const orderIdParam = searchParams.get('orderId') || searchParams.get('vnp_TxnRef');

    if (vnpayStatus === 'success') {
      const finishReturn = () => {
        const url = new URL(window.location.href);
        for (const key of ['vnpay', 'code', 'vnp_ResponseCode', 'vnp_TxnRef']) url.searchParams.delete(key);
        window.history.replaceState({}, '', url.pathname + url.search);
      };
      void getConfirmedPayment(API, storedToken, orderIdParam).then(async order => {
        const cleared = await fetch(`${API}/cart`, { method: 'DELETE', headers: { Authorization: `Bearer ${storedToken}` } });
        if (!cleared.ok) throw new Error('Thanh toán đã được xác nhận nhưng chưa cập nhật được giỏ hàng. Vui lòng tải lại.');
        clearCart();
        setBanner({
          show: true,
          type: 'success',
          message: `🎉 Thanh toán VNPay Sandbox thành công! Đơn hàng ${displayOrderCode(order)} đã được hệ thống ghi nhận và chuyển cho Barista pha chế.`,
        });
        finishReturn();
      }).catch(error => {
        setBanner({ show: true, type: 'error', message: error.message || 'Không thể xác minh thanh toán. Giỏ hàng được giữ nguyên.' });
        finishReturn();
      });
    } else if (vnpayStatus === 'out_of_stock') {
      setBanner({
        show: true,
        type: 'error',
        message:
          '⚠️ Đơn hàng đã hết hạn thanh toán và món ăn đã được bán hết cho khách khác. Hệ thống đã ghi nhận thông tin giao dịch để đối soát và hoàn tiền cho bạn.',
      });
    } else if (vnpayStatus === 'failed' || (responseCode && responseCode !== '00')) {
      setBanner({
        show: true,
        type: 'error',
        message: `❌ Giao dịch VNPay chưa hoàn tất hoặc đã bị hủy (Mã phản hồi: ${
          responseCode || 'FAILED'
        }). Các món nước vẫn được giữ nguyên trong giỏ hàng của bạn!`,
      });
    }

    const mapBackendOrder = (o: any): HistoryOrder => {
      const code = displayOrderCode(o);
      const meta = getOrderStatusMeta(o.status);
      const items: OrderItemDetail[] =
        Array.isArray(o.items) && o.items.length > 0
          ? o.items.map((it: any) => ({
              id: it.productId || it.id,
              name: it.productName || it.product?.name || it.name || 'Món nước',
              category: it.product?.category || '',
              imageUrl:
                it.product?.imageUrl ||
                'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=120&q=80',
              size: it.size || 'M',
              toppings: it.toppings
                ? typeof it.toppings === 'string'
                  ? it.toppings.split(',').map((t: string) => t.trim()).filter(Boolean)
                  : it.toppings
                : [],
              unitPrice:
                it.unitPrice ||
                (it.lineTotal ? Math.round(it.lineTotal / (it.qty || it.quantity || 1)) : 45000),
              qty: it.qty || it.quantity || 1,
              quantity: it.qty || it.quantity || 1,
              lineTotal: it.lineTotal,
            }))
          : getFallbackItemsForOrder(code, o.total);

      return {
        id: o.id,
        code,
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
          o.status === 'CANCELLED' && o.payment?.status === 'REFUNDED'
            ? 'Đã hủy (Đã hoàn tiền)'
            : meta.label,
        badgeClass: meta.badgeClass,
        paymentMethod:
          o.payment?.method === 'COD'
            ? 'Thanh toán khi nhận hàng (COD)'
            : o.payment?.provider
            ? `${o.payment.provider} (${o.payment.method})`
            : o.payment?.method || 'VNPay Sandbox',
        items,
        customerEmail: storedEmail,
      };
    };

    const loadOrders = (isInitial: boolean) => {
      fetch(`${API}/orders/me`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!Array.isArray(data)) return;
          // Chỉ hiển thị đơn hàng đã thanh toán thành công (hoặc đã hủy sau khi thanh toán)
          // Đơn chưa thanh toán (PENDING / PAYMENT_FAILED) chỉ giữ ở giỏ hàng, không hiện ở lịch sử đơn hàng
          const paidOrdersOnly = data.filter((o: any) => {
            if (o.status === 'PENDING' || o.status === 'PAYMENT_FAILED') return false;
            if (o.status === 'CANCELLED') {
              const pStatus = o.payment?.status;
              return pStatus === 'SUCCESS' || pStatus === 'REFUNDED' || pStatus === 'REFUND_PENDING';
            }
            return true;
          });
          const backendMapped = paidOrdersOnly.map(mapBackendOrder);
          setHistoryOrders(backendMapped);

          if (isInitial) {
            if (backendMapped.length > 0) {
              const target =
                (orderIdParam
                  ? backendMapped.find(
                      (o) =>
                        o.id === orderIdParam ||
                        o.code.toLowerCase().includes(orderIdParam.toLowerCase())
                    )
                  : null) || backendMapped[0];
              selectOrderToTrack(target);
            } else {
              setActiveTracking(null);
            }
          } else {
            setActiveTracking((prev) => {
              if (!prev) return null;
              const match = backendMapped.find((o) => o.code === prev.code || o.id === prev.code);
              if (match) {
                const meta = getOrderStatusMeta(match.status);
                return {
                  ...prev,
                  step: meta.step,
                  status: match.status,
                  statusText: match.statusText || meta.label,
                  badgeClass: match.badgeClass || meta.badgeClass,
                  items: match.items || prev.items,
                };
              }
              return prev;
            });
          }
        })
        .catch(() => {});
    };

    loadOrders(true);

    const handleStorageSync = () => {
      loadOrders(false);
    };
    window.addEventListener('storage', handleStorageSync);

    const backendTimer = setInterval(() => {
      loadOrders(false);
    }, 3000);

    return () => {
      clearInterval(backendTimer);
      window.removeEventListener('storage', handleStorageSync);
    };
  }, [searchParams, refreshIndex]);

  const moModalThuLai = (orderItemOrId: any, method?: string) => {
    if (!orderItemOrId) return;
    if (typeof orderItemOrId === 'string') {
      const match = historyOrders.find((o) => o.code === orderItemOrId || o.id === orderItemOrId);
      if (match) {
        setRetryModalOrder({
          id: match.id,
          code: match.code,
          total: match.total,
          paymentMethod: method || match.paymentMethod,
        });
        return;
      }
      setRetryModalOrder({
        id: orderItemOrId,
        code: activeTracking?.code || orderItemOrId,
        total: activeTracking?.total || 0,
        paymentMethod: method || activeTracking?.paymentMethod,
      });
      return;
    }
    const safeCode = orderItemOrId.code || orderItemOrId.id;
    let safeId = orderItemOrId.id || safeCode;
    const match = historyOrders.find((o) => o.code === safeCode || o.id === safeId);
    if (match) {
      safeId = match.id;
    }
    setRetryModalOrder({
      id: safeId,
      code: safeCode,
      total: orderItemOrId.total || 0,
      paymentMethod: method || orderItemOrId.paymentMethod,
    });
  };

  const dongModalThuLai = () => {
    setRetryModalOrder(null);
  };

  const xacNhanThuLaiThanhToan = async (orderId: string, method: string) => {
    const storedToken =
      localStorage.getItem('brewlite-token') || localStorage.getItem('brewlite_token');
    if (!storedToken) {
      setBanner({
        show: true,
        type: 'error',
        message: 'Vui lòng đăng nhập lại để thanh toán đơn hàng.',
      });
      return;
    }

    try {
      setIsRetrying(true);
      const res = await fetch(`${API}/orders/${orderId}/retry-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storedToken}`,
        },
        body: JSON.stringify({
          method,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || 'Không thể thực hiện thanh toán lại');
      }

      if (data?.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }

      setRetryModalOrder(null);

      if (data?.success) {
        setBanner({
          show: true,
          type: 'success',
          message: `🎉 Thanh toán lại thành công! Đơn hàng đã được xác nhận và chuyển đến Barista chuẩn bị món.`,
        });
      } else {
        setBanner({
          show: true,
          type: 'error',
          message: `❌ Thanh toán thất bại. Giỏ hàng & trạng thái đơn hàng của bạn đã được cập nhật. Bạn có thể chọn phương thức khác để thử lại.`,
        });
      }
      setRefreshIndex((c) => c + 1);
    } catch (err: any) {
      setBanner({
        show: true,
        type: 'error',
        message: err.message || 'Lỗi kết nối khi thanh toán lại',
      });
    } finally {
      setIsRetrying(false);
    }
  };

  const xuLyThuLaiThanhToan = async (orderIdOrCode: string) => {
    const match = historyOrders.find((o) => o.code === orderIdOrCode || o.id === orderIdOrCode);
    const targetId = match ? match.id : (activeTracking?.id || orderIdOrCode);
    await xacNhanThuLaiThanhToan(targetId, 'VNPay');
  };

  const filteredHistory = useMemo(() => {
    if (historyFilter === 'Tất cả') return historyOrders;
    return historyOrders.filter((o) => {
      if (historyFilter === 'Đang xử lý')
        return o.status === 'PENDING' || o.status === 'PAID' || o.status === 'PREPARING';
      if (historyFilter === 'Sẵn sàng nhận') return o.status === 'READY';
      if (historyFilter === 'Hoàn thành') return o.status === 'COMPLETED';
      if (historyFilter === 'Đã hủy')
        return o.status === 'CANCELLED' || o.status === 'PAYMENT_FAILED';
      return true;
    });
  }, [historyOrders, historyFilter]);

  const activeOrderItems = useMemo(() => {
    if (!activeTracking) return [];
    if (Array.isArray(activeTracking.items) && activeTracking.items.length > 0) {
      return activeTracking.items;
    }
    const matched = historyOrders.find((o) => o && o.code === activeTracking.code);
    if (matched && Array.isArray(matched.items) && matched.items.length > 0) {
      return matched.items;
    }
    return getFallbackItemsForOrder(activeTracking.code, activeTracking.total);
  }, [activeTracking, historyOrders]);

  return {
    isLoggedIn,
    currentUserEmail,
    banner,
    setBanner,
    historyOrders,
    filteredHistory,
    historyFilter,
    setHistoryFilter,
    activeTracking,
    setActiveTracking,
    chonDonHangTheoDoi,
    selectOrderToTrack: chonDonHangTheoDoi,
    activeOrderItems,
    expandedOrderIds,
    batTatMoRongDonHang,
    toggleExpandOrder: batTatMoRongDonHang,
    modal,
    setModal,
    xuLyThuLaiThanhToan,
    handleRetryPayment: xuLyThuLaiThanhToan,
    moModalThuLai,
    openRetryModal: moModalThuLai,
    dongModalThuLai,
    closeRetryModal: dongModalThuLai,
    retryModalOrder,
    xacNhanThuLaiThanhToan,
    handleConfirmRetryPayment: xacNhanThuLaiThanhToan,
    isRetrying,
  };
}

