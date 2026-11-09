'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Search, Award, Lock, Unlock, Trash2 } from 'lucide-react';
import type { CustomerItem } from '../kieu-quan-tri';
import { money } from '../hang-so-quan-tri';
import { AdminPagination } from '../thanh-phan/PhanTrangQuanTri';

const PAGE_SIZE = 10;

interface CustomersTabProps {
  customers: CustomerItem[];
  customerSearch: string;
  setCustomerSearch: (val: string) => void;
  customerTierFilter: string;
  setCustomerTierFilter: (val: string) => void;
  filteredCustomers: CustomerItem[];
  changeCustomerStatus: (idOrEmail: string, status: 'Hoạt động' | 'Đã khóa') => void;
  deleteCustomer: (idOrEmail: string) => void;
  onOpenAddCustomer: () => void;
}

export function CustomersTab({
  customers,
  customerSearch,
  setCustomerSearch,
  customerTierFilter,
  setCustomerTierFilter,
  filteredCustomers,
  changeCustomerStatus,
  deleteCustomer,
  onOpenAddCustomer,
}: CustomersTabProps) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageCustomers = filteredCustomers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    setPage(1);
  }, [customerSearch, customerTierFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="tab-customers">
      <div className="page-head-row">
        <div>
          <h1 className="page-heading">Quản lý khách hàng</h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
            Theo dõi hồ sơ thành viên, điểm tích lũy và lịch sử mua sắm.
          </p>
        </div>
        <button className="btn-add-primary" onClick={onOpenAddCustomer}>
          <Plus size={16} />
          <span>Thêm khách hàng</span>
        </button>
      </div>

      {/* 4 Stat Cards */}
      <div className="stat-cards-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <div className="stat-label">Tổng khách hàng</div>
          <div className="stat-value">{customers.length.toLocaleString('vi-VN')}</div>
          <div className="stat-sub positive">
            <span>↑ 12% tháng này</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Khách hàng VIP</div>
          <div className="stat-value">
            {customers.filter((c) => c.tier === 'Kim cương' || c.tier === 'Vàng').length}
          </div>
          <div className="stat-sub positive">
            <span>Hạng Vàng & Kim cương</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Tổng điểm tích lũy</div>
          <div className="stat-value">
            {customers.reduce((sum, c) => sum + c.points, 0).toLocaleString('vi-VN')} pts
          </div>
          <div className="stat-sub positive">
            <span>Sẵn sàng đổi voucher</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Tỷ lệ khách quay lại</div>
          <div className="stat-value">74.2%</div>
          <div className="stat-sub positive">
            <span>Trung bình 3.2 lần/tháng</span>
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="filter-row" style={{ marginBottom: '16px' }}>
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Tìm theo tên, SĐT, email..."
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <span className="filter-label">Hạng thành viên:</span>
          <select
            className="filter-select"
            value={customerTierFilter}
            onChange={(e) => setCustomerTierFilter(e.target.value)}
          >
            <option value="Tất cả">Tất cả hạng</option>
            <option value="Kim cương">Kim cương</option>
            <option value="Vàng">Vàng</option>
            <option value="Bạc">Bạc</option>
            <option value="Đồng">Đồng</option>
            <option value="Mới">Khách mới</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="admin-table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Khách hàng</th>
              <th>Số điện thoại</th>
              <th>Hạng thành viên</th>
              <th>Tổng chi tiêu</th>
              <th>Số đơn</th>
              <th>Điểm thưởng</th>
              <th>Mua gần nhất</th>
              <th>Trạng thái</th>
              <th style={{ textAlign: 'center' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {pageCustomers.map((c) => (
              <tr key={c.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: '#eaf4eb',
                        color: '#166534',
                        display: 'grid',
                        placeItems: 'center',
                        fontWeight: 800,
                        fontSize: '14px',
                      }}
                    >
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <strong style={{ display: 'block', color: '#0f172a' }}>{c.name}</strong>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>{c.email}</span>
                    </div>
                  </div>
                </td>
                <td>{c.phone}</td>
                <td>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background:
                        c.tier === 'Kim cương'
                          ? '#eff6ff'
                          : c.tier === 'Vàng'
                          ? '#fefce8'
                          : c.tier === 'Bạc'
                          ? '#f1f5f9'
                          : '#f8fafc',
                      color:
                        c.tier === 'Kim cương'
                          ? '#1d4ed8'
                          : c.tier === 'Vàng'
                          ? '#a16207'
                          : c.tier === 'Bạc'
                          ? '#475569'
                          : '#64748b',
                      border: '1px solid currentColor',
                    }}
                  >
                    <Award size={12} /> {c.tier}
                  </span>
                </td>
                <td>
                  <strong style={{ color: '#166534' }}>{money(c.totalSpend)}</strong>
                </td>
                <td>{c.orderCount} đơn</td>
                <td>
                  <span style={{ fontWeight: 700, color: '#ca8a04' }}>{c.points.toLocaleString('vi-VN')} pts</span>
                </td>
                <td style={{ fontSize: '12px', color: '#64748b' }}>{c.lastOrder}</td>
                <td>
                  <select
                    value={c.status}
                    onChange={(e) => changeCustomerStatus(c.email || c.id, e.target.value as 'Hoạt động' | 'Đã khóa')}
                    style={{
                      padding: '5px 8px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: c.status === 'Hoạt động' ? '#dcfce7' : '#fee2e2',
                      color: c.status === 'Hoạt động' ? '#15803d' : '#b91c1c',
                      border: `1.5px solid ${c.status === 'Hoạt động' ? '#86efac' : '#fca5a5'}`,
                      outline: 'none',
                    }}
                    title="Nhấp để thay đổi trạng thái tài khoản"
                  >
                    <option value="Hoạt động">🟢 Hoạt động</option>
                    <option value="Đã khóa">🔴 Đã khóa</option>
                  </select>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                    {c.status === 'Hoạt động' ? (
                      <button
                        type="button"
                        onClick={() => changeCustomerStatus(c.email || c.id, 'Đã khóa')}
                        title="Bấm để KHÓA tài khoản (chặn khách hàng đăng nhập)"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '5px 12px',
                          borderRadius: '6px',
                          border: '1.5px solid #fca5a5',
                          background: '#fef2f2',
                          color: '#dc2626',
                          fontWeight: 700,
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        <Lock size={13} />
                        <span>Khóa tài khoản</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => changeCustomerStatus(c.email || c.id, 'Hoạt động')}
                        title="Bấm để MỞ KHÓA tài khoản (cho phép khách hàng đăng nhập lại)"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '5px 12px',
                          borderRadius: '6px',
                          border: '1.5px solid #86efac',
                          background: '#dcfce7',
                          color: '#15803d',
                          fontWeight: 800,
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        <Unlock size={13} />
                        <span>Mở tài khoản</span>
                      </button>
                    )}
                    <button
                      type="button"
                      className="action-btn danger"
                      title="Xóa vĩnh viễn khách hàng"
                      onClick={() => deleteCustomer(c.email || c.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredCustomers.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                  Không tìm thấy khách hàng nào phù hợp với bộ lọc.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <AdminPagination
          page={currentPage}
          pageSize={PAGE_SIZE}
          total={filteredCustomers.length}
          itemLabel="khách hàng"
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
