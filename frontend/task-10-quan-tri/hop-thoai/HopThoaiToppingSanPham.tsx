import { useState, useEffect, useCallback } from 'react';
import { X, Check, CheckSquare, Square, RefreshCw, CupSoda } from 'lucide-react';
import { API } from '../../dung-chung/cau-hinh-api';
import type { ProductItem } from '../kieu-quan-tri';
import type { Topping } from '../../dung-chung/kieu-du-lieu-chung';

interface ProductToppingModalProps {
  product: ProductItem | null;
  onClose: () => void;
  onSaved?: () => void;
  triggerToast: (msg: string) => void;
}

export function ProductToppingModal({
  product,
  onClose,
  onSaved,
  triggerToast,
}: ProductToppingModalProps) {
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const getAdminToken = () => {
    if (typeof window === 'undefined') return '';
    return (
      localStorage.getItem('brewlite_admin_token') ||
      localStorage.getItem('brewlite-token') ||
      localStorage.getItem('token') ||
      ''
    );
  };

  const loadData = useCallback(async () => {
    if (!product) return;
    try {
      setLoading(true);
      const token = getAdminToken();
      const res = await fetch(`${API}/admin/products/${product.id}/toppings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setToppings(data.allToppings || []);
        setSelectedIds(data.selectedToppingIds || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [product?.id]);

  useEffect(() => {
    if (product) {
      void loadData();
    }
  }, [product, loadData]);

  const toggleTopping = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedIds(toppings.map((t) => t.id));
  };

  const deselectAll = () => {
    setSelectedIds([]);
  };

  const handleSave = async () => {
    if (!product) return;
    try {
      setSaving(true);
      const token = getAdminToken();
      const res = await fetch(`${API}/admin/products/${product.id}/toppings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ toppingIds: selectedIds }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Không thể lưu cấu hình topping');
        return;
      }

      triggerToast(`✓ Đã cập nhật ${selectedIds.length} topping cho "${product.name}"!`);
      if (onSaved) onSaved();
      onClose();
    } catch {
      alert('Lỗi kết nối khi lưu cấu hình topping');
    } finally {
      setSaving(false);
    }
  };

  if (!product) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
    >
      <div
        className="modal-card"
        style={{
          background: '#fff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#ecfdf5',
                color: '#047857',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CupSoda size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                Topping cho: {product.name}
              </h2>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>
                Chọn các loại topping khách được phép chọn khi đặt món này.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              color: '#64748b',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Toolbar: Chọn tất cả / Bỏ chọn */}
        <div
          style={{
            padding: '12px 24px',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
            Đã chọn {selectedIds.length}/{toppings.length} topping
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={selectAll}
              style={{
                background: '#fff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#166534',
                cursor: 'pointer',
              }}
            >
              Chọn tất cả
            </button>
            <button
              type="button"
              onClick={deselectAll}
              style={{
                background: '#fff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#64748b',
                cursor: 'pointer',
              }}
            >
              Bỏ chọn
            </button>
          </div>
        </div>

        {/* List of toppings */}
        <div style={{ padding: '16px 24px', flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '13px' }}>
              Đang tải danh sách topping...
            </div>
          ) : toppings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '13px' }}>
              Chưa có topping nào trong hệ thống. Hãy thêm topping trước tại Quản lý Topping!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {toppings.map((top) => {
                const isChecked = selectedIds.includes(top.id);
                return (
                  <button
                    key={top.id}
                    type="button"
                    onClick={() => toggleTopping(top.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: `1.5px solid ${isChecked ? '#166534' : '#e2e8f0'}`,
                      background: isChecked ? '#ecfdf5' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                      width: '100%',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '5px',
                          border: `1.5px solid ${isChecked ? '#166534' : '#94a3b8'}`,
                          background: isChecked ? '#166534' : '#fff',
                          color: '#fff',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '13px',
                          fontWeight: 800,
                        }}
                      >
                        {isChecked ? '✓' : ''}
                      </span>
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: isChecked ? 700 : 500,
                          color: isChecked ? '#065f46' : '#1e293b',
                        }}
                      >
                        {top.name}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: isChecked ? '#166534' : '#64748b',
                      }}
                    >
                      +{Number(top.price).toLocaleString('vi-VN')} đ
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#fff',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '9px 18px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              background: '#166534',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '9px 20px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Check size={16} />
            <span>{saving ? 'Đang lưu...' : 'Lưu cấu hình'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
