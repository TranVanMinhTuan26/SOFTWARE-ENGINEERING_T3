import { useEffect, useState } from 'react';
import type { CSSProperties, Dispatch, SetStateAction } from 'react';
import { Search } from 'lucide-react';
import type { CartItem, Product } from '../dung-chung/kieu-du-lieu-chung';
import type { Category } from './du-lieu-danh-muc';

type MenuSectionProps = {
  categories: Category[];
  category: string;
  setCategory: Dispatch<SetStateAction<string>>;
  filteredProducts: Product[];
  loading?: boolean;
  error?: string | null;
  onReload?: () => void;
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  cart: CartItem[];
  token: string;
  setModal: Dispatch<SetStateAction<string>>;
  setAuthError: Dispatch<SetStateAction<string>>;
  setToastMessage: Dispatch<SetStateAction<string>>;
  openDetail: (product: Product) => void;
  onAddToCart: (product: Product, size?: 'S' | 'M' | 'L', toppings?: string[], qty?: number) => Promise<boolean>;
  money: (amount: number) => string;
  normalizeText: (value: string) => string;
};

export function MenuSection(props: MenuSectionProps) {
  // Thành phần danh sách món nhận dữ liệu và callback từ component cha; tại đây
  // quản lý riêng việc tìm kiếm, chọn danh mục, hiển thị trạng thái và phân trang.
  // Mỗi trang có tối đa 12 món.
  const pageSize = 12;
  const [page, setPage] = useState(1);
  const {
    categories, category, setCategory, filteredProducts, loading, error, onReload, search, setSearch, cart,
    token, setModal, setAuthError, setToastMessage, openDetail, onAddToCart,
    money, normalizeText,
  } = props;
  const pageCount = Math.ceil(filteredProducts.length / pageSize);
  // Cắt ra đúng lát dữ liệu của trang hiện tại; chỉ số cuối của slice là loại trừ.
  const visibleProducts = filteredProducts.slice((page - 1) * pageSize, page * pageSize);
  // Khi có tối đa 7 trang, hiện tất cả số trang. Với danh sách dài hơn, giữ
  // trang đầu/cuối và một vùng nhỏ quanh trang hiện tại, dùng dấu ba chấm ở giữa.
  const pageNumbers: (number | 'ellipsis')[] = pageCount <= 7
    ? Array.from({ length: pageCount }, (_, index) => index + 1)
    : [
        1,
        ...(page > 3 ? ['ellipsis' as const] : []),
        ...Array.from(
          { length: Math.min(3, pageCount - 2) },
          (_, index) => Math.max(2, Math.min(page - 1, pageCount - 3) + index)
        ),
        ...(page < pageCount - 2 ? ['ellipsis' as const] : []),
        pageCount,
      ];

  useEffect(() => {
    // Thay đổi bộ lọc/từ khóa có thể làm trang hiện tại không còn phù hợp,
    // nên bắt đầu lại từ trang đầu.
    setPage(1);
  }, [category, search]);

  useEffect(() => {
    // Kết quả bị thu hẹp có thể làm số trang giảm. Kẹp trang hiện tại vào
    // khoảng hợp lệ; khi không có kết quả vẫn giữ page ở mức tối thiểu là 1.
    if (page > Math.max(1, pageCount)) {
      setPage(Math.max(1, pageCount));
    }
  }, [page, pageCount]);

  const selectCategory = (nextCategory: string) => {
    // Đổi danh mục từ thanh bên thì đặt lại trang trước khi cập nhật bộ lọc.
    setPage(1);
    setCategory(nextCategory);
  };

  return <>{<section id="menu" className="menu-layout">
          {/* Left Sidebar Categories */}
          <aside className="category-sidebar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`cat-btn ${category === cat.id ? 'active' : ''}`}
                onClick={() => selectCategory(cat.id)}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </aside>

          {/* Right Product Grid */}
          <div>
            <div className="menu-head">
              <div className="menu-title">
                <h2>Thực đơn của chúng tôi</h2>
                <p>
                  {filteredProducts.length > 0
                    ? `Có ${filteredProducts.length} sản phẩm thơm ngon...`
                    : 'Hiện chưa có món nào đang mở bán.'}
                </p>
              </div>
              <div className="search-box">
                <Search size={15} />
                <input
                  id="search-input"
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={search}
                  onChange={(e) => {
                    setPage(1);
                    setSearch(e.target.value);
                  }}
                />
              </div>
            </div>

            <div className="products-grid">
              {loading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <article className="product-card" key={`skeleton-${idx}`} style={{ opacity: 0.7, pointerEvents: 'none' }}>
                    <div className="card-img-wrap" style={{ background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#e2e8f0', animation: 'pulse 1.5s infinite' }} />
                    </div>
                    <div className="card-info" style={{ padding: '12px' }}>
                      <div style={{ height: '16px', width: '70%', background: '#e2e8f0', borderRadius: '4px', margin: '4px 0 8px' }} />
                      <div style={{ height: '11px', width: '90%', background: '#f1f5f9', borderRadius: '4px', margin: '2px 0 10px' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                        <div style={{ height: '18px', width: '40%', background: '#e2e8f0', borderRadius: '4px' }} />
                        <div style={{ height: '28px', width: '28px', borderRadius: '50%', background: '#e2e8f0' }} />
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                visibleProducts.map((p) => (
                  <article className="product-card" key={p.id}>
                    <div
                      className="card-img-wrap"
                      onClick={() => openDetail(p)}
                      title={`Bấm xem chi tiết & chọn size: ${p.name}`}
                      style={{ cursor: 'pointer' }}
                    >
                      <img src={p.imageUrl} alt={p.name} className="card-img" loading="lazy" decoding="async" />
                    </div>
                    <div className="card-info">
                      <h4
                        className="card-name"
                        title={p.name}
                        onClick={() => openDetail(p)}
                        style={{ cursor: 'pointer' }}
                      >
                        {p.name}
                      </h4>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.description}
                      </p>
                      {(() => {
                        // Tính trạng thái còn hàng và số lượng món đã có trong giỏ.
                        // So khớp theo ID trước, dùng tên đã chuẩn hóa để hỗ trợ
                        // những dòng giỏ cũ không có cùng ID sản phẩm.
                        const isOutOfStock = p.available === false;
                        const qtyInCart = cart
                          .filter((i) => i.product.id === p.id || normalizeText(i.product.name) === normalizeText(p.name))
                          .reduce((sum, i) => sum + i.qty, 0);
                        const isAddDisabled = isOutOfStock;

                        return (
                          <>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '3px 0 6px' }}>
                              <span style={{
                                fontSize: '11px',
                                padding: '2px 7px',
                                borderRadius: '6px',
                                fontWeight: 700,
                                background: isOutOfStock ? '#fee2e2' : '#ecfdf5',
                                color: isOutOfStock ? '#b91c1c' : '#047857',
                              }}>
                                {isOutOfStock ? '❌ Hết hàng' : '✓ Còn hàng'}
                              </span>
                              {qtyInCart > 0 && (
                                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>
                                  Giỏ: {qtyInCart}
                                </span>
                              )}
                            </div>
                            <div className="card-bottom">
                              <span className="card-price">{money(p.price)}</span>
                              <button
                                className="btn-add"
                                aria-label={`Thêm nhanh ${p.name}`}
                                disabled={isAddDisabled}
                                style={{
                                  opacity: isAddDisabled ? 0.35 : 1,
                                  cursor: isAddDisabled ? 'not-allowed' : 'pointer',
                                  background: isAddDisabled ? '#cbd5e1' : undefined,
                                }}
                                onClick={async (e) => {
                                  // Nút thêm nhanh nằm bên trong thẻ mở chi tiết;
                                  // dừng nổi bọt để không mở chi tiết ngoài ý muốn.
                                  e.stopPropagation();
                                  if (isOutOfStock) {
                                    alert(`⚠️ Món "${p.name}" hiện đã HẾT HÀNG!`);
                                    setToastMessage(`⚠️ Món "${p.name}" hiện đã HẾT HÀNG!`);
                                    setTimeout(() => setToastMessage(''), 1000);
                                    return;
                                  }
                                  const ok = await onAddToCart(p, 'M', [], 1);
                                  // Chỉ hiển thị thông báo thành công nếu thao tác
                                  // thêm vào giỏ được component cha chấp nhận.
                                  if (ok) {
                                    setToastMessage(`Đã thêm "${p.name}" vào giỏ hàng`);
                                    setTimeout(() => setToastMessage(''), 1000);
                                  }
                                }}
                              >
                                {isOutOfStock ? 'Hết hàng' : '+'}
                              </button>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </article>
                ))
              )}
            </div>

            {error && filteredProducts.length === 0 && (
              <div
                role="alert"
                style={{
                  textAlign: 'center',
                  padding: '36px 20px',
                  background: '#fef2f2',
                  borderRadius: '16px',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  margin: '20px 0',
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚠️</div>
                <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: '#991b1b' }}>
                  Không thể tải danh sách thực đơn
                </h4>
                <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#b91c1c' }}>
                  {error}
                </p>
                {onReload && (
                  <button
                    type="button"
                    onClick={onReload}
                    style={{
                      background: 'var(--brand-primary, #b45309)',
                      color: 'white',
                      border: 'none',
                      padding: '8px 20px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '13px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                  >
                    🔄 Thử lại
                  </button>
                )}
              </div>
            )}

            {!loading && !error && filteredProducts.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  background: 'white',
                  borderRadius: '16px',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                }}
              >
                {search.trim()
                  ? `Không tìm thấy món phù hợp với từ khóa "${search}".`
                  : 'Hiện tại cửa hàng chưa có món nào đang mở bán hoặc các món đã được tạm ẩn.'}
              </div>
            )}
            {pageCount > 1 && (
              <nav
                aria-label="Phân trang sản phẩm"
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                  marginTop: '24px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page === 1}
                  aria-label="Trang trước"
                  style={paginationButtonStyle(page === 1)}
                >
                  Trước
                </button>
                {pageNumbers.map((pageNumber, index) =>
                  pageNumber === 'ellipsis' ? (
                    <span key={`ellipsis-${index}`} aria-hidden="true">…</span>
                  ) : (
                    <button
                      key={pageNumber}
                      type="button"
                      aria-label={`Trang ${pageNumber}`}
                      aria-current={page === pageNumber ? 'page' : undefined}
                      onClick={() => setPage(pageNumber)}
                      style={paginationButtonStyle(false, page === pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  )
                )}
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                  disabled={page === pageCount}
                  aria-label="Trang sau"
                  style={paginationButtonStyle(page === pageCount)}
                >
                  Sau
                </button>
              </nav>
            )}
          </div>
        </section>}</>;
}

function paginationButtonStyle(disabled: boolean, active = false): CSSProperties {
  // Hàm thuần tạo style dùng chung cho nút phân trang. Hai cờ đầu vào quyết định
  // trạng thái bị vô hiệu hóa và trạng thái trang đang được chọn.
  return {
    minWidth: '38px',
    padding: '8px 12px',
    borderRadius: '8px',
    border: active ? '1px solid #173f35' : '1px solid #cbd5e1',
    background: active ? '#173f35' : '#fff',
    color: active ? '#fff' : '#334155',
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  };
}
