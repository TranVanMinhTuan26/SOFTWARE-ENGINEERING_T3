'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import type { CartItem, PromotionItem } from '../dung-chung/kieu-du-lieu-chung';
import {
  type CartAction,
  type CartState,
  calculateCartCount,
  calculateCartItemUnitPrice,
  calculateCartSubtotal,
  cartReducer,
  initialCartState,
} from './kho-luu-tru-gio-hang';

export {
  type CartAction,
  type CartState,
  calculateCartCount,
  calculateCartItemUnitPrice,
  calculateCartSubtotal,
  cartReducer,
  initialCartState,
};

export interface CartContextValue {
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  clearCart: () => void;
  cartCount: number;
  subtotal: number;
  getItemUnitPrice: (item: CartItem) => number;
  voucher: string;
  setVoucher: React.Dispatch<React.SetStateAction<string>>;
  voucherApplied: boolean;
  setVoucherApplied: React.Dispatch<React.SetStateAction<boolean>>;
  selectedPromo: PromotionItem | null;
  setSelectedPromo: React.Dispatch<React.SetStateAction<PromotionItem | null>>;
  usePoints: boolean;
  setUsePoints: React.Dispatch<React.SetStateAction<boolean>>;
  pointsToRedeem: number;
  setPointsToRedeem: React.Dispatch<React.SetStateAction<number>>;
  inventoryError: string | null;
  setInventoryError: (err: string | null) => void;
}

export const CartContext = createContext<CartContextValue | null>(null);

export const CART_STORAGE_KEY = 'brewlite_cart_items';

function useCreateCartContextValue(): { value: CartContextValue; isHydratedRef: React.MutableRefObject<boolean> } {
  const [state, dispatch] = useReducer(cartReducer, initialCartState);
  const isHydratedRef = useRef(false);

  const setCart = useCallback<React.Dispatch<React.SetStateAction<CartItem[]>>>((updater) => {
    dispatch({ type: 'SET_ITEMS', payload: updater });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(CART_STORAGE_KEY);
      } catch {}
    }
  }, []);

  const setVoucher = useCallback<React.Dispatch<React.SetStateAction<string>>>((updater) => {
    dispatch({ type: 'SET_VOUCHER', payload: updater });
  }, []);

  const setVoucherApplied = useCallback<React.Dispatch<React.SetStateAction<boolean>>>((updater) => {
    dispatch({ type: 'SET_VOUCHER_APPLIED', payload: updater });
  }, []);

  const setSelectedPromo = useCallback<React.Dispatch<React.SetStateAction<PromotionItem | null>>>((updater) => {
    dispatch({ type: 'SET_SELECTED_PROMO', payload: updater });
  }, []);

  const setUsePoints = useCallback<React.Dispatch<React.SetStateAction<boolean>>>((updater) => {
    dispatch({ type: 'SET_USE_POINTS', payload: updater });
  }, []);

  const setPointsToRedeem = useCallback<React.Dispatch<React.SetStateAction<number>>>((updater) => {
    dispatch({ type: 'SET_POINTS_TO_REDEEM', payload: updater });
  }, []);

  const setInventoryError = useCallback((err: string | null) => {
    dispatch({ type: 'SET_INVENTORY_ERROR', payload: err });
  }, []);

  const getItemUnitPrice = useCallback((item: CartItem) => calculateCartItemUnitPrice(item), []);
  const cartCount = useMemo(() => calculateCartCount(state.items), [state.items]);
  const subtotal = useMemo(() => calculateCartSubtotal(state.items, getItemUnitPrice), [state.items, getItemUnitPrice]);

  const value = useMemo<CartContextValue>(
    () => ({
      state,
      dispatch,
      cart: state.items,
      setCart,
      clearCart,
      cartCount,
      subtotal,
      getItemUnitPrice,
      voucher: state.voucher,
      setVoucher,
      voucherApplied: state.voucherApplied,
      setVoucherApplied,
      selectedPromo: state.selectedPromo,
      setSelectedPromo,
      usePoints: state.usePoints,
      setUsePoints,
      pointsToRedeem: state.pointsToRedeem,
      setPointsToRedeem,
      inventoryError: state.inventoryError,
      setInventoryError,
    }),
    [
      state,
      setCart,
      clearCart,
      cartCount,
      subtotal,
      getItemUnitPrice,
      setVoucher,
      setVoucherApplied,
      setSelectedPromo,
      setUsePoints,
      setPointsToRedeem,
      setInventoryError,
    ]
  );

  return { value, isHydratedRef };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { value, isHydratedRef } = useCreateCartContextValue();
  const { state, dispatch } = value;

  // Khởi tạo từ localStorage khi mount trên trình duyệt (tránh ghi đè trước khi hydrate)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const duLieuLuuTru = localStorage.getItem(CART_STORAGE_KEY);
      if (duLieuLuuTru) {
        const duLieuPhanTich = JSON.parse(duLieuLuuTru);
        if (Array.isArray(duLieuPhanTich) && duLieuPhanTich.length > 0) {
          dispatch({ type: 'SET_ITEMS', payload: duLieuPhanTich });
        }
      }
    } catch {}
    isHydratedRef.current = true;
  }, [dispatch, isHydratedRef]);

  // Đồng bộ xuống localStorage & phát sự kiện toàn cục sau khi đã hydrate
  useEffect(() => {
    if (typeof window === 'undefined' || !isHydratedRef.current) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items));
    } catch {}
    window.dispatchEvent(new CustomEvent('brewlite:cart-updated', { detail: state.items }));
  }, [state.items, isHydratedRef]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCartContext(): CartContextValue {
  const boNhoNguCanh = useContext(CartContext);
  if (!boNhoNguCanh) {
    throw new Error('useCartContext phải được sử dụng bên trong CartProvider');
  }
  return boNhoNguCanh;
}
export const dungCartContext = useCartContext;
