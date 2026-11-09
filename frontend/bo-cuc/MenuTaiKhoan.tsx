import Link from 'next/link';
import { ChevronDown, History, LogOut, User } from 'lucide-react';
import type { RefObject } from 'react';

type AccountMenuProps = {
  fullName: string;
  email: string;
  userPoints: number;
  userRole: string;
  accountMenuOpen: boolean;
  setAccountMenuOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  accountMenuRef: RefObject<HTMLDivElement | null>;
  openAccountProfile: () => void;
  handleLogout: () => void;
};

export function AccountMenu(props: AccountMenuProps) {
  const {
    fullName, email, userPoints, userRole, accountMenuOpen,
    setAccountMenuOpen, accountMenuRef, openAccountProfile, handleLogout,
  } = props;

  return (
    <div className="account-actions">
      <div
        ref={accountMenuRef}
        className="account-menu"
        onKeyDown={(event) => {
          if (event.key === 'Escape') setAccountMenuOpen(false);
        }}
      >
        <button
          type="button"
          className="account-trigger"
          aria-label="Mở menu tài khoản"
          aria-expanded={accountMenuOpen}
          aria-controls="account-menu-dropdown"
          onClick={() => setAccountMenuOpen((open: boolean) => !open)}
        >
          <User size={16} />
          <span>{fullName || email || 'Thành viên'}</span>
          <span className="account-points">⭐ {userPoints}</span>
          <ChevronDown size={15} />
        </button>
        {accountMenuOpen && (
          <div className="account-dropdown" id="account-menu-dropdown">
            <div className="account-menu-heading">
              {fullName || email || 'Thành viên'}
              <small>{email}</small>
            </div>
            <button
              type="button"
              className="account-menu-item"
              onClick={openAccountProfile}
            >
              <User size={16} />
              Thông tin tài khoản
            </button>
            <Link
              className="account-menu-item"
              href="/orders"
              onClick={() => setAccountMenuOpen(false)}
            >
              <History size={16} />
              Lịch sử đơn hàng
            </Link>
            <button
              type="button"
              className="account-menu-item"
              onClick={handleLogout}
            >
              <LogOut size={16} />
              Đăng xuất
            </button>
          </div>
        )}
      </div>
      {userRole !== 'CUSTOMER' && (
        <Link
          href="/admin"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#173f35',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 700,
            padding: '6px 14px',
            borderRadius: '10px',
            textDecoration: 'none',
            boxShadow: '0 2px 8px rgba(23,63,53,0.25)',
          }}
          title="Vào bảng điều khiển quản lý"
        >
          🛠️ Quản lý ({userRole})
        </Link>
      )}
    </div>
  );
}

