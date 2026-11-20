import { CheckCircle2, TicketPercent } from 'lucide-react';
import type { PromotionItem } from '../dung-chung/kieu-du-lieu-chung';
import { money } from '../task-03-thuc-don/du-lieu-danh-muc';

type VoucherSectionProps = {
  availablePromotions: PromotionItem[];
  voucher: string;
  setVoucher: (code: string) => void;
  voucherApplied: boolean;
  selectedPromo: PromotionItem | null;
  discountAmount: number;
  handleSelectPromo: (promo: PromotionItem) => Promise<void>;
  handleRemovePromo: () => Promise<void>;
  applyVoucher: () => Promise<void>;
};

export function VoucherSection(props: VoucherSectionProps) {
  const {
    availablePromotions, voucher, setVoucher, voucherApplied,
    selectedPromo, discountAmount, handleSelectPromo, handleRemovePromo, applyVoucher,
  } = props;

  return (
    <div
      style={{
        margin: '14px 0',
        padding: '12px 14px',
        background: '#f8fafc',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
        }}
      >
        <span
          style={{
            fontSize: '13px',
            fontWeight: 700,
            color: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <TicketPercent size={16} color="#166534" /> Mã giảm giá từ cửa hàng
        </span>
        {voucherApplied && (
          <button
            onClick={handleRemovePromo}
            style={{
              background: 'none',
              border: 'none',
              color: '#dc2626',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Bỏ chọn
          </button>
        )}
      </div>

      {/* 1. Dropdown chọn mã ưu đãi lấy trực tiếp từ Admin */}
      <div style={{ marginBottom: '8px' }}>
        <select
          value={selectedPromo?.code || ''}
          onChange={(e) => {
            const code = e.target.value;
            if (!code) {
              handleRemovePromo();
            } else {
              const found = availablePromotions.find((p) => p.code === code);
              if (found) handleSelectPromo(found);
            }
          }}
          style={{
            width: '100%',
            height: '40px',
            padding: '0 12px',
            borderRadius: '8px',
            border: voucherApplied ? '1.5px solid #16a34a' : '1px solid #cbd5e1',
            background: voucherApplied ? '#f0fdf4' : '#fff',
            fontSize: '13px',
            fontWeight: 600,
            color: voucherApplied ? '#166534' : '#1e293b',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="">-- Chọn mã ưu đãi từ quán ({availablePromotions.length} mã khả dụng) --</option>
          {availablePromotions.map((p) => (
            <option key={p.id} value={p.code}>
              🎟️ [{p.code}] - {p.name} (Giảm {p.discount})
            </option>
          ))}
        </select>
      </div>

      {/* 2. Nhập mã thủ công nếu khách có voucher riêng */}
      {!voucherApplied && (
        <div className="voucher-input-box" style={{ margin: '0', display: 'flex', gap: '6px' }}>
          <input
            type="text"
            value={voucher}
            onChange={(e) => setVoucher(e.target.value.toUpperCase())}
            placeholder="Hoặc nhập mã (ví dụ: BREW20, COMBO15)"
            style={{ textTransform: 'uppercase', height: '36px', fontSize: '12px' }}
          />
          <button className="btn-apply" onClick={applyVoucher} style={{ height: '36px', padding: '0 14px' }}>
            Áp dụng
          </button>
        </div>
      )}

      {/* 3. Thẻ xác nhận áp dụng voucher thành công */}
      {voucherApplied && (selectedPromo || voucher) && (
        <div
          style={{
            marginTop: '8px',
            padding: '10px 12px',
            background: '#ecfdf5',
            border: '1px solid #86efac',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                fontWeight: 800,
                color: '#166534',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <CheckCircle2 size={16} color="#16a34a" /> Mã: {selectedPromo ? selectedPromo.code : voucher} ({selectedPromo ? selectedPromo.discount : money(discountAmount)})
            </div>
            <div style={{ color: '#15803d', fontSize: '11px', marginTop: '2px' }}>
              {selectedPromo ? `${selectedPromo.name} · HSD: ${selectedPromo.timeRange}` : 'Áp dụng mã giảm giá thành công'}
            </div>
          </div>
          <span style={{ fontWeight: 800, color: '#16a34a', fontSize: '13px' }}>
            -{money(discountAmount)}
          </span>
        </div>
      )}
    </div>
  );
}

