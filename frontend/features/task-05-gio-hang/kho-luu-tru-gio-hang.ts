import type { SetStateAction } from 'react';
import type { CartItem, Product, PromotionItem } from '../dung-chung/kieu-du-lieu-chung';
import { normalizeText } from '../task-03-thuc-don/du-lieu-danh-muc';

export interface CartState {
  items: CartItem[];
  voucher: string;
  voucherApplied: boolean;
  selectedPromo: PromotionItem | null;
  usePoints: boolean;
  pointsToRedeem: number;
  inventoryError: string | null;
}

export const initialCartState: CartState = {
  items: [],
  voucher: '',
  voucherApplied: false,
  selectedPromo: null,
  usePoints: false,
  pointsToRedeem: 0,
  inventoryError: null,
};

export type CartAction =
  | { type: 'SET_ITEMS'; payload: SetStateAction<CartItem[]> }
  | {
      type: 'ADD_ITEM';
      payload: {
        product: Omit<Product, 'description'> & { description?: string };
        size?: 'S' | 'M' | 'L';
        toppings?: string[];
        qty?: number;
      };
    }
  | { type: 'UPDATE_QTY'; payload: { index: number; qty: number } }
  | { type: 'REMOVE_ITEM'; payload: { index: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_VOUCHER'; payload: SetStateAction<string> }
  | { type: 'SET_VOUCHER_APPLIED'; payload: SetStateAction<boolean> }
  | { type: 'SET_SELECTED_PROMO'; payload: SetStateAction<PromotionItem | null> }
  | { type: 'SET_USE_POINTS'; payload: SetStateAction<boolean> }
  | { type: 'SET_POINTS_TO_REDEEM'; payload: SetStateAction<number> }
  | { type: 'SET_INVENTORY_ERROR'; payload: string | null };

function resolveUpdater<T>(updater: SetStateAction<T>, prev: T): T {
  return typeof updater === 'function' ? (updater as (prevState: T) => T)(prev) : updater;
}

export function tinhDonGiaMonGioHang(item: CartItem): number {
  if (typeof item.unitPrice === 'number' && item.unitPrice > 0) {
    return item.unitPrice;
  }
  const kichCo = item.size || 'M';
  const phuPhiKichCo = kichCo === 'L' ? 10000 : kichCo === 'M' ? 5000 : 0;
  const phuPhiTopping = (item.toppings?.length || 0) * 10000;
  return item.product.price + phuPhiKichCo + phuPhiTopping;
}
export const calculateCartItemUnitPrice = tinhDonGiaMonGioHang;

export function tinhSoLuongMonGioHang(items: ReadonlyArray<CartItem>): number {
  return items.reduce((tongSoLuong, item) => tongSoLuong + item.qty, 0);
}
export const calculateCartCount = tinhSoLuongMonGioHang;

export function tinhTamTinhGioHang(
  items: ReadonlyArray<CartItem>,
  hamTinhDonGia: (item: CartItem) => number = tinhDonGiaMonGioHang
): number {
  return items.reduce((tongTien, item) => tongTien + hamTinhDonGia(item) * item.qty, 0);
}
export const calculateCartSubtotal = tinhTamTinhGioHang;

export function boXuLyGioHang(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'SET_ITEMS': {
      const danhSachMonMoi = resolveUpdater(action.payload, state.items);
      return { ...state, items: danhSachMonMoi };
    }

    case 'ADD_ITEM': {
      const kichCo = action.payload.size || 'M';
      const toppings = action.payload.toppings || [];
      const soLuongThem = action.payload.qty ?? 1;
      const sanPham: Product = {
        ...action.payload.product,
        description: action.payload.product.description ?? '',
      };
      const danhSachToppingSapXep = [...toppings].sort();
      const viTriTonTai = state.items.findIndex(
        (it) =>
          (it.product.id === sanPham.id || normalizeText(it.product.name) === normalizeText(sanPham.name)) &&
          (it.size || 'M') === kichCo &&
          JSON.stringify([...(it.toppings || [])].sort()) === JSON.stringify(danhSachToppingSapXep)
      );

      if (viTriTonTai >= 0) {
        const danhSachMoi = [...state.items];
        danhSachMoi[viTriTonTai] = {
          ...danhSachMoi[viTriTonTai],
          qty: danhSachMoi[viTriTonTai].qty + soLuongThem,
        };
        return { ...state, items: danhSachMoi };
      }

      return {
        ...state,
        items: [
          ...state.items,
          {
            product: sanPham,
            size: kichCo,
            toppings,
            qty: soLuongThem,
          },
        ],
      };
    }

    case 'UPDATE_QTY': {
      const { index, qty } = action.payload;
      if (index < 0 || index >= state.items.length) return state;
      if (qty <= 0) {
        return {
          ...state,
          items: state.items.filter((_, viTri) => viTri !== index),
        };
      }
      const danhSachCapNhat = [...state.items];
      danhSachCapNhat[index] = { ...danhSachCapNhat[index], qty };
      return { ...state, items: danhSachCapNhat };
    }

    case 'REMOVE_ITEM': {
      const { index } = action.payload;
      return {
        ...state,
        items: state.items.filter((_, viTri) => viTri !== index),
      };
    }

    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
        voucher: '',
        voucherApplied: false,
        selectedPromo: null,
        usePoints: false,
        pointsToRedeem: 0,
        inventoryError: null,
      };

    case 'SET_VOUCHER':
      return { ...state, voucher: resolveUpdater(action.payload, state.voucher) };

    case 'SET_VOUCHER_APPLIED':
      return { ...state, voucherApplied: resolveUpdater(action.payload, state.voucherApplied) };

    case 'SET_SELECTED_PROMO':
      return { ...state, selectedPromo: resolveUpdater(action.payload, state.selectedPromo) };

    case 'SET_USE_POINTS':
      return { ...state, usePoints: resolveUpdater(action.payload, state.usePoints) };

    case 'SET_POINTS_TO_REDEEM':
      return { ...state, pointsToRedeem: resolveUpdater(action.payload, state.pointsToRedeem) };

    case 'SET_INVENTORY_ERROR':
      return { ...state, inventoryError: action.payload };

    default:
      return state;
  }
}

export const cartReducer = boXuLyGioHang;

