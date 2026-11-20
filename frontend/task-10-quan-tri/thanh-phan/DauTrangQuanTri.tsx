import { useState } from 'react';
import { ChevronDown, LogOut, Search } from 'lucide-react';
import type { AdminRole } from '../kieu-quan-tri';
import { ROLE_INFO } from '../hang-so-quan-tri';

type AdminHeaderProps = {
  searchGlobal: string;
  setSearchGlobal: (v: string) => void;
  currentAdminRole: AdminRole;
  currentUserEmail: string;
  handleAdminLogout: () => void;
};

export function AdminHeader(props: AdminHeaderProps) {
  const {
    searchGlobal,
    setSearchGlobal,
    currentAdminRole,
    currentUserEmail,
    handleAdminLogout,
  } = props;

  const [showUserDropdown, setShowUserDropdown] = useState(false);

  return (
    <header className="admin-topbar">
      <div className="topbar-search">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Tìm kiếm trong hệ thống..."
          value={searchGlobal}
          onChange={(e) => setSearchGlobal(e.target.value)}
        />
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#f8fafc',
          padding: '5px 12px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Vai trò đang đăng nhập:</span>
        <strong style={{ color: ROLE_INFO[currentAdminRole].color, fontSize: '12px' }}>
          {currentAdminRole}
        </strong>
      </div>

      <div className="topbar-user" onClick={() => setShowUserDropdown(!showUserDropdown)}>
        <img
          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
          alt="Admin Avatar"
          className="user-avatar"
        />
        <div className="user-info">
          <span className="user-email">{currentUserEmail || 'admin@brewlite.local'}</span>
          <span className="user-role" style={{ color: ROLE_INFO[currentAdminRole].color, fontWeight: 800 }}>
            {currentAdminRole}
          </span>
        </div>
        <ChevronDown size={14} className="user-chevron" />

        {showUserDropdown && (
          <div className="user-dropdown-menu">
            <a href="/" className="dropdown-item">
              🌱 Xem trang khách hàng
            </a>
            <button className="dropdown-item danger" onClick={handleAdminLogout}>
              <LogOut size={14} />
              <span>Đăng xuất</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
