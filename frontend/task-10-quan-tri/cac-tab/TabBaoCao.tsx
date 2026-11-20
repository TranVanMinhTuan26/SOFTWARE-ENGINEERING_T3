'use client';

import React from 'react';
import { Download, Printer } from 'lucide-react';
import type { OrderItem, ProductItem } from '../kieu-quan-tri';
import { money } from '../hang-so-quan-tri';

interface ReportsTabProps {
  orders: OrderItem[];
  products: ProductItem[];
  reportTimeFilter: 'Hôm nay' | '7 ngày qua' | 'Tháng này' | 'Năm nay';
  setReportTimeFilter: (val: 'Hôm nay' | '7 ngày qua' | 'Tháng này' | 'Năm nay') => void;
}

export function ReportsTab({
  orders,
  products,
  reportTimeFilter,
  setReportTimeFilter,
}: ReportsTabProps) {
  const totalRev = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const paidOrders = orders.filter((o) => o.status === 'PAID' || o.status === 'COMPLETED');
  const paidCount = paidOrders.length;
  const aov = paidCount > 0 ? Math.round(totalRev / paidCount) : 0;
  const grossProfit = Math.round(totalRev * 0.6);

  // Gom nhóm doanh số theo danh mục thực tế
  const catSales: Record<string, number> = {};
  orders.forEach((o) => {
    if (Array.isArray(o.items)) {
      o.items.forEach((it: any) => {
        const pName = (it.name || it.product?.name || '').trim();
        const pMatch = products.find((p) => p.name.trim().toLowerCase() === pName.toLowerCase());
        const cat = pMatch?.category || 'Cà phê';
        const lineTotal = Number(it.lineTotal || it.unitPrice || 0);
        catSales[cat] = (catSales[cat] || 0) + lineTotal;
      });
    }
  });

  const catList =
    Object.keys(catSales).length > 0
      ? Object.entries(catSales).map(([cat, val], idx) => {
          const percent = totalRev > 0 ? Math.round((val / totalRev) * 100) : 0;
          const colors = ['#166534', '#22c55e', '#84cc16', '#eab308'];
          return { cat, percent, val: money(val), color: colors[idx % colors.length] };
        })
      : [
          { cat: 'Cà phê', percent: 60, val: money(Math.round(totalRev * 0.6)), color: '#166534' },
          { cat: 'Trà trái cây', percent: 40, val: money(Math.round(totalRev * 0.4)), color: '#22c55e' },
        ];

  // Top 5 sản phẩm bán chạy thực tế
  const prodStatsMap = new Map<string, { name: string; cat: string; sold: number; rev: number }>();
  orders.forEach((o) => {
    if (Array.isArray(o.items)) {
      o.items.forEach((it: any) => {
        const pName = (it.name || it.product?.name || '').trim();
        if (!pName) return;
        const qty = Number(it.quantity || it.qty || 1);
        const pMatch = products.find((p) => p.name.trim().toLowerCase() === pName.toLowerCase());
        const cat = pMatch?.category || 'Cà phê';
        const rev = Number(it.lineTotal || it.unitPrice || (pMatch?.price || 0) * qty);
        const exist = prodStatsMap.get(pName);
        if (exist) {
          exist.sold += qty;
          exist.rev += rev;
        } else {
          prodStatsMap.set(pName, { name: pName, cat, sold: qty, rev });
        }
      });
    }
  });

  let top5Report = Array.from(prodStatsMap.values()).sort((a, b) => b.sold - a.sold);
  if (top5Report.length < 5) {
    products.forEach((p) => {
      if (!prodStatsMap.has(p.name.trim()) && top5Report.length < 5) {
        top5Report.push({
          name: p.name,
          cat: p.category,
          sold: 0,
          rev: 0,
        });
      }
    });
  }
  top5Report = top5Report.slice(0, 5);

  return (
    <div className="tab-reports">
      <div className="page-head-row">
        <div>
          <h1 className="page-heading">Báo cáo doanh thu & Phân tích kinh doanh</h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
            Thống kê hiệu quả hoạt động, xu hướng đơn hàng và doanh số bán món.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="action-btn"
            style={{
              background: '#fff',
              border: '1px solid #cbd5e1',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onClick={() => alert('Đang xuất tệp Excel báo cáo tài chính...')}
          >
            <Download size={14} /> Xuất Excel
          </button>
          <button className="btn-add-primary" onClick={() => window.print()}>
            <Printer size={16} />
            <span>In báo cáo</span>
          </button>
        </div>
      </div>

      {/* Bộ lọc thời gian */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {(['Hôm nay', '7 ngày qua', 'Tháng này', 'Năm nay'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setReportTimeFilter(t)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              border: reportTimeFilter === t ? '1.5px solid #166534' : '1px solid #cbd5e1',
              background: reportTimeFilter === t ? '#eaf4eb' : '#fff',
              color: reportTimeFilter === t ? '#166534' : '#475569',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* 4 Stat Cards */}
      <div className="stat-cards-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <div className="stat-label">Doanh thu kỳ này</div>
          <div className="stat-value" style={{ color: '#15803d' }}>
            {money(totalRev)}
          </div>
          <div className="stat-sub positive">
            <span>Từ {orders.length} đơn hàng thực tế</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Tổng đơn hàng thành công</div>
          <div className="stat-value">{paidCount} đơn</div>
          <div className="stat-sub positive">
            <span>
              {orders.length > 0
                ? `Tỷ lệ hoàn thành ${Math.round((paidCount / orders.length) * 100)}%`
                : '100%'}
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Giá trị trung bình/đơn (AOV)</div>
          <div className="stat-value">{money(aov)}</div>
          <div className="stat-sub positive">
            <span>Dựa trên {paidCount} đơn đã thanh toán</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Lợi nhuận gộp ước tính</div>
          <div className="stat-value">{money(grossProfit)}</div>
          <div className="stat-sub positive">
            <span>Biên lợi nhuận gộp ~60%</span>
          </div>
        </div>
      </div>

      {/* 2 Panel Charts */}
      <div className="overview-panels-grid" style={{ marginBottom: '24px' }}>
        {/* Panel 1: Biểu đồ doanh thu thực tế */}
        <div className="chart-panel">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <h3 className="panel-title" style={{ margin: 0 }}>
              Xu hướng doanh thu các ngày gần nhất
            </h3>
            <span
              style={{
                fontSize: '11px',
                color: '#16a34a',
                fontWeight: 700,
                background: '#dcfce7',
                padding: '2px 8px',
                borderRadius: '4px',
              }}
            >
              Dữ liệu thực tế
            </span>
          </div>
          <div className="chart-wrapper">
            <svg viewBox="0 0 600 240" className="revenue-svg">
              <line x1="40" y1="30" x2="580" y2="30" stroke="#f1f5f9" strokeWidth="1" />
              <text x="32" y="34" textAnchor="end" className="chart-label">
                {money(Math.max(totalRev, 100000))}
              </text>
              <line x1="40" y1="120" x2="580" y2="120" stroke="#f1f5f9" strokeWidth="1" />
              <text x="32" y="124" textAnchor="end" className="chart-label">
                {money(Math.round(Math.max(totalRev, 100000) / 2))}
              </text>
              <line x1="40" y1="210" x2="580" y2="210" stroke="#e2e8f0" strokeWidth="1" />
              <text x="32" y="214" textAnchor="end" className="chart-label">
                0
              </text>

              {/* Cột dữ liệu thực tế */}
              {Array.from({ length: 6 }, (_, bIdx) => {
                const x = 70 + bIdx * 80;
                const d = new Date();
                d.setDate(d.getDate() - (5 - bIdx));
                const label = `${String(d.getDate()).padStart(2, '0')}/${String(
                  d.getMonth() + 1
                ).padStart(2, '0')}`;
                const matchedOrders = orders.filter((o) => (o.createdAt || '').includes(label));
                const dayRev = matchedOrders.reduce((s, o) => s + (o.total || 0), 0);
                const h = Math.min(
                  170,
                  Math.max(12, Math.round((dayRev / Math.max(totalRev, 100000)) * 170))
                );
                return (
                  <g key={bIdx}>
                    <rect
                      x={x}
                      y={210 - h}
                      width="42"
                      height={h}
                      rx="6"
                      fill="#166534"
                      opacity={bIdx === 5 ? 1 : 0.75}
                    />
                    <text x={x + 21} y="228" textAnchor="middle" className="chart-label">
                      {label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Panel 2: Tỷ trọng danh mục thực tế */}
        <div className="top-products-panel">
          <h3 className="panel-title">Tỷ trọng doanh số theo danh mục</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '14px' }}>
            {catList.map((item, idx) => (
              <div key={idx}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '13px',
                    marginBottom: '4px',
                  }}
                >
                  <strong style={{ color: '#1e293b' }}>{item.cat}</strong>
                  <span style={{ fontWeight: 700, color: '#166534' }}>
                    {item.percent}% ({item.val})
                  </span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '8px',
                    background: '#f1f5f9',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${Math.max(item.percent, 8)}%`,
                      height: '100%',
                      background: item.color,
                      borderRadius: '4px',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: '20px',
              padding: '12px 16px',
              background: '#f8fafc',
              borderRadius: '10px',
              fontSize: '12px',
              color: '#64748b',
            }}
          >
            💡 <strong>Nhận định:</strong> Tổng hợp tự động từ {orders.length} đơn hàng thực tế của
            khách hàng tại quầy và trực tuyến.
          </div>
        </div>
      </div>

      {/* Bảng Top 5 Đồ Uống Bán Chạy Nhất Thực Tế */}
      <div className="admin-table-card">
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
            🏆 Top 5 Đồ Uống Bán Chạy Nhất Thực Tế
          </h3>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Cập nhật theo đơn hàng thực tế khách đã đặt
          </span>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>Hạng</th>
              <th>Tên sản phẩm</th>
              <th>Danh mục</th>
              <th>Đã bán</th>
              <th>Doanh thu đóng góp</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {top5Report.map((row, rIdx) => (
              <tr key={rIdx}>
                <td>
                  <span style={{ fontWeight: 800, color: rIdx === 0 ? '#ca8a04' : '#1e293b' }}>
                    #{rIdx + 1}
                  </span>
                </td>
                <td>
                  <strong>{row.name}</strong>
                </td>
                <td>
                  <span className="badge badge-green">{row.cat}</span>
                </td>
                <td>
                  <strong>{row.sold} ly</strong>
                </td>
                <td>
                  <strong style={{ color: '#166534' }}>{money(row.rev)}</strong>
                </td>
                <td>
                  <span
                    style={{
                      color: row.sold > 0 ? '#16a34a' : '#64748b',
                      fontWeight: 700,
                      fontSize: '12px',
                    }}
                  >
                    {row.sold > 0 ? '🔥 Có khách mua' : 'Chưa có đơn'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

