import type { CustomerItem, OrderItem, ProductItem } from '../kieu-quan-tri';
import { money } from '../hang-so-quan-tri';

type DashboardTabProps = {
  orders: OrderItem[];
  customers: CustomerItem[];
  products: ProductItem[];
  lowStockProductCount?: number;
};

export function DashboardTab({
  orders,
  customers,
  products,
  lowStockProductCount,
}: DashboardTabProps) {
  // 1. Thống kê Doanh thu & Đơn hàng thực tế
  const todayD = new Date();
  const todayStrVN = todayD.toLocaleDateString('vi-VN');
  const todayDayMonth = `${String(todayD.getDate()).padStart(2, '0')}/${String(todayD.getMonth() + 1).padStart(2, '0')}`;

  const todayOrders = orders.filter((o) => {
    if (!o.createdAt) return false;
    return (
      o.createdAt.includes('Hôm nay') ||
      o.createdAt.includes(todayDayMonth) ||
      o.createdAt.includes(todayStrVN)
    );
  });

  const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalOrdersCount = orders.length;

  // 2. Thống kê khách hàng thực tế
  const realCustomersCount = customers.length;

  // 3. Thống kê tồn kho thấp thực tế (các món hết hàng hoặc chưa có công thức)
  const lowStockProducts = products.filter(
    (p) => p.status === 'Hết hàng' || p.status === 'Chưa có công thức' || p.available === false
  );
  const lowStockCount = lowStockProductCount ?? lowStockProducts.length;

  // 4. Biểu đồ Doanh thu 7 ngày qua thực tế từ các đơn hàng
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return {
      dateKey: `${day}/${month}`,
      revenue: 0,
      count: 0,
    };
  });

  orders.forEach((o) => {
    const oTotal = o.total || 0;
    const cAt = o.createdAt || '';
    const matched = last7Days.find((d) => {
      if (cAt.includes('Hôm nay') && d.dateKey === todayDayMonth) return true;
      return cAt.includes(d.dateKey);
    });
    if (matched) {
      matched.revenue += oTotal;
      matched.count += 1;
    } else if (cAt.includes('Hôm nay')) {
      last7Days[last7Days.length - 1].revenue += oTotal;
      last7Days[last7Days.length - 1].count += 1;
    }
  });

  const maxRev = Math.max(...last7Days.map((d) => d.revenue), 100000);
  const yTopVal =
    maxRev >= 1000000
      ? `${(maxRev / 1000000).toFixed(1)}tr`
      : `${Math.round(maxRev / 1000)}k`;
  const yMidVal =
    maxRev >= 1000000
      ? `${(maxRev / 2000000).toFixed(1)}tr`
      : `${Math.round(maxRev / 2000)}k`;

  // Tọa độ các điểm vẽ SVG (X từ 60 đến 550, Y từ 190 xuống 60)
  const chartPoints = last7Days.map((d, i) => {
    const x = 60 + i * (490 / 6);
    const ratio = Math.min(1, Math.max(0, d.revenue / maxRev));
    const y = 190 - ratio * 130;
    return { x, y, ...d };
  });

  const linePath = chartPoints.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');
  const areaPath = `${linePath} L ${chartPoints[chartPoints.length - 1].x} 200 L ${chartPoints[0].x} 200 Z`;

  // 5. Thống kê Sản phẩm bán chạy thực tế
  const salesMap = new Map<string, { name: string; count: number; img: string }>();
  orders.forEach((o) => {
    if (Array.isArray(o.items)) {
      o.items.forEach((it: any) => {
        const pName = (it.name || it.product?.name || '').trim();
        if (!pName) return;
        const qty = Number(it.quantity || it.qty || 1);
        const pMatch = products.find(
          (p) => p.name.trim().toLowerCase() === pName.toLowerCase()
        );
        const img =
          pMatch?.imageUrl ||
          it.product?.imageUrl ||
          'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=100&q=80';
        const exist = salesMap.get(pName);
        if (exist) {
          exist.count += qty;
        } else {
          salesMap.set(pName, { name: pName, count: qty, img });
        }
      });
    }
  });

  let topList = Array.from(salesMap.values()).sort((a, b) => b.count - a.count);
  if (topList.length < 5) {
    products.forEach((p) => {
      if (!salesMap.has(p.name.trim()) && topList.length < 5) {
        topList.push({
          name: p.name,
          count: 0,
          img: p.imageUrl,
        });
      }
    });
  }
  topList = topList.slice(0, 5);

  return (
    <div className="tab-overview">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <div>
          <h1 className="page-heading" style={{ margin: 0 }}>
            Tổng quan
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
            Dữ liệu thực tế từ hoạt động đặt món & tài khoản của khách hàng
          </p>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="stat-cards-grid">
        <div className="stat-card">
          <div className="stat-label">
            {todayRevenue > 0 ? 'Doanh thu hôm nay' : 'Tổng doanh thu thực tế'}
          </div>
          <div className="stat-value" style={{ color: '#166534' }}>
            {money(todayRevenue > 0 ? todayRevenue : totalRevenue)}
          </div>
          <div className="stat-sub positive">
            <span>
              {todayRevenue > 0
                ? `Đã nhận ${todayOrders.length} đơn hôm nay`
                : `Tổng cộng từ ${orders.length} đơn hàng`}
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Tổng đơn hàng</div>
          <div className="stat-value">{totalOrdersCount}</div>
          <div className="stat-sub positive">
            <span>
              {orders.filter((o) => o.status === 'PAID' || o.status === 'COMPLETED').length}{' '}
              đơn đã thanh toán
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Khách hàng mới</div>
          <div className="stat-value">{realCustomersCount}</div>
          <div className="stat-sub positive">
            <span>Tài khoản khách hàng thực tế</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Tồn kho thấp</div>
          <div className="stat-value danger">{lowStockCount}</div>
          <div className="stat-sub danger">
            <span>
              {lowStockCount > 0 ? `${lowStockCount} món còn ≤ 15 ly` : 'Kho hàng đầy đủ'}
            </span>
          </div>
        </div>
      </div>

      {/* Charts & Top Products Row */}
      <div className="overview-panels-grid">
        {/* Doanh thu 7 ngày qua (SVG Chart thật) */}
        <div className="chart-panel">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}
          >
            <h3 className="panel-title" style={{ margin: 0 }}>
              Doanh thu 7 ngày qua
            </h3>
            <span
              style={{
                fontSize: '11px',
                color: '#166534',
                fontWeight: 700,
                background: '#dcfce7',
                padding: '2px 8px',
                borderRadius: '4px',
              }}
            >
              Dữ liệu thời gian thực
            </span>
          </div>

          <div className="chart-wrapper">
            <svg viewBox="0 0 600 240" className="revenue-svg">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#15803d" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#15803d" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines & Y-Labels */}
              <line x1="40" y1="60" x2="580" y2="60" stroke="#f1f5f9" strokeWidth="1" />
              <text x="32" y="64" textAnchor="end" className="chart-label">
                {yTopVal}
              </text>

              <line x1="40" y1="125" x2="580" y2="125" stroke="#f1f5f9" strokeWidth="1" />
              <text x="32" y="129" textAnchor="end" className="chart-label">
                {yMidVal}
              </text>

              <line x1="40" y1="190" x2="580" y2="190" stroke="#e2e8f0" strokeWidth="1" />
              <text x="32" y="194" textAnchor="end" className="chart-label">
                0
              </text>

              {/* Area Fill */}
              <path d={areaPath} fill="url(#chartGrad)" />

              {/* Line */}
              <path
                d={linePath}
                fill="none"
                stroke="#166534"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Points & Labels */}
              {chartPoints.map((pt, pIdx) => (
                <g key={pIdx}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={pt.revenue > 0 ? '5' : '3.5'}
                    fill="#166534"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  {pt.revenue > 0 && (
                    <text
                      x={pt.x}
                      y={pt.y - 8}
                      textAnchor="middle"
                      style={{ fontSize: '10px', fontWeight: 700, fill: '#166534' }}
                    >
                      {pt.revenue >= 1000000
                        ? `${(pt.revenue / 1000000).toFixed(1)}tr`
                        : `${Math.round(pt.revenue / 1000)}k`}
                    </text>
                  )}
                  <text x={pt.x} y="222" textAnchor="middle" className="chart-label">
                    {pt.dateKey}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Sản phẩm bán chạy */}
        <div className="top-products-panel">
          <h3 className="panel-title">Sản phẩm bán chạy</h3>

          <div className="top-products-list">
            {topList.map((item) => (
              <div className="top-prod-row" key={item.name}>
                <img src={item.img} alt={item.name} className="top-prod-img" />
                <span className="top-prod-name">{item.name}</span>
                <strong className="top-prod-count">{item.count}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
