import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CartItem, Product } from '../../dung-chung/kieu-du-lieu-chung';
import { API } from '../../dung-chung/cau-hinh-api';
import { normalizeText } from '../../task-03-thuc-don/du-lieu-danh-muc';
import { useCartContext } from '../NguCanhGioHang';

export interface UseCartItemsProps {
  token: string;
  products: Product[];
  setModal: (m: string) => void;
  setAuthError: (e: string) => void;
  setToastMessage: (m: string) => void;
}

export function useCartItems({
  token,
  products,
  setModal,
  setAuthError,
  setToastMessage,
}: UseCartItemsProps) {
  // Quản lý state giỏ hàng thông qua React Context (CartContext & useReducer)
  const {
    cart,
    setCart,
    clearCart,
    dispatch,
    cartCount,
    subtotal,
    getItemUnitPrice,
    inventoryError,
    setInventoryError,
    setVoucher,
    setVoucherApplied,
    setSelectedPromo,
  } = useCartContext();

  const cartRef = useRef<CartItem[]>(cart);
  cartRef.current = cart;

  // Danh sách các món trong giỏ nhưng hiện tại server/menu báo hết hàng
  const unavailableItemsInCart = useMemo(() => {
    return cart.filter((item) => {
      const targetProd = products.find(
        (p) => p.id === item.product.id || normalizeText(p.name) === normalizeText(item.product.name)
      );
      return (targetProd || item.product).available === false;
    });
  }, [cart, products]);

  // Backward compatibility alias: cartOverStockInfo giờ chỉ rỗng nếu mọi món khả dụng
  const cartOverStockInfo = useMemo(() => {
    return unavailableItemsInCart.map((it) => ({
      id: it.product.id,
      name: it.product.name,
      totalQty: it.qty,
      liveStock: 0,
    }));
  }, [unavailableItemsInCart]);

  const [isCheckingInventory, setIsCheckingInventory] = useState(false);

  const validateCartInventory = useCallback(
    async (customCart?: CartItem[]): Promise<boolean> => {
      const itemsToCheck = customCart || cartRef.current;
      if (itemsToCheck.length === 0) {
        setInventoryError(null);
        return true;
      }
      setIsCheckingInventory(true);
      try {
        const res = await fetch(`${API}/cart/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: itemsToCheck.map((it) => ({
              productId: it.product.id,
              size: it.size || 'M',
              toppings: it.toppings || [],
              qty: it.qty || 1,
            })),
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.isFulfillable === false) {
            setInventoryError(data.inventoryError || 'Không đủ nguyên liệu');
            return false;
          } else {
            setInventoryError(null);
            return true;
          }
        }
      } catch {
        // Bỏ qua lỗi mạng cục bộ
      } finally {
        setIsCheckingInventory(false);
      }
      return true;
    },
    [setInventoryError]
  );

  const syncCartFromApi = useCallback(
    (cartData: any) => {
      if (!cartData) return;
      if (cartData.isFulfillable === false && cartData.inventoryError) {
        setInventoryError(cartData.inventoryError);
      } else if (cartData.isFulfillable === true) {
        setInventoryError(null);
      }
      if (cartData.voucherCode) {
        setVoucher(cartData.voucherCode);
        setVoucherApplied(true);
        const pctOff = Number(cartData.discountPercent || 0);
        const fixedAmt = Number(cartData.discountAmount || 0);
        const discountLabel =
          fixedAmt > 0 && pctOff > 0
            ? `${pctOff}% + ${fixedAmt.toLocaleString('vi-VN')}đ`
            : fixedAmt > 0
            ? `${fixedAmt.toLocaleString('vi-VN')}đ`
            : `${pctOff}%`;
        setSelectedPromo((prev) =>
          prev && prev.code.toUpperCase() === String(cartData.voucherCode).toUpperCase()
            ? prev
            : {
                id: `api-${cartData.voucherCode}`,
                code: cartData.voucherCode,
                name: `Mã ưu đãi ${cartData.voucherCode}`,
                discount: discountLabel,
                percentOff: pctOff,
                discountAmount: fixedAmt,
                timeRange: 'Đang áp dụng',
                status: 'Đang hoạt động',
              },
        );
      } else if (cartData.voucherCode === null) {
        setVoucher('');
        setVoucherApplied(false);
        setSelectedPromo(null);
      }
      if (!Array.isArray(cartData.items)) return;
      const mapped: CartItem[] = cartData.items.map((it: any) => ({
        id: it.id,
        product: {
          id: it.product.id,
          name: it.product.name,
          description: it.product.description || '',
          category: it.product.category,
          price: it.product.price,
          available: it.product.available !== false,
          imageUrl: it.product.imageUrl,
        },
        size: it.size || 'M',
        toppings: Array.isArray(it.toppings) ? it.toppings : [],
        qty: it.qty || 1,
        unitPrice: it.unitPrice,
      }));
      setCart(mapped);
    },
    [setCart, setInventoryError, setVoucher, setVoucherApplied, setSelectedPromo]
  );

  const loadCartFromDatabase = useCallback(
    async (tok?: string) => {
      const activeTok =
        tok ||
        token ||
        (typeof window !== 'undefined'
          ? localStorage.getItem('brewlite-token') ||
            localStorage.getItem('brewlite_token') ||
            localStorage.getItem('token')
          : '');
      if (!activeTok) return;
      try {
        const res = await fetch(`${API}/cart`, {
          headers: { Authorization: `Bearer ${activeTok}` },
        });
        if (res.ok) {
          const data = await res.json();
          const currentLocalItems = cartRef.current.filter((it) => !it.id);
          // Nếu giỏ hàng trong DB rỗng nhưng khách vãng lai đã chọn món trước khi đăng nhập (chưa có id DB): đẩy các món lên DB
          if ((!data.items || data.items.length === 0) && currentLocalItems.length > 0) {
            for (const localItem of currentLocalItems) {
              await fetch(`${API}/cart/items`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${activeTok}`,
                },
                body: JSON.stringify({
                  productId: localItem.product.id,
                  size: localItem.size,
                  toppings: localItem.toppings,
                  qty: localItem.qty,
                }),
              }).catch(() => {});
            }
            const refreshed = await fetch(`${API}/cart`, {
              headers: { Authorization: `Bearer ${activeTok}` },
            });
            if (refreshed.ok) {
              const freshData = await refreshed.json();
              syncCartFromApi(freshData);
              return;
            }
          }
          syncCartFromApi(data);
        }
      } catch (err) {
        console.error('Lỗi khi tải giỏ hàng từ Database:', err);
      }
    },
    [token, syncCartFromApi]
  );

  // Tự động kéo giỏ hàng từ Database ngay khi component/trang mount
  useEffect(() => {
    const activeTok =
      token ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('brewlite-token') ||
          localStorage.getItem('brewlite_token') ||
          localStorage.getItem('token')
        : '');
    if (activeTok) {
      void loadCartFromDatabase(activeTok);
    }
  }, [token, loadCartFromDatabase]);

  // Đồng bộ lại khi người dùng quay lại tab/cửa sổ trình duyệt
  useEffect(() => {
    const onFocus = () => {
      const activeTok =
        token ||
        (typeof window !== 'undefined'
          ? localStorage.getItem('brewlite-token') ||
            localStorage.getItem('brewlite_token') ||
            localStorage.getItem('token')
          : '');
      if (activeTok) {
        void loadCartFromDatabase(activeTok);
      }
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [token, loadCartFromDatabase]);

  // Kiểm tra tồn kho nguyên liệu mỗi khi giỏ hàng thay đổi (debounce 250ms)
  useEffect(() => {
    if (cart.length === 0) {
      setInventoryError(null);
      return;
    }
    const timer = setTimeout(() => {
      void validateCartInventory(cart);
    }, 250);
    return () => clearTimeout(timer);
  }, [cart, validateCartInventory, setInventoryError]);

  // Lắng nghe sự kiện cập nhật kho hàng từ Admin (qua custom event hoặc storage event giữa các tab)
  useEffect(() => {
    const onInventoryUpdate = () => {
      void validateCartInventory();
    };
    window.addEventListener('brewlite:inventory-updated', onInventoryUpdate);
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key === 'brewlite_inventory_updated' || e.key === 'brewlite_admin_products_updated') {
        void validateCartInventory();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('brewlite:inventory-updated', onInventoryUpdate);
      window.removeEventListener('storage', onStorage);
    };
  }, [validateCartInventory]);

  const addToCart = async (
    product: Product,
    size: 'S' | 'M' | 'L' = 'M',
    toppings: string[] = [],
    qtyToAdd: number = 1
  ): Promise<boolean> => {
    const targetProd = products.find(
      (p) => p.id === product.id || normalizeText(p.name) === normalizeText(product.name)
    );
    if ((targetProd || product).available === false) {
      alert(`⚠️ Món "${product.name}" hiện đã hết hàng trong kho!`);
      setToastMessage(`⚠️ Món "${product.name}" hiện đã hết hàng!`);
      setTimeout(() => setToastMessage(''), 3000);
      return false;
    }

    // Nếu chưa đăng nhập: dispatch ADD_ITEM vào CartContext
    if (!token) {
      dispatch({
        type: 'ADD_ITEM',
        payload: { product, size, toppings, qty: qtyToAdd },
      });
      return true;
    }

    try {
      const res = await fetch(`${API}/cart/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: product.id, size, toppings, qty: qtyToAdd }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = err.message || 'Không thể thêm sản phẩm vào giỏ hàng';
        alert(`⚠️ ${msg}`);
        setToastMessage(`⚠️ ${msg}`);
        setTimeout(() => setToastMessage(''), 3000);
        return false;
      }

      const cartData = await res.json();
      syncCartFromApi(cartData);
      return true;
    } catch (err) {
      console.error('Lỗi khi thêm món vào Database cart:', err);
      return false;
    }
  };

  const updateCartQty = async (index: number, delta: number) => {
    const item = cart[index];
    if (!item) return;

    const newQty = item.qty + delta;
    if (newQty <= 0) {
      await removeCartItem(index);
      return;
    }

    dispatch({ type: 'UPDATE_QTY', payload: { index, qty: newQty } });

    if (token && item.id) {
      try {
        const res = await fetch(`${API}/cart/items/${item.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ qty: newQty }),
        });
        if (res.ok) {
          const data = await res.json();
          syncCartFromApi(data);
        } else {
          const err = await res.json().catch(() => ({}));
          const msg = err.message || 'Không thể cập nhật số lượng';
          alert(`⚠️ ${msg}`);
          setToastMessage(`⚠️ ${msg}`);
          setTimeout(() => setToastMessage(''), 3000);
          await loadCartFromDatabase(token);
        }
      } catch (err) {
        console.error('Lỗi cập nhật số lượng giỏ hàng trên DB:', err);
      }
    }
  };

  const removeCartItem = async (index: number) => {
    const item = cart[index];
    if (!item) return;

    dispatch({ type: 'REMOVE_ITEM', payload: { index } });

    if (token && item.id) {
      try {
        const res = await fetch(`${API}/cart/items/${item.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          syncCartFromApi(data);
        }
      } catch (err) {
        console.error('Lỗi xóa món trên DB:', err);
      }
    }
  };

  return {
    cart,
    setCart,
    clearCart,
    cartCount,
    subtotal,
    getItemUnitPrice,
    cartOverStockInfo,
    unavailableItemsInCart,
    addToCart,
    themVaoGioHang: addToCart,
    updateCartQty,
    capNhatSoLuongGioHang: updateCartQty,
    removeCartItem,
    xoaMonGioHang: removeCartItem,
    syncCartFromApi,
    dongBoGioHangTuApi: syncCartFromApi,
    loadCartFromDatabase,
    taiGioHangTuCoSoDuLieu: loadCartFromDatabase,
    inventoryError,
    setInventoryError,
    isCheckingInventory,
    validateCartInventory,
    kiemTraTonKhoGioHang: validateCartInventory,
  };
}
