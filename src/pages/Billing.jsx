import React, { useState, useEffect } from 'react';
import { Plus, Trash, Printer, FileText, Download, Check, AlertCircle, X, Search } from 'lucide-react';

const Billing = ({ user }) => {
  const [invoices, setInvoices] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('create'); // 'create' or 'history'
  
  // Create Invoice State
  const [selectedDealer, setSelectedDealer] = useState('');
  const [paymentReceived, setPaymentReceived] = useState(0);
  const [discountTotal, setDiscountTotal] = useState(0);
  const [billingItems, setBillingItems] = useState([
    { product: '', batchNumber: '', quantity: 1, rate: 0, gstPercentage: 18, total: 0, availableBatches: [], maxQty: 0 }
  ]);
  const [error, setError] = useState('');
  const [successInvoice, setSuccessInvoice] = useState(null); // For invoice preview/print after creation

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const invRes = await fetch('/api/invoices', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const invData = await invRes.json();
      setInvoices(invData);

      const dealerRes = await fetch('/api/dealers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dealerData = await dealerRes.json();
      setDealers(dealerData);

      const prodRes = await fetch('/api/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const prodData = await prodRes.json();
      setProducts(prodData);

      setLoading(false);
    } catch (err) {
      console.error('Error fetching billing dependencies:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddItemRow = () => {
    setBillingItems([
      ...billingItems,
      { product: '', batchNumber: '', quantity: 1, rate: 0, gstPercentage: 18, total: 0, availableBatches: [], maxQty: 0 }
    ]);
  };

  const handleRemoveItemRow = (idx) => {
    if (billingItems.length === 1) return;
    setBillingItems(billingItems.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx, field, val) => {
    const newItems = [...billingItems];
    newItems[idx][field] = val;

    if (field === 'product') {
      const prod = products.find(p => p._id === val);
      if (prod) {
        newItems[idx].rate = prod.sellingPrice;
        newItems[idx].gstPercentage = prod.gstPercentage;
        // Load active, unexpired batches with stock
        const today = new Date();
        newItems[idx].availableBatches = (prod.batches || []).filter(b => b.quantity > 0 && new Date(b.expiryDate) > today);
        newItems[idx].batchNumber = newItems[idx].availableBatches[0]?.batchNumber || '';
        newItems[idx].maxQty = newItems[idx].availableBatches[0]?.quantity || 0;
        newItems[idx].quantity = 1;
      } else {
        newItems[idx].availableBatches = [];
        newItems[idx].batchNumber = '';
        newItems[idx].maxQty = 0;
      }
    }

    if (field === 'batchNumber') {
      const batch = newItems[idx].availableBatches.find(b => b.batchNumber === val);
      newItems[idx].maxQty = batch ? batch.quantity : 0;
      if (newItems[idx].quantity > newItems[idx].maxQty) {
        newItems[idx].quantity = newItems[idx].maxQty;
      }
    }

    // Recalculate item total
    const qty = parseFloat(newItems[idx].quantity) || 0;
    const rate = parseFloat(newItems[idx].rate) || 0;
    const gstRate = parseFloat(newItems[idx].gstPercentage) || 0;
    
    // Ensure quantity doesn't exceed stock limit
    if (qty > newItems[idx].maxQty) {
      newItems[idx].quantity = newItems[idx].maxQty;
    }

    const baseVal = newItems[idx].quantity * rate;
    const gstAmount = baseVal * (gstRate / 100);
    newItems[idx].total = baseVal + gstAmount;

    setBillingItems(newItems);
  };

  // Subtotal before tax
  const subtotal = billingItems.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const rate = parseFloat(item.rate) || 0;
    return sum + (qty * rate);
  }, 0);

  // Total tax amount
  const gstTotal = billingItems.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const rate = parseFloat(item.rate) || 0;
    const gstRate = parseFloat(item.gstPercentage) || 0;
    return sum + ((qty * rate) * (gstRate / 100));
  }, 0);

  const grandTotal = Math.max(0, subtotal + gstTotal - (parseFloat(discountTotal) || 0));

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!selectedDealer) {
      setError('Please select a Dealer.');
      return;
    }

    const invalidLine = billingItems.some(item => !item.product || !item.batchNumber || item.quantity <= 0);
    if (invalidLine) {
      setError('Please fill in product, select an available batch, and enter a valid quantity.');
      return;
    }

    // Format items
    const itemsPayload = billingItems.map(item => {
      const qty = parseFloat(item.quantity);
      const rate = parseFloat(item.rate);
      const base = qty * rate;
      const gstAmt = base * (item.gstPercentage / 100);
      return {
        product: item.product,
        batchNumber: item.batchNumber,
        quantity: qty,
        rate: rate,
        gstPercentage: item.gstPercentage,
        gstAmount: gstAmt,
        total: item.total
      };
    });

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          dealer: selectedDealer,
          items: itemsPayload,
          subtotal,
          gstTotal,
          discountTotal: parseFloat(discountTotal) || 0,
          grandTotal,
          paymentReceived: parseFloat(paymentReceived) || 0
        })
      });

      if (res.ok) {
        const result = await res.json();
        
        // Fetch invoice details populated with dealer details for print preview
        const detailRes = await fetch(`/api/invoices/${result._id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const detailData = await detailRes.json();
        
        setSuccessInvoice(detailData);
        fetchData(); // reload lists

        // Reset inputs
        setSelectedDealer('');
        setPaymentReceived(0);
        setDiscountTotal(0);
        setBillingItems([{ product: '', batchNumber: '', quantity: 1, rate: 0, gstPercentage: 18, total: 0, availableBatches: [], maxQty: 0 }]);
      } else {
        const errData = await res.json();
        setError(errData.message || 'Billing transaction failed');
      }
    } catch (err) {
      setError('Server connection failed');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Simulates downloading dynamic CSV Excel data representation
  const handleExportCSV = (inv) => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Invoice Number,Date,Dealer Name,Product SKU,Batch,Qty,Rate,GST %,Total\r\n";
    
    inv.items.forEach(item => {
      csvContent += `${inv.invoiceNumber},${new Date(inv.date).toLocaleDateString()},${inv.dealer?.name},${item.product?.sku},${item.batchNumber},${item.quantity},${item.rate},${item.gstPercentage}%,${item.total}\r\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Invoice_${inv.invoiceNumber.replace(/\//g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '4px' }}>Sales & Billing Terminal</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Dispatch pesticide/fertilizer stocks, calculate SGST/CGST, log dealer credits and print POS invoices.
          </p>
        </div>
        
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className={`btn-secondary ${activeTab === 'create' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('create')}
            style={activeTab === 'create' ? {color: 'white'} : {}}
          >
            Create Invoice
          </button>
          <button 
            className={`btn-secondary ${activeTab === 'history' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('history')}
            style={activeTab === 'history' ? {color: 'white'} : {}}
          >
            Invoice History
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>Loading billing files...</div>
      ) : activeTab === 'create' ? (
        /* POS creation layout grid */
        <div className="billing-grid">
          {/* Billing items panel */}
          <div className="billing-items-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1rem' }}>Invoice Line Items</h3>
              <button onClick={handleAddItemRow} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                + Add Item Row
              </button>
            </div>

            {error && (
              <div style={{ color: 'var(--danger)', background: 'var(--danger-light)', padding: '12px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {billingItems.map((item, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 30px', 
                    gap: '12px', 
                    alignItems: 'end',
                    paddingBottom: '16px',
                    borderBottom: '1px solid var(--border-color)'
                  }}
                >
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Select Dawai (Product)</label>
                    <select 
                      className="filter-select"
                      style={{ width: '100%', padding: '8px' }}
                      value={item.product}
                      onChange={(e) => handleItemChange(idx, 'product', e.target.value)}
                      required
                    >
                      <option value="">-- Choose Product --</option>
                      {products.map(p => (
                        <option key={p._id} value={p._id}>{p.name} (SKU: {p.sku})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Batch Number</label>
                    <select 
                      className="filter-select"
                      style={{ width: '100%', padding: '8px' }}
                      value={item.batchNumber}
                      onChange={(e) => handleItemChange(idx, 'batchNumber', e.target.value)}
                      required
                      disabled={!item.product}
                    >
                      <option value="">-- Choose Batch --</option>
                      {item.availableBatches.map(b => (
                        <option key={b.batchNumber} value={b.batchNumber}>{b.batchNumber} (Stock: {b.quantity})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Billing Qty</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      style={{ padding: '8px' }}
                      min="1"
                      max={item.maxQty}
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 0)}
                      required
                      disabled={!item.batchNumber}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Rate (₹)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      style={{ padding: '8px' }}
                      value={item.rate}
                      onChange={(e) => handleItemChange(idx, 'rate', parseFloat(e.target.value) || 0)}
                      required
                      disabled={!item.product}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                      Total (with GST)
                    </span>
                    <span style={{ fontWeight: '600', fontSize: '0.9rem', display: 'block', paddingBottom: '8px' }}>
                      ₹{item.total ? item.total.toFixed(2) : '0.00'}
                    </span>
                  </div>

                  <button 
                    type="button" 
                    onClick={() => handleRemoveItemRow(idx)}
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', marginBottom: '10px' }}
                  >
                    <Trash size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Billing summary and submit panel */}
          <div className="billing-summary-panel">
            <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Invoice Checkout</h3>
            
            <div className="form-group">
              <label className="form-label">Select Dealer (Customer) *</label>
              <select 
                className="filter-select"
                style={{ width: '100%' }}
                value={selectedDealer}
                onChange={(e) => setSelectedDealer(e.target.value)}
                required
              >
                <option value="">-- Choose Dealer --</option>
                {dealers.map(d => (
                  <option key={d._id} value={d._id}>{d.name} (Bal: ₹{d.outstandingBalance})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Immediate Discount Amount (₹)</label>
              <input 
                type="number" 
                className="form-input" 
                value={discountTotal}
                onChange={(e) => setDiscountTotal(parseFloat(e.target.value) || 0)}
                placeholder="Discount"
                min="0"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Payment Received (Paid Now) (₹)</label>
              <input 
                type="number" 
                className="form-input" 
                value={paymentReceived}
                onChange={(e) => setPaymentReceived(parseFloat(e.target.value) || 0)}
                placeholder="Payment received"
                min="0"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
              <div className="summary-row">
                <span>Total Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Output GST Tax:</span>
                <span>₹{gstTotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Discount Applied:</span>
                <span>- ₹{(discountTotal || 0).toFixed(2)}</span>
              </div>
              <div className="summary-row total">
                <span>Grand Total:</span>
                <span style={{ color: 'var(--accent)' }}>₹{grandTotal.toFixed(2)}</span>
              </div>
              <div className="summary-row" style={{ fontSize: '0.8rem', color: 'var(--warning)', marginTop: '4px' }}>
                <span>Will add to dealer ledger:</span>
                <span>₹{Math.max(0, grandTotal - paymentReceived).toFixed(2)}</span>
              </div>
            </div>

            <button 
              onClick={handleCreateInvoice}
              className="btn-primary" 
              style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
            >
              Generate & Dispatch Invoice
            </button>
          </div>
        </div>
      ) : (
        /* Invoice List History */
        <div className="table-container">
          <table className="responsive-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Invoice Number</th>
                <th>Dealer Name</th>
                <th>Grand Total</th>
                <th>Paid Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv._id}>
                  <td>{new Date(inv.date).toLocaleDateString()}</td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{inv.invoiceNumber}</td>
                  <td style={{ fontWeight: '600' }}>{inv.dealer?.name || 'Unknown'}</td>
                  <td style={{ fontWeight: '600', color: 'var(--accent)' }}>₹{inv.grandTotal.toLocaleString('en-IN')}</td>
                  <td>₹{inv.paymentReceived.toLocaleString('en-IN')}</td>
                  <td>
                    <span className={`badge ${inv.status === 'PAID' ? 'success' : (inv.status === 'PARTIALLY_PAID' ? 'warning' : 'danger')}`}>
                      {inv.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button 
                        onClick={() => setSuccessInvoice(inv)}
                        style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        title="Print Preview"
                      >
                        <Printer size={16} /> Print
                      </button>
                      <button 
                        onClick={() => handleExportCSV(inv)}
                        style={{ background: 'none', border: 'none', color: 'var(--info)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        title="Export CSV"
                      >
                        <Download size={16} /> CSV
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
                    No invoice history found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Invoice Preview & POS Print Modal */}
      {successInvoice && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px', width: '95%' }}>
            <div className="modal-header no-print">
              <h3>Sales Invoice Receipt</h3>
              <button 
                onClick={() => setSuccessInvoice(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body print-invoice-area" style={{ padding: '32px', color: 'black', backgroundColor: 'white' }}>
              {/* Receipt Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid black', paddingBottom: '16px', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ color: 'black', fontSize: '1.5rem', fontWeight: 'bold' }}>AgriDistribute India</h2>
                  <p style={{ color: '#555', fontSize: '0.8rem' }}>Agri Chemical, Fertilizer & Seeds Wholesale Distributors</p>
                  <p style={{ color: '#555', fontSize: '0.8rem' }}>Mandi Compound, Indore, M.P. | GSTIN: 23AABCA8899A1Z0</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h3 style={{ color: 'black', fontSize: '1.1rem', fontWeight: 'bold' }}>TAX INVOICE</h3>
                  <p style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Inv No: {successInvoice.invoiceNumber}</p>
                  <p style={{ fontSize: '0.8rem' }}>Date: {new Date(successInvoice.date).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Dealer & Invoice Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: '#666', display: 'block', fontWeight: '600' }}>BILL TO (DEALER):</span>
                  <strong>{successInvoice.dealer?.name}</strong>
                  <p>{successInvoice.dealer?.address}</p>
                  <p>Mobile: {successInvoice.dealer?.mobile}</p>
                  <p>GSTIN: {successInvoice.dealer?.gstNumber || 'N/A'}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: '#666', display: 'block', fontWeight: '600' }}>TRANSACTION DETAILS:</span>
                  <p>Payment Term: Credit / Ledger Account</p>
                  <p>Status: <strong>{successInvoice.status?.replace('_', ' ')}</strong></p>
                </div>
              </div>

              {/* Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid black', borderTop: '1px solid black' }}>
                    <th style={{ textAlign: 'left', padding: '8px 4px' }}>Dawai Name</th>
                    <th style={{ textAlign: 'left', padding: '8px 4px' }}>Batch</th>
                    <th style={{ textAlign: 'right', padding: '8px 4px' }}>Qty</th>
                    <th style={{ textAlign: 'right', padding: '8px 4px' }}>Rate</th>
                    <th style={{ textAlign: 'right', padding: '8px 4px' }}>GST %</th>
                    <th style={{ textAlign: 'right', padding: '8px 4px' }}>Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {successInvoice.items?.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                      <td style={{ padding: '8px 4px', fontWeight: '600' }}>
                        {item.product?.name}
                      </td>
                      <td style={{ padding: '8px 4px', fontFamily: 'monospace' }}>{item.batchNumber}</td>
                      <td style={{ textAlign: 'right', padding: '8px 4px' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right', padding: '8px 4px' }}>₹{item.rate.toFixed(2)}</td>
                      <td style={{ textAlign: 'right', padding: '8px 4px' }}>{item.gstPercentage}%</td>
                      <td style={{ textAlign: 'right', padding: '8px 4px', fontWeight: 'bold' }}>₹{item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Calculations Block */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Subtotal:</span>
                    <span>₹{successInvoice.subtotal?.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>CGST/SGST Tax:</span>
                    <span>₹{successInvoice.gstTotal?.toFixed(2)}</span>
                  </div>
                  {successInvoice.discountTotal > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Discount Given:</span>
                      <span>- ₹{successInvoice.discountTotal?.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.05rem', borderTop: '2px solid black', paddingTop: '6px', marginTop: '4px' }}>
                    <span>Grand Total:</span>
                    <span>₹{successInvoice.grandTotal?.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#555', marginTop: '2px' }}>
                    <span>Paid on invoice:</span>
                    <span>₹{successInvoice.paymentReceived?.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 'bold', borderTop: '1px dashed #555', paddingTop: '4px' }}>
                    <span>Ledger Balance Added:</span>
                    <span>₹{Math.max(0, successInvoice.grandTotal - successInvoice.paymentReceived).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Terms and Signatures */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '60px', fontSize: '0.8rem' }}>
                <div>
                  <p><strong>Terms & Conditions:</strong></p>
                  <p>1. Interest at 18% p.a. charged after due date.</p>
                  <p>2. Subject to Indore Jurisdiction.</p>
                </div>
                <div style={{ textAlign: 'center', borderTop: '1px solid black', width: '150px', paddingTop: '6px', marginTop: '24px' }}>
                  Authorized Signatory
                </div>
              </div>
            </div>

            <div className="modal-footer no-print">
              <button className="btn-secondary" onClick={() => setSuccessInvoice(null)}>Close</button>
              <button className="btn-secondary" onClick={() => handleExportCSV(successInvoice)}>
                <Download size={16} /> Export to CSV
              </button>
              <button className="btn-primary" onClick={handlePrint}>
                <Printer size={16} /> Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
