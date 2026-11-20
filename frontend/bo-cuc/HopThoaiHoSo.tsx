import { useEffect, useState, type FormEvent } from 'react';
import { User } from 'lucide-react';
import type { AccountProfile } from '../dung-chung/kieu-du-lieu-chung';

type ProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
  accountProfile: AccountProfile | null;
  accountProfileLoading: boolean;
  accountProfileError: string;
  onSaveProfile: (profile: { fullName: string; phone: string }) => Promise<void>;
};

export function ProfileModal(props: ProfileModalProps) {
  const {
    isOpen,
    onClose,
    accountProfile,
    accountProfileLoading,
    accountProfileError,
    onSaveProfile,
  } = props;
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  useEffect(() => {
    setFullName(accountProfile?.fullName || '');
    setPhone(accountProfile?.phone || '');
    setSaveError('');
    setSaveSuccess('');
  }, [accountProfile]);

  if (!isOpen) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setSaveError('');
    setSaveSuccess('');
    try {
      await onSaveProfile({ fullName: fullName.trim(), phone: phone.trim() });
      setSaveSuccess('Đã lưu thông tin tài khoản.');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Không thể cập nhật thông tin tài khoản.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal-dialog account-profile-dialog" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" aria-label="Đóng thông tin tài khoản" onClick={onClose}>
          ✕
        </button>
        <div className="account-profile-heading">
          <div className="account-profile-avatar">
            <User size={22} />
          </div>
          <div>
            <h2>Thông tin tài khoản</h2>
            <p>Thông tin khách hàng đang đăng nhập</p>
          </div>
        </div>

        {accountProfileLoading ? (
          <div className="account-profile-state">Đang tải thông tin tài khoản...</div>
        ) : accountProfileError ? (
          <div className="account-profile-error" role="alert">{accountProfileError}</div>
        ) : accountProfile ? (
          <form onSubmit={handleSubmit}>
            <div className="account-profile-details">
              <label className="account-profile-row">
                <span>Họ và tên</span>
                <input
                  className="account-profile-input"
                  type="text"
                  maxLength={120}
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  autoComplete="name"
                />
              </label>
              <div className="account-profile-row">
                <span>Email</span>
                <strong>{accountProfile.email}</strong>
              </div>
              <label className="account-profile-row">
                <span>Số điện thoại</span>
                <input
                  className="account-profile-input"
                  type="tel"
                  maxLength={20}
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  autoComplete="tel"
                  placeholder="Ví dụ: 0901234567"
                />
              </label>
              <div className="account-profile-row">
                <span>Vai trò</span>
                <strong>{accountProfile.role === 'CUSTOMER' ? 'Khách hàng' : accountProfile.role}</strong>
              </div>
              <div className="account-profile-row">
                <span>Điểm tích lũy</span>
                <strong>⭐ {accountProfile.loyaltyPoints}</strong>
              </div>
              <div className="account-profile-row">
                <span>Ngày tham gia</span>
                <strong>
                  {accountProfile.createdAt
                    ? new Date(accountProfile.createdAt).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Không có thông tin'}
                </strong>
              </div>
            </div>
            {saveError && <div className="account-profile-error" role="alert">{saveError}</div>}
            {saveSuccess && <div className="account-profile-success" role="status">{saveSuccess}</div>}
            <button className="account-profile-save" type="submit" disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
