import type { Dispatch, FormEvent, SetStateAction } from 'react';
import { Eye, EyeOff, KeyRound, Lock, Mail, Phone, User } from 'lucide-react';

type AuthFlowMode = 'login' | 'register' | 'forgot' | 'reset';
const LOCAL_DEMO_PASSWORD_RESET =
  process.env.NEXT_PUBLIC_ENABLE_LOCAL_DEMO_PASSWORD_RESET !== 'false';

type AuthModalProps = {
  modal: string;
  setModal: Dispatch<SetStateAction<string>>;
  authMode: AuthFlowMode;
  setAuthMode: Dispatch<SetStateAction<AuthFlowMode>>;
  authError: string;
  setAuthError: Dispatch<SetStateAction<string>>;
  authSuccessMsg: string;
  setAuthSuccessMsg: Dispatch<SetStateAction<string>>;
  handleAuth: (event: FormEvent) => void;
  fullName: string;
  setFullName: Dispatch<SetStateAction<string>>;
  phone: string;
  setPhone: Dispatch<SetStateAction<string>>;
  email: string;
  setEmail: Dispatch<SetStateAction<string>>;
  resetTokenInput: string;
  setResetTokenInput: Dispatch<SetStateAction<string>>;
  showPassword: boolean;
  setShowPassword: Dispatch<SetStateAction<boolean>>;
  password: string;
  setPassword: Dispatch<SetStateAction<string>>;
  isSubmitting: boolean;
};

export function AuthModal(props: AuthModalProps) {
  const {
    modal, setModal, authMode, setAuthMode, authError, setAuthError,
    authSuccessMsg, setAuthSuccessMsg, handleAuth, fullName, setFullName,
    phone, setPhone, email, setEmail, resetTokenInput, setResetTokenInput,
    showPassword, setShowPassword, password, setPassword, isSubmitting,
  } = props;

  return <>{modal === 'login' && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModal('');
          }}
        >
          <div className="modal-dialog">
            <span className="login-leaves-left">🌿</span>
            <span className="login-leaves-right">🌿</span>

            <button className="modal-close" onClick={() => setModal('')}>
              ✕
            </button>

            <div className="login-head">
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: 'var(--green)',
                  marginBottom: '4px',
                }}
              >
                🌿 BrewLite
              </div>
              <h2>
                {authMode === 'login'
                  ? 'Đăng nhập'
                  : authMode === 'register'
                  ? 'Đăng ký tài khoản'
                  : authMode === 'forgot'
                  ? 'Quên mật khẩu'
                  : 'Đặt lại mật khẩu'}
              </h2>
              <p>
                {authMode === 'login'
                  ? 'Chào mừng bạn trở lại! Vui lòng đăng nhập để tiếp tục.'
                  : authMode === 'register'
                  ? 'Tạo tài khoản để lưu đơn hàng và tích lũy điểm thưởng.'
                  : authMode === 'forgot'
                  ? LOCAL_DEMO_PASSWORD_RESET
                    ? 'Nhập email để tạo mã OTP demo local. Mã sẽ hiển thị trong ứng dụng, chưa được gửi qua email hoặc SMS.'
                    : 'Đặt lại mật khẩu chỉ khả dụng trong môi trường kiểm thử local.'
                  : 'Nhập mã OTP demo và mật khẩu mới để hoàn tất.'}
              </p>
            </div>

            {authError && (
              <div
                style={{
                  background: '#fee2e2',
                  color: '#b91c1c',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  marginBottom: '12px',
                }}
              >
                {authError}
              </div>
            )}

            {authSuccessMsg && (
              <div
                style={{
                  background: '#dcfce7',
                  color: '#15803d',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  marginBottom: '12px',
                  lineHeight: 1.4,
                }}
              >
                {authSuccessMsg}
              </div>
            )}

            <form onSubmit={handleAuth}>
              {authMode === 'register' && (
                <>
                  <div className="form-group">
                    <div className="form-input-wrap">
                      <User size={16} color="#94a3b8" />
                      <input
                        type="text"
                        placeholder="Họ và tên của bạn"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <div className="form-input-wrap">
                      <Phone size={16} color="#94a3b8" />
                      <input
                        type="tel"
                        required
                        placeholder="Số điện thoại (10 số, bắt đầu bằng 0)"
                        pattern="0[0-9]{9}"
                        maxLength={10}
                        title="Số điện thoại phải gồm đúng 10 chữ số và bắt đầu bằng số 0 (ví dụ: 0901234567)"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, '').slice(0, 10))}
                      />
                    </div>
                  </div>
                </>
              )}

              {authMode !== 'reset' && (
              <div className="form-group">
                <div className="form-input-wrap">
                  <Mail size={16} color="#94a3b8" />
                  <input
                    type="email"
                    required
                    placeholder="Email của bạn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              )}

              {authMode === 'reset' && (
                <div className="form-group">
                  <div className="form-input-wrap">
                    <KeyRound size={16} color="#94a3b8" />
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      required
                      pattern="[0-9]{6}"
                      maxLength={6}
                      placeholder="Mã OTP (6 chữ số)"
                      value={resetTokenInput}
                      onChange={(e) => setResetTokenInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    />
                  </div>
                </div>
              )}

              {authMode !== 'forgot' && (
              <div className="form-group">
                <div className="form-input-wrap">
                  <Lock size={16} color="#94a3b8" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={authMode === 'login' ? undefined : 6}
                    autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                    placeholder={authMode === 'reset' ? 'Mật khẩu mới' : 'Mật khẩu'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ color: '#94a3b8' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              )}

              {authMode === 'login' && (
                <div className="login-options">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked /> Ghi nhớ
                  </label>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setAuthMode('forgot');
                      setAuthError('');
                      setAuthSuccessMsg('');
                      setPassword('');
                      setResetTokenInput('');
                    }}
                    style={{ color: 'var(--green)', fontWeight: 600, textDecoration: 'none' }}
                  >
                    Quên mật khẩu?
                  </a>
                </div>
              )}

              <button
                className="btn-full"
                type="submit"
                disabled={isSubmitting || (authMode === 'forgot' && !LOCAL_DEMO_PASSWORD_RESET)}
              >
                {isSubmitting
                  ? 'Đang xử lý...'
                  : authMode === 'login'
                  ? 'Đăng nhập'
                  : authMode === 'register'
                  ? 'Đăng ký tài khoản'
                  : authMode === 'forgot'
                  ? 'Tạo mã OTP demo'
                  : 'Xác nhận đặt lại mật khẩu'}
              </button>
            </form>

            {authMode === 'forgot' || authMode === 'reset' ? (
              <div
                style={{
                  textAlign: 'center',
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  marginTop: '16px',
                }}
              >
                <button
                  type="button"
                  style={{
                    color: 'var(--green)',
                    fontWeight: 700,
                    background: 'none',
                    textDecoration: 'underline',
                  }}
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError('');
                    setAuthSuccessMsg('');
                    setPassword('');
                    setResetTokenInput('');
                  }}
                >
                  ← Quay lại đăng nhập
                </button>
              </div>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                  marginTop: '20px',
                }}
              >
                {authMode === 'login' ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
                <button
                  type="button"
                  style={{
                    color: 'var(--green)',
                    fontWeight: 700,
                    background: 'none',
                    textDecoration: 'underline',
                  }}
                  onClick={() => {
                    setAuthMode(authMode === 'login' ? 'register' : 'login');
                    setAuthError('');
                    setAuthSuccessMsg('');
                  }}
                >
                  {authMode === 'login' ? 'Đăng ký ngay' : 'Đăng nhập'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}</>;
}
