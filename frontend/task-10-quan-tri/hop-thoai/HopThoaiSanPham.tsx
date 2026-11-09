import { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import type { ProductItem } from '../kieu-quan-tri';
import { inventoryApiClient, IngredientDto } from '../api/khach-api-ton-kho';
import { useToppings } from '../../dung-chung/useDanhSachTopping';
import { ToppingsModal } from './HopThoaiQuanLyTopping';

function ProductImagePreview({ imageUrl }: { imageUrl: string }) {
  const [failed, setFailed] = useState(false);
  const trimmed = imageUrl.trim();
  const isValid = trimmed.startsWith('http://') || trimmed.startsWith('https://');

  if (!isValid || failed) {
    return (
      <div className="product-image-preview placeholder">
        {trimmed ? 'URL ảnh không tải được' : 'Chưa có ảnh xem trước'}
      </div>
    );
  }

  return (
    <img
      src={trimmed}
      className="product-image-preview"
      alt="Ảnh xem trước sản phẩm"
      onError={() => setFailed(true)}
    />
  );
}

interface ProductFormModalProps {
  showAddModal: boolean;
  setShowAddModal: (val: boolean) => void;
  newProdName: string;
  setNewProdName: (val: string) => void;
  newProdCategory: string;
  setNewProdCategory: (val: string) => void;
  newProdPrice: string;
  setNewProdPrice: (val: string) => void;
  newProdStock?: string;
  setNewProdStock?: (val: string) => void;
  newProdDescription: string;
  setNewProdDescription: (val: string) => void;
  newProdImageUrl: string;
  setNewProdImageUrl: (val: string) => void;
  newProdRecipeLines?: Array<{ ingredientId: string; quantity: number }>;
  setNewProdRecipeLines?: React.Dispatch<React.SetStateAction<Array<{ ingredientId: string; quantity: number }>>>;
  newProdToppingIds?: string[];
  setNewProdToppingIds?: React.Dispatch<React.SetStateAction<string[]>>;
  isSavingProduct: boolean;
  handleAddProduct: (e: React.FormEvent) => void;

  editingProduct: ProductItem | null;
  setEditingProduct: (val: ProductItem | null) => void;
  editProdName: string;
  setEditProdName: (val: string) => void;
  editProdCategory: string;
  setEditProdCategory: (val: string) => void;
  editProdPrice: string;
  setEditProdPrice: (val: string) => void;
  editProdStock?: string;
  setEditProdStock?: (val: string) => void;
  editProdDescription: string;
  setEditProdDescription: (val: string) => void;
  editProdImageUrl: string;
  setEditProdImageUrl: (val: string) => void;
  editProdToppingIds?: string[];
  setEditProdToppingIds?: React.Dispatch<React.SetStateAction<string[]>>;
  handleSaveEditProduct: (e: React.FormEvent) => void;
  triggerToast?: (msg: string) => void;
}

export function ProductFormModal({
  showAddModal,
  setShowAddModal,
  newProdName,
  setNewProdName,
  newProdCategory,
  setNewProdCategory,
  newProdPrice,
  setNewProdPrice,
  newProdDescription,
  setNewProdDescription,
  newProdImageUrl,
  setNewProdImageUrl,
  newProdRecipeLines = [],
  setNewProdRecipeLines,
  newProdToppingIds = [],
  setNewProdToppingIds,
  isSavingProduct,
  handleAddProduct,

  editingProduct,
  setEditingProduct,
  editProdName,
  setEditProdName,
  editProdCategory,
  setEditProdCategory,
  editProdPrice,
  setEditProdPrice,
  editProdDescription,
  setEditProdDescription,
  editProdImageUrl,
  setEditProdImageUrl,
  editProdToppingIds = [],
  setEditProdToppingIds,
  handleSaveEditProduct,
  triggerToast,
}: ProductFormModalProps) {
  const [availableIngredients, setAvailableIngredients] = useState<IngredientDto[]>([]);
  const { toppings, fetchToppings } = useToppings();
  const [showToppingModal, setShowToppingModal] = useState(false);
  const [addRecipeMarkup, setAddRecipeMarkup] = useState<number>(250);
  const hasInitializedAddModalToppings = useRef(false);

  const addRecipeCost = newProdRecipeLines.reduce((sum, l) => {
    const ing = availableIngredients.find((i) => i.id === l.ingredientId);
    return sum + l.quantity * (ing?.costPrice || 0);
  }, 0);

  const addCalculatedPrice = Math.round((addRecipeCost * addRecipeMarkup) / 100);

  useEffect(() => {
    if (addCalculatedPrice > 0) {
      setNewProdPrice?.(String(addCalculatedPrice));
    }
  }, [addCalculatedPrice, setNewProdPrice]);

  useEffect(() => {
    if (showAddModal) {
      inventoryApiClient.listIngredients().then(setAvailableIngredients).catch(() => {});
      if (!hasInitializedAddModalToppings.current && toppings.length > 0 && newProdToppingIds.length === 0) {
        setNewProdToppingIds?.(toppings.map((t) => t.id));
        hasInitializedAddModalToppings.current = true;
      }
    } else {
      hasInitializedAddModalToppings.current = false;
    }
  }, [showAddModal, toppings, newProdToppingIds.length, setNewProdToppingIds]);

  const handleAddRecipeLine = () => {
    if (!setNewProdRecipeLines) return;
    const unselected = availableIngredients.find((ing) => !newProdRecipeLines.some((l) => l.ingredientId === ing.id));
    const defaultId = unselected ? unselected.id : (availableIngredients[0]?.id || '');
    if (!defaultId) return;
    setNewProdRecipeLines([...newProdRecipeLines, { ingredientId: defaultId, quantity: 15 }]);
  };

  const handleUpdateRecipeLine = (idx: number, patch: Partial<{ ingredientId: string; quantity: number }>) => {
    if (!setNewProdRecipeLines) return;
    setNewProdRecipeLines(newProdRecipeLines.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  const handleRemoveRecipeLine = (idx: number) => {
    if (!setNewProdRecipeLines) return;
    setNewProdRecipeLines(newProdRecipeLines.filter((_, i) => i !== idx));
  };

  return (
    <>
      {/* MODAL: THÊM SẢN PHẨM MỚI */}
      {showAddModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card" style={{ maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
            <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>
              <X size={18} />
            </button>
            <h2 className="modal-title">Thêm sản phẩm mới</h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 16px' }}>
              Điền thông tin món đồ uống mới. Khả dụng bán sẽ được tính toán tự động dựa trên công thức và kho nguyên liệu.
            </p>

            <form onSubmit={handleAddProduct}>
              <div style={{ marginBottom: '12px' }}>
                <label className="field-label">Tên món</label>
                <input
                  type="text"
                  required
                  maxLength={120}
                  className="modal-input"
                  placeholder="Ví dụ: Cà phê Muối Biển..."
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label className="field-label">Mô tả</label>
                <textarea
                  className="modal-input"
                  maxLength={2000}
                  rows={3}
                  placeholder="Mô tả hương vị, đặc trưng món..."
                  value={newProdDescription}
                  onChange={(e) => setNewProdDescription(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label className="field-label">URL hình ảnh</label>
                <input
                  type="url"
                  required
                  maxLength={2048}
                  className="modal-input"
                  placeholder="https://..."
                  value={newProdImageUrl}
                  onChange={(e) => setNewProdImageUrl(e.target.value)}
                />
                <ProductImagePreview imageUrl={newProdImageUrl} />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label className="field-label">Danh mục</label>
                <select
                  className="modal-input"
                  value={newProdCategory}
                  onChange={(e) => setNewProdCategory(e.target.value)}
                >
                  <option>Cà phê</option>
                  <option>Trà</option>
                  <option>Matcha</option>
                  <option>Đá xay</option>
                  <option>Khác</option>
                </select>
              </div>

              {/* ĐỊNH LƯỢNG NGUYÊN LIỆU KHO (CÔNG THỨC CHUẨN SIZE M) */}
              <div
                style={{
                  marginBottom: '20px',
                  padding: '14px',
                  background: '#f8fafc',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div>
                    <label className="field-label" style={{ margin: 0, fontWeight: 700, color: 'var(--green, #173f35)' }}>
                      🧪 Công thức nguyên liệu (chuẩn Size M)
                    </label>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      Liên kết với kho để tự động trừ nguyên liệu khi khách đặt món
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddRecipeLine}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '5px 10px',
                      fontSize: '12px',
                      fontWeight: 600,
                      background: 'var(--green, #173f35)',
                      color: '#ffffff',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <Plus size={14} /> Thêm nguyên liệu
                  </button>
                </div>

                {newProdRecipeLines.length === 0 ? (
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', padding: '6px 0' }}>
                    Chưa chọn nguyên liệu. Bạn có thể thêm ngay tại đây hoặc tạo món trước rồi bấm nút "Công thức" tại danh sách sản phẩm.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                    {newProdRecipeLines.map((line, idx) => {
                      const selectedIng = availableIngredients.find((i) => i.id === line.ingredientId);
                      return (
                        <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <select
                            className="modal-input"
                            style={{ flex: 2, padding: '6px 10px', fontSize: '13px' }}
                            value={line.ingredientId}
                            onChange={(e) => handleUpdateRecipeLine(idx, { ingredientId: e.target.value })}
                          >
                            {availableIngredients.map((ing) => (
                              <option key={ing.id} value={ing.id}>
                                {ing.name} ({ing.unit})
                              </option>
                            ))}
                          </select>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              required
                              className="modal-input"
                              style={{ width: '100%', padding: '6px 10px', fontSize: '13px' }}
                              placeholder="Định lượng"
                              value={line.quantity}
                              onChange={(e) => handleUpdateRecipeLine(idx, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                            />
                            <span style={{ fontSize: '12px', color: '#64748b', minWidth: '20px' }}>
                              {selectedIng?.unit || ''}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveRecipeLine(idx)}
                            style={{
                              color: '#ef4444',
                              background: '#fee2e2',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            title="Xóa nguyên liệu này"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      );
                    })}

                    {/* BẢNG TÍNH GIÁ BÁN THEO NGUYÊN LIỆU * % */}
                    <div
                      style={{
                        marginTop: '12px',
                        background: '#ecfdf5',
                        border: '1px solid #a7f3d0',
                        borderRadius: '8px',
                        padding: '10px 12px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#065f46' }}>
                          💰 Tính giá vốn & đề xuất giá bán (Nguyên liệu × %)
                        </span>
                        <span style={{ fontSize: '12px', color: '#047857', fontWeight: 600 }}>
                          Vốn: {addRecipeCost.toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '12px', color: '#475569' }}>Tỷ lệ (%):</span>
                          <input
                            type="number"
                            min="10"
                            max="1000"
                            step="10"
                            value={addRecipeMarkup}
                            onChange={(e) => setAddRecipeMarkup(Math.max(1, Number(e.target.value) || 100))}
                            style={{
                              width: '65px',
                              padding: '3px 6px',
                              fontSize: '13px',
                              fontWeight: 700,
                              borderRadius: '4px',
                              border: '1px solid #cbd5e1',
                              background: '#ffffff',
                            }}
                          />
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#065f46' }}>%</span>
                          <span style={{ fontSize: '13px', color: '#64748b', margin: '0 4px' }}>→</span>
                          <span style={{ fontSize: '14px', fontWeight: 800, color: '#047857' }}>
                            {addCalculatedPrice.toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setNewProdPrice(String(addCalculatedPrice));
                            if (triggerToast) triggerToast(`✓ Đã áp dụng giá bán ${addCalculatedPrice.toLocaleString('vi-VN')} đ!`);
                          }}
                          style={{
                            padding: '4px 10px',
                            fontSize: '12px',
                            fontWeight: 600,
                            background: '#047857',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                          }}
                        >
                          ⚡ Áp dụng vào giá bán
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* TOPPING ĐỒ UỐNG ÁP DỤNG */}
              <div
                style={{
                  marginBottom: '20px',
                  padding: '14px',
                  background: '#f8fafc',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div>
                    <label className="field-label" style={{ margin: 0, fontWeight: 700, color: 'var(--green, #173f35)' }}>
                      🥤 Topping đồ uống áp dụng
                    </label>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      Chọn topping khách được phép chọn khi đặt món này
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowToppingModal(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '5px 10px',
                      fontSize: '12px',
                      fontWeight: 600,
                      background: 'var(--green, #173f35)',
                      color: '#ffffff',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <Plus size={14} /> Thêm Topping
                  </button>
                </div>

                {toppings.length === 0 ? (
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', padding: '6px 0' }}>
                    Chưa có topping nào trong hệ thống. Bấm &quot;+ Thêm Topping&quot; để tạo mới.
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setNewProdToppingIds?.(toppings.map((t) => t.id))}
                        style={{ fontSize: '11px', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                      >
                        Chọn tất cả
                      </button>
                      <span style={{ fontSize: '11px', color: '#cbd5e1' }}>|</span>
                      <button
                        type="button"
                        onClick={() => setNewProdToppingIds?.([])}
                        style={{ fontSize: '11px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                      >
                        Bỏ chọn tất cả
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {toppings.map((t) => {
                        const isSelected = newProdToppingIds.includes(t.id);
                        return (
                          <label
                            key={t.id}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              border: isSelected ? '1px solid #10b981' : '1px solid #cbd5e1',
                              background: isSelected ? '#ecfdf5' : '#ffffff',
                              color: isSelected ? '#065f46' : '#475569',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: isSelected ? 600 : 400,
                              userSelect: 'none',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (!setNewProdToppingIds) return;
                                if (e.target.checked) {
                                  setNewProdToppingIds([...newProdToppingIds, t.id]);
                                } else {
                                  setNewProdToppingIds(newProdToppingIds.filter((id) => id !== t.id));
                                }
                              }}
                              style={{ accentColor: '#10b981', cursor: 'pointer' }}
                            />
                            <span>{t.name}</span>
                            <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '2px' }}>
                              (+{Number(t.price).toLocaleString('vi-VN')}đ)
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              <button type="submit" className="btn-save-perms" style={{ width: '100%' }} disabled={isSavingProduct}>
                {isSavingProduct ? 'Đang lưu...' : 'Xác nhận thêm món'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CHỈNH SỬA SẢN PHẨM */}
      {editingProduct && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card" style={{ maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
            <button className="modal-close-btn" onClick={() => setEditingProduct(null)}>
              <X size={18} />
            </button>
            <h2 className="modal-title">Chỉnh sửa sản phẩm</h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 16px' }}>
              Cập nhật thông tin giá bán và mô tả sản phẩm.
            </p>

            <form onSubmit={handleSaveEditProduct}>
              <div style={{ marginBottom: '12px' }}>
                <label className="field-label">Tên món</label>
                <input
                  type="text"
                  required
                  maxLength={120}
                  className="modal-input"
                  value={editProdName}
                  onChange={(e) => setEditProdName(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label className="field-label">Mô tả</label>
                <textarea
                  className="modal-input"
                  maxLength={2000}
                  rows={3}
                  value={editProdDescription}
                  onChange={(e) => setEditProdDescription(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label className="field-label">URL hình ảnh</label>
                <input
                  type="url"
                  required
                  maxLength={2048}
                  className="modal-input"
                  value={editProdImageUrl}
                  onChange={(e) => setEditProdImageUrl(e.target.value)}
                />
                <ProductImagePreview imageUrl={editProdImageUrl} />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label className="field-label">Danh mục</label>
                <select
                  className="modal-input"
                  value={editProdCategory}
                  onChange={(e) => setEditProdCategory(e.target.value)}
                >
                  <option>Cà phê</option>
                  <option>Trà</option>
                  <option>Matcha</option>
                  <option>Đá xay</option>
                  <option>Khác</option>
                </select>
              </div>

              {/* TOPPING ĐỒ UỐNG ÁP DỤNG */}
              <div
                style={{
                  marginBottom: '20px',
                  padding: '14px',
                  background: '#f8fafc',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div>
                    <label className="field-label" style={{ margin: 0, fontWeight: 700, color: 'var(--green, #173f35)' }}>
                      🥤 Topping đồ uống áp dụng
                    </label>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      Chọn topping khách được phép chọn khi đặt món này
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowToppingModal(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '5px 10px',
                      fontSize: '12px',
                      fontWeight: 600,
                      background: 'var(--green, #173f35)',
                      color: '#ffffff',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <Plus size={14} /> Thêm Topping
                  </button>
                </div>

                {toppings.length === 0 ? (
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', padding: '6px 0' }}>
                    Chưa có topping nào trong hệ thống. Bấm &quot;+ Thêm Topping&quot; để tạo mới.
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setEditProdToppingIds?.(toppings.map((t) => t.id))}
                        style={{ fontSize: '11px', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                      >
                        Chọn tất cả
                      </button>
                      <span style={{ fontSize: '11px', color: '#cbd5e1' }}>|</span>
                      <button
                        type="button"
                        onClick={() => setEditProdToppingIds?.([])}
                        style={{ fontSize: '11px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                      >
                        Bỏ chọn tất cả
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {toppings.map((t) => {
                        const isSelected = editProdToppingIds.includes(t.id);
                        return (
                          <label
                            key={t.id}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              border: isSelected ? '1px solid #10b981' : '1px solid #cbd5e1',
                              background: isSelected ? '#ecfdf5' : '#ffffff',
                              color: isSelected ? '#065f46' : '#475569',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: isSelected ? 600 : 400,
                              userSelect: 'none',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (!setEditProdToppingIds) return;
                                if (e.target.checked) {
                                  setEditProdToppingIds([...editProdToppingIds, t.id]);
                                } else {
                                  setEditProdToppingIds(editProdToppingIds.filter((id) => id !== t.id));
                                }
                              }}
                              style={{ accentColor: '#10b981', cursor: 'pointer' }}
                            />
                            <span>{t.name}</span>
                            <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '2px' }}>
                              (+{Number(t.price).toLocaleString('vi-VN')}đ)
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              <button type="submit" className="btn-save-perms" style={{ width: '100%' }} disabled={isSavingProduct}>
                {isSavingProduct ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: QUẢN LÝ / TẠO TOPPING MỚI */}
      <ToppingsModal
        isOpen={showToppingModal}
        onClose={() => {
          setShowToppingModal(false);
          void fetchToppings();
        }}
        triggerToast={triggerToast || (() => {})}
      />
    </>
  );
}
