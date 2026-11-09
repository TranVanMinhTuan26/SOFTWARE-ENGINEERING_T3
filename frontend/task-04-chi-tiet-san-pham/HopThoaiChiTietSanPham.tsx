import type { Dispatch, SetStateAction } from 'react';
import { Minus, Plus } from 'lucide-react';
import type { CartItem, Product, Topping } from '../dung-chung/kieu-du-lieu-chung';
import { useToppings } from '../dung-chung/useDanhSachTopping';

export type ProductSize = 'S' | 'M' | 'L';

type ProductDetailModalProps = {
  modal: string;
  setModal: Dispatch<SetStateAction<string>>;
  selectedProduct: Product | null;
  detailSize: ProductSize;
  setDetailSize: Dispatch<SetStateAction<ProductSize>>;
  detailToppings: string[];
  setDetailToppings: Dispatch<SetStateAction<string[]>>;
  detailQty: number;
  setDetailQty: Dispatch<SetStateAction<number>>;
  products: Product[];
  cart: CartItem[];
  token: string;
  setAuthError: Dispatch<SetStateAction<string>>;
  setToastMessage: Dispatch<SetStateAction<string>>;
  onAddToCart: (product: Product, size: ProductSize, toppings: string[], qty: number) => Promise<boolean>;
  money: (amount: number) => string;
  normalizeText: (value: string) => string;
  toppings?: Topping[];
};

export function ProductDetailModal(props: ProductDetailModalProps) {
  const {
    modal, setModal, selectedProduct, detailSize, setDetailSize, detailToppings,
    setDetailToppings, detailQty, setDetailQty, products, cart, token,
    setAuthError, setToastMessage, onAddToCart, money, normalizeText,
  } = props;

  const { toppings: fetchedToppings } = useToppings();
  const availableToppings =
    selectedProduct?.toppings !== undefined
      ? selectedProduct.toppings
      : (props.toppings || fetchedToppings);

  return <>{modal === 'product-detail' && selectedProduct && (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) setModal('');
      }}
    >
      <div className="modal-dialog" style={{ maxWidth: '440px' }}>
        <button className="modal-close" onClick={() => setModal('')}>
          ✕
        </button>

        <div style={{ textAlign: 'center', marginBottom: '14px' }}>
          <img
            src={selectedProduct.imageUrl}
            alt={selectedProduct.name}
            style={{
              width: '130px',
              height: '130px',
              objectFit: 'cover',
              borderRadius: '16px',
              margin: '0 auto 10px',
              boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
            }}
          />
          <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', color: 'var(--green)' }}>
            {selectedProduct.name}
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 6px', lineHeight: 1.4 }}>
            {selectedProduct.description}
          </p>
          <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--green)' }}>
            {money(selectedProduct.price)} <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-muted)' }}>(Giá gốc)</span>
          </div>
        </div>

        {/* Chọn kích cỡ */}
        <div style={{ marginBottom: '14px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
            Kích cỡ ly (Size):
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {[
              { id: 'S', label: 'Size S', sub: '+0đ' },
              { id: 'M', label: 'Size M', sub: '+5.000đ' },
              { id: 'L', label: 'Size L', sub: '+10.000đ' },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setDetailSize(s.id as any)}
                style={{
                  padding: '8px 4px',
                  borderRadius: '10px',
                  border: `2px solid ${detailSize === s.id ? 'var(--green)' : 'var(--border)'}`,
                  background: detailSize === s.id ? 'var(--green-light)' : '#fff',
                  color: detailSize === s.id ? 'var(--green)' : 'var(--text-main)',
                  fontWeight: detailSize === s.id ? 800 : 500,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                <div>{s.label}</div>
                <small style={{ fontSize: '10px', opacity: 0.8 }}>{s.sub}</small>
              </button>
            ))}
          </div>
        </div>

        {/* Chọn Topping */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
            Topping thêm:
          </label>
          {availableToppings.length === 0 ? (
            <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1', fontSize: '12px', color: '#64748b', textAlign: 'center' }}>
              Món này không kèm topping thêm
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {availableToppings.map((top) => {
                const isChecked = detailToppings.includes(top.name);
                return (
                  <button
                    key={top.id || top.name}
                    type="button"
                    onClick={() => {
                      setDetailToppings((prev) =>
                        prev.includes(top.name) ? prev.filter((t) => t !== top.name) : [...prev, top.name]
                      );
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: `1.5px solid ${isChecked ? 'var(--green)' : 'var(--border)'}`,
                      background: isChecked ? 'var(--green-light)' : '#fff',
                      cursor: 'pointer',
                      fontSize: '13px',
                      width: '100%',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span style={{ fontWeight: isChecked ? 700 : 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '18px',
                          height: '18px',
                          borderRadius: '4px',
                          border: `1.5px solid ${isChecked ? 'var(--green)' : '#cbd5e1'}`,
                          background: isChecked ? 'var(--green)' : '#fff',
                          color: '#fff',
                          fontSize: '12px',
                          fontWeight: 800,
                        }}
                      >
                        {isChecked ? '✓' : ''}
                      </span>
                      {top.name}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: isChecked ? 700 : 500, color: isChecked ? 'var(--green)' : 'var(--text-muted)' }}>
                      {isChecked ? `+${money(top.price)} (Đã chọn)` : `+${money(top.price)}`}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Tồn kho & Ràng buộc */}
        {(() => {
          const targetProd = products.find(
            (p) => p.id === selectedProduct.id || normalizeText(p.name) === normalizeText(selectedProduct.name)
          );
          const isAvailable = (targetProd || selectedProduct).available !== false;

          return (
            <div style={{ marginBottom: '14px', padding: '8px 12px', background: !isAvailable ? '#fee2e2' : '#ecfdf5', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ fontWeight: 600, color: !isAvailable ? '#b91c1c' : '#047857' }}>
                {!isAvailable ? '❌ Sản phẩm hiện đã HẾT HÀNG' : '✓ Sản phẩm đang CÒN HÀNG'}
              </span>
            </div>
          );
        })()}

        {/* Số lượng & Thêm vào giỏ */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
          {(() => {
            const targetProd = products.find(
              (p) => p.id === selectedProduct.id || normalizeText(p.name) === normalizeText(selectedProduct.name)
            );
            const isOutOfStock = (targetProd || selectedProduct).available === false;

            const sizeSurch = detailSize === 'L' ? 10000 : detailSize === 'M' ? 5000 : 0;
            const toppingTotal = detailToppings.reduce((sum, topName) => {
              const found = availableToppings.find((t) => t.name === topName);
              return sum + (found ? found.price : 10000);
            }, 0);
            const totalItemPrice = (selectedProduct.price + sizeSurch + toppingTotal) * detailQty;

            return (
              <>
                <div className="stepper-mini" style={{ padding: '4px 6px', background: '#f1f5f2', borderRadius: '10px' }}>
                  <button
                    type="button"
                    disabled={detailQty <= 1 || isOutOfStock}
                    onClick={() => setDetailQty((q) => Math.max(1, q - 1))}
                    style={{ padding: '6px 8px', opacity: detailQty <= 1 || isOutOfStock ? 0.4 : 1 }}
                  >
                    <Minus size={14} />
                  </button>
                  <span style={{ fontWeight: 800, padding: '0 8px', minWidth: '22px', textAlign: 'center' }}>
                    {isOutOfStock ? 0 : detailQty}
                  </span>
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => setDetailQty((q) => q + 1)}
                    style={{ padding: '6px 8px', opacity: isOutOfStock ? 0.4 : 1 }}
                    title="Tăng số lượng"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <button
                  className="btn-full"
                  disabled={isOutOfStock}
                  style={{
                    flex: 1,
                    marginLeft: '12px',
                    marginTop: 0,
                    opacity: isOutOfStock ? 0.5 : 1,
                    cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                    background: isOutOfStock ? '#94a3b8' : undefined,
                  }}
                  onClick={async () => {
                    if (isOutOfStock) {
                      alert(`⚠️ Món "${selectedProduct.name}" hiện đã hết hàng!`);
                      setToastMessage(`⚠️ Món "${selectedProduct.name}" hiện đã hết hàng!`);
                      setTimeout(() => setToastMessage(''), 1000);
                      return;
                    }
                    const added = await onAddToCart(selectedProduct, detailSize, detailToppings, detailQty);
                    if (added) {
                      setModal('');
                      setToastMessage(`Đã thêm ${detailQty} ly ${selectedProduct.name} (Size ${detailSize}) vào giỏ hàng!`);
                      setTimeout(() => setToastMessage(''), 1000);
                    }
                  }}
                >
                  {isOutOfStock
                    ? 'Đã hết hàng'
                    : `Thêm vào giỏ • ${money(totalItemPrice)}`}
                </button>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  )}</>;
}
