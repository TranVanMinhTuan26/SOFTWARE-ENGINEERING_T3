import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, X, RefreshCw, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { API } from '../../dung-chung/cau-hinh-api';
import type { Topping } from '../../dung-chung/kieu-du-lieu-chung';

type ToppingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  adminToken?: string;
  triggerToast: (msg: string) => void;
};

export function ToppingsModal({ isOpen, onClose, adminToken, triggerToast }: ToppingsModalProps) {
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('10000');
  const [submitting, setSubmitting] = useState(false);

  const getActiveToken = () => {
    return (
      adminToken ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('brewlite_admin_token') ||
          localStorage.getItem('brewlite-token') ||
          localStorage.getItem('token')
        : '')
    );
  };

  const loadToppings = useCallback(async () => {
    try {
      setLoading(true);
      const token = getActiveToken();
      const res = await fetch(`${API}/admin/toppings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setToppings(data);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [adminToken]);

  useEffect(() => {
    if (isOpen) {
      void loadToppings();
    }
  }, [isOpen, loadToppings]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      alert('Vui lòng nhập tên topping');
      return;
    }
    const numPrice = Number(price);
    if (!Number.isInteger(numPrice) || numPrice < 0) {
      alert('Giá topping phải là số nguyên không âm');
      return;
    }

    try {
      setSubmitting(true);
      const token = getActiveToken();
      const res = await fetch(`${API}/admin/toppings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: trimmedName, price: numPrice }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Không thể tạo topping mới');
        return;
      }

      setName('');
      setPrice('10000');
      triggerToast(`Đã thêm topping "${trimmedName}" thành công!`);
      await loadToppings();
    } catch {
      alert('Lỗi kết nối khi tạo topping');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (topping: Topping) => {
    try {
      const token = getActiveToken();
      const res = await fetch(`${API}/admin/toppings/${topping.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ active: !topping.active }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Không thể cập nhật trạng thái');
        return;
      }

      triggerToast(`Đã ${!topping.active ? 'bật' : 'tắt'} topping "${topping.name}"!`);
      await loadToppings();
    } catch {
      alert('Lỗi khi cập nhật trạng thái');
    }
  };

  const handleDelete = async (topping: Topping) => {
    if (!confirm(`Bạn có chắc muốn xóa topping "${topping.name}"?`)) return;

    try {
      const token = getActiveToken();
      const res = await fetch(`${API}/admin/toppings/${topping.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Không thể xóa topping');
        return;
      }

      triggerToast(`Đã xóa topping "${topping.name}"!`);
      await loadToppings();
    } catch {
      alert('Lỗi khi xóa topping');
    }
  };

  if (!isOpen) return null;

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
          maxWidth: '560px',
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
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
              Quản lý Topping đồ uống
            </h2>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0' }}>
              Topping đang mở bán sẽ tự động hiển thị bên giao diện khách hàng.
            </p>
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

        {/* Form thêm mới */}
        <div style={{ padding: '20px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <form onSubmit={handleCreate} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <div style={{ flex: 2 }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Tên topping mới
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Trân châu hoàng kim, Thạch đào..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                }}
              />
            </div>
            <div style={{ flex: 1.2 }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Giá cộng thêm (đ)
              </label>
              <input
                type="number"
                step="1000"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              style={{
                background: '#166534',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: submitting || !name.trim() ? 'not-allowed' : 'pointer',
                opacity: submitting || !name.trim() ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
              }}
            >
              <Plus size={16} />
              <span>Thêm Topping</span>
            </button>
          </form>
        </div>

        {/* Danh sách */}
        <div style={{ padding: '16px 24px', flex: 1, overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
              Danh sách hiện có ({toppings.length})
            </span>
            <button
              type="button"
              onClick={() => void loadToppings()}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#166534',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Làm mới</span>
            </button>
          </div>

          {loading && toppings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '13px' }}>
              Đang tải danh sách topping...
            </div>
          ) : toppings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '13px' }}>
              Chưa có topping nào. Hãy thêm topping đầu tiên ở biểu mẫu trên!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {toppings.map((top) => (
                <div
                  key={top.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    background: top.active ? '#ffffff' : '#f8fafc',
                    opacity: top.active ? 1 : 0.7,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: top.active ? '#dcfce7' : '#f1f5f9',
                        color: top.active ? '#15803d' : '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '13px',
                      }}
                    >
                      🥤
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>
                        {top.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#166534', fontWeight: 600 }}>
                        +{Number(top.price).toLocaleString('vi-VN')} đ
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(top)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        background: top.active ? '#ecfdf5' : '#f1f5f9',
                        color: top.active ? '#047857' : '#64748b',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      title={top.active ? 'Đang mở bán (Bấm để ẩn)' : 'Đang ẩn (Bấm để mở bán)'}
                    >
                      {top.active ? <Eye size={13} /> : <EyeOff size={13} />}
                      <span>{top.active ? 'Đang mở bán' : 'Tạm ẩn'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(top)}
                      style={{
                        padding: '6px 8px',
                        borderRadius: '6px',
                        border: '1px solid #fecaca',
                        background: '#fef2f2',
                        color: '#dc2626',
                        cursor: 'pointer',
                      }}
                      title="Xóa topping"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
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
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#e2e8f0',
              color: '#334155',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 18px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

