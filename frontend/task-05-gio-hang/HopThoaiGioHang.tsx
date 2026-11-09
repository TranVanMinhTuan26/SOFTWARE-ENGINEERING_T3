import React from 'react';
import type { UseCartReturn } from './useGioHang';
import type { Product } from '../dung-chung/kieu-du-lieu-chung';
import { money } from '../task-03-thuc-don/du-lieu-danh-muc';
import { CartItemRow } from './DongSanPhamGioHang';
import { VoucherSection } from './KhuVucMaGiamGia';
import { PointsRedemption } from './DoiDiemTichLuy';
import { PaymentMethodPicker } from './BoChonPhuongThucThanhToan';
import { displayOrderCode } from '../dung-chung/ma-don-hang';

type CartModalProps = {
  isOpen: boolean;
  onClose: () => void;
  cartState: UseCartReturn;
  products: Product[];
  token: string;
  userPoints: number;
  onOpenLogin: () => void;
};

export function CartModal(props: CartModalProps) {
  const { isOpen, onClose, cartState, products, token, userPoints, onOpenLogin } = props;

  if (!isOpen) return null;

  const {
    cart,
    cartCount,
    subtotal,
    discountAmount,
    pointsDiscount,
    grandTotal,
    expectedEarnedPoints,
    pointRateNumber,
    minPointRedeem,
    maxRedeemablePoints,
    actualPointsUsed,
    pointToMoneyRateNumber,
    usePoints,
    setUsePoints,
    pointsToRedeem,
    setPointsToRedeem,
    cartOverStockInfo,
    inventoryError,
    voucher,
    setVoucher,
    voucherApplied,
    availablePromotions,
    selectedPromo,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    checkoutStep,
    setCheckoutStep,
    isProcessingPayment,
    confirmationResult,
    handleProceedToCheckout,
    handleConfirmPayment,
    handleRetryPayment,
    resetCheckout,
    getItemUnitPrice,
    updateCartQty,
    removeCartItem,
    handleSelectPromo,
    handleRemovePromo,
    applyVoucher,
  } = cartState;

  const handleModalClose = () => {
    resetCheckout();
    onClose();
  };

  const formattedOrderId = (id?: string, code?: string) => {
    if (!id && !code) return '#---';
    return displayOrderCode({ id: id || '', code });
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleModalClose();
      }}
    >
      <div className="modal-dialog" style={{ maxWidth: '520px' }}>
        <button className="modal-close" onClick={handleModalClose}>
          ✕
        </button>

        {/* ============================================================== */}
        {/* MÀN HÌNH (5): XÁC NHẬN ĐƠN HÀNG (THÀNH CÔNG HOẶC THẤT BẠI)     */}
        {/* ============================================================== */}
        {checkoutStep === 'confirmation' && confirmationResult && (
          <div style={{ textAlign: 'center', padding: '16px 8px 8px' }}>
            {confirmationResult.success ? (
              <>
                <div
                  style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '50%',
                    background: '#dcfce7',
                    color: '#15803d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    fontSize: '34px',
                    fontWeight: 800,
                  }}
                >
                  ✓
                </div>

                <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#166534', margin: '0 0 6px' }}>
                  Đặt hàng thành công
                </h2>

                <div
                  style={{
                    background: '#f8fafc',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '16px',
                    margin: '16px 0',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                    <span style={{ color: '#64748b' }}>Mã đơn:</span>
                    <strong style={{ color: '#0f172a', fontSize: '15px' }}>{formattedOrderId(confirmationResult.orderId, confirmationResult.orderCode)}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                    <span style={{ color: '#64748b' }}>Trạng thái:</span>
                    <span
                      style={{
                        padding: '2px 10px',
                        background: '#dcfce7',
                        color: '#15803d',
                        borderRadius: '20px',
                        fontWeight: 800,
                        fontSize: '12px',
                      }}
                    >
                      PAID
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                    <span style={{ color: '#64748b' }}>Phương thức:</span>
                    <strong style={{ color: '#334155' }}>{confirmationResult.method}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px dashed #cbd5e1', fontSize: '14px' }}>
                    <span style={{ color: '#64748b' }}>Tổng thanh toán:</span>
                    <strong style={{ color: '#166534', fontSize: '16px' }}>{money(confirmationResult.total)}</strong>
                  </div>
                </div>

                <p style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '14px 0 20px' }}>
                  🥤 Mời tới quầy lấy nước
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    className="btn-full"
                    style={{ background: '#166534', padding: '12px', fontSize: '14px' }}
                    onClick={handleModalClose}
                  >
                    Về trang chủ
                  </button>
                  <button
                    className="btn-full"
                    style={{ background: '#f1f5f9', color: '#1e293b', border: '1px solid #cbd5e1', padding: '12px', fontSize: '14px' }}
                    onClick={() => {
                      handleModalClose();
                      window.location.href = `/orders?orderId=${confirmationResult.orderId}`;
                    }}
                  >
                    Xem lịch sử đơn
                  </button>
                </div>
              </>
            ) : (
              <>
                <div
                  style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '50%',
                    background: '#fee2e2',
                    color: '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    fontSize: '32px',
                    fontWeight: 800,
                  }}
                >
                  ✕
                </div>

                <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#991b1b', margin: '0 0 6px' }}>
                  Thanh toán thất bại
                </h2>

                <div
                  style={{
                    background: '#fef2f2',
                    border: '1.5px solid #fecaca',
                    borderRadius: '12px',
                    padding: '16px',
                    margin: '16px 0',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                    <span style={{ color: '#64748b' }}>Mã đơn:</span>
                    <strong style={{ color: '#991b1b', fontSize: '15px' }}>{formattedOrderId(confirmationResult.orderId, confirmationResult.orderCode)}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                    <span style={{ color: '#64748b' }}>Trạng thái:</span>
                    <span
                      style={{
                        padding: '2px 10px',
                        background: '#fee2e2',
                        color: '#b91c1c',
                        borderRadius: '20px',
                        fontWeight: 800,
                        fontSize: '12px',
                      }}
                    >
                      PAYMENT_FAILED
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                    <span style={{ color: '#64748b' }}>Phương thức:</span>
                    <strong style={{ color: '#334155' }}>{confirmationResult.method}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px dashed #fca5a5', fontSize: '14px' }}>
                    <span style={{ color: '#64748b' }}>Số tiền:</span>
                    <strong style={{ color: '#991b1b', fontSize: '16px' }}>{money(confirmationResult.total)}</strong>
                  </div>
                </div>

                {/* Tiêu chí quan trọng: Giỏ hàng được giữ nguyên khi thanh toán lỗi */}
                <div
                  style={{
                    padding: '12px',
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: '10px',
                    fontSize: '13px',
                    color: '#92400e',
                    textAlign: 'left',
                    marginBottom: '20px',
                  }}
                >
                  🛡️ <strong>Lưu ý:</strong> Giỏ hàng ({cartCount} món) của bạn <strong>được giữ nguyên</strong> để bạn có thể thử lại hoặc thay đổi phương thức thanh toán.
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    className="btn-full"
                    style={{ background: '#166534', padding: '12px', fontSize: '14px' }}
                    onClick={handleRetryPayment}
                  >
                    🔄 Thử lại thanh toán
                  </button>
                  <button
                    className="btn-full"
                    style={{ background: '#f1f5f9', color: '#1e293b', border: '1px solid #cbd5e1', padding: '12px', fontSize: '14px' }}
                    onClick={() => setCheckoutStep('cart')}
                  >
                    Xem lại giỏ hàng
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* MÀN HÌNH (4): THANH TOÁN (CHỌN VÍ / THẺ RỒI XÁC NHẬN TRẢ)       */}
        {/* ============================================================== */}
        {checkoutStep === 'checkout' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => setCheckoutStep('cart')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '16px',
                  cursor: 'pointer',
                  color: '#64748b',
                  padding: '4px',
                }}
                title="Quay lại giỏ hàng"
              >
                ←
              </button>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                Thanh toán
              </h3>
            </div>

            {/* Thẻ tổng tiền chuẩn Wireframe 4 */}
            <div
              style={{
                padding: '16px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Đơn hàng ({cartCount} món)</span>
                <div style={{ fontSize: '12px', color: '#166534', fontWeight: 600, marginTop: '2px' }}>
                  {actualPointsUsed > 0 ? `Đã dùng ${actualPointsUsed} điểm (-${money(pointsDiscount)})` : 'Chưa áp dụng điểm'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Tổng thanh toán</span>
                <span style={{ fontSize: '20px', fontWeight: 800, color: '#166534' }}>
                  {money(grandTotal)}
                </span>
              </div>
            </div>

            {/* Chọn phương thức Ví điện tử / Thẻ ngân hàng */}
            <PaymentMethodPicker
              selectedPaymentMethod={selectedPaymentMethod}
              setSelectedPaymentMethod={setSelectedPaymentMethod}
            />

            {/* Nút "Xác nhận trả" theo Wireframe 4 */}
            <button
              className="btn-full"
              onClick={handleConfirmPayment}
              disabled={isProcessingPayment}
              style={{
                marginTop: '16px',
                padding: '14px',
                fontSize: '15px',
                fontWeight: 800,
                background: '#166534',
                opacity: isProcessingPayment ? 0.7 : 1,
                cursor: isProcessingPayment ? 'not-allowed' : 'pointer',
              }}
            >
              {isProcessingPayment ? '⏳ Đang xử lý thanh toán...' : `Xác nhận trả • ${money(grandTotal)}`}
            </button>

            <button
              type="button"
              onClick={() => setCheckoutStep('cart')}
              style={{
                width: '100%',
                marginTop: '10px',
                background: 'none',
                border: 'none',
                color: '#64748b',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'center',
                padding: '8px',
              }}
            >
              ← Mua thêm / Sửa giỏ hàng
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* MÀN HÌNH (3): GIỎ HÀNG (DANH SÁCH MÓN + NÚT THANH TOÁN TỔNG)     */}
        {/* ============================================================== */}
        {checkoutStep === 'cart' && (
          <>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 16px' }}>
              Giỏ hàng ({cartCount})
            </h3>

            {cart.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '30px 10px',
                  color: 'var(--text-muted)',
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🛒</div>
                <p style={{ fontWeight: 600, fontSize: '13px' }}>Giỏ hàng của bạn đang trống</p>
                <button
                  className="btn-full"
                  style={{ marginTop: '14px' }}
                  onClick={handleModalClose}
                >
                  Tiếp tục chọn món
                </button>
              </div>
            ) : (
              <>
                <div className="cart-items-wrap">
                  {cart.map((item, idx) => (
                    <CartItemRow
                      key={`${item.product.id}-${item.size || 'M'}-${idx}`}
                      item={item}
                      index={idx}
                      products={products}
                      cart={cart}
                      getItemUnitPrice={getItemUnitPrice}
                      updateCartQty={updateCartQty}
                      removeCartItem={removeCartItem}
                    />
                  ))}
                </div>

                {/* KHU VỰC CHỌN MÃ GIẢM GIÁ */}
                <VoucherSection
                  availablePromotions={availablePromotions}
                  voucher={voucher}
                  setVoucher={setVoucher}
                  voucherApplied={voucherApplied}
                  selectedPromo={selectedPromo}
                  discountAmount={discountAmount}
                  handleSelectPromo={handleSelectPromo}
                  handleRemovePromo={handleRemovePromo}
                  applyVoucher={applyVoucher}
                />

                {/* DÙNG ĐIỂM TÍCH LŨY */}
                <PointsRedemption
                  token={token}
                  userPoints={userPoints}
                  minPointRedeem={minPointRedeem}
                  usePoints={usePoints}
                  setUsePoints={setUsePoints}
                  pointsToRedeem={pointsToRedeem}
                  setPointsToRedeem={setPointsToRedeem}
                  maxRedeemablePoints={maxRedeemablePoints}
                  actualPointsUsed={actualPointsUsed}
                  pointToMoneyRate={pointToMoneyRateNumber}
                />

                <div className="cart-summary">
                  <div className="summary-line">
                    <span>Tạm tính</span>
                    <span>{money(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div
                      className="summary-line"
                      style={{ color: 'var(--green)', fontWeight: 700 }}
                    >
                      <span>Giảm giá ({selectedPromo?.discount || '10%'} - {selectedPromo?.code || voucher})</span>
                      <span>-{money(discountAmount)}</span>
                    </div>
                  )}
                  {pointsDiscount > 0 && (
                    <div
                      className="summary-line"
                      style={{ color: '#d97706', fontWeight: 700 }}
                    >
                      <span>Giảm từ điểm thưởng ({actualPointsUsed} điểm)</span>
                      <span>-{money(pointsDiscount)}</span>
                    </div>
                  )}
                  <div className="summary-line total">
                    <span>Tổng:</span>
                    <span style={{ color: 'var(--green)' }}>{money(grandTotal)}</span>
                  </div>

                  {/* ĐIỂM TÍCH LŨY DỰ KIẾN NHẬN ĐƯỢC */}
                  <div
                    style={{
                      marginTop: '8px',
                      padding: '8px 12px',
                      background: '#ecfdf5',
                      border: '1px dashed #34d399',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      gap: '12px',
                      lineHeight: 1.4,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0, color: '#065f46', fontWeight: 700 }}>
                      <span aria-hidden="true" style={{ flexShrink: 0 }}>⭐</span>
                      <span>Điểm tích lũy dự kiến nhận ({money(pointRateNumber)} = 1 điểm):</span>
                    </div>
                    <span style={{ fontWeight: 800, color: '#059669', fontSize: '13px', flexShrink: 0, whiteSpace: 'nowrap', minWidth: '9ch', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      +{expectedEarnedPoints} điểm
                    </span>
                  </div>
                </div>

                {/* CẢNH BÁO TỒN KHO & NGUYÊN LIỆU */}
                {(cartOverStockInfo.length > 0 || Boolean(inventoryError)) && (
                  <div
                    style={{
                      margin: '12px 0',
                      padding: '12px 14px',
                      background: '#fee2e2',
                      border: '1.5px solid #ef4444',
                      borderRadius: '10px',
                      color: '#991b1b',
                      fontSize: '12px',
                    }}
                  >
                    <div style={{ fontWeight: 800, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>⚠️</span> KHÔNG THỂ THANH TOÁN ({cartOverStockInfo.length > 0 ? 'HẾT HÀNG' : 'THIẾU NGUYÊN LIỆU'}):
                    </div>
                    {cartOverStockInfo.map((info, i) => (
                      <div key={i} style={{ margin: '2px 0' }}>
                        • <strong>{info.name}</strong>: Đang chọn {info.totalQty} ly ({info.liveStock <= 0 ? 'Kho đã hết hàng' : `Kho chỉ còn ${info.liveStock} ly`}).
                      </div>
                    ))}
                    {inventoryError && (
                      <div style={{ margin: '2px 0', fontWeight: 600 }}>
                        • {inventoryError}
                      </div>
                    )}
                    <div style={{ marginTop: '6px', fontSize: '11px', color: '#7f1d1d', fontStyle: 'italic' }}>
                      Vui lòng bấm dấu (-) để giảm số lượng món về mức tồn kho cho phép để có thể tiếp tục thanh toán!
                    </div>
                  </div>
                )}

                {/* TIÊU CHÍ CHẤP NHẬN: Khi giỏ hàng có ít nhất 1 sản phẩm, nút "Thanh toán" hiển thị tổng tiền */}
                {!token ? (
                  <div style={{ marginTop: '16px' }}>
                    <div
                      style={{
                        marginBottom: '10px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: '#fff7ed',
                        border: '1px solid #fed7aa',
                        color: '#9a3412',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span>🔒</span>
                      <span>Bạn cần đăng nhập tài khoản trước khi thanh toán đơn hàng.</span>
                    </div>
                    <button
                      className="btn-full"
                      onClick={cartOverStockInfo.length > 0 || Boolean(inventoryError) ? undefined : onOpenLogin}
                      disabled={cartOverStockInfo.length > 0 || Boolean(inventoryError)}
                      style={{
                        background: cartOverStockInfo.length > 0 || Boolean(inventoryError) ? '#94a3b8' : '#173f35',
                        padding: '12px',
                        fontSize: '14px',
                        cursor: cartOverStockInfo.length > 0 || Boolean(inventoryError) ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {cartOverStockInfo.length > 0 || Boolean(inventoryError)
                        ? '⚠️ Thiếu nguyên liệu - Vui lòng giảm số lượng'
                        : `🔑 Đăng nhập để thanh toán • ${money(grandTotal)}`}
                    </button>
                  </div>
                ) : (
                  <button
                    className="btn-full"
                    onClick={handleProceedToCheckout}
                    disabled={cartOverStockInfo.length > 0 || Boolean(inventoryError)}
                    style={{
                      marginTop: '16px',
                      padding: '14px',
                      fontSize: '15px',
                      fontWeight: 800,
                      background: cartOverStockInfo.length > 0 || Boolean(inventoryError) ? '#94a3b8' : '#166534',
                      cursor: cartOverStockInfo.length > 0 || Boolean(inventoryError) ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {cartOverStockInfo.length > 0
                      ? '⚠️ Vượt tồn kho - Vui lòng giảm số lượng'
                      : inventoryError
                      ? '⚠️ Thiếu nguyên liệu - Vui lòng giảm số lượng'
                      : `Thanh toán • ${money(grandTotal)}`}
                  </button>
                )}

                {/* Nút "Thêm sản phẩm khác": Cho phép khách quay lại bước xem menu để mua thêm */}
                <button
                  type="button"
                  className="btn-full"
                  onClick={handleModalClose}
                  style={{
                    marginTop: '10px',
                    background: '#f8fafc',
                    color: '#334155',
                    border: '1.5px solid #cbd5e1',
                    padding: '12px',
                    fontSize: '13px',
                    fontWeight: 700,
                  }}
                >
                  ➕ Mua thêm sản phẩm khác (Xem Menu)
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
