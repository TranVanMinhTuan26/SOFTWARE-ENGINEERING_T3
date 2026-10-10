'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CATEGORIES, money, normalizeText } from '../features/task-03-thuc-don/du-lieu-danh-muc';
import type { Product } from '../features/dung-chung/kieu-du-lieu-chung';
import { API } from '../features/dung-chung/cau-hinh-api';
import { displayOrderCode } from '../features/dung-chung/ma-don-hang';

// Hooks
import { useAuth } from '../features/task-07-xac-thuc/useXacThuc';
import { useProducts } from '../features/task-03-thuc-don/useSanPham';
import { useCart } from '../features/task-05-gio-hang/useGioHang';
import { useOrders } from '../features/task-09-lich-su-don-hang/useDonHang';

// UI Components
import { SiteHeader } from '../features/bo-cuc/DauTrang';
import { HeroSection } from '../features/task-03-thuc-don/PhanMoDau';
import { MenuSection } from '../features/task-03-thuc-don/PhanThucDon';
import { CartModal } from '../features/task-05-gio-hang/HopThoaiGioHang';
import { AuthModal } from '../features/task-07-xac-thuc/HopThoaiXacThuc';
import { ProductDetailModal, type ProductSize } from '../features/task-04-chi-tiet-san-pham/HopThoaiChiTietSanPham';
import { ProfileModal } from '../features/bo-cuc/HopThoaiHoSo';
import { PaymentSuccessModal, type PaymentSuccessOrder } from '../features/task-08-thanh-toan/HopThoaiThanhToanThanhCong';
import { MobileNavBar } from '../features/bo-cuc/ThanhDieuHuongDiDong';
import { ToastNotification } from '../features/bo-cuc/ThongBaoNhanh';
import { SiteFooter } from '../features/bo-cuc/ChanTrang';

export default function Home() {
  // Modal states: 'login' | 'cart' | 'product-detail' | 'profile' | ''
  const [modal, setModal] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string>('');

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage('');
    }, 1000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Product detail modal state (Task 4)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailSize, setDetailSize] = useState<ProductSize>('M');
  const [detailToppings, setDetailToppings] = useState<string[]>([]);
  const [detailQty, setDetailQty] = useState<number>(1);

  // Payment success state
  const [paymentSuccessOrder, setPaymentSuccessOrder] = useState<PaymentSuccessOrder | null>(null);

  // 1. Order Tracking hook
  const orders = useOrders();

  // 2. Auth hook
  const auth = useAuth({
    setModal,
    setHistoryOrders: orders.setHistoryOrders,
    loadUserOrders: orders.loadUserOrders,
  });

  // 3. Products hook
  const products = useProducts({
    loadUserOrders: orders.loadUserOrders,
  });

  // 4. Cart hook
  const cart = useCart({
    token: auth.token,
    products: products.products,
    userPoints: auth.userPoints,
    setModal,
    setAuthError: auth.setAuthError,
    setToastMessage,
  });

  // Initial session restoration & VNPay callback handling
  useEffect(() => {
    const { storedToken } = auth.restoreSession();
    if (storedToken) {
      auth.loadUserProfile(storedToken);
      orders.loadUserOrders(storedToken);
      cart.loadCartFromDatabase(storedToken);
    }

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const responseCode = params.get('vnp_ResponseCode') || params.get('code');
      const orderIdParam = params.get('orderId') || params.get('vnp_TxnRef');
      const amountParam = params.get('amount') || params.get('vnp_Amount');

      if (responseCode === '00' || params.get('payment') === 'success') {
        const orderCode = orderIdParam ? displayOrderCode(orderIdParam) : '#BL-ORDER';

        let paidAmount = 0;
        if (params.has('vnp_Amount')) {
          paidAmount = Number(params.get('vnp_Amount')) / 100;
        } else if (amountParam) {
          paidAmount = Number(amountParam);
        }

        const activeTok = storedToken || localStorage.getItem('brewlite-token') || localStorage.getItem('brewlite_token');
        if (activeTok) {
          auth.loadUserProfile(activeTok);
          orders.loadUserOrders(activeTok);
          cart.loadCartFromDatabase(activeTok);
        }

        fetch(`${API}/products`)
          .then((res) => (res.ok ? res.json() : Promise.reject()))
          .then((apiData: Product[]) => {
            if (Array.isArray(apiData) && apiData.length > 0) {
              products.setProducts(apiData);
            }
          })
          .catch(() => {});

        cart.clearCart();
        setPaymentSuccessOrder({
          code: orderCode,
          amount: paidAmount,
          earnedPoints: 0,
          pointsUsed: 0,
        });

        window.history.replaceState({}, '', '/');
      } else if (responseCode && responseCode !== '00') {
        alert(`Giao dịch thanh toán VNPay không thành công hoặc đã bị hủy (Mã phản hồi: ${responseCode}).`);
        window.history.replaceState({}, '', '/');
      } else if (params.get('login') === '1') {
        setModal('login');
      }
    }
  }, []);

  const openDetail = (p: Product) => {
    setSelectedProduct(p);
    setDetailSize('M');
    setDetailToppings([]);
    setDetailQty(1);
    setModal('product-detail');
  };

  const handleOpenSearch = () => {
    const el = document.getElementById('search-input');
    el?.focus();
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleOpenLogin = () => {
    auth.setAuthMode('login');
    auth.setAuthError('');
    setModal('login');
  };

  return (
    <>
      {/* 1. Header / Navbar */}
      <SiteHeader
        token={auth.token}
        email={auth.email}
        fullName={auth.fullName}
        userPoints={auth.userPoints}
        userRole={auth.userRole}
        cartCount={cart.cartCount}
        accountMenuOpen={auth.accountMenuOpen}
        setAccountMenuOpen={auth.setAccountMenuOpen}
        accountMenuRef={auth.accountMenuRef}
        onOpenSearch={handleOpenSearch}
        onOpenCart={() => setModal('cart')}
        onOpenLogin={handleOpenLogin}
        openAccountProfile={() => auth.openAccountProfile(setModal)}
        handleLogout={auth.handleLogout}
      />

      {/* Main Container */}
      <main className="site-container">
        {/* 2 & 3. Hero Section & Category Circles */}
        <HeroSection
          category={products.category}
          setCategory={products.setCategory}
        />

        {/* 4. Menu Section */}
        <MenuSection
          categories={CATEGORIES}
          category={products.category}
          setCategory={products.setCategory}
          filteredProducts={products.filteredProducts}
          loading={products.loading}
          error={products.error}
          onReload={products.reload}
          search={products.search}
          setSearch={products.setSearch}
          cart={cart.cart}
          token={auth.token}
          setModal={setModal}
          setAuthError={auth.setAuthError}
          setToastMessage={setToastMessage}
          openDetail={openDetail}
          onAddToCart={cart.addToCart}
          money={money}
          normalizeText={normalizeText}
        />
      </main>

      {/* Footer */}
      <SiteFooter />

      {/* MODAL: GIỎ HÀNG */}
      <CartModal
        isOpen={modal === 'cart'}
        onClose={() => setModal('')}
        cartState={cart}
        products={products.products}
        token={auth.token}
        userPoints={auth.userPoints}
        onOpenLogin={handleOpenLogin}
      />

      {/* MODAL: THÔNG TIN TÀI KHOẢN */}
      <ProfileModal
        isOpen={modal === 'profile'}
        onClose={() => setModal('')}
        accountProfile={auth.accountProfile}
        accountProfileLoading={auth.accountProfileLoading}
        accountProfileError={auth.accountProfileError}
        onSaveProfile={auth.saveAccountProfile}
      />

      {/* MODAL: ĐĂNG NHẬP / ĐĂNG KÝ / QUÊN MK */}
      <AuthModal
        modal={modal}
        setModal={setModal}
        authMode={auth.authMode}
        setAuthMode={auth.setAuthMode}
        authError={auth.authError}
        setAuthError={auth.setAuthError}
        authSuccessMsg={auth.authSuccessMsg}
        setAuthSuccessMsg={auth.setAuthSuccessMsg}
        handleAuth={auth.handleAuth}
        fullName={auth.fullName}
        setFullName={auth.setFullName}
        phone={auth.phone}
        setPhone={auth.setPhone}
        email={auth.email}
        setEmail={auth.setEmail}
        resetTokenInput={auth.resetTokenInput}
        setResetTokenInput={auth.setResetTokenInput}
        showPassword={auth.showPassword}
        setShowPassword={auth.setShowPassword}
        password={auth.password}
        setPassword={auth.setPassword}
        isSubmitting={auth.isSubmitting}
      />

      {/* MODAL: CHI TIẾT SẢN PHẨM & TÙY CHỌN */}
      <ProductDetailModal
        modal={modal}
        setModal={setModal}
        selectedProduct={selectedProduct}
        detailSize={detailSize}
        setDetailSize={setDetailSize}
        detailToppings={detailToppings}
        setDetailToppings={setDetailToppings}
        detailQty={detailQty}
        setDetailQty={setDetailQty}
        products={products.products}
        cart={cart.cart}
        token={auth.token}
        setAuthError={auth.setAuthError}
        setToastMessage={setToastMessage}
        onAddToCart={cart.addToCart}
        money={money}
        normalizeText={normalizeText}
      />

      {/* Toast thông báo nhẹ khi thêm món */}
      <ToastNotification message={toastMessage} />

      {/* MODAL: THÔNG BÁO THANH TOÁN THÀNH CÔNG */}
      {paymentSuccessOrder && (
        <PaymentSuccessModal
          order={paymentSuccessOrder}
          onClose={() => setPaymentSuccessOrder(null)}
        />
      )}

      {/* Mobile Bottom Navigation Bar */}
      <MobileNavBar
        token={auth.token}
        cartCount={cart.cartCount}
        onOpenCart={() => setModal('cart')}
        onOpenLogin={handleOpenLogin}
        handleLogout={auth.handleLogout}
      />
    </>
  );
}
