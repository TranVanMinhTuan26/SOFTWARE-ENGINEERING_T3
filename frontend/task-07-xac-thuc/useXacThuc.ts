import { useCallback, useEffect, useRef, useState } from 'react';
import type { AccountProfile } from '../dung-chung/kieu-du-lieu-chung';
import { API } from '../dung-chung/cau-hinh-api';
import { authenticate, clearStoredAuth, requestForgotPassword, resetPassword } from './api-xac-thuc';
import { DEMO_HISTORY } from '../task-03-thuc-don/du-lieu-danh-muc';
import { useCartContext } from '../task-05-gio-hang/NguCanhGioHang';

export type AuthFlowMode = 'login' | 'register' | 'forgot' | 'reset';

export interface UseAuthReturn {
  token: string;
  email: string;
  setEmail: React.Dispatch<React.SetStateAction<string>>;
  fullName: string;
  setFullName: React.Dispatch<React.SetStateAction<string>>;
  phone: string;
  setPhone: React.Dispatch<React.SetStateAction<string>>;
  userPoints: number;
  setUserPoints: React.Dispatch<React.SetStateAction<number>>;
  userRole: string;
  setUserRole: React.Dispatch<React.SetStateAction<string>>;
  accountMenuOpen: boolean;
  setAccountMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  accountMenuRef: React.RefObject<HTMLDivElement | null>;
  accountProfile: AccountProfile | null;
  accountProfileLoading: boolean;
  accountProfileError: string;
  saveAccountProfile: (profile: { fullName: string; phone: string }) => Promise<void>;
  password: string;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
  resetTokenInput: string;
  setResetTokenInput: React.Dispatch<React.SetStateAction<string>>;
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  authMode: AuthFlowMode;
  setAuthMode: React.Dispatch<React.SetStateAction<AuthFlowMode>>;
  authError: string;
  setAuthError: React.Dispatch<React.SetStateAction<string>>;
  authSuccessMsg: string;
  setAuthSuccessMsg: React.Dispatch<React.SetStateAction<string>>;
  isSubmitting: boolean;
  handleAuth: (e: React.FormEvent) => void;
  xuLyXacThuc?: (e: React.FormEvent) => void;
  handleLogout: () => void;
  xuLyDangXuat?: () => void;
  loadUserProfile: (authToken: string) => Promise<void>;
  taiThongTinNguoiDung?: (authToken: string) => Promise<void>;
  openAccountProfile: (setModal: (m: string) => void) => Promise<void>;
  moThongTinTaiKhoan?: (setModal: (m: string) => void) => Promise<void>;
  restoreSession: () => { storedToken: string | null; storedEmail: string | null };
  khoiPhucPhienDangNhap?: () => { storedToken: string | null; storedEmail: string | null };
  luuThongTinTaiKhoan?: (profile: { fullName: string; phone: string }) => Promise<void>;
}

export function useAuth(
  callbacks?: {
    setCart?: React.Dispatch<React.SetStateAction<any[]>>;
    setModal?: React.Dispatch<React.SetStateAction<string>>;
    setHistoryOrders?: React.Dispatch<React.SetStateAction<any[]>>;
    loadUserOrders?: (token: string) => void;
    loadCartFromDatabase?: (token: string) => void;
  }
): UseAuthReturn {
  const { clearCart } = useCartContext();
  const [token, setToken] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [userPoints, setUserPoints] = useState<number>(0);
  const [userRole, setUserRole] = useState<string>('CUSTOMER');
  const [accountMenuOpen, setAccountMenuOpen] = useState<boolean>(false);
  const [accountProfile, setAccountProfile] = useState<AccountProfile | null>(null);
  const [accountProfileLoading, setAccountProfileLoading] = useState<boolean>(false);
  const [accountProfileError, setAccountProfileError] = useState<string>('');
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const [password, setPassword] = useState<string>('');
  const [resetTokenInput, setResetTokenInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<AuthFlowMode>('login');
  const [authError, setAuthError] = useState<string>('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Close account menu on outside click
  useEffect(() => {
    if (!accountMenuOpen) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer);
  }, [accountMenuOpen]);

  const handleLogout = useCallback(() => {
    setAccountMenuOpen(false);
    setAccountProfile(null);
    callbacks?.setModal?.('');
    clearStoredAuth();
    clearCart();
    callbacks?.setCart?.([]);
    setToken('');
    setEmail('');
    setFullName('');
    setPhone('');
    setUserPoints(0);
    setUserRole('CUSTOMER');
    callbacks?.setHistoryOrders?.(DEMO_HISTORY);
  }, [callbacks, clearCart]);

  const loadUserProfile = useCallback(async (authToken: string) => {
    try {
      const res = await fetch(`${API}/auth/profile`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const u = await res.json();
        const userData = u?.user || u;
        if (userData) {
          if (userData.status === 'LOCKED' || userData.status === 'Đã khóa') {
            handleLogout();
            alert('⚠️ Tài khoản của bạn đã bị Quản trị viên KHÓA. Bạn đã được tự động đăng xuất!');
            return;
          }

          setFullName(userData.fullName || '');
          setPhone(userData.phone || '');
          const points = typeof userData.loyaltyPoints === 'number'
            ? userData.loyaltyPoints
            : (typeof u.loyaltyPoints === 'number' ? u.loyaltyPoints : 0);
          setUserPoints(points);
          if (userData.email) setEmail(userData.email);
          const r = (userData.role || 'CUSTOMER').toUpperCase();
          setUserRole(r);
          localStorage.setItem('brewlite-role', r);
        }
      }
    } catch {
      // ignore
    }
  }, [handleLogout]);

  const openAccountProfile = useCallback(async (setModal: (m: string) => void) => {
    setAccountMenuOpen(false);
    setAccountProfileError('');
    setAccountProfile(null);
    setModal('profile');
    setAccountProfileLoading(true);
    try {
      const response = await fetch(`${API}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Không tải được thông tin tài khoản.');
      }
      const profile = result.user || result;
      setAccountProfile(profile);
      setFullName(profile.fullName || '');
      setPhone(profile.phone || '');
      setEmail(profile.email || email);
      setUserPoints(typeof profile.loyaltyPoints === 'number' ? profile.loyaltyPoints : 0);
      setUserRole((profile.role || 'CUSTOMER').toUpperCase());
    } catch (error) {
      setAccountProfileError(error instanceof Error ? error.message : 'Không tải được thông tin tài khoản.');
    } finally {
      setAccountProfileLoading(false);
    }
  }, [token, email]);

  const saveAccountProfile = useCallback(async (profile: { fullName: string; phone: string }) => {
    if (!token) {
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
    const response = await fetch(`${API}/users/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profile),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = Array.isArray(result.message) ? result.message.join(', ') : result.message;
      throw new Error(message || 'Không thể cập nhật thông tin tài khoản.');
    }
    const updatedProfile = result.user || result;
    setAccountProfile(updatedProfile);
    setFullName(updatedProfile.fullName || '');
    setPhone(updatedProfile.phone || '');
  }, [token]);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    setAuthSuccessMsg('');
    setIsSubmitting(true);
    try {
      if (authMode === 'forgot') {
        const data = await requestForgotPassword(API, email);
        setAuthSuccessMsg(
          data.resetToken
            ? `Mã OTP demo local: ${data.resetToken}. Mã chưa được gửi qua email hoặc SMS.`
            : data.message || 'Nếu email tồn tại, mã khôi phục đã được tạo cho chế độ demo local.'
        );
        setAuthMode('reset');
        return;
      }

      if (authMode === 'reset') {
        await resetPassword(API, {
          email,
          token: resetTokenInput.trim(),
          newPassword: password,
        });
        setAuthSuccessMsg('Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.');
        setAuthMode('login');
        setPassword('');
        setResetTokenInput('');
        return;
      }

      const normalizedEmail = email.toLowerCase().trim();

      if (authMode === 'register') {
        const cleanedPhone = phone.replace(/[\s.-]/g, '');
        if (!cleanedPhone) {
          throw new Error('Vui lòng nhập số điện thoại để đăng ký!');
        }
        if (!/^0\d{9}$/.test(cleanedPhone)) {
          throw new Error('Số điện thoại không hợp lệ! Vui lòng nhập đúng 10 số bắt đầu bằng số 0 (ví dụ: 0901234567).');
        }
      }

      const bodyPayload =
        authMode === 'register'
          ? {
              email: normalizedEmail,
              password,
              fullName: fullName.trim() || undefined,
              phone: phone.replace(/[\s.-]/g, '') || undefined,
            }
          : { email: normalizedEmail, password };

      const data = await authenticate(API, authMode, bodyPayload);
      const userObj = data.user || {};
      if (userObj.status === 'LOCKED' || userObj.status === 'Đã khóa') {
        throw new Error('Tài khoản của bạn đã bị khóa bởi Quản trị viên. Vui lòng liên hệ hỗ trợ!');
      }
      const returnedRole = (userObj.role || 'CUSTOMER').toUpperCase();
      localStorage.setItem('brewlite-token', data.accessToken);
      localStorage.setItem('brewlite-email', email);
      localStorage.setItem('brewlite-role', returnedRole);
      setToken(data.accessToken);

      // RÀNG BUỘC PHÂN QUYỀN VAI TRÒ
      if (returnedRole !== 'CUSTOMER') {
        const mappedAdminRole =
          returnedRole === 'ADMIN'
            ? 'Admin'
            : returnedRole === 'MANAGER'
            ? 'Manager'
            : returnedRole === 'BARISTA'
            ? 'Pha chế'
            : returnedRole === 'INVENTORY' || returnedRole === 'KHO'
            ? 'Kho'
            : 'Nhân viên';
        setAuthSuccessMsg(`Đăng nhập thành công với vai trò ${mappedAdminRole}! Đang chuyển hướng sang giao diện quản trị...`);
        setTimeout(() => {
          window.location.href = '/admin';
        }, 700);
        return;
      }

      setUserRole('CUSTOMER');
      if (userObj.fullName) localStorage.setItem('brewlite-fullname', userObj.fullName);
      else if (fullName.trim()) localStorage.setItem('brewlite-fullname', fullName.trim());
      if (userObj.phone) localStorage.setItem('brewlite-phone', userObj.phone);
      else if (phone.trim()) localStorage.setItem('brewlite-phone', phone.trim());

      callbacks?.setModal?.('');
      loadUserProfile(data.accessToken);
      callbacks?.loadUserOrders?.(data.accessToken);
      callbacks?.loadCartFromDatabase?.(data.accessToken);
    } catch (err: any) {
      setAuthError(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Kiểm tra định kỳ trạng thái tài khoản từ Database
  useEffect(() => {
    const checkUserStatus = () => {
      try {
        const activeTok = localStorage.getItem('brewlite-token') || localStorage.getItem('brewlite_token');
        if (activeTok) {
          loadUserProfile(activeTok);
        }
      } catch {}
    };

    window.addEventListener('focus', checkUserStatus);
    const interval = setInterval(checkUserStatus, 15000);
    return () => {
      window.removeEventListener('focus', checkUserStatus);
      clearInterval(interval);
    };
  }, [loadUserProfile]);

  // Tự động khôi phục phiên đăng nhập ngay khi hook mount
  useEffect(() => {
    try {
      const storedToken =
        localStorage.getItem('brewlite-token') ||
        localStorage.getItem('brewlite_token') ||
        localStorage.getItem('token');
      const storedEmail =
        localStorage.getItem('brewlite-email') ||
        localStorage.getItem('brewlite_email') ||
        localStorage.getItem('email');
      const storedRole = localStorage.getItem('brewlite-role');

      if (storedToken) {
        setToken(storedToken);
        if (storedEmail) setEmail(storedEmail);
        if (storedRole) setUserRole(storedRole);
        void loadUserProfile(storedToken);
      }
    } catch {
      // ignore
    }
  }, [loadUserProfile]);

  function restoreSession() {
    const storedToken = localStorage.getItem('brewlite-token') || localStorage.getItem('brewlite_token');
    const storedEmail = localStorage.getItem('brewlite-email') || localStorage.getItem('brewlite_email');
    if (storedToken) {
      setToken(storedToken);
      if (storedEmail) setEmail(storedEmail);
    }
    return { storedToken, storedEmail };
  }

  return {
    token,
    email,
    setEmail,
    fullName,
    setFullName,
    phone,
    setPhone,
    userPoints,
    setUserPoints,
    userRole,
    setUserRole,
    accountMenuOpen,
    setAccountMenuOpen,
    accountMenuRef,
    accountProfile,
    accountProfileLoading,
    accountProfileError,
    saveAccountProfile,
    password,
    setPassword,
    resetTokenInput,
    setResetTokenInput,
    showPassword,
    setShowPassword,
    authMode,
    setAuthMode,
    authError,
    setAuthError,
    authSuccessMsg,
    setAuthSuccessMsg,
    isSubmitting,
    handleAuth,
    xuLyXacThuc: handleAuth,
    handleLogout,
    xuLyDangXuat: handleLogout,
    loadUserProfile,
    taiThongTinNguoiDung: loadUserProfile,
    openAccountProfile,
    moThongTinTaiKhoan: openAccountProfile,
    restoreSession,
    khoiPhucPhienDangNhap: restoreSession,
    luuThongTinTaiKhoan: saveAccountProfile,
  };
}
