import { useEffect, useMemo, useState } from 'react';
import type { CartItem, Product } from '../dung-chung/kieu-du-lieu-chung';
import { API } from '../dung-chung/cau-hinh-api';
import { normalizeText } from './du-lieu-danh-muc';

export function useProducts(deps?: {
  setCart?: React.Dispatch<React.SetStateAction<CartItem[]>>;
  loadUserOrders?: (token: string) => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string>('Tất cả');
  const [search, setSearch] = useState<string>('');

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/products`);
      if (!res.ok) {
        throw new Error(`Máy chủ phản hồi mã lỗi HTTP ${res.status}`);
      }
      const apiData = await res.json();
      if (Array.isArray(apiData)) {
        setProducts(apiData);
      } else {
        throw new Error('Dữ liệu sản phẩm trả về không đúng định dạng');
      }
    } catch (err: any) {
      setError(err?.message || 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng hoặc thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // 1. Tải danh sách sản phẩm từ Server API (Nguồn sự thật)
  useEffect(() => {
    fetchProducts();
  }, []);

  // 2. Định kỳ và theo sự kiện focus/storage đồng bộ lại sản phẩm
  useEffect(() => {
    const fetchLatest = () => {
      fetch(`${API}/products`)
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((apiData: Product[]) => {
          if (!Array.isArray(apiData)) return;

          setProducts((prev) => {
            if (prev.length !== apiData.length) return apiData;
            let hasChange = false;
            for (let i = 0; i < prev.length; i++) {
              const p = prev[i];
              const f = apiData.find((item) => item.id === p.id);
              if (
                !f ||
                f.name !== p.name ||
                f.price !== p.price ||
                f.available !== p.available ||
                f.category !== p.category ||
                f.imageUrl !== p.imageUrl ||
                f.description !== p.description
              ) {
                hasChange = true;
                break;
              }
            }
            return hasChange ? apiData : prev;
          });

          if (deps?.setCart) {
            deps.setCart((prevCart) => {
              let cartChanged = false;
              const updated = prevCart.map((item) => {
                const norm = normalizeText(item.product.name);
                const pMatch = apiData.find(
                  (p) => p.id === item.product.id || normalizeText(p.name) === norm
                );
                if (pMatch && (pMatch.available !== item.product.available || pMatch.price !== item.product.price || pMatch.name !== item.product.name)) {
                  cartChanged = true;
                  return {
                    ...item,
                    product: {
                      ...item.product,
                      available: pMatch.available,
                      price: pMatch.price,
                      name: pMatch.name,
                    },
                  };
                }
                return item;
              });
              return cartChanged ? updated : prevCart;
            });
          }
        })
        .catch(() => {});
    };

    const syncAll = () => {
      fetchLatest();
      const activeTok = localStorage.getItem('brewlite-token') || localStorage.getItem('brewlite_token');
      if (activeTok && deps?.loadUserOrders) {
        deps.loadUserOrders(activeTok);
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (
        !e.key ||
        e.key === 'brewlite_inventory_updated' ||
        e.key === 'brewlite_admin_products_updated' ||
        e.key === 'brewlite_orders' ||
        (e.key && e.key.startsWith('brewlite_orders_')) ||
        e.key === 'brewlite_last_order'
      ) {
        syncAll();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', syncAll);
    window.addEventListener('brewlite:inventory-updated', syncAll);
    const syncTimer = setInterval(syncAll, 4000);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', syncAll);
      window.removeEventListener('brewlite:inventory-updated', syncAll);
      clearInterval(syncTimer);
    };
  }, [deps]);

  // Lọc sản phẩm theo danh mục và từ khóa tìm kiếm
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat =
        category === 'Tất cả' ||
        p.category.toLowerCase() === category.toLowerCase() ||
        (category === 'Khác' && !['Cà phê', 'Trà', 'Matcha', 'Đá xay'].includes(p.category));
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase().trim());
      return matchCat && matchSearch;
    });
  }, [products, category, search]);

  return {
    products,
    setProducts,
    loading,
    error,
    reload: fetchProducts,
    category,
    setCategory,
    search,
    setSearch,
    filteredProducts,
  };
}
