'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type {
  AdminRole,
  CreatableUserRole,
  OrderItem,
  ProductItem,
  PromotionItem,
  UserAccount,
  CustomerItem,
  StoreSettings,
} from '../kieu-quan-tri';
import {
  ROLE_PERMISSIONS_PRESETS,
  DEFAULT_PROMOTIONS,
} from '../hang-so-quan-tri';
import { inventoryApiClient } from '../api/khach-api-ton-kho';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const USER_ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  STAFF: 'Nhân viên',
  BARISTA: 'Pha chế',
  INVENTORY: 'Kho',
  KHO: 'Kho',
  CUSTOMER: 'Khách hàng',
};
const USER_ROLE_VALUES: Record<CreatableUserRole, string> = {
  Manager: 'MANAGER',
  'Nhân viên': 'STAFF',
  Kho: 'INVENTORY',
  'Pha chế': 'BARISTA',
  'Khách hàng': 'CUSTOMER',
};
const mapUserRoleToAdminRole = (role: string): AdminRole | null => {
  switch (role) {
    case 'ADMIN':
      return 'Admin';
    case 'MANAGER':
      return 'Manager';
    case 'BARISTA':
      return 'Pha chế';
    case 'INVENTORY':
    case 'KHO':
      return 'Kho';
    case 'STAFF':
    case 'NHANVIEN':
      return 'Nhân viên';
    default:
      return null;
  }
};
const toProductItem = (product: any): ProductItem => {
  const stockStatus: 'Còn hàng' | 'Hết hàng' | 'Chưa có công thức' =
    product.stockStatus || (product.hasRecipe === false ? 'Chưa có công thức' : product.available === false ? 'Hết hàng' : 'Còn hàng');
  return {
    id: product.id,
    name: product.name,
    description: product.description || '',
    category: product.category,
    price: product.price,
    imageUrl: product.imageUrl || '',
    active: product.active !== false,
    available: product.available !== false,
    hasRecipe: product.hasRecipe !== false,
    stockStatus,
    status: stockStatus,
  };
};

export const layTokenAdminHienTai = (): string | null => {
  if (typeof window === 'undefined') return null;
  return (
    localStorage.getItem('brewlite_admin_token') ||
    localStorage.getItem('brewlite-admin-token') ||
    localStorage.getItem('brewlite-token') ||
    localStorage.getItem('brewlite_token')
  );
};
export const getActiveAdminToken = layTokenAdminHienTai;

const kiemTraDuongDanAnhHopLe = (value: string) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};
const isValidProductImageUrl = kiemTraDuongDanAnhHopLe;

export function useAdminState() {
  const [activeTab, setActiveTab] = useState('Đơn hàng');
  const [globalSearch, setGlobalSearch] = useState('');
  const [currentAdminRole, setCurrentAdminRole] = useState<AdminRole>('Admin');

  // Role permissions preset
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('brewlite_role_permissions');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return ROLE_PERMISSIONS_PRESETS;
  });

  const getAllowedTabsForRole = useCallback(
    (role: AdminRole): string[] => {
      if (role === 'Admin') {
        return [
          'Đơn hàng',
          'Sản phẩm',
          'Kho hàng',
          'Khuyến mãi',
          'Khách hàng',
          'Tài khoản & Phân quyền',
        ];
      }

      const perms = rolePermissions[role] || ROLE_PERMISSIONS_PRESETS[role] || [];
      const allowed: string[] = [];

      // 1. Đơn hàng
      if (
        perms.includes('Xem đơn hàng') ||
        perms.includes('Xác nhận đơn hàng') ||
        perms.includes('Cập nhật trạng thái') ||
        perms.includes('Duyệt & Xử lý đơn hàng') ||
        perms.includes('Pha chế đồ uống')
      ) {
        allowed.push('Đơn hàng');
      }

      // 2. Sản phẩm
      if (
        perms.includes('Xem sản phẩm') ||
        perms.includes('Quản lý sản phẩm') ||
        perms.includes('Quản lý thực đơn & Giá bán')
      ) {
        allowed.push('Sản phẩm');
      }

      // 3. Kho hàng
      if (
        perms.includes('Quản lý kho & Nhập hàng') ||
        perms.includes('Kho hàng') ||
        role === 'Kho'
      ) {
        allowed.push('Kho hàng');
      }

      // 4. Khuyến mãi
      if (
        perms.includes('Quản lý khuyến mãi') ||
        perms.includes('Tạo mã giảm giá & Khuyến mãi')
      ) {
        allowed.push('Khuyến mãi');
      }

      // 5. Khách hàng
      if (
        perms.includes('Quản lý khách hàng') ||
        perms.includes('Quản lý thông tin khách hàng')
      ) {
        allowed.push('Khách hàng');
      }

      // 6. Tài khoản & Phân quyền
      if (
        perms.includes('Quản lý tài khoản') ||
        perms.includes('Phân quyền vai trò')
      ) {
        allowed.push('Tài khoản & Phân quyền');
      }

      return allowed.length > 0 ? allowed : ['Đơn hàng'];
    },
    [rolePermissions]
  );

  // Data states
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [productPageItems, setProductPageItems] = useState<ProductItem[]>([]);
  const [productPage, setProductPage] = useState(1);
  const [productPageSize] = useState(10);
  const [productTotal, setProductTotal] = useState(0);
  const [productTotalPages, setProductTotalPages] = useState(1);
  const [productLowStockCount, setProductLowStockCount] = useState(0);
  const [productLoading, setProductLoading] = useState(false);
  const [productError, setProductError] = useState('');
  const productsOverviewLoadedRef = useRef(false);
  const productPageRequestIdRef = useRef(0);
  const [promotions, setPromotions] = useState<PromotionItem[]>(DEFAULT_PROMOTIONS);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState('');
  const backendUsersRef = useRef<any[] | null>(null);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [customers, setCustomers] = useState<CustomerItem[]>([]);

  // Store Settings
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => {
    const defaultSettings: StoreSettings = {
      storeName: 'BrewLite Specialty Coffee & Tea',
      hotline: '1900 6868 - 0988 123 456',
      phone: '1900 6868 - 0988 123 456',
      address: '123 Nguyễn Thị Minh Khai, Bến Nghé, Quận 1, TP. Hồ Chí Minh',
      email: 'contact@brewlite.vn',
      openHours: '06:30 - 22:30 hàng ngày',
      website: 'https://brewlite.vn',
      facebook: 'https://facebook.com/brewlite',
      instagram: 'https://instagram.com/brewlite',
      pointRate: '1000',
      pointRedeem: '100',
      pointToMoneyRate: '100',
      autoPrintBill: true,
      notificationSound: true,
      allowTakeaway: true,
    };
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('brewlite_store_settings');
        if (saved) return { ...defaultSettings, ...JSON.parse(saved) };
      } catch {}
    }
    return defaultSettings;
  });

  // Filter states
  const [orderStatusFilter, setOrderStatusFilter] = useState('Tất cả');
  const [productCategoryFilter, setProductCategoryFilter] = useState('Tất cả');
  const [productStatusFilter, setProductStatusFilter] = useState('Tất cả');
  const [productSearch, setProductSearch] = useState('');

  const [promoStatusFilter, setPromoStatusFilter] = useState('Tất cả');
  const [promoSearch, setPromoSearch] = useState('');

  const [userRoleFilter, setUserRoleFilter] = useState('Tất cả');
  const [userStatusFilter, setUserStatusFilter] = useState('Tất cả');
  const [userSearch, setUserSearch] = useState('');

  const [customerTierFilter, setCustomerTierFilter] = useState('Tất cả');
  const [customerSearch, setCustomerSearch] = useState('');

  const [reportTimeFilter, setReportTimeFilter] = useState<
    'Hôm nay' | '7 ngày qua' | 'Tháng này' | 'Năm nay'
  >('Tháng này');

  // Modals state
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRoleForPerms, setSelectedRoleForPerms] = useState('Nhân viên');
  const [activePermissions, setActivePermissions] = useState<string[]>(
    ROLE_PERMISSIONS_PRESETS['Nhân viên']
  );

  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Cà phê');
  const [newProdPrice, setNewProdPrice] = useState('45000');
  const [newProdStock, setNewProdStock] = useState('50');
  const [newProdDescription, setNewProdDescription] = useState('');
  const [newProdImageUrl, setNewProdImageUrl] = useState('');
  const [newProdRecipeLines, setNewProdRecipeLines] = useState<Array<{ ingredientId: string; quantity: number }>>([]);
  const [newProdToppingIds, setNewProdToppingIds] = useState<string[]>([]);
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [editProdName, setEditProdName] = useState('');
  const [editProdCategory, setEditProdCategory] = useState('Cà phê');
  const [editProdPrice, setEditProdPrice] = useState('45000');
  const [editProdStock, setEditProdStock] = useState('50');
  const [editProdDescription, setEditProdDescription] = useState('');
  const [editProdImageUrl, setEditProdImageUrl] = useState('');
  const [editProdToppingIds, setEditProdToppingIds] = useState<string[]>([]);

  const [showAddPromoModal, setShowAddPromoModal] = useState(false);
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoName, setNewPromoName] = useState('');
  const [newPromoDiscount, setNewPromoDiscount] = useState('20%');
  const [newPromoTime, setNewPromoTime] = useState('01/11 - 30/11');

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [addUserError, setAddUserError] = useState('');
  const [newUserRole, setNewUserRole] = useState<CreatableUserRole>('Nhân viên');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [confirmNewUserPassword, setConfirmNewUserPassword] = useState('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [custEmailError, setCustEmailError] = useState('');
  const [custPhoneError, setCustPhoneError] = useState('');
  const [newCustTier, setNewCustTier] = useState<CustomerItem['tier']>('Mới');

  // Auth & RBAC gate states
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [isCustomerBlocked, setIsCustomerBlocked] = useState<boolean>(false);
  const [isNotLoggedIn, setIsNotLoggedIn] = useState<boolean>(false);

  const [adminEmailInput, setAdminEmailInput] = useState<string>('admin@brewlite.local');
  const [adminPasswordInput, setAdminPasswordInput] = useState<string>('');
  const [adminLoginError, setAdminLoginError] = useState<string>('');
  const [adminLoginLoading, setAdminLoginLoading] = useState<boolean>(false);

  // Toast
  const [adminToast, setAdminToast] = useState('');
  const triggerToast = useCallback((msg: string) => {
    setAdminToast(msg);
    setTimeout(() => setAdminToast(''), 3000);
  }, []);

  const handleAdminLogout = () => {
    inventoryApiClient.setToken(null);
    localStorage.removeItem('brewlite_admin_token');
    localStorage.removeItem('brewlite-admin-token');
    localStorage.removeItem('brewlite_admin_email');
    localStorage.removeItem('brewlite-admin-email');
    localStorage.removeItem('brewlite_admin_role');
    localStorage.removeItem('brewlite-admin-role');
    setIsNotLoggedIn(true);
    setIsCustomerBlocked(false);
    setAuthChecking(false);
    setCurrentUserEmail('');
    setCurrentUserRole('');
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError('');
    setAdminLoginLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmailInput.trim(), password: adminPasswordInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Đăng nhập không thành công.');
      }

      const roleUpper = (data.user?.role || 'CUSTOMER').toUpperCase();
      if (roleUpper === 'CUSTOMER') {
        throw new Error(
          'Tài khoản này là tài khoản Khách hàng (CUSTOMER). Bạn không có quyền truy cập bảng quản trị!'
        );
      }

      const mappedAdminRole = mapUserRoleToAdminRole(roleUpper);
      if (!mappedAdminRole) {
        throw new Error('Tài khoản không có vai trò quản trị hợp lệ.');
      }

      // Lưu trữ phiên Admin riêng biệt hoàn toàn, TUYỆT ĐỐI KHÔNG ghi đè phiên Khách hàng
      localStorage.setItem('brewlite_admin_token', data.accessToken);
      localStorage.setItem('brewlite_admin_email', data.user?.email || adminEmailInput.trim());
      localStorage.setItem('brewlite_admin_role', mappedAdminRole);
      localStorage.setItem('brewlite-admin-role', roleUpper);

      inventoryApiClient.setToken(data.accessToken);
      setCurrentAdminRole(mappedAdminRole);
      setCurrentUserEmail(data.user?.email || adminEmailInput.trim());
      setCurrentUserRole(roleUpper);
      setIsNotLoggedIn(false);
      setIsCustomerBlocked(false);

      const allowedTabs = getAllowedTabsForRole(mappedAdminRole);
      if (allowedTabs.length > 0) {
        setActiveTab(allowedTabs[0]);
      }

      syncDataFromClient();
    } catch (err: any) {
      setAdminLoginError(err.message || 'Lỗi đăng nhập');
    } finally {
      setAdminLoginLoading(false);
    }
  };

  const loadUsers = useCallback(async (
    activeToken: string | null,
    force = false
  ): Promise<any[] | null> => {
    if (backendUsersRef.current && !force) return backendUsersRef.current;
    setUsersLoading(true);
    try {
      if (!activeToken) {
        throw new Error('Đăng nhập lại để tải danh sách tài khoản.');
      }
      const response = await fetch(`${API}/admin/users`, {
        headers: { Authorization: 'Bearer ' + activeToken },
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.message || 'Không tải được danh sách tài khoản.');
      }
      if (!Array.isArray(result)) {
        throw new Error('Dữ liệu danh sách tài khoản từ máy chủ không hợp lệ.');
      }

      setUsers(
        result.map((user: any, index: number): UserAccount => {
          const roleCode = String(user.role || '').toUpperCase();
          return {
            id: user.id,
            index: index + 1,
            username: user.fullName || user.email,
            email: user.email,
            role: USER_ROLE_LABELS[roleCode] || roleCode,
            status: user.status === 'LOCKED' || user.status === 'Đã khóa'
              ? 'Đã khóa'
              : 'Đang hoạt động',
          };
        })
      );
      setUsersError('');
      backendUsersRef.current = result;
      return result;
    } catch (error) {
      setUsersError(error instanceof Error ? error.message : 'Không tải được danh sách tài khoản.');
      return null;
    } finally {
      setUsersLoading(false);
    }
  }, []);
  const reloadUsers = useCallback(() => {
    const activeToken = getActiveAdminToken();
    return loadUsers(activeToken, true);
  }, [loadUsers]);

  const loadProductPage = useCallback(async (targetPage = productPage): Promise<ProductItem[] | null> => {
    const requestId = ++productPageRequestIdRef.current;
    const activeToken = getActiveAdminToken();
    setProductLoading(true);
    setProductError('');
    try {
      if (!activeToken) throw new Error('Phiên đăng nhập đã hết hạn. Đăng nhập lại để tải sản phẩm.');
      const params = new URLSearchParams({
        page: String(targetPage),
        limit: String(productPageSize),
        search: productSearch.trim(),
        category: productCategoryFilter,
        status: productStatusFilter,
      });
      const response = await fetch(`${API}/admin/products?${params}`, {
        headers: { Authorization: 'Bearer ' + activeToken },
      });
      const result = await response.json().catch(() => ({}));
      if (requestId !== productPageRequestIdRef.current) return null;
      if (!response.ok) {
        const message = Array.isArray(result.message) ? result.message.join(', ') : result.message;
        throw new Error(message || 'Không tải được danh sách sản phẩm.');
      }
      if (!Array.isArray(result.items) || typeof result.total !== 'number') {
        throw new Error('Dữ liệu danh sách sản phẩm từ máy chủ không hợp lệ.');
      }
      const pages = Math.max(1, Number(result.totalPages) || 1);
      if (targetPage > pages) {
        setProductPage(pages);
        return loadProductPage(pages);
      }
      const items = result.items.map(toProductItem);
      setProductPageItems(items);
      setProductTotal(result.total);
      setProductTotalPages(pages);
      setProductLowStockCount(Number(result.lowStockCount) || 0);
      setProductError('');
      return items;
    } catch (error) {
      if (requestId === productPageRequestIdRef.current) {
        setProductError(error instanceof Error ? error.message : 'Không tải được danh sách sản phẩm.');
      }
      return null;
    } finally {
      if (requestId === productPageRequestIdRef.current) setProductLoading(false);
    }
  }, [productPage, productPageSize, productSearch, productCategoryFilter, productStatusFilter]);

  const loadProductOverview = useCallback(async () => {
    const activeToken = getActiveAdminToken();
    if (!activeToken) return;
    const response = await fetch(`${API}/admin/products`, {
      headers: { Authorization: 'Bearer ' + activeToken },
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !Array.isArray(result)) {
      throw new Error(result.message || 'Không tải được dữ liệu sản phẩm.');
    }
    const overviewProducts = result.map(toProductItem);
    setProducts(overviewProducts);
    setProductLowStockCount(overviewProducts.filter((product) => product.status === 'Hết hàng' || product.status === 'Chưa có công thức').length);
    productsOverviewLoadedRef.current = true;
    return overviewProducts;
  }, []);
  const reloadProductPage = useCallback(
    (targetPage = productPage) => loadProductPage(targetPage),
    [loadProductPage, productPage]
  );

  useEffect(() => {
    setProductPage(1);
  }, [productSearch, productCategoryFilter, productStatusFilter]);

  useEffect(() => {
    if (activeTab !== 'Sản phẩm') return;
    const timer = window.setTimeout(() => void loadProductPage(), 250);
    return () => window.clearTimeout(timer);
  }, [activeTab, loadProductPage]);

  const loadStoreSettings = useCallback(async (activeToken?: string | null): Promise<StoreSettings | null> => {
    setSettingsLoading(true);
    setSettingsError('');
    try {
      const tok = activeToken || getActiveAdminToken();
      const url = tok ? `${API}/admin/settings` : `${API}/settings`;
      const headers: Record<string, string> = tok ? { Authorization: `Bearer ${tok}` } : {};

      let res = await fetch(url, { headers }).catch(() => null);
      if (!res || !res.ok) {
        res = await fetch(`${API}/settings`).catch(() => null);
      }

      if (!res || !res.ok) {
        throw new Error('Không thể tải cấu hình cửa hàng từ máy chủ.');
      }

      const data = await res.json();
      if (!tok) {
        try {
          const pRes = await fetch(`${API}/settings/loyalty-policy`);
          if (pRes.ok) {
            const pData = await pRes.json();
            Object.assign(data, pData);
          }
        } catch {}
      }
      setStoreSettings((prev) => ({
        ...prev,
        ...data,
        pointRate: data.pointRate !== undefined && data.pointRate !== null ? String(data.pointRate) : prev.pointRate,
        pointRedeem: data.pointRedeem !== undefined && data.pointRedeem !== null ? String(data.pointRedeem) : prev.pointRedeem,
        pointToMoneyRate: data.pointToMoneyRate !== undefined && data.pointToMoneyRate !== null ? String(data.pointToMoneyRate) : prev.pointToMoneyRate || '100',
        hotline: data.hotline || data.phone || prev.hotline,
        address: data.address || prev.address,
        openHours: data.openHours || prev.openHours,
      }));

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('brewlite_store_settings', JSON.stringify(data));
        } catch {}
      }
      return data;
    } catch (err: any) {
      setSettingsError(err?.message || 'Lỗi khi tải cấu hình');
      return null;
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'Cài đặt' || activeTab === 'Khuyến mãi') {
      void loadStoreSettings();
    }
  }, [activeTab, loadStoreSettings]);

  // Sync data 2-way
  const syncDataFromClient = useCallback(async () => {
    try {
      if (storeSettings.pointRate !== undefined && storeSettings.pointRate !== '') {
        const val = Number(storeSettings.pointRate);
        if (isNaN(val) || val <= 0 || !Number.isInteger(val)) {
          triggerToast('❌ Tỷ lệ tích điểm phải là số nguyên dương lớn hơn 0 (không được là số âm hoặc bằng 0).');
          return;
        }
      }
      if (storeSettings.pointToMoneyRate !== undefined && storeSettings.pointToMoneyRate !== '') {
        const val = Number(storeSettings.pointToMoneyRate);
        if (isNaN(val) || val <= 0 || !Number.isInteger(val)) {
          triggerToast('❌ Tỷ lệ đổi điểm sang tiền phải là số nguyên dương lớn hơn 0 (không được là số âm hoặc bằng 0).');
          return;
        }
      }
      if (storeSettings.pointRedeem !== undefined && storeSettings.pointRedeem !== '') {
        const val = Number(storeSettings.pointRedeem);
        if (isNaN(val) || val <= 0 || !Number.isInteger(val)) {
          triggerToast('❌ Mức điểm tối thiểu để đổi phải là số nguyên dương lớn hơn 0 (không được là số âm hoặc bằng 0).');
          return;
        }
      }

      const activeToken = getActiveAdminToken();
      await loadUsers(activeToken);

      // 1. Fetch Orders from backend API (lấy đầy đủ trạng thái đơn hàng)
      let apiOrdersList: OrderItem[] = [];
      let apiFetchedSuccessfully = false;
      if (activeToken) {
        try {
          const res = await fetch(`${API}/admin/orders`, {
            headers: { Authorization: `Bearer ${activeToken}` },
          });
          if (res.ok) {
            apiFetchedSuccessfully = true;
            const data = await res.json();
            if (Array.isArray(data)) {
              apiOrdersList = data.map((o: any) => {
                const custEmail = o.user?.email || '';
                const custName = o.user?.fullName || '';
                const displayCust =
                  custName && custEmail
                    ? `${custName} (${custEmail})`
                    : custEmail || custName || 'Khách hàng';

                return {
                  id: o.id,
                  code: o.code
                    ? (o.code.startsWith('#') ? o.code : `#${o.code}`)
                    : (o.id.startsWith('#') ? o.id : `#BL${o.id.slice(-6).toUpperCase()}`),
                  customer: displayCust,
                  total: o.total || 0,
                  status: o.status || 'PAID',
                  createdAt: new Date(o.createdAt).toLocaleString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                  paymentMethod: o.payment?.method || 'VNPay Sandbox',
                  payment: o.payment,
                  items: Array.isArray(o.items)
                    ? o.items.map((it: any) => ({
                        name: it.productName || it.product?.name || 'Món uống',
                        size: it.size || 'M',
                        quantity: it.qty || 1,
                        unitPrice: it.unitPrice || it.lineTotal || 0,
                      }))
                    : [],
                };
              });
            }
          }
        } catch {}
      }

      // 2. Read local orders (chỉ đọc nếu chưa lấy được từ API)
      let localOrdersList: OrderItem[] = [];
      if (!apiFetchedSuccessfully) {
        try {
          const storedOrdersRaw = localStorage.getItem('brewlite_orders');
          if (storedOrdersRaw) {
            const storedOrders = JSON.parse(storedOrdersRaw);
            if (Array.isArray(storedOrders) && storedOrders.length > 0) {
              localOrdersList = storedOrders
                .map((o: any, idx: number) => {
                  const cEmail = (o.customerEmail || o.customer || o.userEmail || '').trim();
                  const cName = (o.customerName || '').trim();
                  let customerLabel = 'Khách hàng';
                  if (cName && cEmail && cName !== cEmail) {
                    customerLabel = `${cName} (${cEmail})`;
                  } else if (cEmail) {
                    customerLabel = cEmail;
                  } else if (cName) {
                    customerLabel = cName;
                  }

                  return {
                    id: o.id || `ord-${idx}`,
                    code: o.code
                      ? (o.code.startsWith('#') ? o.code : `#${o.code}`)
                      : `#BL${String(o.id).slice(-6).toUpperCase()}`,
                    customer: customerLabel,
                    total: o.total || 0,
                    status: o.status || 'PAID',
                    createdAt: o.date || 'Hôm nay',
                    paymentMethod: o.paymentMethod || 'VNPay Sandbox',
                    items: o.items || [],
                  };
                });
            }
          }
        } catch {}
      }

      const mergedOrdersMap = new Map<string, OrderItem>();
      apiOrdersList.forEach((ord) => {
        mergedOrdersMap.set(ord.id, ord);
        if (ord.code) mergedOrdersMap.set(ord.code, ord);
      });
      localOrdersList.forEach((ord) => {
        if (!mergedOrdersMap.has(ord.id) && (!ord.code || !mergedOrdersMap.has(ord.code))) {
          mergedOrdersMap.set(ord.id, ord);
          if (ord.code) mergedOrdersMap.set(ord.code, ord);
        }
      });
      const allOrders = Array.from(new Set(Array.from(mergedOrdersMap.values())));
      if (apiFetchedSuccessfully || allOrders.length > 0) {
        setOrders(allOrders);
      }

      // 3. Sync Customers from backend API
      let apiCustomers: CustomerItem[] = [];
      if (activeToken) {
        try {
          const res = await fetch(`${API}/admin/users`, {
            headers: { Authorization: `Bearer ${activeToken}` },
          });
          if (res.ok) {
            const usersData = await res.json();
            if (Array.isArray(usersData)) {
              const custUsers = usersData.filter(
                (u: any) => (u.role || '').toUpperCase() === 'CUSTOMER'
              );
              apiCustomers = custUsers.map((u: any) => {
                const isLocked = u.status === 'LOCKED' || u.status === 'Đã khóa';
                const userOrders = Array.isArray(u.orders) ? u.orders : [];
                const paidOrders = userOrders.filter(
                  (o: any) => o.status === 'PAID' || o.status === 'COMPLETED'
                );
                const totalSpend = paidOrders.reduce(
                  (sum: number, o: any) => sum + (o.total || 0),
                  0
                );
                const pts =
                  typeof u.loyaltyPoints === 'number'
                    ? u.loyaltyPoints
                    : Math.round(totalSpend / 1000);
                const tier: CustomerItem['tier'] =
                  totalSpend >= 4000000
                    ? 'Kim cương'
                    : totalSpend >= 2000000
                    ? 'Vàng'
                    : totalSpend >= 1000000
                    ? 'Bạc'
                    : totalSpend >= 500000
                    ? 'Đồng'
                    : 'Mới';
                const lastDate =
                  userOrders.length > 0
                    ? new Date(userOrders[0].createdAt).toLocaleDateString('vi-VN')
                    : new Date(u.createdAt).toLocaleDateString('vi-VN');

                return {
                  id: u.id,
                  name: u.fullName || u.email.split('@')[0],
                  email: u.email,
                  phone: u.phone || '0901 234 567',
                  tier,
                  totalSpend,
                  orderCount: userOrders.length,
                  points: pts,
                  status: isLocked ? 'Đã khóa' : 'Hoạt động',
                  lastOrder: lastDate,
                };
              });
            }
          }
        } catch {}
      }

      const customerStats: Record<
        string,
        { totalSpend: number; orderCount: number; lastDate: string }
      > = {};
      allOrders.forEach((o) => {
        let emailKey = '';
        if (o.customer && o.customer.includes('@')) {
          const match = o.customer.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
          emailKey = match ? match[0].toLowerCase() : o.customer.toLowerCase();
        }
        const STAFF_EMAILS = [
          'admin@brewlite.local',
          'manager@brewlite.local',
          'barista@brewlite.local',
          'inventory@brewlite.local',
          'staff@brewlite.local',
        ];
        if (emailKey && !STAFF_EMAILS.includes(emailKey)) {
          if (!customerStats[emailKey]) {
            customerStats[emailKey] = { totalSpend: 0, orderCount: 0, lastDate: o.createdAt };
          }
          customerStats[emailKey].totalSpend += o.total || 0;
          customerStats[emailKey].orderCount += 1;
          customerStats[emailKey].lastDate = o.createdAt;
        }
      });

      const custMap = new Map<string, CustomerItem>();
      const STAFF_EMAILS = [
        'admin@brewlite.local',
        'manager@brewlite.local',
        'barista@brewlite.local',
        'inventory@brewlite.local',
        'staff@brewlite.local',
      ];
      apiCustomers.forEach((c) => {
        const k = c.email.toLowerCase();
        if (STAFF_EMAILS.includes(k)) return;
        const stat = customerStats[k];
        if (stat) {
          c.totalSpend = Math.max(c.totalSpend, stat.totalSpend);
          c.orderCount = Math.max(c.orderCount, stat.orderCount);
          c.tier =
            c.totalSpend >= 4000000
              ? 'Kim cương'
              : c.totalSpend >= 2000000
              ? 'Vàng'
              : c.totalSpend >= 1000000
              ? 'Bạc'
              : c.totalSpend >= 500000
              ? 'Đồng'
              : 'Mới';
        }
        custMap.set(k, c);
      });
      setCustomers(Array.from(custMap.values()));

      // 4. Sync promotions
      let syncedPromosFromApi = false;
      if (activeToken) {
        try {
          const resPromos = await fetch(`${API}/admin/promotions`, {
            headers: { Authorization: `Bearer ${activeToken}` },
          });
          if (resPromos.ok) {
            const apiPromos = await resPromos.json();
            if (Array.isArray(apiPromos) && apiPromos.length > 0) {
              const now = Date.now();
              const mapped: PromotionItem[] = apiPromos.map((p: any) => {
                const isExpired = p.expiresAt ? new Date(p.expiresAt).getTime() <= now : false;
                const fixedAmt = Number(p.discountAmount || p.fixedAmount || 0);
                const pctOff = Number(p.percentOff || 0);
                const discountLabel =
                  fixedAmt > 0 && pctOff > 0
                    ? `${pctOff}% + ${fixedAmt.toLocaleString('vi-VN')}đ`
                    : fixedAmt > 0
                    ? `${fixedAmt.toLocaleString('vi-VN')}đ`
                    : `${pctOff}%`;
                const timeRangeLabel = p.expiresAt
                  ? `HSD: ${new Date(p.expiresAt).toLocaleDateString('vi-VN')}`
                  : 'Không giới hạn';
                return {
                  id: p.id,
                  code: p.code,
                  name: p.description || `Giảm ${discountLabel}`,
                  discount: discountLabel,
                  percentOff: pctOff,
                  discountAmount: fixedAmt,
                  expiresAt: p.expiresAt || null,
                  timeRange: timeRangeLabel,
                  status: (p.active && !isExpired ? 'Đang hoạt động' : 'Đã kết thúc') as PromotionItem['status'],
                };
              });
              setPromotions(mapped);
              localStorage.setItem('brewlite_promotions', JSON.stringify(mapped));
              syncedPromosFromApi = true;
            }
          }
        } catch {}
      }
      if (!syncedPromosFromApi) {
        const storedPromos = localStorage.getItem('brewlite_promotions');
        if (storedPromos) {
          try {
            const parsed = JSON.parse(storedPromos);
            if (Array.isArray(parsed) && parsed.length > 0) setPromotions(parsed);
          } catch {}
        } else {
          localStorage.setItem('brewlite_promotions', JSON.stringify(DEFAULT_PROMOTIONS));
        }
      }

      // 5. Load full product data for dashboard and reports; the products tab uses paged data.
      if (!productsOverviewLoadedRef.current && activeToken) {
        productsOverviewLoadedRef.current = true;
        loadProductOverview()
          .catch((error) => {
            productsOverviewLoadedRef.current = false;
            console.error('Không thể đồng bộ dữ liệu sản phẩm:', error);
          });
      }
    } catch {}
  }, [loadProductOverview, loadUsers]);

  // Listen to cross-tab / storage updates for role permissions
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'brewlite_role_permissions' && e.newValue) {
        try {
          setRolePermissions(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Auth & profile check (runs once on mount to establish role & initial allowed tabs)
  const authLoadedRef = useRef(false);
  useEffect(() => {
    if (authLoadedRef.current) return;
    const adminToken =
      localStorage.getItem('brewlite_admin_token') ||
      localStorage.getItem('brewlite-admin-token');
    const token =
      adminToken ||
      localStorage.getItem('brewlite-token') ||
      localStorage.getItem('brewlite_token');
    const storedEmail =
      (adminToken
        ? localStorage.getItem('brewlite_admin_email') || localStorage.getItem('brewlite-admin-email')
        : null) ||
      localStorage.getItem('brewlite-email') ||
      localStorage.getItem('brewlite_email') ||
      '';
    if (!token) {
      setIsNotLoggedIn(true);
      setAuthChecking(false);
      return;
    }

    authLoadedRef.current = true;
    inventoryApiClient.setToken(token);
    setCurrentUserEmail(storedEmail);

    fetch(`${API}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        const u = data?.user || data;
        const role = String(u?.role || '').toUpperCase();
        const email = u?.email || storedEmail;

        setCurrentUserEmail(email);
        setCurrentUserRole(role);
        if (role === 'CUSTOMER') {
          setIsNotLoggedIn(true);
          setIsCustomerBlocked(false);
          setAuthChecking(false);
          return;
        }

        const mappedAdminRole = mapUserRoleToAdminRole(role);
        if (!mappedAdminRole) {
          throw new Error('Không xác định được vai trò tài khoản từ máy chủ.');
        }

        setCurrentAdminRole(mappedAdminRole);
        void loadStoreSettings(token);

        const allowed = getAllowedTabsForRole(mappedAdminRole);
        setActiveTab((prevTab) => (allowed.length > 0 && !allowed.includes(prevTab) ? allowed[0] : prevTab));

        setAuthChecking(false);
      })
      .catch(() => {
        setIsNotLoggedIn(true);
        setAuthChecking(false);
      });
  }, [getAllowedTabsForRole]);

  // Periodic client sync - decoupled from activeTab to prevent re-render loops and UI lag
  useEffect(() => {
    syncDataFromClient();
    window.addEventListener('storage', syncDataFromClient);
    const syncTimer = setInterval(syncDataFromClient, 3000);

    return () => {
      window.removeEventListener('storage', syncDataFromClient);
      clearInterval(syncTimer);
    };
  }, [syncDataFromClient]);

  // Order status update
  const handleUpdateOrderStatus = async (orderIdOrCode: string, newStatus: string) => {
    const statusMap: Record<string, { text: string; step: number }> = {
      PENDING: { text: 'Chờ thanh toán', step: 1 },
      PAID: { text: 'Đã thanh toán', step: 2 },
      PREPARING: { text: 'Đang pha chế', step: 2 },
      READY: { text: 'Chờ khách nhận', step: 3 },
      COMPLETED: { text: 'Hoàn tất', step: 4 },
      CANCELLED: { text: 'Đã hủy', step: 1 },
    };

    const target = statusMap[newStatus] || { text: newStatus, step: 2 };
    const targetOrder = orders.find((ord) => ord.id === orderIdOrCode || ord.code === orderIdOrCode);
    const apiId = targetOrder?.id || orderIdOrCode;
    const orderDisplayCode = targetOrder?.code || orderIdOrCode;

    const activeToken = getActiveAdminToken();
    if (!activeToken) {
      triggerToast('Vui lòng đăng nhập lại để cập nhật đơn hàng.');
      return;
    }
    let updatedOrder: any = null;
    if (activeToken) {
      try {
        const res = await fetch(`${API}/admin/orders/${encodeURIComponent(apiId)}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${activeToken}`,
          },
          body: JSON.stringify({ status: newStatus, ...(newStatus === 'CANCELLED' ? { cancelReason: 'Hủy từ trang quản trị' } : {}) }),
        });
        const resData = await res.json().catch(() => ({}));
        if (!res.ok) {
          triggerToast(`❌ Lỗi cập nhật: ${resData.message || 'Không thể đổi trạng thái đơn hàng'}`);
          syncDataFromClient();
          return;
        }
        updatedOrder = resData;
      } catch (err: any) {
        triggerToast('Không thể kết nối máy chủ. Trạng thái đơn chưa thay đổi.');
        return;
      }
    }

    setOrders((prev) =>
      prev.map((ord) =>
        ord.id === orderIdOrCode ||
        ord.code === orderIdOrCode ||
        (targetOrder && (ord.id === targetOrder.id || ord.code === targetOrder.code))
          ? { ...ord, status: updatedOrder?.status || newStatus, payment: updatedOrder && 'payment' in updatedOrder ? updatedOrder.payment : ord.payment }
          : ord
      )
    );

    try {
      const storedOrdersRaw = localStorage.getItem('brewlite_orders');
      if (storedOrdersRaw) {
        const storedOrders = JSON.parse(storedOrdersRaw);
        const mapped = storedOrders.map((o: any) => {
          if (
            o.id === orderIdOrCode ||
            o.code === orderIdOrCode ||
            (targetOrder && (o.id === targetOrder.id || o.code === targetOrder.code))
          ) {
            return {
              ...o,
              status: newStatus,
              statusText: target.text,
              badgeClass:
                newStatus === 'COMPLETED' || newStatus === 'PAID'
                  ? 'done'
                  : newStatus === 'READY' || newStatus === 'PREPARING'
                  ? 'delivering'
                  : newStatus === 'CANCELLED'
                  ? 'cancelled'
                  : 'pending',
            };
          }
          return o;
        });
        localStorage.setItem('brewlite_orders', JSON.stringify(mapped));
      }

      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('brewlite_orders_')) {
          try {
            const userOrdersRaw = localStorage.getItem(k);
            if (userOrdersRaw) {
              const uOrders = JSON.parse(userOrdersRaw);
              if (Array.isArray(uOrders)) {
                let changed = false;
                const updatedUOrders = uOrders.map((o: any) => {
                  if (
                    o.id === orderIdOrCode ||
                    o.code === orderIdOrCode ||
                    (targetOrder && (o.id === targetOrder.id || o.code === targetOrder.code))
                  ) {
                    changed = true;
                    return {
                      ...o,
                      status: newStatus,
                      statusText: target.text,
                      badgeClass:
                        newStatus === 'COMPLETED' || newStatus === 'PAID'
                          ? 'done'
                          : newStatus === 'READY' || newStatus === 'PREPARING'
                          ? 'delivering'
                          : newStatus === 'CANCELLED'
                          ? 'cancelled'
                          : 'pending',
                    };
                  }
                  return o;
                });
                if (changed) {
                  localStorage.setItem(k, JSON.stringify(updatedUOrders));
                }
              }
            }
          } catch {}
        }
      }

      const lastOrderRaw = localStorage.getItem('brewlite_last_order');
      if (lastOrderRaw) {
        const lastOrder = JSON.parse(lastOrderRaw);
        if (
          lastOrder.code === orderIdOrCode ||
          lastOrder.id === orderIdOrCode ||
          (targetOrder &&
            (lastOrder.code === targetOrder.code || lastOrder.id === targetOrder.id))
        ) {
          const updatedLast = {
            ...lastOrder,
            status: newStatus,
            step: target.step,
          };
          localStorage.setItem('brewlite_last_order', JSON.stringify(updatedLast));
        }
      }

      window.dispatchEvent(new Event('storage'));
    } catch {}

    triggerToast(
      `✓ Đã cập nhật đơn ${orderDisplayCode} sang: "${target.text}". Khách hàng thấy tiến trình đổi ngay lập tức!`
    );
  };

  // Role permissions handlers
  const handleRoleChangeInModal = (roleName: string) => {
    setSelectedRoleForPerms(roleName);
    setActivePermissions(rolePermissions[roleName] || ROLE_PERMISSIONS_PRESETS[roleName] || []);
  };

  const togglePermission = (perm: string) => {
    setActivePermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleSavePermissions = () => {
    const updated = {
      ...rolePermissions,
      [selectedRoleForPerms]: activePermissions,
    };
    setRolePermissions(updated);
    try {
      localStorage.setItem('brewlite_role_permissions', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    } catch {}
    setShowRoleModal(false);
    triggerToast(`✓ Đã lưu phân quyền vai trò "${selectedRoleForPerms}" thành công!`);
  };

  // Product handlers
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const productName = newProdName.trim();
    const imageUrl = newProdImageUrl.trim();
    const prodPrice = Number(newProdPrice);
    if (!productName || !newProdCategory.trim()) {
      triggerToast('Vui lòng nhập tên và danh mục sản phẩm.');
      return;
    }
    if (!Number.isInteger(prodPrice) || prodPrice < 0 || prodPrice > 100000000) {
      triggerToast('Giá bán phải là số nguyên từ 0 đến 100.000.000 VNĐ.');
      return;
    }
    if (!isValidProductImageUrl(imageUrl)) {
      triggerToast('URL hình ảnh không hợp lệ. Vui lòng dùng địa chỉ http:// hoặc https://.');
      return;
    }

    const activeToken = getActiveAdminToken();
    if (!activeToken) {
      triggerToast('Phiên đăng nhập đã hết hạn. Đăng nhập lại để thêm sản phẩm.');
      return;
    }
    setIsSavingProduct(true);
    let createdOnServer = false;
    try {
      const res = await fetch(`${API}/admin/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + activeToken,
        },
        body: JSON.stringify({
          name: productName,
          category: newProdCategory,
          price: prodPrice,
          imageUrl,
          description: newProdDescription.trim(),
          toppingIds: newProdToppingIds,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = Array.isArray(data.message) ? data.message.join(', ') : data.message;
        triggerToast(res.status === 409
          ? 'Sản phẩm đã tồn tại. Vui lòng chọn Sửa sản phẩm để cập nhật thông tin.'
          : `⚠️ ${message || 'Lỗi thêm sản phẩm'}`);
        return;
      }
      if (!data.id || !data.name) {
        triggerToast('API chưa xác nhận sản phẩm vừa tạo.');
        return;
      }
      createdOnServer = true;
      if (newProdRecipeLines.length > 0) {
        try {
          await inventoryApiClient.replaceRecipe(data.id, {
            items: newProdRecipeLines,
          });
        } catch (e: any) {
          triggerToast(`⚠️ Đã tạo món nhưng lỗi gán công thức: ${e?.message || ''}`);
        }
      }
      const createdProd = toProductItem(data);
      setProducts((current) => [createdProd, ...current]);
      setProductPageItems((current) => [createdProd, ...current]);
      setShowAddProductModal(false);
      setNewProdName('');
      setNewProdDescription('');
      setNewProdImageUrl('');
      setNewProdRecipeLines([]);
      setNewProdToppingIds([]);
      localStorage.setItem('brewlite_admin_products_updated', String(Date.now()));
      void loadProductPage(1);
      void loadProductOverview();
      triggerToast(
        `✓ Đã thêm sản phẩm "${createdProd.name}" vào thực đơn!`
      );
    } catch (err: any) {
      if (createdOnServer) {
        setShowAddProductModal(false);
        triggerToast('Đã tạo sản phẩm thành công!');
      } else {
        triggerToast(`❌ Lỗi kết nối máy chủ: ${err.message || ''}`);
      }
    } finally {
      setIsSavingProduct(false);
    }
  };

  const openEditProductModal = (p: ProductItem) => {
    setEditingProduct(p);
    setEditProdName(p.name);
    setEditProdCategory(p.category);
    setEditProdPrice(String(p.price));
    setEditProdDescription(p.description || '');
    setEditProdImageUrl(p.imageUrl);
    setEditProdToppingIds([]);

    const activeToken = getActiveAdminToken();
    if (activeToken) {
      fetch(`${API}/admin/products/${p.id}/toppings`, {
        headers: { Authorization: `Bearer ${activeToken}` },
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.selectedToppingIds) {
            setEditProdToppingIds(data.selectedToppingIds);
          }
        })
        .catch(() => {});
    }
  };

  const handleSaveEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    const newPrice = Number(editProdPrice);
    const finalName = editProdName.trim();
    const finalImageUrl = editProdImageUrl.trim() || editingProduct.imageUrl;
    if (!finalName || !editProdCategory.trim()) {
      triggerToast('Vui lòng nhập tên và danh mục sản phẩm.');
      return;
    }
    if (!Number.isInteger(newPrice) || newPrice < 0 || newPrice > 100000000) {
      triggerToast('Giá bán phải là số nguyên từ 0 đến 100.000.000 VNĐ.');
      return;
    }
    if (!isValidProductImageUrl(finalImageUrl)) {
      triggerToast('URL hình ảnh không hợp lệ. Vui lòng dùng địa chỉ http:// hoặc https://.');
      return;
    }

    const activeToken = getActiveAdminToken();
    if (!activeToken) {
      triggerToast('Phiên đăng nhập đã hết hạn. Đăng nhập lại để sửa sản phẩm.');
      return;
    }
    setIsSavingProduct(true);
    let savedOnServer = false;
    try {
      const res = await fetch(`${API}/admin/products/${encodeURIComponent(editingProduct.id)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + activeToken,
        },
        body: JSON.stringify({
          name: finalName,
          category: editProdCategory,
          price: newPrice,
          description: editProdDescription.trim(),
          imageUrl: finalImageUrl,
          toppingIds: editProdToppingIds,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = Array.isArray(data.message) ? data.message.join(', ') : data.message;
        triggerToast(res.status === 404
          ? 'Sản phẩm không còn tồn tại. Hãy tải lại danh sách.'
          : `❌ ${message || 'Lỗi cập nhật sản phẩm'}`);
        return;
      }
      if (!data.id) {
        triggerToast('API chưa xác nhận cập nhật sản phẩm.');
        return;
      }
      savedOnServer = true;
      const updatedItem = toProductItem(data);
      setProducts((current) => current.map((product) =>
        product.id === data.id ? updatedItem : product
      ));
      setProductPageItems((current) => current.map((product) =>
        product.id === data.id ? updatedItem : product
      ));
      setEditingProduct(null);
      localStorage.setItem('brewlite_admin_products_updated', String(Date.now()));
      void loadProductPage();
      void loadProductOverview();
      triggerToast(
        `✓ Đã lưu thay đổi cho "${data.name}" (Giá: ${data.price.toLocaleString(
          'vi-VN'
        )} đ)!`
      );
    } catch (err: any) {
      if (savedOnServer) {
        setEditingProduct(null);
        triggerToast('Đã lưu thay đổi sản phẩm thành công!');
      } else {
        triggerToast(`❌ Lỗi kết nối máy chủ: ${err.message || ''}`);
      }
    } finally {
      setIsSavingProduct(false);
    }
  };

  const toggleProductActive = async (p: ProductItem) => {
    const activeToken = getActiveAdminToken();
    try {
      const res = await fetch(
        `${API}/admin/products/${encodeURIComponent(p.id)}/toggle-active`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
          },
        }
      );
      const data = await res.json();
      if (!res.ok) {
        triggerToast(`❌ ${data.message || 'Lỗi cập nhật trạng thái món'}`);
        return;
      }
      setProducts((prev) => prev.map((it) => (it.id === p.id ? { ...it, active: data.active } : it)));
      setProductPageItems((prev) => prev.map((it) => (it.id === p.id ? { ...it, active: data.active } : it)));
      localStorage.setItem('brewlite_admin_products_updated', String(Date.now()));
      void loadProductPage();
      void loadProductOverview();
      triggerToast(
        data.active
          ? `👁️ Đã hiển thị lại món "${p.name}" trên thực đơn khách!`
          : `🔒 Đã ẩn món "${p.name}" khỏi thực đơn khách!`
      );
    } catch (err: any) {
      triggerToast(`❌ Lỗi kết nối: ${err.message || ''}`);
    }
  };

  const deleteProduct = async (id: string, name?: string) => {
    const targetProd = products.find((p) => p.id === id);
    const prodName = name || targetProd?.name || '';
    if (confirm(`Bạn có chắc muốn xóa hoặc ngừng kinh doanh sản phẩm "${prodName || id}"?`)) {
      const activeToken = getActiveAdminToken();
      try {
        const res = await fetch(
          `${API}/admin/products/${encodeURIComponent(id)}?name=${encodeURIComponent(prodName)}`,
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
            },
          }
        );
        const resData = await res.json();
        if (!res.ok) {
          triggerToast(`❌ ${resData.message || 'Lỗi khi xóa sản phẩm'}`);
          return;
        }

        if (resData.archived) {
          setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, active: false } : p)));
          setProductPageItems((prev) => prev.map((p) => (p.id === id ? { ...p, active: false } : p)));
          triggerToast(`ℹ️ ${resData.message}`);
        } else {
          setProducts((prev) => prev.filter((p) => p.id !== id));
          setProductPageItems((prev) => prev.filter((p) => p.id !== id));
          triggerToast(`✓ ${resData.message}`);
        }
        localStorage.setItem('brewlite_admin_products_updated', String(Date.now()));
        void loadProductPage();
        void loadProductOverview();
      } catch (err: any) {
        triggerToast(`❌ Lỗi kết nối máy chủ: ${err.message || ''}`);
      }
    }
  };

  // Promo handlers
  const handleAddPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromoName.trim()) return;
    const finalCode = (
      newPromoCode.trim() ||
      newPromoName.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) ||
      'PROMO' + Math.floor(Math.random() * 1000)
    ).toUpperCase();

    const rawDiscountStr = newPromoDiscount.trim();
    const numericVal = parseInt(rawDiscountStr.replace(/[^0-9]/g, ''), 10) || 10;
    const isFixedDiscount =
      !rawDiscountStr.includes('%') &&
      (rawDiscountStr.toLowerCase().includes('đ') ||
        rawDiscountStr.toLowerCase().includes('vnd') ||
        rawDiscountStr.toLowerCase().includes('k') ||
        numericVal > 100);
    const percentOff = isFixedDiscount ? 0 : Math.min(100, Math.max(1, numericVal));
    const discountAmount = isFixedDiscount
      ? rawDiscountStr.toLowerCase().endsWith('k') && numericVal < 1000
        ? numericVal * 1000
        : numericVal
      : 0;

    const expiresAtIso: string | null = null;

    let createdId = 'pr-' + Date.now();
    // Đồng bộ vào cơ sở dữ liệu Backend API
    try {
      const authToken = getActiveAdminToken();
      if (authToken) {
        const res = await fetch(`${API}/admin/promotions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            code: finalCode,
            description: newPromoName.trim(),
            percentOff,
            discountAmount,
            expiresAt: expiresAtIso,
            active: true,
          }),
        });
        if (res.ok) {
          const saved = await res.json();
          if (saved?.id) createdId = saved.id;
        }
      }
    } catch {}

    const discountLabel =
      discountAmount > 0 && percentOff === 0
        ? `${discountAmount.toLocaleString('vi-VN')}đ`
        : `${percentOff}%`;

    const newPr: PromotionItem = {
      id: createdId,
      code: finalCode,
      name: newPromoName.trim(),
      discount: discountLabel,
      percentOff,
      discountAmount,
      expiresAt: expiresAtIso,
      timeRange: newPromoTime,
      status: 'Đang hoạt động',
    };
    const updated = [newPr, ...promotions];
    setPromotions(updated);
    localStorage.setItem('brewlite_promotions', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
    setShowAddPromoModal(false);
    setNewPromoName('');
    setNewPromoCode('');
    triggerToast(`Đã tạo mã khuyến mãi ${finalCode} thành công`);
  };

  const togglePromotionStatus = async (id: string) => {
    const target = promotions.find((pr) => pr.id === id);
    const nextStatus = target?.status === 'Đang hoạt động' ? 'Đã kết thúc' : 'Đang hoạt động';

    // Đồng bộ vào cơ sở dữ liệu Backend API
    try {
      const authToken = getActiveAdminToken();
      if (authToken && target) {
        await fetch(`${API}/admin/promotions/${target.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            active: nextStatus === 'Đang hoạt động',
          }),
        });
      }
    } catch {}

    const updated = promotions.map((pr) => {
      if (pr.id === id) {
        return { ...pr, status: nextStatus as any };
      }
      return pr;
    });
    setPromotions(updated);
    localStorage.setItem('brewlite_promotions', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
    triggerToast('Đã cập nhật trạng thái khuyến mãi');
  };

  const deletePromotion = async (id: string) => {
    if (confirm('Bạn có chắc muốn xóa khuyến mãi này?')) {
      const target = promotions.find((p) => p.id === id);

      // Đồng bộ xóa vào cơ sở dữ liệu Backend API
      try {
        const authToken = getActiveAdminToken();
        if (authToken && target) {
          await fetch(`${API}/admin/promotions/${target.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${authToken}` },
          });
        }
      } catch {}

      const updated = promotions.filter((p) => p.id !== id);
      setPromotions(updated);
      localStorage.setItem('brewlite_promotions', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
      triggerToast('Đã xóa chương trình khuyến mãi');
    }
  };

  // User handlers
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddUserError('');
    const email = newUserEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setAddUserError('Vui lòng nhập email hợp lệ.');
      return;
    }
    if (newUserPassword.length < 6) {
      setAddUserError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (newUserPassword !== confirmNewUserPassword) {
      setAddUserError('Mật khẩu xác nhận không khớp.');
      return;
    }

    const activeToken = getActiveAdminToken();
    if (!activeToken) {
      setAddUserError('Phiên đăng nhập đã hết hạn. Đăng nhập lại để tiếp tục.');
      return;
    }

    setIsCreatingUser(true);
    try {
      const response = await fetch(`${API}/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + activeToken,
        },
        body: JSON.stringify({
          email,
          password: newUserPassword,
          role: USER_ROLE_VALUES[newUserRole],
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = Array.isArray(result.message)
          ? result.message.join(', ')
          : result.message;
        if (
          response.status === 409 ||
          (typeof message === 'string' && /email.*(đã tồn tại|đã được sử dụng)/i.test(message))
        ) {
          throw new Error('Email đã tồn tại trong hệ thống. Vui lòng nhập email khác.');
        }
        throw new Error(message || 'Không thể tạo tài khoản.');
      }
      if (!result.id || result.email?.toLowerCase() !== email) {
        throw new Error('Máy chủ không xác nhận được tài khoản vừa tạo.');
      }

      const refreshedUsers = await loadUsers(activeToken, true);
      if (!refreshedUsers?.some((user: any) => user.id === result.id)) {
        throw new Error('Tài khoản đã được tạo nhưng danh sách chưa đồng bộ được. Vui lòng tải lại danh sách.');
      }

      setShowAddUserModal(false);
      setAddUserError('');
      setNewUserEmail('');
      setNewUserPassword('');
      setConfirmNewUserPassword('');
      triggerToast('Tạo tài khoản thành công.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tạo tài khoản.';
      setAddUserError(message);
      triggerToast(message);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const deleteUser = async (id: string) => {
    const userToDel = users.find((u) => u.id === id);
    if (!userToDel) return;
    if (confirm(`Bạn có chắc muốn xóa tài khoản "${userToDel.email}" khỏi hệ thống?`)) {
      const activeToken = getActiveAdminToken();
      if (activeToken) {
        try {
          await fetch(`${API}/admin/users/${encodeURIComponent(userToDel.id || userToDel.email)}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${activeToken}` },
          });
        } catch {}
      }
      const refreshedUsers = await loadUsers(activeToken, true);
      if (!refreshedUsers) {
        triggerToast('Không thể xác minh việc xóa tài khoản. Hãy tải lại danh sách.');
      } else if (refreshedUsers.some((user: any) => user.id === id)) {
        triggerToast('Máy chủ chưa xóa tài khoản. Hãy kiểm tra quyền hoặc thử lại.');
      } else {
        triggerToast(`Đã xóa tài khoản ${userToDel.email}.`);
      }
    }
  };

  // Customer handlers
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustEmailError('');
    if (!newCustName.trim()) return;
    const finalEmail = newCustEmail.trim().toLowerCase();

    if (!finalEmail) {
      setCustEmailError('Vui lòng nhập địa chỉ email của khách hàng!');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(finalEmail)) {
      setCustEmailError('Email không đúng định dạng. Vui lòng nhập email hợp lệ!');
      return;
    }

    const emailExists = customers.some((c) => c.email.toLowerCase() === finalEmail);
    if (emailExists) {
      setCustEmailError(
        `Email "${finalEmail}" đã tồn tại! Mỗi email chỉ thuộc về duy nhất một khách hàng.`
      );
      triggerToast(`⚠️ Email "${finalEmail}" đã được sử dụng. Mỗi email chỉ dành cho 1 khách hàng!`);
      return;
    }

    const cleanedPhone = newCustPhone.replace(/[\s.-]/g, '');
    if (!cleanedPhone) {
      setCustPhoneError('Vui lòng nhập số điện thoại của khách hàng!');
      triggerToast('⚠️ Vui lòng nhập số điện thoại khách hàng!');
      return;
    }
    if (!/^0\d{9}$/.test(cleanedPhone)) {
      setCustPhoneError('Số điện thoại phải đủ 10 chữ số và bắt đầu bằng số 0 (ví dụ: 0901234567).');
      triggerToast('⚠️ Số điện thoại không hợp lệ! Phải đủ 10 chữ số và bắt đầu bằng số 0.');
      return;
    }

    const finalPhone = cleanedPhone;
    const initialPoints =
      newCustTier === 'Kim cương'
        ? 4000
        : newCustTier === 'Vàng'
        ? 2000
        : newCustTier === 'Bạc'
        ? 1000
        : newCustTier === 'Đồng'
        ? 500
        : 50;
    const defaultPassword = 'password123';

    const newC: CustomerItem = {
      id: 'c-' + Date.now(),
      name: newCustName.trim(),
      email: finalEmail,
      phone: finalPhone,
      tier: newCustTier,
      totalSpend: 0,
      orderCount: 0,
      points: initialPoints,
      status: 'Hoạt động',
      lastOrder: 'Vừa thêm mới',
    };

    const activeToken = getActiveAdminToken();
    try {
      const res = await fetch(`${API}/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
        },
        body: JSON.stringify({
          email: finalEmail,
          password: defaultPassword,
          fullName: newCustName.trim(),
          phone: finalPhone,
          role: 'CUSTOMER',
          loyaltyPoints: initialPoints,
          status: 'ACTIVE',
        }),
      });
      const resData = await res.json();
      if (!res.ok) {
        setCustEmailError(resData.message || `Email "${finalEmail}" đã tồn tại trên hệ thống!`);
        triggerToast(`⚠️ ${resData.message || 'Email này đã tồn tại trong hệ thống!'}`);
        return;
      }
      if (resData.id) newC.id = resData.id;
    } catch (err) {
      console.warn('Lỗi kết nối tạo khách hàng trên backend:', err);
    }

    setCustomers([newC, ...customers.filter((c) => c.email.toLowerCase() !== finalEmail)]);
    setShowAddCustomerModal(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustEmail('');
    setCustEmailError('');
    setCustPhoneError('');
    triggerToast(`✓ Đã thêm khách hàng ${finalEmail} vào hệ thống!`);
  };

  const changeCustomerStatus = async (
    idOrEmail: string,
    newStatus: 'Hoạt động' | 'Đã khóa'
  ) => {
    const cust = customers.find(
      (c) => c.id === idOrEmail || c.email.toLowerCase() === idOrEmail.toLowerCase()
    );
    if (!cust) return;
    const isLocking = newStatus === 'Đã khóa';
    const nextStatusApi = isLocking ? 'LOCKED' : 'ACTIVE';
    const emailLower = cust.email.toLowerCase().trim();

    const activeToken = getActiveAdminToken();
    try {
      const res = await fetch(`${API}/admin/users/${encodeURIComponent(emailLower)}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
        },
        body: JSON.stringify({ status: nextStatusApi }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        triggerToast(`❌ Lỗi cập nhật trạng thái: ${err.message || 'Thao tác không được phép'}`);
        return;
      }
    } catch (err: any) {
      triggerToast(`❌ Lỗi kết nối máy chủ: ${err.message || ''}`);
      return;
    }

    setCustomers((prev) =>
      prev.map((c) =>
        c.id === cust.id || c.email.toLowerCase() === emailLower
          ? { ...c, status: newStatus }
          : c
      )
    );

    triggerToast(
      isLocking
        ? `🔒 Đã KHÓA tài khoản "${cust.email}" trong cơ sở dữ liệu!`
        : `🔓 Đã MỞ KHÓA tài khoản "${cust.email}" trong cơ sở dữ liệu!`
    );
  };

  const deleteCustomer = async (idOrEmail: string) => {
    const cust = customers.find(
      (c) => c.id === idOrEmail || c.email.toLowerCase() === idOrEmail.toLowerCase()
    );
    if (!cust) return;
    const emailLower = cust.email.toLowerCase().trim();

    if (
      confirm(
        `Bạn có chắc chắn muốn xóa vĩnh viễn khách hàng "${cust.name} (${cust.email})" khỏi hệ thống?`
      )
    ) {
      const activeToken = getActiveAdminToken();
      try {
        const res = await fetch(`${API}/admin/users/${encodeURIComponent(emailLower)}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
          },
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          triggerToast(`❌ Lỗi xóa tài khoản: ${err.message || 'Thao tác không được phép'}`);
          return;
        }
      } catch (err: any) {
        triggerToast(`❌ Lỗi kết nối máy chủ: ${err.message || ''}`);
        return;
      }

      setCustomers((prev) =>
        prev.filter((c) => c.id !== cust.id && c.email.toLowerCase() !== emailLower)
      );

      triggerToast(`✓ Đã xóa vĩnh viễn khách hàng "${cust.email}" khỏi hệ thống!`);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSettingsSaving(true);
    setSettingsError('');
    try {
      if (storeSettings.pointRate !== undefined && storeSettings.pointRate !== '') {
        const val = Number(storeSettings.pointRate);
        if (isNaN(val) || val <= 0 || !Number.isInteger(val)) {
          triggerToast('❌ Tỷ lệ tích điểm phải là số nguyên dương lớn hơn 0 (không được là số âm hoặc bằng 0).');
          return;
        }
      }
      if (storeSettings.pointToMoneyRate !== undefined && storeSettings.pointToMoneyRate !== '') {
        const val = Number(storeSettings.pointToMoneyRate);
        if (isNaN(val) || val <= 0 || !Number.isInteger(val)) {
          triggerToast('❌ Tỷ lệ đổi điểm sang tiền phải là số nguyên dương lớn hơn 0 (không được là số âm hoặc bằng 0).');
          return;
        }
      }
      if (storeSettings.pointRedeem !== undefined && storeSettings.pointRedeem !== '') {
        const val = Number(storeSettings.pointRedeem);
        if (isNaN(val) || val <= 0 || !Number.isInteger(val)) {
          triggerToast('❌ Mức điểm tối thiểu để đổi phải là số nguyên dương lớn hơn 0 (không được là số âm hoặc bằng 0).');
          return;
        }
      }

      const activeToken = getActiveAdminToken();
      if (!activeToken) {
        triggerToast('⚠️ Vui lòng đăng nhập với tài khoản Admin để lưu cấu hình!');
        throw new Error('Vui lòng đăng nhập với tài khoản Admin để lưu cấu hình.');
      }

      const res = await fetch(`${API}/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify(storeSettings),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMsg =
          data?.message ||
          (res.status === 403 || res.status === 401
            ? 'Bạn không có quyền thay đổi cấu hình hệ thống (Chỉ Admin mới có quyền)'
            : 'Lưu cấu hình thất bại từ máy chủ.');
        setSettingsError(errorMsg);
        triggerToast(`❌ ${errorMsg}`);
        return;
      }

      setStoreSettings((prev) => ({
        ...prev,
        ...data,
      }));

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('brewlite_store_settings', JSON.stringify(data));
          window.dispatchEvent(new Event('storage'));
          window.dispatchEvent(new CustomEvent('brewlite:settings-updated', { detail: data }));
        } catch {}
      }

      triggerToast(
        '🎉 Đã lưu toàn bộ cấu hình Cửa hàng, Cổng thanh toán VNPay và Chính sách tích điểm thành công!'
      );
    } catch (err: any) {
      const errorMsg = err?.message || 'Lỗi kết nối khi lưu cấu hình';
      setSettingsError(errorMsg);
      triggerToast(`❌ ${errorMsg}`);
    } finally {
      setSettingsSaving(false);
    }
  };

  // Filtered queries
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = productCategoryFilter === 'Tất cả' || p.category === productCategoryFilter;
      const matchStatus = productStatusFilter === 'Tất cả' || p.status === productStatusFilter;
      const matchName = p.name.toLowerCase().includes(productSearch.toLowerCase());
      return matchCat && matchStatus && matchName;
    });
  }, [products, productCategoryFilter, productStatusFilter, productSearch]);

  const filteredPromos = useMemo(() => {
    return promotions.filter((pr) => {
      const matchStatus = promoStatusFilter === 'Tất cả' || pr.status === promoStatusFilter;
      const matchName = pr.name.toLowerCase().includes(promoSearch.toLowerCase());
      return matchStatus && matchName;
    });
  }, [promotions, promoStatusFilter, promoSearch]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchRole = userRoleFilter === 'Tất cả' || u.role === userRoleFilter;
      const matchStatus = userStatusFilter === 'Tất cả' || u.status === userStatusFilter;
      const matchSearch =
        u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase());
      return matchRole && matchStatus && matchSearch;
    });
  }, [users, userRoleFilter, userStatusFilter, userSearch]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchTier = customerTierFilter === 'Tất cả' || c.tier === customerTierFilter;
      const matchSearch =
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.phone.includes(customerSearch) ||
        c.email.toLowerCase().includes(customerSearch.toLowerCase());
      return matchTier && matchSearch;
    });
  }, [customers, customerTierFilter, customerSearch]);

  return {
    // Nav & RBAC
    activeTab,
    setActiveTab,
    globalSearch,
    setGlobalSearch,
    currentAdminRole,
    getAllowedTabsForRole,

    // Auth gate
    authChecking,
    currentUserEmail,
    currentUserRole,
    isCustomerBlocked,
    isNotLoggedIn,
    adminEmailInput,
    setAdminEmailInput,
    adminPasswordInput,
    setAdminPasswordInput,
    adminLoginError,
    adminLoginLoading,
    handleAdminLogin,
    handleAdminLogout,

    // Data lists
    products,
    setProducts,
    productPageItems,
    productPage,
    productPageSize,
    setProductPage,
    productTotal,
    productTotalPages,
    productLowStockCount,
    productLoading,
    productError,
    reloadProductPage,
    loadProductOverview,
    orders,
    setOrders,
    promotions,
    setPromotions,
    users,
    setUsers,
    usersLoading,
    usersError,
    reloadUsers,
    customers,
    setCustomers,
    storeSettings,
    setStoreSettings,
    settingsLoading,
    settingsSaving,
    settingsError,
    loadStoreSettings,
    rolePermissions,

    // Filter states
    orderStatusFilter,
    setOrderStatusFilter,
    productCategoryFilter,
    setProductCategoryFilter,
    productStatusFilter,
    setProductStatusFilter,
    productSearch,
    setProductSearch,
    promoStatusFilter,
    setPromoStatusFilter,
    promoSearch,
    setPromoSearch,
    userRoleFilter,
    setUserRoleFilter,
    userStatusFilter,
    setUserStatusFilter,
    userSearch,
    setUserSearch,
    customerTierFilter,
    setCustomerTierFilter,
    customerSearch,
    setCustomerSearch,
    reportTimeFilter,
    setReportTimeFilter,

    // Filtered lists
    filteredProducts,
    filteredPromos,
    filteredUsers,
    filteredCustomers,

    // Handlers
    handleUpdateOrderStatus,
    handleAddProduct,
    openEditProductModal,
    handleSaveEditProduct,
    toggleProductActive,
    deleteProduct,
    handleAddPromo,
    togglePromotionStatus,
    deletePromotion,
    handleAddUser,
    deleteUser,
    handleRoleChangeInModal,
    togglePermission,
    handleSavePermissions,
    handleAddCustomer,
    changeCustomerStatus,
    deleteCustomer,
    handleSaveSettings,

    // Toast
    adminToast,
    triggerToast,

    // Modal states
    showRoleModal,
    setShowRoleModal,
    selectedRoleForPerms,
    activePermissions,

    showAddProductModal,
    setShowAddProductModal,
    newProdName,
    setNewProdName,
    newProdCategory,
    setNewProdCategory,
    newProdPrice,
    setNewProdPrice,
    newProdStock,
    setNewProdStock,
    newProdDescription,
    setNewProdDescription,
    newProdImageUrl,
    setNewProdImageUrl,
    newProdRecipeLines,
    setNewProdRecipeLines,
    newProdToppingIds,
    setNewProdToppingIds,
    isSavingProduct,

    editingProduct,
    setEditingProduct,
    editProdName,
    setEditProdName,
    editProdCategory,
    setEditProdCategory,
    editProdPrice,
    setEditProdPrice,
    editProdStock,
    setEditProdStock,
    editProdDescription,
    setEditProdDescription,
    editProdImageUrl,
    setEditProdImageUrl,
    editProdToppingIds,
    setEditProdToppingIds,

    showAddPromoModal,
    setShowAddPromoModal,
    newPromoCode,
    setNewPromoCode,
    newPromoName,
    setNewPromoName,
    newPromoDiscount,
    setNewPromoDiscount,
    newPromoTime,
    setNewPromoTime,

    showAddUserModal,
    setShowAddUserModal,
    newUserEmail,
    setNewUserEmail,
    addUserError,
    setAddUserError,
    newUserRole,
    setNewUserRole,
    newUserPassword,
    setNewUserPassword,
    confirmNewUserPassword,
    setConfirmNewUserPassword,
    isCreatingUser,

    showAddCustomerModal,
    setShowAddCustomerModal,
    newCustName,
    setNewCustName,
    newCustPhone,
    setNewCustPhone,
    custPhoneError,
    setCustPhoneError,
    newCustEmail,
    setNewCustEmail,
    custEmailError,
    setCustEmailError,
    newCustTier,
    setNewCustTier,

  };
}
