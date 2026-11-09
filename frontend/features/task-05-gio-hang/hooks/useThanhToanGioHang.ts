import { useState } from 'react';
import type { CartItem, PromotionItem } from '../../dung-chung/kieu-du-lieu-chung';
import { API } from '../../dung-chung/cau-hinh-api';
import { displayOrderCode } from '../../dung-chung/ma-don-hang';
import type { PaymentMethodType } from '../BoChonPhuongThucThanhToan';

export interface ConfirmationResult {
  success: boolean;
  orderId: string;
  orderCode?: string;
  status: string;
  total: number;
  method: string;
  message?: string;
}

export interface UseCartCheckoutProps {
  token: string;
  cart: CartItem[];
  voucher: string;
  voucherApplied: boolean;
  selectedPromo: PromotionItem | null;
  usePoints?: boolean;
  actualPointsUsed?: number;
  onCheckoutSuccess?: (data: any) => void;
  setCart: (c: CartItem[]) => void;
  clearCart?: () => void;
  setModal: (m: string) => void;
  setAuthError: (e: string) => void;
  loadCartFromDatabase: () => Promise<void>;
  cartOverStockInfo?: { id?: string; name: string; totalQty: number; liveStock: number }[];
  inventoryError?: string | null;
  setInventoryError?: (err: string | null) => void;
  validateCartInventory?: (customCart?: CartItem[]) => Promise<boolean>;
}

export function useCartCheckout({
  token,
  cart,
  voucher,
  voucherApplied,
  selectedPromo,
  usePoints,
  actualPointsUsed,
  onCheckoutSuccess,
  setCart,
  clearCart,
  setModal,
  setAuthError,
  loadCartFromDatabase,
  cartOverStockInfo,
  inventoryError,
  setInventoryError,
  validateCartInventory,
}: UseCartCheckoutProps) {
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'checkout' | 'confirmation'>('cart');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType>('VNPay');
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [vnpayStatus, setVnpayStatus] = useState<string>('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [currentOrderCode, setCurrentOrderCode] = useState<string | null>(null);

  // Bước 3 -> Bước 4: Chuyển từ giỏ hàng sang màn hình thanh toán
  async function handleProceedToCheckout(): Promise<void> {
    if (cart.length === 0) {
      alert('Giỏ hàng của bạn đang trống! Vui lòng chọn món trước khi thanh toán.');
      return;
    }

    if (!token) {
      setModal('login');
      setAuthError('Vui lòng đăng nhập tài khoản trước khi thanh toán đơn hàng.');
      return;
    }

    if (cartOverStockInfo && cartOverStockInfo.length > 0) {
      alert('⚠️ Một số sản phẩm trong giỏ đã hết hàng hoặc vượt tồn kho! Vui lòng điều chỉnh lại giỏ hàng.');
      return;
    }

    if (inventoryError) {
      alert(`⚠️ ${inventoryError}\nVui lòng giảm bớt số lượng món để có thể tiếp tục thanh toán.`);
      return;
    }

    if (validateCartInventory) {
      const isOk = await validateCartInventory(cart);
      if (!isOk) {
        alert('⚠️ Nguyên liệu trong kho không đủ để pha chế số lượng món này. Vui lòng kiểm tra lại giỏ hàng!');
        return;
      }
    }

    setCurrentOrderId(null);
    setCurrentOrderCode(null);
    setCheckoutStep('checkout');
  }

  // Bước 4 -> Bước 5: Xác nhận thanh toán VNPay
  async function handleConfirmPayment() {
    if (cart.length === 0) {
      alert('Giỏ hàng trống!');
      setCheckoutStep('cart');
      return;
    }

    if (!token) {
      setModal('login');
      setAuthError('Vui lòng đăng nhập tài khoản trước khi thanh toán đơn hàng.');
      return;
    }

    setIsProcessingPayment(true);
    setVnpayStatus('redirecting');

    try {
      const promoCode = voucherApplied ? (selectedPromo ? selectedPromo.code : voucher) : undefined;
      const pointsUsedToSend = usePoints && actualPointsUsed && actualPointsUsed > 0 ? actualPointsUsed : undefined;

      let orderId = currentOrderId;

      // 1. Chỉ tạo đơn hàng PENDING mới nếu chưa có đơn hàng cho phiên checkout này
      if (!orderId) {
        const itemsToSend = cart.map((item) => ({
          productId: item.product.id,
          size: item.size || 'M',
          toppings: item.toppings || [],
          qty: item.qty,
        }));

        const orderRes = await fetch(`${API}/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            items: itemsToSend,
            promotionCode: promoCode,
            pointsUsed: pointsUsedToSend,
            paymentMethod: selectedPaymentMethod,
          }),
        });

        if (!orderRes.ok) {
          setIsProcessingPayment(false);
          setVnpayStatus('');
          const err = await orderRes.json().catch(() => ({}));
          if (orderRes.status === 409) {
            const msg = err.message || 'Sản phẩm trong giỏ đã hết hàng hoặc tồn kho vừa thay đổi!';
            if (setInventoryError) setInventoryError(msg);
            alert(`⚠️ ${msg}\nVui lòng kiểm tra lại giỏ hàng.`);
          } else {
            alert(`⚠️ ${err.message || 'Không thể tạo đơn hàng, vui lòng thử lại sau.'}`);
          }
          await loadCartFromDatabase();
          if (validateCartInventory) void validateCartInventory();
          setCheckoutStep('cart');
          return;
        }

        const createdOrderData = await orderRes.json();
        const orderObj = createdOrderData.order || createdOrderData;
        orderId = orderObj.id || createdOrderData.orderId;
        const resolvedCode = displayOrderCode({ id: orderId, code: orderObj.code });
        setCurrentOrderCode(resolvedCode);
        setCurrentOrderId(orderId);
      }

      // 2A. Nếu chọn VNPay: lấy URL thanh toán VNPay cho đúng đơn hàng này (không tạo đơn mới)
      if (selectedPaymentMethod === 'VNPay') {
        const vnpayRes = await fetch(`${API}/orders/${orderId}/retry-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            method: 'VNPay',
          }),
        });

        const vnpayData = await vnpayRes.json().catch(() => ({}));
        if (!vnpayRes.ok) {
          throw new Error(vnpayData.message || 'Không thể tạo URL thanh toán VNPay.');
        }
        if (vnpayRes.ok) {
          if (vnpayData.paymentUrl) {
            window.location.href = vnpayData.paymentUrl;
            return;
          }
          if (vnpayData.success && vnpayData.order?.status === 'PAID') {
            fetch(`${API}/cart`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            }).catch(() => {});
            if (clearCart) {
              clearCart();
            } else {
              setCart([]);
            }
            setCurrentOrderId(null);
            if (onCheckoutSuccess) {
              onCheckoutSuccess(vnpayData.order);
            }
            setConfirmationResult({
              success: true,
              orderId,
              orderCode: currentOrderCode || (vnpayData.order?.code ? `#${vnpayData.order.code}` : undefined),
              status: 'PAID',
              total: 0,
              method: 'VNPay',
              message: 'Đơn hàng 0đ đã được xác nhận thành công. Mời tới quầy lấy nước!',
            });
            setCheckoutStep('confirmation');
            return;
          }
        }
        throw new Error('VNPay không trả về URL thanh toán. Vui lòng thử lại.');
      }

    } catch (err: any) {
      console.error('Lỗi khi thực hiện thanh toán:', err);
      alert(err.message || 'Đã xảy ra lỗi kết nối khi đặt hàng. Giỏ hàng của bạn được giữ nguyên.');
    } finally {
      setIsProcessingPayment(false);
      setVnpayStatus('');
    }
  }

  function handleRetryPayment() {
    setCheckoutStep('checkout');
  }

  function resetCheckout() {
    setCheckoutStep('cart');
    setConfirmationResult(null);
    setCurrentOrderId(null);
    setCurrentOrderCode(null);
    setIsProcessingPayment(false);
  }

  const tienHanhDatHang = handleProceedToCheckout;
  const xacNhanThanhToan = handleConfirmPayment;
  const thuLaiThanhToan = handleRetryPayment;
  const datLaiTrangThaiThanhToan = resetCheckout;

  return {
    checkoutStep,
    setCheckoutStep,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    isProcessingPayment,
    vnpayStatus,
    confirmationResult,
    handleProceedToCheckout,
    tienHanhDatHang,
    handleConfirmPayment,
    xacNhanThanhToan,
    handleRetryPayment,
    thuLaiThanhToan,
    resetCheckout,
    datLaiTrangThaiThanhToan,
    // Alias tương thích cũ
    handleCheckout: handleProceedToCheckout,
  };
}
