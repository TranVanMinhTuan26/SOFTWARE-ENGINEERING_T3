'use client';

import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, PackagePlus, AlertTriangle } from 'lucide-react';
import { useInventory } from '../hooks/useTonKho';
import { IngredientDto } from '../api/khach-api-ton-kho';

interface IngredientsTabProps {
  triggerToast: (msg: string) => void;
}

export function IngredientsTab({ triggerToast }: IngredientsTabProps) {
  const {
    ingredients,
    loading,
    error,
    createIngredient,
    updateIngredient,
    restock,
    deleteIngredient,
    fetchIngredients,
  } = useInventory();

  const [search, setSearch] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'ingredient' | 'topping'>('all');

  // Modal thêm/sửa
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingItem, setEditingItem] = useState<IngredientDto | null>(null);
  const [formName, setFormName] = useState('');
  const [formUnit, setFormUnit] = useState('g');
  const [formQty, setFormQty] = useState('0');
  const [formThreshold, setFormThreshold] = useState('100');
  const [formCostPrice, setFormCostPrice] = useState('250');
  const [formIsTopping, setFormIsTopping] = useState(false);
  const [formPrice, setFormPrice] = useState('10000');
  const [submitting, setSubmitting] = useState(false);

  // Modal nhập kho
  const [restockItem, setRestockItem] = useState<IngredientDto | null>(null);
  const [restockQty, setRestockQty] = useState('500');
  const [restocking, setRestocking] = useState(false);

  const openCreateModal = (isTopping: boolean = false) => {
    setModalMode('create');
    setEditingItem(null);
    setFormName('');
    setFormUnit(isTopping ? 'g' : 'g');
    setFormQty('1000');
    setFormThreshold('100');
    setFormCostPrice(isTopping ? '2000' : '250');
    setFormIsTopping(isTopping);
    setFormPrice('10000');
  };

  const openEditModal = (item: IngredientDto) => {
    setModalMode('edit');
    setEditingItem(item);
    setFormName(item.name);
    setFormUnit(item.unit);
    setFormQty(String(item.quantity));
    setFormThreshold(String(item.lowStockThreshold));
    setFormCostPrice(String(item.costPrice ?? (item.isTopping ? 2000 : 250)));
    setFormIsTopping(Boolean(item.isTopping));
    setFormPrice(String(item.price || 10000));
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = formName.trim();
    const unit = formUnit.trim();
    const qty = parseInt(formQty, 10);
    const threshold = parseInt(formThreshold, 10);
    const costPrice = parseInt(formCostPrice, 10) || 0;
    const price = formIsTopping ? parseInt(formPrice, 10) || 10000 : 0;

    if (!name || !unit) {
      triggerToast('Vui lòng điền đầy đủ tên và đơn vị tính.');
      return;
    }
    if (isNaN(qty) || qty < 0) {
      triggerToast('Số lượng tồn kho không được âm.');
      return;
    }
    if (isNaN(threshold) || threshold < 0) {
      triggerToast('Ngưỡng cảnh báo không được âm.');
      return;
    }
    if (costPrice < 0) {
      triggerToast('Đơn giá vốn không được âm.');
      return;
    }

    setSubmitting(true);
    try {
      if (modalMode === 'create') {
        await createIngredient({
          name,
          unit,
          quantity: qty,
          lowStockThreshold: threshold,
          costPrice,
          isTopping: formIsTopping,
          price,
        });
        triggerToast(`✓ Đã thêm ${formIsTopping ? 'topping' : 'nguyên liệu'} "${name}" thành công!`);
      } else if (modalMode === 'edit' && editingItem) {
        await updateIngredient(editingItem.id, {
          name,
          unit,
          quantity: qty,
          lowStockThreshold: threshold,
          costPrice,
          isTopping: formIsTopping,
          price,
        });
        triggerToast(`✓ Đã cập nhật "${name}" thành công!`);
      }
      setModalMode(null);
    } catch (err: any) {
      triggerToast(`❌ ${err?.message || 'Lỗi thao tác'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockItem) return;
    const qty = parseInt(restockQty, 10);
    if (isNaN(qty) || qty <= 0) {
      triggerToast('Số lượng nhập kho phải lớn hơn 0.');
      return;
    }

    setRestocking(true);
    try {
      await restock(restockItem.id, { quantity: qty });
      triggerToast(`✓ Đã nhập kho +${qty} ${restockItem.unit} cho "${restockItem.name}"!`);
      setRestockItem(null);
    } catch (err: any) {
      triggerToast(`❌ ${err?.message || 'Lỗi nhập kho'}`);
    } finally {
      setRestocking(false);
    }
  };

  const handleDelete = async (item: IngredientDto) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa nguyên liệu "${item.name}"?`)) {
      return;
    }
    try {
      await deleteIngredient(item.id);
      triggerToast(`✓ Đã xóa nguyên liệu "${item.name}" thành công!`);
    } catch (err: any) {
      // Bắt lỗi 409 quy tắc 15 (nêu tên các món đang dùng)
      triggerToast(`❌ ${err?.message || 'Lỗi xóa nguyên liệu'}`);
    }
  };

  const totalCount = ingredients.length;
  const toppingCount = ingredients.filter((i) => i.isTopping).length;
  const ingredientCount = ingredients.filter((i) => !i.isTopping).length;
  const lowStockCount = ingredients.filter((i) => i.quantity <= i.lowStockThreshold).length;

  const filtered = ingredients.filter((ing) => {
    const matchSearch = ing.name.toLowerCase().includes(search.toLowerCase().trim());
    const matchLowStock = filterLowStock ? ing.quantity <= ing.lowStockThreshold : true;
    const matchType =
      filterType === 'all'
        ? true
        : filterType === 'topping'
        ? Boolean(ing.isTopping)
        : !ing.isTopping;
    return matchSearch && matchLowStock && matchType;
  });

  return (
    <div className="tab-products">
      <div className="page-head-row">
        <div>
          <h1 className="page-heading">Quản lý kho & Topping</h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>
            Theo dõi tồn kho, định mức cảnh báo và nhập kho nguyên liệu pha chế & topping đồ uống.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="btn-primary-action"
            onClick={() => openCreateModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#047857',
              borderColor: '#047857',
            }}
          >
            <Plus size={16} />
            <span>Thêm Topping</span>
          </button>
          <button
            type="button"
            className="btn-primary-action"
            onClick={() => openCreateModal(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Plus size={16} />
            <span>Thêm nguyên liệu</span>
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="table-filter-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <div className="filter-search-box" style={{ flex: '1', minWidth: '240px' }}>
          <Search size={15} />
          <input
            type="text"
            placeholder="Tìm kiếm nguyên liệu hoặc topping..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setFilterType('all')}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: `1.5px solid ${filterType === 'all' ? '#166534' : '#e2e8f0'}`,
              background: filterType === 'all' ? '#eaf4eb' : '#ffffff',
              color: filterType === 'all' ? '#166534' : '#64748b',
              fontWeight: filterType === 'all' ? 700 : 500,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Tất cả ({totalCount})
          </button>

          <button
            type="button"
            onClick={() => setFilterType('ingredient')}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: `1.5px solid ${filterType === 'ingredient' ? '#166534' : '#e2e8f0'}`,
              background: filterType === 'ingredient' ? '#eaf4eb' : '#ffffff',
              color: filterType === 'ingredient' ? '#166534' : '#64748b',
              fontWeight: filterType === 'ingredient' ? 700 : 500,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <span>📦 Nguyên liệu ({ingredientCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterType('topping')}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: `1.5px solid ${filterType === 'topping' ? '#166534' : '#e2e8f0'}`,
              background: filterType === 'topping' ? '#eaf4eb' : '#ffffff',
              color: filterType === 'topping' ? '#166534' : '#64748b',
              fontWeight: filterType === 'topping' ? 700 : 500,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <span>🥤 Topping ({toppingCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterLowStock(!filterLowStock)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: `1.5px solid ${filterLowStock ? '#ef4444' : '#e2e8f0'}`,
              background: filterLowStock ? '#fee2e2' : '#ffffff',
              color: filterLowStock ? '#b91c1c' : '#64748b',
              fontWeight: filterLowStock ? 700 : 500,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <AlertTriangle size={15} />
            <span>Sắp hết ({lowStockCount})</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="admin-table-card">
        {error && (
          <div role="alert" style={{ padding: '16px', color: '#b91c1c' }}>
            {error}{' '}
            <button type="button" className="btn-secondary-action" onClick={() => fetchIngredients()}>
              Thử tải lại
            </button>
          </div>
        )}

        <div className="product-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>#</th>
                <th>Tên mục</th>
                <th style={{ width: '130px' }}>Phân loại</th>
                <th>Đơn vị tính</th>
                <th style={{ textAlign: 'right' }}>Đơn giá vốn</th>
                <th style={{ textAlign: 'right' }}>Số lượng tồn</th>
                <th style={{ textAlign: 'right' }}>Ngưỡng cảnh báo</th>
                <th>Tình trạng</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {!loading &&
                filtered.map((ing, idx) => {
                  const isLow = ing.quantity <= ing.lowStockThreshold;
                  return (
                    <tr key={ing.id} style={{ background: isLow ? '#fff1f2' : undefined }}>
                      <td style={{ color: '#94a3b8' }}>{idx + 1}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '16px' }}>{ing.isTopping ? '🥤' : '📦'}</span>
                          <div>
                            <span style={{ fontWeight: ing.isTopping ? 700 : 600, color: ing.isTopping ? '#065f46' : '#0f172a' }}>
                              {ing.name}
                            </span>
                            {ing.isTopping && (
                              <span style={{ display: 'block', fontSize: '11px', color: '#166534', fontWeight: 600 }}>
                                Giá bán: +{Number(ing.price || 10000).toLocaleString('vi-VN')} đ
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        {ing.isTopping ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '3px 10px',
                              borderRadius: '20px',
                              background: '#ecfdf5',
                              color: '#047857',
                              border: '1px solid #a7f3d0',
                              fontSize: '12px',
                              fontWeight: 700,
                            }}
                          >
                            🥤 Topping
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '3px 10px',
                              borderRadius: '20px',
                              background: '#f1f5f9',
                              color: '#475569',
                              border: '1px solid #cbd5e1',
                              fontSize: '12px',
                              fontWeight: 600,
                            }}
                          >
                            📦 Nguyên liệu
                          </span>
                        )}
                      </td>
                      <td>
                        <span style={{ padding: '2px 8px', background: '#f1f5f9', borderRadius: '4px', fontSize: '12px', fontWeight: 500 }}>
                          {ing.unit}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: '#047857' }}>
                        {Number(ing.costPrice || 0).toLocaleString('vi-VN')} đ
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 400, marginLeft: '3px' }}>
                          /{ing.unit}
                        </span>
                      </td>
                      <td
                        style={{
                          textAlign: 'right',
                          fontWeight: 700,
                          fontSize: '14px',
                          color: isLow ? '#b91c1c' : '#0f172a',
                        }}
                      >
                        {ing.quantity.toLocaleString('vi-VN')} {ing.unit}
                      </td>
                      <td style={{ textAlign: 'right', color: '#64748b' }}>
                        {ing.lowStockThreshold.toLocaleString('vi-VN')} {ing.unit}
                      </td>
                      <td>
                        {isLow ? (
                          <span
                            className="status-pill warning"
                            style={{ background: '#fee2e2', color: '#b91c1c', borderColor: '#fca5a5' }}
                          >
                            ⚠️ Sắp hết hàng
                          </span>
                        ) : (
                          <span
                            className="status-pill active"
                            style={{ background: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }}
                          >
                            ✓ Đủ tồn kho
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="action-icon-btn"
                          style={{ color: '#059669', marginRight: '6px' }}
                          title="Nhập thêm kho"
                          onClick={() => {
                            setRestockItem(ing);
                            setRestockQty('500');
                          }}
                        >
                          <PackagePlus size={16} />
                        </button>
                        <button
                          className="action-icon-btn edit"
                          title="Sửa thông tin"
                          onClick={() => openEditModal(ing)}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          className="action-icon-btn delete"
                          title={ing.isTopping ? 'Xóa topping' : 'Xóa nguyên liệu'}
                          onClick={() => handleDelete(ing)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}

              {loading && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '24px' }}>
                    Đang tải dữ liệu kho nguyên liệu...
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                    Không có mục nào phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm / Sửa nguyên liệu */}
      {modalMode && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card" style={{ maxWidth: '480px' }}>
            <button className="modal-close-btn" onClick={() => setModalMode(null)}>
              ✕
            </button>
            <h2 className="modal-title">
              {modalMode === 'create'
                ? formIsTopping ? 'Thêm Topping mới vào kho' : 'Thêm nguyên liệu mới'
                : formIsTopping ? 'Chỉnh sửa Topping' : 'Chỉnh sửa nguyên liệu'}
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 16px' }}>
              Quản lý định danh, đơn vị và ngưỡng cảnh báo khi kho xuống thấp.
            </p>

            <form onSubmit={handleSubmitForm}>
              <div style={{ marginBottom: '14px' }}>
                <label className="field-label">Phân loại mục</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setFormIsTopping(false)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: `1.5px solid ${!formIsTopping ? '#166534' : '#cbd5e1'}`,
                      background: !formIsTopping ? '#eaf4eb' : '#fff',
                      color: !formIsTopping ? '#166534' : '#475569',
                      fontWeight: !formIsTopping ? 700 : 500,
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    📦 Nguyên liệu pha chế
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormIsTopping(true);
                      if (!formPrice) setFormPrice('10000');
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: `1.5px solid ${formIsTopping ? '#166534' : '#cbd5e1'}`,
                      background: formIsTopping ? '#eaf4eb' : '#fff',
                      color: formIsTopping ? '#166534' : '#475569',
                      fontWeight: formIsTopping ? 700 : 500,
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    🥤 Topping đồ uống
                  </button>
                </div>
              </div>

              {formIsTopping && (
                <div style={{ marginBottom: '14px', padding: '12px', background: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                  <label className="field-label" style={{ color: '#065f46' }}>
                    Giá bán cộng thêm cho khách (VNĐ)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    required
                    className="modal-input"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    style={{ background: '#fff' }}
                  />
                  <small style={{ fontSize: '11px', color: '#047857', display: 'block', marginTop: '4px' }}>
                    ✓ Topping này sẽ hiển thị bên thực đơn đồ uống để khách chọn với giá này.
                  </small>
                </div>
              )}

              <div style={{ marginBottom: '12px' }}>
                <label className="field-label">{formIsTopping ? 'Tên Topping' : 'Tên nguyên liệu'}</label>
                <input
                  type="text"
                  required
                  className="modal-input"
                  placeholder={formIsTopping ? 'Ví dụ: Trân châu hoàng kim, Kem cheese...' : 'Ví dụ: Cà phê hạt Robusta, Sữa đặc...'}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label className="field-label">Đơn vị tính</label>
                <input
                  type="text"
                  required
                  className="modal-input"
                  placeholder="g, ml, cái, lon, gói..."
                  value={formUnit}
                  onChange={(e) => setFormUnit(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label className="field-label">
                  Đơn giá vốn nhập (VNĐ / {formUnit || 'đơn vị'})
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  className="modal-input"
                  placeholder="Ví dụ: 250 (đối với g), 40 (đối với ml)..."
                  value={formCostPrice}
                  onChange={(e) => setFormCostPrice(e.target.value)}
                />
                <small style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '3px' }}>
                  Giá vốn dùng để tự động tính tổng chi phí công thức và tính giá bán sản phẩm (Vốn × %).
                </small>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label className="field-label">Số lượng tồn kho</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    className="modal-input"
                    value={formQty}
                    onChange={(e) => setFormQty(e.target.value)}
                  />
                </div>
                <div>
                  <label className="field-label">Ngưỡng cảnh báo</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    className="modal-input"
                    value={formThreshold}
                    onChange={(e) => setFormThreshold(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-secondary-action" onClick={() => setModalMode(null)}>
                  Hủy
                </button>
                <button type="submit" className="btn-save-perms" disabled={submitting}>
                  {submitting ? 'Đang lưu...' : modalMode === 'create' ? 'Xác nhận tạo' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nhập kho */}
      {restockItem && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card" style={{ maxWidth: '420px' }}>
            <button className="modal-close-btn" onClick={() => setRestockItem(null)}>
              ✕
            </button>
            <h2 className="modal-title">Nhập kho nguyên liệu</h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 16px' }}>
              Nguyên liệu: <strong>{restockItem.name}</strong> • Hiện có:{' '}
              <strong>
                {restockItem.quantity.toLocaleString('vi-VN')} {restockItem.unit}
              </strong>
            </p>

            <form onSubmit={handleRestock}>
              <div style={{ marginBottom: '16px' }}>
                <label className="field-label">Số lượng nhập thêm ({restockItem.unit})</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  autoFocus
                  className="modal-input"
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-secondary-action" onClick={() => setRestockItem(null)}>
                  Hủy
                </button>
                <button type="submit" className="btn-save-perms" disabled={restocking}>
                  {restocking ? 'Đang xử lý...' : 'Xác nhận nhập kho'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

