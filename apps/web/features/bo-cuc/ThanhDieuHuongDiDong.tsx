import Link from 'next/link';

type MobileNavBarProps = {
  token: string;
  cartCount: number;
  onOpenCart: () => void;
  onOpenLogin: () => void;
  handleLogout: () => void;
};

export function MobileNavBar(props: MobileNavBarProps) {
  const { token, cartCount, onOpenCart, onOpenLogin, handleLogout } = props;

  return (
    <nav className="mobile-nav-bar">
      <Link href="/" className="mob-nav-item active">
        <span>🏠</span>
        <span>Trang chủ</span>
      </Link>
      <a
        href="#menu"
        className="mob-nav-item"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
        }}
      >
        <span>☕</span>
        <span>Thực đơn</span>
      </a>
      <button
        className="mob-nav-item"
        onClick={onOpenCart}
        style={{ position: 'relative' }}
      >
        <span>🛒</span>
        <span>Giỏ hàng</span>
        {cartCount > 0 && <span className="badge-count">{cartCount}</span>}
      </button>
      <Link href="/orders" className="mob-nav-item">
        <span>📦</span>
        <span>Đơn hàng</span>
      </Link>
      <button
        className="mob-nav-item"
        onClick={() => {
          if (token) handleLogout();
          else onOpenLogin();
        }}
      >
        <span>👤</span>
        <span>{token ? 'Thoát' : 'Tài khoản'}</span>
      </button>
    </nav>
  );
}

