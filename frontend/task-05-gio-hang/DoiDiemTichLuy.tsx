import { money } from '../task-03-thuc-don/du-lieu-danh-muc';

type PointsRedemptionProps = {
  token: string;
  userPoints: number;
  minPointRedeem: number;
  usePoints: boolean;
  setUsePoints: (val: boolean) => void;
  pointsToRedeem: number;
  setPointsToRedeem: (val: number) => void;
  maxRedeemablePoints: number;
  actualPointsUsed: number;
  pointToMoneyRate?: number;
};

export function PointsRedemption(props: PointsRedemptionProps) {
  const {
    token, userPoints, minPointRedeem, usePoints, setUsePoints,
    pointsToRedeem, setPointsToRedeem, maxRedeemablePoints, actualPointsUsed,
    pointToMoneyRate = 100,
  } = props;

  return (
    <div
      style={{
        margin: '12px 0',
        padding: '12px 14px',
        background: '#fffbeb',
        borderRadius: '10px',
        border: '1.5px solid #fde68a',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '15px' }}>⭐</span>
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#92400e' }}>
            Dùng điểm tích lũy
          </span>
        </div>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 700,
            color: '#b45309',
            background: '#fef3c7',
            padding: '2px 8px',
            borderRadius: '12px',
          }}
        >
          Có: {userPoints} điểm
        </span>
      </div>

      {token ? (
        userPoints < minPointRedeem || maxRedeemablePoints < minPointRedeem ? (
          <div
            style={{
              padding: '10px 12px',
              background: '#fffbeb',
              border: '1px dashed #f59e0b',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#b45309',
              lineHeight: '1.4',
            }}
          >
            🔒 <strong>Chính sách tích điểm:</strong> Cần đạt tối thiểu <strong>{minPointRedeem} điểm</strong> để đổi mã giảm giá.
            <div style={{ marginTop: '4px', fontSize: '11px', color: '#92400e' }}>
              {userPoints < minPointRedeem ? (
                <>
                  Bạn hiện có <strong>{userPoints} điểm</strong> (cần tích thêm {Math.max(0, minPointRedeem - userPoints)} điểm).
                </>
              ) : (
                <>
                  Đơn hàng hiện tại tối đa chỉ quy đổi được <strong>{maxRedeemablePoints} điểm</strong> (thấp hơn mức tối thiểu {minPointRedeem} điểm).
                </>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  color: '#78350f',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                <input
                  type="checkbox"
                  checked={usePoints}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setUsePoints(checked);
                    if (checked && (pointsToRedeem === 0 || pointsToRedeem < minPointRedeem)) {
                      setPointsToRedeem(maxRedeemablePoints);
                    }
                  }}
                  style={{ accentColor: '#d97706', width: '16px', height: '16px', cursor: 'pointer' }}
                />
                Dùng điểm giảm giá (1 điểm = {money(pointToMoneyRate)} | Tối thiểu: {minPointRedeem} điểm)
              </label>
              {usePoints && maxRedeemablePoints > 0 && (
                <button
                  type="button"
                  onClick={() => setPointsToRedeem(maxRedeemablePoints)}
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#b45309',
                    background: '#fef3c7',
                    border: '1px solid #fcd34d',
                    borderRadius: '6px',
                    padding: '2px 6px',
                    cursor: 'pointer',
                  }}
                >
                  Dùng tối đa ({maxRedeemablePoints} điểm)
                </button>
              )}
            </div>

            {usePoints && (
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="number"
                  min={minPointRedeem}
                  max={maxRedeemablePoints}
                  value={pointsToRedeem || ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (isNaN(val) || val <= 0) setPointsToRedeem(0);
                    else setPointsToRedeem(Math.min(val, maxRedeemablePoints));
                  }}
                  onBlur={() => {
                    if (pointsToRedeem > 0 && pointsToRedeem < minPointRedeem) {
                      setPointsToRedeem(Math.min(minPointRedeem, maxRedeemablePoints));
                    }
                  }}
                  placeholder={`Nhập điểm (${minPointRedeem} - ${maxRedeemablePoints})`}
                  style={{
                    flex: 1,
                    height: '34px',
                    padding: '0 10px',
                    borderRadius: '8px',
                    border: '1px solid #fcd34d',
                    fontSize: '12px',
                    fontWeight: 700,
                    background: '#fff',
                  }}
                />
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#16a34a', whiteSpace: 'nowrap' }}>
                  - {money(actualPointsUsed * pointToMoneyRate)}
                </span>
              </div>
            )}
          </div>
        )
      ) : (
        <div style={{ fontSize: '11px', color: '#92400e', fontStyle: 'italic' }}>
          Vui lòng đăng nhập để sử dụng và tích lũy điểm thưởng.
        </div>
      )}
    </div>
  );
}

