import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, EyeOff, ScrollText, CupSoda } from 'lucide-react';
import type { ProductItem } from '../kieu-quan-tri';
import { money as formatMoney } from '../hang-so-quan-tri';
import { RecipeModal } from '../hop-thoai/HopThoaiCongThuc';
import { ToppingsModal } from '../hop-thoai/HopThoaiQuanLyTopping';
import { ProductToppingModal } from '../hop-thoai/HopThoaiToppingSanPham';

type ProductsTabProps = {
  products: ProductItem[];
  productSearch: string;
  setProductSearch: (value: string) => void;
  productCategoryFilter: string;
  setProductCategoryFilter: (value: string) => void;
  productStatusFilter: string;
  setProductStatusFilter: (value: string) => void;
  productPage: number;
  productTotalPages: number;
  productTotal: number;
  productPageSize: number;
  productLoading: boolean;
  productError: string | null;
  onPrevPage: () => void;
  onNextPage: () => void;
  onOpenAddModal: () => void;
  openEditProductModal: (product: ProductItem) => void;
  toggleProductActive: (product: ProductItem) => void;
  deleteProduct: (id: string, name?: string) => void;
  money?: (value: number) => string;
  onPageChange?: (page: number) => void;
  onReload?: () => void;
  triggerToast: (msg: string) => void;
};

export function ProductsTab({
  products,
  productSearch,
  setProductSearch,
  productCategoryFilter,
  setProductCategoryFilter,
  productStatusFilter,
  setProductStatusFilter,
  productPage,
  productTotalPages,
  productTotal,
  productPageSize,
  productLoading,
  productError,
  onPrevPage,
  onNextPage,
  onOpenAddModal,
  openEditProductModal,
  toggleProductActive,
  deleteProduct,
  money: moneyProp,
  onReload,
  triggerToast,
}: ProductsTabProps) {
  const money = moneyProp || formatMoney;
  const [recipeProduct, setRecipeProduct] = useState<ProductItem | null>(null);
  const [productToppingItem, setProductToppingItem] = useState<ProductItem | null>(null);
  const [isToppingModalOpen, setIsToppingModalOpen] = useState(false);

  const getStatusBadge = (p: ProductItem) => {
    if (p.active === false) {
      return (
        <span
          className="status-pill warning"
          style={{
            background: '#f1f5f9',
            color: '#64748b',
            borderColor: '#cbd5e1',
          }}
        >
          Đã ẩn (Ngừng bán)
        </span>
      );
    }

    if (p.hasRecipe === false || p.status === 'Chưa có công thức') {
      return (
        <span
          className="status-pill"
          style={{
            background: '#fef3c7',
            color: '#b45309',
            borderColor: '#fde68a',
          }}
        >
          ⚠️ Chưa có công thức
        </span>
      );
    }

    if (p.available === false || p.status === 'Hết hàng') {
      return (
        <span
          className="status-pill warning"
          style={{
            background: '#fee2e2',
            color: '#b91c1c',
            borderColor: '#fca5a5',
          }}
        >
          ❌ Hết hàng
        </span>
      );
    }

    return (
      <span
        className="status-pill active"
        style={{
          background: '#ecfdf5',
          color: '#047857',
          borderColor: '#a7f3d0',
        }}
      >
        ✓ Còn hàng
      </span>
    );
  };

  return (
    <div className="tab-products">
      <div className="page-head-row">
        <h1 className="page-heading">Quản lý sản phẩm</h1>
        <button className="btn-primary-action" onClick={onOpenAddModal}>
          <Plus size={16} />
          <span>Thêm sản phẩm</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="table-filter-bar">
        <div className="filter-search-box">
          <Search size={15} />
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
          />
        </div>

        <div className="filter-select-wrap">
          <select
            value={productCategoryFilter}
            onChange={(e) => setProductCategoryFilter(e.target.value)}
          >
            <option value="Tất cả">Danh mục: Tất cả</option>
            <option value="Cà phê">Cà phê</option>
            <option value="Trà">Trà</option>
            <option value="Matcha">Matcha</option>
            <option value="Đá xay">Đá xay</option>
            <option value="Khác">Khác</option>
          </select>
        </div>

        <div className="filter-select-wrap">
          <select
            value={productStatusFilter}
            onChange={(e) => setProductStatusFilter(e.target.value)}
          >
            <option value="Tất cả">Trạng thái: Tất cả</option>
            <option value="Còn hàng">Còn hàng</option>
            <option value="Hết hàng">Hết hàng</option>
            <option value="Chưa có công thức">Chưa có công thức</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="admin-table-card">
        {productError && (
          <div role="alert" style={{ padding: '16px', color: '#b91c1c' }}>
            {productError}{' '}
            <button type="button" className="btn-secondary-action" onClick={onReload}>
              Thử tải lại
            </button>
          </div>
        )}
        <div className="product-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>#</th>
                <th style={{ width: '60px' }}>Hình ảnh</th>
                <th>Tên sản phẩm</th>
                <th>Danh mục</th>
                <th>Giá bán</th>
                <th>Trạng thái tồn kho</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {!productLoading && products.map((p, idx) => (
                <tr key={p.id}>
                  <td style={{ color: '#94a3b8' }}>{(productPage - 1) * productPageSize + idx + 1}</td>
                  <td>
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="table-thumb"
                      onError={(event) => {
                        event.currentTarget.style.visibility = 'hidden';
                      }}
                    />
                  </td>
                  <td className="product-table-name" style={{ fontWeight: 600 }}>{p.name}</td>
                  <td>{p.category}</td>
                  <td style={{ fontWeight: 700 }}>{money(p.price)}</td>
                  <td>{getStatusBadge(p)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="action-icon-btn"
                      style={{
                        color: '#4f46e5',
                        marginRight: '6px',
                      }}
                      title="Cấu hình công thức pha chế"
                      onClick={() => setRecipeProduct(p)}
                    >
                      <ScrollText size={15} />
                    </button>
                    <button
                      className="action-icon-btn"
                      style={{
                        color: '#047857',
                        marginRight: '6px',
                      }}
                      title="Cấu hình Topping cho món này"
                      onClick={() => setProductToppingItem(p)}
                    >
                      <CupSoda size={15} />
                    </button>
                    <button
                      className="action-icon-btn"
                      style={{
                        color: p.active === false ? '#64748b' : '#059669',
                        marginRight: '6px',
                      }}
                      title={
                        p.active === false
                          ? 'Hiện món trên thực đơn khách'
                          : 'Ẩn món khỏi thực đơn khách'
                      }
                      onClick={() => toggleProductActive(p)}
                    >
                      {p.active === false ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                    <button
                      className="action-icon-btn edit"
                      title="Sửa thông tin sản phẩm"
                      onClick={() => openEditProductModal(p)}
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      className="action-icon-btn delete"
                      title="Xóa / Ngừng kinh doanh"
                      onClick={() => deleteProduct(p.id, p.name)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
              {productLoading && <tr><td colSpan={7}>Đang tải sản phẩm...</td></tr>}
              {!productLoading && !productError && products.length === 0 && (
                <tr><td colSpan={7}>Không có sản phẩm phù hợp.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="table-pagination-row">
          <span className="pagination-info">
            Trang {productPage} / {Math.max(1, productTotalPages)} ({productTotal} sản phẩm)
          </span>
          <div className="pagination-btns">
            <button
              className="btn-page"
              disabled={productPage <= 1 || productLoading}
              onClick={onPrevPage}
            >
              Trang trước
            </button>
            <button
              className="btn-page"
              disabled={productPage >= productTotalPages || productLoading}
              onClick={onNextPage}
            >
              Trang sau
            </button>
          </div>
        </div>
      </div>

      {/* Recipe Modal */}
      {recipeProduct && (
        <RecipeModal
          product={recipeProduct}
          onClose={() => setRecipeProduct(null)}
          onSaved={() => {
            if (onReload) onReload();
          }}
          triggerToast={triggerToast}
        />
      )}

      {/* Product Topping Modal */}
      {productToppingItem && (
        <ProductToppingModal
          product={productToppingItem}
          onClose={() => setProductToppingItem(null)}
          onSaved={() => {
            if (onReload) onReload();
          }}
          triggerToast={triggerToast}
        />
      )}

      {/* Toppings Modal */}
      <ToppingsModal
        isOpen={isToppingModalOpen}
        onClose={() => setIsToppingModalOpen(false)}
        triggerToast={triggerToast}
      />
    </div>
  );
}
