import {
  Package,
  ShoppingBag,
  TicketPercent,
  UserCog,
  Users,
  Warehouse,
} from 'lucide-react';
import type { AdminRole } from '../kieu-quan-tri';

type AdminSidebarProps = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentAdminRole: AdminRole;
  getAllowedTabsForRole: (role: AdminRole) => string[];
};

export const ADMIN_NAV_ITEMS = [
  { name: 'Đơn hàng', icon: ShoppingBag },
  { name: 'Sản phẩm', icon: Package },
  { name: 'Kho hàng', icon: Warehouse },
  { name: 'Khuyến mãi', icon: TicketPercent },
  { name: 'Khách hàng', icon: Users },
  { name: 'Tài khoản & Phân quyền', icon: UserCog },
];

export function AdminSidebar(props: AdminSidebarProps) {
  const { activeTab, setActiveTab, currentAdminRole, getAllowedTabsForRole } = props;
  const allowedTabs = getAllowedTabsForRole(currentAdminRole);

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo-wrap">
          <span className="brand-icon">🌱</span>
          <span className="brand-name">BrewLite</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {ADMIN_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isAllowed = allowedTabs.includes(item.name);
          const isActive = activeTab === item.name;

          return (
            <button
              key={item.name}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.name)}
              style={{
                opacity: isAllowed ? 1 : 0.55,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
              }}
              title={!isAllowed ? `(Vai trò ${currentAdminRole} không có quyền truy cập)` : undefined}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon size={18} />
                <span>{item.name}</span>
              </div>
              {!isAllowed && (
                <span style={{ fontSize: '12px' }} title="Bị giới hạn quyền">
                  🔒
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

