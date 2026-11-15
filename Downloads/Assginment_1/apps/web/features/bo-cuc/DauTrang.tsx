import Link from 'next/link';
import { Search, ShoppingBag } from 'lucide-react';
import type { RefObject } from 'react';
import { AccountMenu } from './MenuTaiKhoan';

type SiteHeaderProps = {
  token: string;
  email: string;
  fullName: string;
  userPoints: number;
  userRole: string;
  cartCount: number;
  accountMenuOpen: boolean;
  setAccountMenuOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  accountMenuRef: RefObject<HTMLDivElement | null>;
  onOpenSearch: () => void;
  onOpenCart: () => void;
  onOpenLogin: () => void;
  openAccountProfile: () => void;
  handleLogout: () => void;
};

export function SiteHeader(props: SiteHeaderProps) {
  const {
    token, email, fullName, userPoints, userRole, cartCount,
    accountMenuOpen, setAccountMenuOpen, accountMenuRef,
    onOpenSearch, onOpenCart, onOpenLogin,
    openAccountProfile, handleLogout,
  } = props;

  return (
    <header className="site-header">
      <div className="nav-wrapper">
        <Link href="/" className="brand-logo">
          <div className="brand-icon">🌱</div>
          <span>BrewLite</span>
        </Link>

        <nav className="nav-links">
          <Link href="/" className="active">
            Trang chủ
          </Link>
          <a
            href="#menu"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Thực đơn
          </a>
          <Link href="/orders">
            Theo dõi đơn hàng
          </Link>
        </nav>

        <div className="nav-actions">
          <button
            className="icon-btn"
            aria-label="Tìm kiếm"
            onClick={onOpenSearch}
          >
            <Search size={18} />
          </button>

          <button
            className="icon-btn"
            aria-label="Giỏ hàng"
            onClick={onOpenCart}
          >
            <ShoppingBag size={18} />
            {cartCount > 0 && <span className="badge-count">{cartCount}</span>}
          </button>

          {token ? (
            <AccountMenu
              fullName={fullName}
              email={email}
              userPoints={userPoints}
              userRole={userRole}
              accountMenuOpen={accountMenuOpen}
              setAccountMenuOpen={setAccountMenuOpen}
              accountMenuRef={accountMenuRef}
              openAccountProfile={openAccountProfile}
              handleLogout={handleLogout}
            />
          ) : (
            <button
              className="btn-login"
              onClick={onOpenLogin}
            >
              Đăng nhập
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

