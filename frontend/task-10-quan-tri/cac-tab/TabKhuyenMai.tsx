import { useEffect, useMemo, useState } from 'react';
import { Award, Plus, Search, Trash2 } from 'lucide-react';
import type { PromotionItem, StoreSettings } from '../kieu-quan-tri';
import { AdminPagination } from '../thanh-phan/PhanTrangQuanTri';

const PAGE_SIZE = 10;

type PromotionsTabProps = {
  promotions: PromotionItem[];
  promoSearch: string;
  setPromoSearch: (s: string) => void;
  promoStatusFilter: string;
  setPromoStatusFilter: (s: string) => void;
  onOpenAddModal: () => void;
  togglePromotionStatus: (id: string) => void;
  deletePromotion: (id: string) => void;
  storeSettings?: StoreSettings;
  setStoreSettings?: React.Dispatch<React.SetStateAction<StoreSettings>>;
  handleSaveSettings?: (e?: React.FormEvent) => Promise<void>;
  settingsSaving?: boolean;
};

export function PromotionsTab(props: PromotionsTabProps) {
  const {
    promotions,
    promoSearch,
    setPromoSearch,
    promoStatusFilter,
    setPromoStatusFilter,
    onOpenAddModal,
    togglePromotionStatus,
    deletePromotion,
    storeSettings,
    setStoreSettings,
    handleSaveSettings,
    settingsSaving,
  } = props;

  const [page, setPage] = useState(1);
  const filteredPromos = useMemo(() => promotions.filter((pr) => {
    const matchStatus =
      promoStatusFilter === 'Tất cả' || pr.status === promoStatusFilter;
    const matchSearch =
      pr.name.toLowerCase().includes(promoSearch.toLowerCase()) ||
      pr.code.toLowerCase().includes(promoSearch.toLowerCase());
    return matchStatus && matchSearch;
  }), [promotions, promoSearch, promoStatusFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredPromos.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagePromos = filteredPromos.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    setPage(1);
  }, [promoSearch, promoStatusFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="tab-promotions">
      <div className="page-head-row">
        <h1 className="page-heading">Khuyến mãi</h1>
        <button className="btn-primary-action" onClick={onOpenAddModal}>
          <Plus size={16} />
          <span>Tạo khuyến mãi</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="table-filter-bar">
        <div className="filter-search-box">
          <Search size={15} />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={promoSearch}
            onChange={(e) => setPromoSearch(e.target.value)}
          />
        </div>

        <div className="filter-select-wrap">
          <select
            value={promoStatusFilter}
            onChange={(e) => setPromoStatusFilter(e.target.value)}
          >
            <option value="Tất cả">Trạng thái: Tất cả</option>
            <option value="Đang hoạt động">Đang hoạt động</option>
            <option value="Chưa bắt đầu">Chưa bắt đầu</option>
            <option value="Đã kết thúc">Đã kết thúc / Tạm dừng</option>
          </select>
        </div>
      </div>

      {/* Promotions Table */}
      <div className="admin-table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: '160px' }}>Mã Voucher</th>
              <th>Tên chương trình ưu đãi</th>
              <th>Mức giảm</th>
              <th>Trạng thái (Khách dùng)</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {pagePromos.map((pr) => (
              <tr key={pr.id}>
                <td>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#fef3c7',
                      color: '#92400e',
                      border: '1px solid #fde68a',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      fontSize: '13px',
                      letterSpacing: '0.5px',
                    }}
                  >
                    🎟️ {pr.code || 'BREW20'}
                  </span>
                </td>
                <td style={{ fontWeight: 600 }}>{pr.name}</td>
                <td style={{ fontWeight: 800, color: '#16a34a' }}>{pr.discount}</td>
                <td>
                  <button
                    onClick={() => togglePromotionStatus(pr.id)}
                    title="Bấm để bật/tắt kích hoạt mã cho khách hàng"
                    className={`status-pill ${
                      pr.status === 'Đang hoạt động' ? 'active' : 'inactive'
                    }`}
                    style={{ cursor: 'pointer', border: 'none' }}
                  >
                    {pr.status === 'Đang hoạt động' ? '✓ Đang hoạt động' : 'Tạm dừng'}
                  </button>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    className="action-icon-btn delete"
                    title="Xóa khuyến mãi"
                    onClick={() => deletePromotion(pr.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <AdminPagination
          page={currentPage}
          pageSize={PAGE_SIZE}
          total={filteredPromos.length}
          itemLabel="khuyến mãi"
          onPageChange={setPage}
        />
      </div>

      {/* Chính sách Tích lũy Điểm thưởng & Khách hàng */}
      {storeSettings && setStoreSettings && (
        <div className="admin-table-card" style={{ padding: '24px', marginTop: '24px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              borderBottom: '1px solid #f1f5f9',
              paddingBottom: '12px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Award size={20} color="#166534" />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                Chính sách Tích lũy Điểm thưởng & Khách hàng
              </h3>
            </div>
            {handleSaveSettings && (
              <button
                className="btn-primary-action"
                style={{ padding: '8px 18px', fontSize: '13px' }}
                onClick={() => handleSaveSettings()}
                disabled={settingsSaving}
              >
                <span>{settingsSaving ? 'Đang lưu...' : 'Lưu chính sách điểm'}</span>
              </button>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '20px',
            }}
          >
            <div>
              <label className="field-label" style={{ fontWeight: 700, marginBottom: '6px', display: 'block' }}>
                Tỷ lệ tích điểm (VNĐ chi tiêu = 1 điểm)
              </label>
              <input
                type="number"
                min="1"
                step="1"
                className="modal-input"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                value={storeSettings.pointRate ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.includes('-')) return;
                  setStoreSettings({ ...storeSettings, pointRate: val });
                }}
                placeholder="1000"
              />
              <span style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', display: 'block' }}>
                Mặc định: 1.000 VNĐ chi tiêu tích được 1 điểm thưởng
              </span>
            </div>

            <div>
              <label className="field-label" style={{ fontWeight: 700, marginBottom: '6px', display: 'block' }}>
                Đổi ngược điểm sang tiền (1 điểm = ? VNĐ)
              </label>
              <input
                type="number"
                min="1"
                step="1"
                className="modal-input"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                value={storeSettings.pointToMoneyRate ?? '100'}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.includes('-')) return;
                  setStoreSettings({ ...storeSettings, pointToMoneyRate: val });
                }}
                placeholder="100"
              />
              <span style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', display: 'block' }}>
                Mặc định: 1 điểm = {Math.max(1, Number(storeSettings.pointToMoneyRate || 100)).toLocaleString('vi-VN')} VNĐ (ví dụ: 100 điểm = {(100 * Math.max(1, Number(storeSettings.pointToMoneyRate || 100))).toLocaleString('vi-VN')} VNĐ giảm giá)
              </span>
            </div>

            <div>
              <label className="field-label" style={{ fontWeight: 700, marginBottom: '6px', display: 'block' }}>
                Mức điểm tối thiểu để đổi giảm giá
              </label>
              <input
                type="number"
                min="1"
                step="1"
                className="modal-input"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                value={storeSettings.pointRedeem ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.includes('-')) return;
                  setStoreSettings({ ...storeSettings, pointRedeem: val });
                }}
                placeholder="100"
              />
              <span style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', display: 'block' }}>
                Mặc định: 100 điểm (tương đương giảm {(Math.max(1, Number(storeSettings.pointRedeem || 100)) * Math.max(1, Number(storeSettings.pointToMoneyRate || 100))).toLocaleString('vi-VN')} VNĐ)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
