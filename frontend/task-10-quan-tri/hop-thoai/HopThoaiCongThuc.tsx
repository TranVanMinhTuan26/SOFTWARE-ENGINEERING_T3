'use client';

import { useEffect, useState } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import type { ProductItem } from '../kieu-quan-tri';
import { inventoryApiClient, IngredientDto } from '../api/khach-api-ton-kho';

interface RecipeModalProps {
  product: ProductItem | null;
  onClose: () => void;
  onSaved?: () => void;
  triggerToast: (msg: string) => void;
}

interface LineItem {
  ingredientId: string;
  quantity: number;
}

export function RecipeModal({ product, onClose, onSaved, triggerToast }: RecipeModalProps) {
  const [ingredients, setIngredients] = useState<IngredientDto[]>([]);
  const [lines, setLines] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [markupPercent, setMarkupPercent] = useState<number>(250);
  const [applyNewPrice, setApplyNewPrice] = useState<boolean>(true);

  useEffect(() => {
    if (!product?.id) return;
    let isMounted = true;
    setLoading(true);
    Promise.all([
      inventoryApiClient.listIngredients(),
      inventoryApiClient.getRecipe(product.id),
    ])
      .then(([ingList, recipeData]) => {
        if (!isMounted) return;
        setIngredients(ingList);
        setLines(
          recipeData.items.map((i) => ({
            ingredientId: i.ingredientId,
            quantity: i.quantity,
          }))
        );
      })
      .catch((err) => {
        if (!isMounted) return;
        triggerToast(`❌ Lỗi tải công thức: ${err?.message || ''}`);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [product?.id]);

  if (!product) return null;

  const currentTotalCost = lines.reduce((sum, l) => {
    const ing = ingredients.find((i) => i.id === l.ingredientId);
    const cp = ing?.costPrice || 0;
    return sum + l.quantity * cp;
  }, 0);

  const calculatedPrice = Math.round((currentTotalCost * markupPercent) / 100);

  const handleAddLine = () => {
    const unselected = ingredients.find((i) => !lines.some((l) => l.ingredientId === i.id));
    if (!unselected) {
      triggerToast('Đã thêm tất cả nguyên liệu có sẵn');
      return;
    }
    setLines([...lines, { ingredientId: unselected.id, quantity: 10 }]);
  };

  const handleRemoveLine = (idx: number) => {
    setLines(lines.filter((_, i) => i !== idx));
  };

  const handleChangeIngredient = (idx: number, id: string) => {
    const next = [...lines];
    next[idx].ingredientId = id;
    setLines(next);
  };

  const handleChangeQty = (idx: number, val: number) => {
    const next = [...lines];
    next[idx].quantity = Math.max(1, Math.round(val));
    setLines(next);
  };

  const handleSave = async () => {
    if (lines.length === 0) {
      if (!confirm('Công thức rỗng đồng nghĩa món này sẽ ở trạng thái "Chưa có công thức" và không bán được. Bạn có chắc không?')) {
        return;
      }
    }

    // Check duplicate
    const ids = lines.map((l) => l.ingredientId);
    if (new Set(ids).size !== ids.length) {
      triggerToast('⚠️ Không được chọn trùng nguyên liệu trong một công thức');
      return;
    }

    setSaving(true);
    try {
      await inventoryApiClient.replaceRecipe(product.id, {
        items: lines.map((l) => ({ ingredientId: l.ingredientId, quantity: l.quantity })),
        newPrice: applyNewPrice && calculatedPrice > 0 ? calculatedPrice : undefined,
      });
      triggerToast(
        applyNewPrice && calculatedPrice > 0
          ? `✓ Đã lưu công thức và cập nhật giá bán thành ${calculatedPrice.toLocaleString('vi-VN')} đ!`
          : `✓ Đã lưu công thức cho món "${product.name}" thành công!`
      );
      if (onSaved) onSaved();
      onClose();
    } catch (err: any) {
      triggerToast(`❌ Lỗi lưu công thức: ${err?.message || ''}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal-card" style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={18} />
        </button>
        <h2 className="modal-title">Cấu hình công thức (Size M chuẩn)</h2>
        <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 16px' }}>
          Món: <strong>{product.name}</strong> • Định lượng nguyên liệu cho <strong>1 ly size M</strong>.
          Size S sẽ nhân 0.8, size L nhân 1.3 và làm tròn lên.
        </p>

        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Đang tải công thức...</div>
        ) : (
          <div>
            {lines.length === 0 ? (
              <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '8px', textAlign: 'center', marginBottom: '16px' }}>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>
                  Chưa có nguyên liệu nào trong công thức. Bấm "Thêm nguyên liệu" bên dưới để bắt đầu.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                {lines.map((line, idx) => {
                  const selectedIng = ingredients.find((i) => i.id === line.ingredientId);
                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 130px 110px 36px',
                        gap: '10px',
                        alignItems: 'center',
                        background: '#f8fafc',
                        padding: '8px 12px',
                        borderRadius: '8px',
                      }}
                    >
                      <select
                        className="modal-input"
                        value={line.ingredientId}
                        onChange={(e) => handleChangeIngredient(idx, e.target.value)}
                        style={{ margin: 0 }}
                      >
                        {ingredients.map((ing) => (
                          <option key={ing.id} value={ing.id}>
                            {ing.name} ({ing.unit})
                          </option>
                        ))}
                      </select>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          className="modal-input"
                          value={line.quantity}
                          onChange={(e) => handleChangeQty(idx, Number(e.target.value))}
                          style={{ margin: 0, textAlign: 'right' }}
                        />
                        <span style={{ fontSize: '12px', color: '#64748b', minWidth: '24px' }}>
                          {selectedIng?.unit || ''}
                        </span>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#047857' }}>
                          {((selectedIng?.costPrice || 0) * line.quantity).toLocaleString('vi-VN')} đ
                        </span>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                          {(selectedIng?.costPrice || 0).toLocaleString('vi-VN')} đ/{selectedIng?.unit || ''}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveLine(idx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '6px',
                        }}
                        title="Xóa dòng"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              <button
                type="button"
                className="btn-secondary-action"
                onClick={handleAddLine}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={15} /> Thêm nguyên liệu
              </button>
            </div>

            {/* BẢNG TÍNH GIÁ BÁN THEO NGUYÊN LIỆU * % */}
            {lines.length > 0 && (
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1.5px solid #bbf7d0',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ fontWeight: 700, color: '#166534', fontSize: '14px' }}>
                    💰 Tự động cập nhật giá bán (Nguyên liệu × %)
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569' }}>
                    Giá bán hiện tại: <strong style={{ color: '#0f172a' }}>{Number(product.price).toLocaleString('vi-VN')} đ</strong>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', alignItems: 'center' }}>
                  <div style={{ background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Tổng vốn nguyên liệu</div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                      {currentTotalCost.toLocaleString('vi-VN')} đ
                    </div>
                  </div>

                  <div style={{ background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Tỷ lệ định giá (%)</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="number"
                        min="10"
                        max="1000"
                        step="10"
                        value={markupPercent}
                        onChange={(e) => setMarkupPercent(Math.max(1, Number(e.target.value) || 100))}
                        style={{ width: '70px', padding: '4px 6px', fontWeight: 700, fontSize: '14px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                      />
                      <span style={{ fontWeight: 700, color: '#166534' }}>%</span>
                    </div>
                  </div>

                  <div style={{ background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1.5px solid #86efac' }}>
                    <div style={{ fontSize: '11px', color: '#166534', fontWeight: 600 }}>Giá bán mới đề xuất</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#166534' }}>
                      {calculatedPrice.toLocaleString('vi-VN')} đ
                    </div>
                  </div>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', cursor: 'pointer', fontSize: '13px', color: '#166534', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={applyNewPrice}
                    onChange={(e) => setApplyNewPrice(e.target.checked)}
                    style={{ accentColor: '#166534', width: '16px', height: '16px' }}
                  />
                  <span>
                    Đồng ý cập nhật giá bán sản phẩm từ {Number(product.price).toLocaleString('vi-VN')} đ thành {calculatedPrice.toLocaleString('vi-VN')} đ khi bấm Lưu công thức
                  </span>
                </label>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <button type="button" className="btn-secondary-action" onClick={onClose}>
                Hủy
              </button>
              <button
                type="button"
                className="btn-save-perms"
                onClick={handleSave}
                disabled={saving}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Save size={15} /> {saving ? 'Đang lưu...' : 'Lưu công thức'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

