import { Minus, Plus, Trash2 } from 'lucide-react';
import type { CartItem, Product } from '../dung-chung/kieu-du-lieu-chung';
import { money, normalizeText } from '../task-03-thuc-don/du-lieu-danh-muc';

type CartItemRowProps = {
  item: CartItem;
  index: number;
  products: Product[];
  cart: CartItem[];
  getItemUnitPrice: (item: CartItem) => number;
  updateCartQty: (index: number, delta: number) => Promise<void>;
  removeCartItem: (index: number) => Promise<void>;
};

export function CartItemRow(props: CartItemRowProps) {
  const {
    item, index, products,
    getItemUnitPrice, updateCartQty, removeCartItem,
  } = props;

  const targetProd = products.find(
    (p) => p.id === item.product.id || normalizeText(p.name) === normalizeText(item.product.name)
  );
  const isAvailable = (targetProd || item.product).available !== false;

  return (
    <div className="cart-drawer-item">
      <img
        src={item.product.imageUrl}
        alt={item.product.name}
        className="cart-item-img"
      />
      <div className="cart-item-details">
        <h5 className="cart-item-name">{item.product.name}</h5>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Size {item.size || 'M'}
          {item.toppings && item.toppings.length > 0 ? ` • ${item.toppings.join(', ')}` : ''}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
          <div className="cart-item-price">{money(getItemUnitPrice(item))}</div>
          {!isAvailable && (
            <span
              style={{
                fontSize: '10px',
                padding: '1px 6px',
                borderRadius: '4px',
                fontWeight: 700,
                background: '#fee2e2',
                color: '#b91c1c',
              }}
            >
              ❌ Tạm hết hàng
            </span>
          )}
        </div>
      </div>
      <div className="stepper-mini">
        <button onClick={() => updateCartQty(index, -1)}>
          <Minus size={12} />
        </button>
        <span>{item.qty}</span>
        <button
          onClick={() => updateCartQty(index, 1)}
          title="Tăng 1 ly"
        >
          <Plus size={12} />
        </button>
      </div>
      <button
        style={{ color: '#94a3b8', padding: '4px' }}
        onClick={() => removeCartItem(index)}
        aria-label="Xóa"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

