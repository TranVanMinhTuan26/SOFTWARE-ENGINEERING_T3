import { useEffect, useMemo, useState } from 'react';
import { Edit2, Plus, RefreshCw, Search, ShieldCheck, Trash2 } from 'lucide-react';
import type { AdminRole, UserAccount } from '../kieu-quan-tri';
import { AdminPagination } from '../thanh-phan/PhanTrangQuanTri';

const PAGE_SIZE = 10;

const isAdminRole = (role: string): role is AdminRole =>
  ['Admin', 'Manager', 'Nhân viên', 'Kho', 'Pha chế'].includes(role);

type PermissionsTabProps = {
  users: UserAccount[];
  userSearch: string;
  setUserSearch: (s: string) => void;
  userRoleFilter: string;
  setUserRoleFilter: (s: string) => void;
  userStatusFilter: string;
  setUserStatusFilter: (s: string) => void;
  usersLoading: boolean;
  usersError: string;
  onReloadUsers: () => void;
  onOpenRoleModal: (role: AdminRole) => void;
  onOpenAddUserModal: () => void;
  deleteUser: (id: string) => void;
};

export function PermissionsTab(props: PermissionsTabProps) {
  const {
    users,
    userSearch,
    setUserSearch,
    userRoleFilter,
    setUserRoleFilter,
    userStatusFilter,
    setUserStatusFilter,
    usersLoading,
    usersError,
    onReloadUsers,
    onOpenRoleModal,
    onOpenAddUserModal,
    deleteUser,
  } = props;

  const [page, setPage] = useState(1);
  const filteredUsers = useMemo(() => users.filter((u) => {
    const matchRole = userRoleFilter === 'Tất cả' || u.role === userRoleFilter;
    const matchStatus = userStatusFilter === 'Tất cả' || u.status === userStatusFilter;
    const matchSearch =
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    return matchRole && matchStatus && matchSearch;
  }), [users, userRoleFilter, userStatusFilter, userSearch]);
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageUsers = filteredUsers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    setPage(1);
  }, [userSearch, userRoleFilter, userStatusFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="tab-users-permissions">
      <div className="page-head-row">
        <h1 className="page-heading">Quản lý tài khoản & phân quyền</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn-secondary-action"
            onClick={onReloadUsers}
            disabled={usersLoading}
          >
            <RefreshCw size={16} />
            <span>{usersLoading ? 'Đang tải...' : 'Tải lại danh sách'}</span>
          </button>
          <button
            className="btn-secondary-action"
            onClick={() => onOpenRoleModal('Nhân viên')}
          >
            <ShieldCheck size={16} />
            <span>Phân quyền vai trò</span>
          </button>
          <button className="btn-primary-action" onClick={onOpenAddUserModal}>
            <Plus size={16} />
            <span>Thêm tài khoản</span>
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="table-filter-bar">
        <div className="filter-search-box">
          <Search size={15} />
          <input
            type="text"
            placeholder="Tìm kiếm tài khoản..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
          />
        </div>

        <div className="filter-select-wrap">
          <select
            value={userRoleFilter}
            onChange={(e) => setUserRoleFilter(e.target.value)}
          >
            <option value="Tất cả">Vai trò: Tất cả</option>
            <option value="Admin">Admin</option>
            <option value="Manager">Manager</option>
            <option value="Nhân viên">Nhân viên</option>
            <option value="Kho">Kho</option>
            <option value="Pha chế">Pha chế</option>
            <option value="Khách hàng">Khách hàng</option>
          </select>
        </div>

        <div className="filter-select-wrap">
          <select
            value={userStatusFilter}
            onChange={(e) => setUserStatusFilter(e.target.value)}
          >
            <option value="Tất cả">Trạng thái: Tất cả</option>
            <option value="Đang hoạt động">Đang hoạt động</option>
            <option value="Đã khóa">Đã khóa</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="admin-table-card">
        {usersError && (
          <div role="alert" style={{ padding: '16px', color: '#b91c1c' }}>
            <span>{usersError}</span>{' '}
            <button type="button" className="btn-secondary-action" onClick={onReloadUsers}>
              Thử tải lại
            </button>
          </div>
        )}
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>#</th>
              <th>Tên đăng nhập</th>
              <th>Email</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {!usersLoading && pageUsers.map((u) => (
              <tr key={u.id}>
                <td style={{ color: '#94a3b8' }}>{u.index}</td>
                <td style={{ fontWeight: 600 }}>{u.username}</td>
                <td style={{ color: '#64748b' }}>{u.email}</td>
                <td>
                  <span className="role-tag">{u.role}</span>
                </td>
                <td>
                  <span
                    className={`status-pill ${
                      u.status === 'Đang hoạt động' ? 'active' : 'inactive'
                    }`}
                  >
                    {u.status}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  {u.role !== 'Khách hàng' && (
                    <button
                      className="action-icon-btn edit"
                      title="Phân quyền vai trò"
                      onClick={() => {
                        if (isAdminRole(u.role)) {
                          onOpenRoleModal(u.role);
                        }
                      }}
                    >
                      <Edit2 size={15} />
                    </button>
                  )}
                  <button
                    className="action-icon-btn delete"
                    title="Xóa tài khoản"
                    onClick={() => deleteUser(u.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
            {usersLoading && (
              <tr><td colSpan={6}>Đang tải danh sách tài khoản...</td></tr>
            )}
            {!usersLoading && !usersError && filteredUsers.length === 0 && (
              <tr><td colSpan={6}>Không có tài khoản phù hợp.</td></tr>
            )}
          </tbody>
        </table>
        <AdminPagination
          page={currentPage}
          pageSize={PAGE_SIZE}
          total={filteredUsers.length}
          itemLabel="tài khoản"
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
