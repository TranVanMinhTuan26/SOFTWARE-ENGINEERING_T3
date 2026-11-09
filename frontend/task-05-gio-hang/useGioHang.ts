import type { CartItem, Product, PromotionItem } from '../dung-chung/kieu-du-lieu-chung';
import { useCartItems } from './hooks/useSanPhamGioHang';
import { useCartDiscounts } from './hooks/useGiamGiaGioHang';
import { useCartCheckout, type ConfirmationResult } from './hooks/useThanhToanGioHang';
import type { PaymentMethodType } from './BoChonPhuongThucThanhToan';

export { CartContext, CartProvider, useCartContext, cartReducer } from './NguCanhGioHang';

export interface UseCartReturn {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  clearCart: () => void;
  voucher: string;
  setVoucher: React.Dispatch<React.SetStateAction<string>>;
  voucherApplied: boolean;
  availablePromotions: PromotionItem[];
  selectedPromo: PromotionItem | null;
  selectedPaymentMethod: PaymentMethodType;
  setSelectedPaymentMethod: React.Dispatch<React.SetStateAction<PaymentMethodType>>;
  checkoutStep: 'cart' | 'checkout' | 'confirmation';
  setCheckoutStep: (step: 'cart' | 'checkout' | 'confirmation') => void;
  isProcessingPayment: boolean;
  confirmationResult: ConfirmationResult | null;
  handleProceedToCheckout: () => void;
  handleConfirmPayment: () => Promise<void>;
  handleRetryPayment: () => void;
  resetCheckout: () => void;
  vnpayStatus: string;
  usePoints: boolean;
  setUsePoints: React.Dispatch<React.SetStateAction<boolean>>;
  pointsToRedeem: number;
  setPointsToRedeem: React.Dispatch<React.SetStateAction<number>>;
  cartCount: number;
  subtotal: number;
  discountAmount: number;
  pointsDiscount: number;
  actualPointsUsed: number;
  grandTotal: number;
  expectedEarnedPoints: number;
  maxRedeemablePoints: number;
  minPointRedeem: number;
  pointRateNumber: number;
  pointToMoneyRateNumber?: number;
  cartOverStockInfo: { id?: string; name: string; totalQty: number; liveStock: number }[];
  inventoryError: string | null;
  setInventoryError: (err: string | null) => void;
  isCheckingInventory: boolean;
  validateCartInventory: (customCart?: CartItem[]) => Promise<boolean>;
  getItemUnitPrice: (item: CartItem) => number;
  addToCart: (product: Product, size?: 'S' | 'M' | 'L', toppings?: string[], qty?: number) => Promise<boolean>;
  updateCartQty: (index: number, delta: number) => Promise<void>;
  removeCartItem: (index: number) => Promise<void>;
  handleSelectPromo: (promo: PromotionItem) => Promise<void>;
  handleRemovePromo: () => Promise<void>;
  applyVoucher: () => Promise<void>;
  handleCheckout?: () => Promise<void>;
  loadCartFromDatabase: (authToken?: string) => Promise<void>;
  syncCartFromApi: (data: any) => void;
}

export function useCart(deps: {
  token: string;
  products: Product[];
  userPoints: number;
  setModal: (m: string) => void;
  setAuthError: (e: string) => void;
  setToastMessage: (m: string) => void;
}): UseCartReturn {
  const { token, products, userPoints, setModal, setAuthError, setToastMessage } = deps;

  const items = useCartItems({
    token,
    products,
    setModal,
    setAuthError,
    setToastMessage,
  });

  const discounts = useCartDiscounts({
    token,
    userPoints,
    subtotal: items.subtotal,
    syncCartFromApi: items.syncCartFromApi,
  });

  const checkout = useCartCheckout({
    token,
    cart: items.cart,
    voucher: discounts.voucher,
    voucherApplied: discounts.voucherApplied,
    selectedPromo: discounts.selectedPromo,
    usePoints: discounts.usePoints,
    actualPointsUsed: discounts.actualPointsUsed,
    setCart: items.setCart,
    clearCart: items.clearCart,
    setModal,
    setAuthError,
    loadCartFromDatabase: items.loadCartFromDatabase,
    cartOverStockInfo: items.cartOverStockInfo,
    inventoryError: items.inventoryError,
    setInventoryError: items.setInventoryError,
    validateCartInventory: items.validateCartInventory,
  });

  return {
    ...items,
    ...discounts,
    ...checkout,
  };
}
