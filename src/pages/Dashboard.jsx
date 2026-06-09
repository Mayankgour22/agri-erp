import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Building2, 
  Users2, 
  TrendingUp, 
  AlertTriangle, 
  DollarSign, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight 
} from 'lucide-react';

const Dashboard = ({ onNavigate, user }) => {
  const [data, setData] = useState({
    totalProducts: 0,
    totalCompanies: 0,
    totalDealers: 0,
    totalStockValue: 0,
    todaySales: 0,
    monthlySales: 0,
    lowStockAlerts: 0,
    expiryAlerts: 0,
    recentTransactions: [],
    chartData: []
  });
  const [loading, setLoading] = useState(true);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [expiryAlertsList, setExpiryAlertsList] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Fetch general aggregates
        const aggRes = await fetch('/api/reports/dashboard', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const aggData = await aggRes.json();
        setData(aggData);

        // Fetch detailed low-stock items
        const lsRes = await fetch('/api/products/low-stock', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const lsData = await lsRes.json();
        setLowStockProducts(lsData.slice(0, 5)); // show top 5

        // Fetch detailed expiry warnings
        const expRes = await fetch('/api/products/expiry-alerts', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const expData = await expRes.json();
        setExpiryAlertsList(expData.slice(0, 5)); // show top 5

        setLoading(false);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading ERP Dashboard...</div>;
  }

  // Draw custom SVG chart variables
  const maxVal = Math.max(...data.chartData.map(d => Math.max(d.sales, d.purchases)), 10000);
  // Round max value to nearest 20% interval
  const chartHeight = 180;
  const chartWidth = 500;
  const padding = { top: 20, right: 20, bottom: 30, left: 60 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '6px' }}>Agricultural Business Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Real-time billing, stock valuation, and distributor logistics stats. Welcome back, <strong>{user?.name}</strong>.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="dashboard-grid">
        <div className="stat-card" onClick={() => onNavigate('products')} style={{ cursor: 'pointer' }}>
          <div className="stat-info">
            <span className="stat-label">Total Dawai SKU</span>
            <span className="stat-val">{data.totalProducts}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Inventory catalog</span>
          </div>
          <div className="stat-icon">
            <Package size={24} />
          </div>
        </div>

        <div className="stat-card" onClick={() => onNavigate('companies')} style={{ cursor: 'pointer' }}>
          <div className="stat-info">
            <span className="stat-label">Manufacturers</span>
            <span className="stat-val">{data.totalCompanies}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Chemical suppliers</span>
          </div>
          <div className="stat-icon">
            <Building2 size={24} />
          </div>
        </div>

        <div className="stat-card" onClick={() => onNavigate('dealers')} style={{ cursor: 'pointer' }}>
          <div className="stat-info">
            <span className="stat-label">Dealer Network</span>
            <span className="stat-val">{data.totalDealers}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Registered retail stores</span>
          </div>
          <div className="stat-icon">
            <Users2 size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Stock Valuation</span>
            <span className="stat-val">₹{data.totalStockValue.toLocaleString('en-IN')}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: '600' }}>In-hand chemical value</span>
          </div>
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
        </div>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--accent)' }}>
          <div className="stat-info">
            <span className="stat-label">Today's Billing</span>
            <span className="stat-val">₹{data.todaySales.toLocaleString('en-IN')}</span>
            <span className="stat-trend up">Live sales today</span>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--info)' }}>
          <div className="stat-info">
            <span className="stat-label">Monthly Sales</span>
            <span className="stat-val">₹{data.monthlySales.toLocaleString('en-IN')}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Current month billing</span>
          </div>
        </div>

        <div className="stat-card" onClick={() => onNavigate('products')} style={{ borderLeft: '4px solid var(--warning)', cursor: 'pointer' }}>
          <div className="stat-info">
            <span className="stat-label">Low Stock items</span>
            <span className="stat-val" style={{ color: data.lowStockAlerts > 0 ? 'var(--warning)' : 'inherit' }}>
              {data.lowStockAlerts}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Below reorder level</span>
          </div>
          {data.lowStockAlerts > 0 && <AlertTriangle size={18} style={{ color: 'var(--warning)' }} />}
        </div>

        <div className="stat-card" onClick={() => onNavigate('reports')} style={{ borderLeft: '4px solid var(--danger)', cursor: 'pointer' }}>
          <div className="stat-info">
            <span className="stat-label">Expiry Warnings</span>
            <span className="stat-val" style={{ color: data.expiryAlerts > 0 ? 'var(--danger)' : 'inherit' }}>
              {data.expiryAlerts}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Batches expiring &lt; 90 days</span>
          </div>
          {data.expiryAlerts > 0 && <AlertTriangle size={18} style={{ color: 'var(--danger)' }} />}
        </div>
      </div>

      {/* Charts & Alerts Row */}
      <div className="dashboard-charts">
        {/* Sales & Purchase Analytics */}
        <div className="dashboard-panel">
          <div className="panel-title">
            <span>Sales & Purchases Billing History</span>
            <div className="chart-legend">
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: 'var(--accent)' }}></span>
                <span>Sales Billing</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: 'var(--info)' }}></span>
                <span>Procurement (Purchases)</span>
              </div>
            </div>
          </div>
          
          <div className="chart-container">
            <svg 
              viewBox={`0 0 ${chartWidth} ${chartHeight + padding.top + padding.bottom}`}
              style={{ width: '100%', height: '100%', overflow: 'visible' }}
            >
              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                const y = padding.top + chartHeight * (1 - ratio);
                const valLabel = (maxVal * ratio).toLocaleString('en-IN', { notation: 'compact' });
                return (
                  <g key={index}>
                    <line 
                      x1={padding.left} 
                      y1={y} 
                      x2={chartWidth - padding.right} 
                      y2={y} 
                      stroke="var(--border-color)" 
                      strokeWidth={1} 
                      strokeDasharray="4 4"
                    />
                    <text 
                      x={padding.left - 10} 
                      y={y + 4} 
                      fill="var(--text-secondary)" 
                      fontSize="9" 
                      textAnchor="end"
                    >
                      ₹{valLabel}
                    </text>
                  </g>
                );
              })}

              {/* Bars */}
              {data.chartData.map((d, index) => {
                const sectionWidth = (chartWidth - padding.left - padding.right) / data.chartData.length;
                const xCenter = padding.left + index * sectionWidth + sectionWidth / 2;
                
                const barWidth = 14;
                const salesHeight = (d.sales / maxVal) * chartHeight;
                const purchasesHeight = (d.purchases / maxVal) * chartHeight;

                const salesY = padding.top + chartHeight - salesHeight;
                const purchasesY = padding.top + chartHeight - purchasesHeight;

                return (
                  <g key={index}>
                    {/* Sales Bar */}
                    <rect
                      x={xCenter - barWidth - 2}
                      y={salesY}
                      width={barWidth}
                      height={salesHeight}
                      fill="var(--accent)"
                      rx="3"
                      title={`Sales: ₹${d.sales}`}
                    />
                    {/* Purchase Bar */}
                    <rect
                      x={xCenter + 2}
                      y={purchasesY}
                      width={barWidth}
                      height={purchasesHeight}
                      fill="var(--info)"
                      rx="3"
                      title={`Purchases: ₹${d.purchases}`}
                    />
                    {/* Month Label */}
                    <text
                      x={xCenter}
                      y={padding.top + chartHeight + 18}
                      fill="var(--text-secondary)"
                      fontSize="9"
                      textAnchor="middle"
                      fontWeight="500"
                    >
                      {d.month}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Real-time Alerts Panel */}
        <div className="dashboard-panel">
          <div className="panel-title">
            <span>Critical Alerts</span>
            <AlertTriangle size={18} style={{ color: 'var(--warning)' }} />
          </div>

          <div className="alerts-list">
            {lowStockProducts.map(p => (
              <div key={p._id} className="alert-item warning">
                <div className="alert-item-text">
                  <strong>Low Stock:</strong> {p.name}
                </div>
                <div className="alert-item-meta">
                  Qty: {p.currentStock}
                </div>
              </div>
            ))}

            {expiryAlertsList.map(a => (
              <div key={`${a.productId}-${a.batchNumber}`} className={`alert-item ${a.isExpired ? 'danger' : 'warning'}`}>
                <div className="alert-item-text">
                  <strong>{a.isExpired ? 'Expired:' : 'Expiry Warning:'}</strong> {a.name} (Batch: {a.batchNumber})
                </div>
                <div className="alert-item-meta">
                  {a.isExpired ? 'EXPIRED' : new Date(a.expiryDate).toLocaleDateString(undefined, {month: 'short', year: '2-digit'})}
                </div>
              </div>
            ))}

            {lowStockProducts.length === 0 && expiryAlertsList.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0', fontSize: '0.85rem' }}>
                All systems healthy. No stock or expiry concerns.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="table-container" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', fontWeight: '600' }}>Recent ERP Transactions</h3>
        <table className="responsive-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Inv / Bill No</th>
              <th>Type</th>
              <th>Manufacturer / Dealer</th>
              <th>Grand Total</th>
            </tr>
          </thead>
          <tbody>
            {data.recentTransactions.map(tx => (
              <tr key={tx.id + tx.type}>
                <td>{new Date(tx.date).toLocaleDateString()}</td>
                <td style={{ fontWeight: '600' }}>{tx.invoiceNumber}</td>
                <td>
                  <span className={`badge ${tx.type === 'SALE' ? 'success' : 'info'}`} style={tx.type === 'PURCHASE' ? {backgroundColor: 'var(--accent-light)', color: 'var(--accent)'} : {}}>
                    {tx.type === 'SALE' ? 'Sale / Invoice' : 'Purchase In'}
                  </span>
                </td>
                <td>{tx.entity}</td>
                <td style={{ fontWeight: '600' }}>₹{tx.amount.toLocaleString('en-IN')}</td>
              </tr>
            ))}
            {data.recentTransactions.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No transactions found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
