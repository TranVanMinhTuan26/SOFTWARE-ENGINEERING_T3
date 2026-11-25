import Link from 'next/link';
import { money } from '../task-03-thuc-don/du-lieu-danh-muc';

export type PaymentSuccessOrder = {
  code: string;
  amount: number;
  earnedPoints: number;
  pointsUsed: number;
};

type PaymentSuccessModalProps = {
  order: PaymentSuccessOrder;
  onClose: () => void;
};

export function PaymentSuccessModal({ order, onClose }: PaymentSuccessModalProps) {
  // Hộp thoại xác nhận đơn thanh toán thành công: hiện mã đơn, số tiền và điểm.
  // onClose được gọi khi bấm nền hoặc nút tiếp tục; click trong hộp thoại không
  // đóng modal vì sự kiện được chặn nổi bọt ở phần tử dialog.
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        style={{ maxWidth: '440px', textAlign: 'center', padding: '32px 24px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            background: '#dcfce7',
            color: '#15803d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '32px',
          }}
        >
          ✓
        </div>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 800,
            color: '#166534',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          Thanh toán thành công
        </span>
        <h2
          style={{
            fontSize: '20px',
            fontWeight: 800,
            color: 'var(--green, #173f35)',
            margin: '4px 0 10px',
          }}
        >
          Đơn hàng {order.code}
        </h2>
        <p
          style={{
            fontSize: '13px',
            color: 'var(--text-muted, #64748b)',
            margin: '0 0 18px',
            lineHeight: 1.5,
          }}
        >
          Quán đã nhận được thanh toán {money(order.amount)} qua cổng VNPay Sandbox và đang chuyển đơn cho Barista pha chế!
        </p>

        <div
          style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '12px',
            padding: '12px 14px',
            marginBottom: '20px',
            textAlign: 'left',
            fontSize: '13px',
          }}
        >
          <div
            style={{
              fontWeight: 700,
              color: '#92400e',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>⭐</span>
            <span>Điểm thưởng tích lũy: +{order.earnedPoints} điểm</span>
          </div>
          {order.pointsUsed > 0 && (
            <div style={{ fontSize: '11px', color: '#b45309', marginTop: '3px' }}>
              (Đã áp dụng giảm giá {money(order.pointsUsed * 1000)} từ {order.pointsUsed} điểm)
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn-full"
            onClick={onClose}
            style={{ flex: 1, margin: 0, background: '#eaf4eb', color: '#173f35' }}
          >
            Tiếp tục mua sắm
          </button>
          <Link
            href="/orders"
            style={{
              flex: 1,
              background: 'var(--green, #173f35)',
              color: '#fff',
              padding: '12px',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '13px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            Theo dõi đơn hàng →
          </Link>
        </div>
      </div>
    </div>
  );
}

