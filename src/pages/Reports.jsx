import React, { useState, useEffect } from 'react';
import { Download, Calendar, ArrowUpRight, ArrowDownRight, DollarSign, Activity } from 'lucide-react';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('sales');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Report Data States
  const [salesReport, setSalesReport] = useState({ invoices: [], aggregates: { subtotal: 0, gstTotal: 0, discountTotal: 0, grandTotal: 0 } });
  const [purchaseReport, setPurchaseReport] = useState({ purchases: [], aggregates: { subtotal: 0, gstTotal: 0, grandTotal: 0 } });
  const [profitReport, setProfitReport] = useState({ summary: { totalRevenue: 0, totalCost: 0, totalProfit: 0, marginPercentage: 0 }, details: [] });
  const [gstSummary, setGstSummary] = useState({ outputGST: 0, inputGST: 0, netGSTPayable: 0 });
  const [stockLogs, setStockLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const dateParams = `?startDate=${startDate}&endDate=${endDate}`;

      if (activeTab === 'sales') {
        const res = await fetch(`/api/reports/sales${dateParams}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setSalesReport(data);
      } else if (activeTab === 'purchases') {
        const res = await fetch(`/api/reports/purchases${dateParams}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setPurchaseReport(data);
      } else if (activeTab === 'profit') {
        const res = await fetch(`/api/reports/profit${dateParams}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setProfitReport(data);
      } else if (activeTab === 'gst') {
        const res = await fetch(`/api/reports/gst${dateParams}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setGstSummary(data);
      } else if (activeTab === 'stock-movement') {
        const res = await fetch(`/api/reports/stock-movement`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setStockLogs(data);
      }

      setLoading(false);
    } catch (err) {
      console.error('Failed to load report data:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [activeTab, startDate, endDate]);

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    let filename = `${activeTab}_report_${startDate}_to_${endDate}.csv`;

    if (activeTab === 'sales') {
      csvContent += "Invoice Number,Date,Dealer Name,Subtotal,GST Tax,Discount,Grand Total\r\n";
      salesReport.invoices.forEach(inv => {
        csvContent += `${inv.invoiceNumber},${new Date(inv.date).toLocaleDateString()},${inv.dealer?.name},${inv.subtotal},${inv.gstTotal},${inv.discountTotal},${inv.grandTotal}\r\n`;
      });
    } else if (activeTab === 'purchases') {
      csvContent += "Invoice Number,Date,Manufacturer,Subtotal,GST Tax,Grand Total\r\n";
      purchaseReport.purchases.forEach(pur => {
        csvContent += `${pur.invoiceNumber},${new Date(pur.date).toLocaleDateString()},${pur.company?.name},${pur.subtotal},${pur.gstTotal},${pur.grandTotal}\r\n`;
      });
    } else if (activeTab === 'profit') {
      csvContent += "Date,Invoice Number,Dawai Name,SKU,Quantity,Selling Rate,Purchase Rate,GST %,Revenue Total,Cost Total,Net Profit\r\n";
      profitReport.details.forEach(item => {
        csvContent += `${new Date(item.date).toLocaleDateString()},${item.invoiceNumber},${item.productName},${item.sku},${item.quantity},${item.sellingRate},${item.purchaseRate},${item.gstPercentage}%,${item.saleTotal},${item.costTotal},${item.profit}\r\n`;
      });
    } else if (activeTab === 'gst') {
      csvContent += "GST Category,Tax Amount\r\n";
      csvContent += `Output GST (Tax Collected from Sales),₹${gstSummary.outputGST}\r\n`;
      csvContent += `Input GST (Tax Paid on Purchases),₹${gstSummary.inputGST}\r\n`;
      csvContent += `Net GST Payable,₹${gstSummary.netGSTPayable}\r\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '4px' }}>Analytical Reports</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Query transaction summaries, analyze net margins, audit stock logs and download GST schedules.
          </p>
        </div>

        {/* Date Filter Widget */}
        {activeTab !== 'stock-movement' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-surface)', padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
            <input 
              type="date" 
              className="form-input" 
              style={{ border: 'none', background: 'none', color: 'var(--text-primary)', padding: 0 }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span style={{ color: 'var(--text-secondary)' }}>to</span>
            <input 
              type="date" 
              className="form-input" 
              style={{ border: 'none', background: 'none', color: 'var(--text-primary)', padding: 0 }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Tabs Menu */}
      <div className="tabs-navigation">
        <button className={`tab-btn ${activeTab === 'sales' ? 'active' : ''}`} onClick={() => setActiveTab('sales')}>Sales Report</button>
        <button className={`tab-btn ${activeTab === 'purchases' ? 'active' : ''}`} onClick={() => setActiveTab('purchases')}>Purchase Report</button>
        <button className={`tab-btn ${activeTab === 'profit' ? 'active' : ''}`} onClick={() => setActiveTab('profit')}>Profit / Margin</button>
        <button className={`tab-btn ${activeTab === 'gst' ? 'active' : ''}`} onClick={() => setActiveTab('gst')}>GST Summary</button>
        <button className={`tab-btn ${activeTab === 'stock-movement' ? 'active' : ''}`} onClick={() => setActiveTab('stock-movement')}>Stock Audit Logs</button>
      </div>

      {/* Export Button */}
      {activeTab !== 'stock-movement' && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleExportCSV} className="btn-secondary">
            <Download size={16} /> Export CSV Excel
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>Compiling report data...</div>
      ) : (
        /* Dynamic Tab Views */
        <div>
          {activeTab === 'sales' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Aggregates row */}
              <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div className="stat-card">
                  <div className="stat-info">
                    <span className="stat-label">Total Invoices</span>
                    <span className="stat-val">{salesReport.invoices.length}</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-info">
                    <span className="stat-label">Subtotal</span>
                    <span className="stat-val">₹{salesReport.aggregates.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-info">
                    <span className="stat-label">Output GST</span>
                    <span className="stat-val">₹{salesReport.aggregates.gstTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <div className="stat-card" style={{ borderLeft: '4px solid var(--accent)' }}>
                  <div className="stat-info">
                    <span className="stat-label">Net Sales</span>
                    <span className="stat-val" style={{ color: 'var(--accent)' }}>₹{salesReport.aggregates.grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="table-container">
                <table className="responsive-table">
                  <thead>
                    <tr>
                      <th>Invoice Date</th>
                      <th>Invoice Number</th>
                      <th>Dealer Store</th>
                      <th>Subtotal</th>
                      <th>GST Tax</th>
                      <th>Discount</th>
                      <th>Grand Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesReport.invoices.map(inv => (
                      <tr key={inv._id}>
                        <td>{new Date(inv.date).toLocaleDateString()}</td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{inv.invoiceNumber}</td>
                        <td style={{ fontWeight: '600' }}>{inv.dealer?.name}</td>
                        <td>₹{inv.subtotal}</td>
                        <td>₹{inv.gstTotal}</td>
                        <td>₹{inv.discountTotal}</td>
                        <td style={{ fontWeight: '600', color: 'var(--accent)' }}>₹{inv.grandTotal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'purchases' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div className="stat-card">
                  <div className="stat-info">
                    <span className="stat-label">Procurements</span>
                    <span className="stat-val">{purchaseReport.purchases.length}</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-info">
                    <span className="stat-label">Base Cost</span>
                    <span className="stat-val">₹{purchaseReport.aggregates.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-info">
                    <span className="stat-label">Input GST Paid</span>
                    <span className="stat-val">₹{purchaseReport.aggregates.gstTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <div className="stat-card" style={{ borderLeft: '4px solid var(--info)' }}>
                  <div className="stat-info">
                    <span className="stat-label">Net Purchases</span>
                    <span className="stat-val" style={{ color: 'var(--info)' }}>₹{purchaseReport.aggregates.grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div className="table-container">
                <table className="responsive-table">
                  <thead>
                    <tr>
                      <th>Purchase Date</th>
                      <th>Inward Bill Number</th>
                      <th>Manufacturer Company</th>
                      <th>Base Cost</th>
                      <th>Input GST</th>
                      <th>Total Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseReport.purchases.map(pur => (
                      <tr key={pur._id}>
                        <td>{new Date(pur.date).toLocaleDateString()}</td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{pur.invoiceNumber}</td>
                        <td style={{ fontWeight: '600' }}>{pur.company?.name}</td>
                        <td>₹{pur.subtotal}</td>
                        <td>₹{pur.gstTotal}</td>
                        <td style={{ fontWeight: '600' }}>₹{pur.grandTotal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'profit' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="dashboard-grid">
                <div className="stat-card">
                  <div className="stat-info">
                    <span className="stat-label">Billing Revenue</span>
                    <span className="stat-val">₹{profitReport.summary.totalRevenue.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-info">
                    <span className="stat-label">Material Cost</span>
                    <span className="stat-val">₹{profitReport.summary.totalCost.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <div className="stat-card" style={{ borderLeft: '4px solid var(--success)' }}>
                  <div className="stat-info">
                    <span className="stat-label">Net Profit</span>
                    <span className="stat-val" style={{ color: 'var(--success)' }}>₹{profitReport.summary.totalProfit.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-info">
                    <span className="stat-label">Operating Margin</span>
                    <span className="stat-val">{profitReport.summary.marginPercentage.toFixed(2)}%</span>
                  </div>
                </div>
              </div>

              <div className="table-container">
                <table className="responsive-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Inv No</th>
                      <th>Product SKU</th>
                      <th>Dawai Name</th>
                      <th>Qty</th>
                      <th>Sell Rate</th>
                      <th>Cost Rate</th>
                      <th>Revenue</th>
                      <th>Cost</th>
                      <th>Profit Earned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profitReport.details.map((item, idx) => (
                      <tr key={idx}>
                        <td>{new Date(item.date).toLocaleDateString()}</td>
                        <td style={{ fontFamily: 'monospace' }}>{item.invoiceNumber}</td>
                        <td style={{ fontWeight: 'bold' }}>{item.sku}</td>
                        <td>{item.productName}</td>
                        <td>{item.quantity}</td>
                        <td>₹{item.sellingRate}</td>
                        <td style={{ color: 'var(--text-muted)' }}>₹{item.purchaseRate}</td>
                        <td>₹{item.saleTotal}</td>
                        <td style={{ color: 'var(--text-muted)' }}>₹{item.costTotal}</td>
                        <td style={{ fontWeight: '600', color: 'var(--success)' }}>₹{item.profit.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'gst' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px', margin: '0 auto' }}>
              <div className="dashboard-panel" style={{ padding: '32px' }}>
                <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                  GST Compliance Aggregates
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
                  <div style={{ display: 'flex', justifyBetween: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong style={{ fontSize: '0.95rem' }}>Output GST (Sales Tax Collected)</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Collected from dealers on invoices</span>
                    </div>
                    <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--danger)' }}>
                      ₹{gstSummary.outputGST.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyBetween: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong style={{ fontSize: '0.95rem' }}>Input GST (Tax Paid on Imports)</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Paid to manufacturers on stock procurements</span>
                    </div>
                    <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--success)' }}>
                      ₹{gstSummary.inputGST.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyBetween: 'space-between', alignItems: 'center', borderTop: '2px dashed var(--border-color)', paddingTop: '16px', background: 'var(--bg-base)', padding: '16px', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong style={{ fontSize: '1rem', color: 'var(--accent)' }}>Net GST Payable</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Net payable tax to government (Output - Input)</span>
                    </div>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                      ₹{gstSummary.netGSTPayable.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stock-movement' && (
            <div className="table-container">
              <table className="responsive-table">
                <thead>
                  <tr>
                    <th>Date / Time</th>
                    <th>Product</th>
                    <th>Batch</th>
                    <th>Type</th>
                    <th>Quantity</th>
                    <th>Source</th>
                    <th>Reference</th>
                    <th>Log Details</th>
                  </tr>
                </thead>
                <tbody>
                  {stockLogs.map(log => (
                    <tr key={log._id}>
                      <td>{new Date(log.date).toLocaleString()}</td>
                      <td style={{ fontWeight: '600' }}>{log.product?.name} ({log.product?.sku})</td>
                      <td style={{ fontFamily: 'monospace' }}>{log.batchNumber}</td>
                      <td>
                        <span className={`badge ${log.type === 'IN' ? 'success' : 'danger'}`}>
                          Stock {log.type}
                        </span>
                      </td>
                      <td style={{ fontWeight: '600' }}>{log.quantity} Units</td>
                      <td>{log.source}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{log.referenceId?.substring(18) || 'N/A'}</td>
                      <td>{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
