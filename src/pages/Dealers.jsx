import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash, DollarSign, BookOpen, X } from 'lucide-react';

const Dealers = ({ user }) => {
  const [dealers, setDealers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  
  // Active dealer states
  const [editingDealer, setEditingDealer] = useState(null);
  const [activeDealer, setActiveDealer] = useState(null);

  // Forms state
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    gstNumber: '',
    address: '',
    creditLimit: 100000
  });

  const [paymentData, setPaymentData] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [error, setError] = useState('');

  const fetchDealers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/dealers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setDealers(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load dealer list:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDealers();
  }, []);

  const handleOpenAdd = () => {
    setEditingDealer(null);
    setFormData({
      name: '',
      mobile: '',
      gstNumber: '',
      address: '',
      creditLimit: 100000
    });
    setError('');
    setShowFormModal(true);
  };

  const handleOpenEdit = (d) => {
    setEditingDealer(d);
    setFormData({
      name: d.name,
      mobile: d.mobile,
      gstNumber: d.gstNumber || '',
      address: d.address || '',
      creditLimit: d.creditLimit
    });
    setError('');
    setShowFormModal(true);
  };

  const handleOpenPayment = (d) => {
    setActiveDealer(d);
    setPaymentData({
      amount: '',
      description: 'Cash payment received from dealer',
      date: new Date().toISOString().split('T')[0]
    });
    setError('');
    setShowPaymentModal(true);
  };

  const handleOpenLedger = async (d) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/dealers/${d._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const fullDealer = await res.json();
      setActiveDealer(fullDealer);
      setShowLedgerModal(true);
    } catch (err) {
      console.error('Failed to fetch dealer ledger details:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this dealer?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/dealers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchDealers();
      } else {
        const errData = await res.json();
        alert(errData.message || 'Failed to delete');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.name || !formData.mobile) {
      setError('Dealer Name and Mobile Number are required.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const url = editingDealer ? `/api/dealers/${editingDealer._id}` : '/api/dealers';
      const method = editingDealer ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setShowFormModal(false);
        fetchDealers();
      } else {
        const errData = await res.json();
        setError(errData.message || 'Error saving dealer');
      }
    } catch (err) {
      setError('Connection failure');
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const amt = parseFloat(paymentData.amount);
    if (!amt || amt <= 0) {
      setError('Please enter a valid positive payment amount.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/dealers/${activeDealer._id}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(paymentData)
      });

      if (res.ok) {
        setShowPaymentModal(false);
        fetchDealers();
      } else {
        const errData = await res.json();
        setError(errData.message || 'Error recording payment');
      }
    } catch (err) {
      setError('Server connection failure');
    }
  };

  const filteredDealers = dealers.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.mobile.includes(search) ||
    (d.gstNumber && d.gstNumber.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '4px' }}>Dealer Network & Credit Tracker</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Register distribution dealers, manage their credit limits, track outstanding balances, and log payment receipt histories.
          </p>
        </div>
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <button onClick={handleOpenAdd} className="btn-primary">
            <Plus size={18} /> Register Dealer
          </button>
        )}
      </div>

      <div className="table-header-row">
        <div className="search-wrapper">
          <Search size={18} className="search-icon-inside" />
          <input 
            type="text" 
            placeholder="Search dealers, GST, mobile..." 
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>Loading dealers...</div>
      ) : (
        <div className="table-container">
          <table className="responsive-table">
            <thead>
              <tr>
                <th>Dealer Name</th>
                <th>Mobile</th>
                <th>GST Number</th>
                <th>Address</th>
                <th>Credit Limit</th>
                <th>Outstanding Balance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDealers.map(d => {
                const isOverCreditLimit = d.outstandingBalance > d.creditLimit;
                return (
                  <tr key={d._id}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: '600' }}>{d.name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: {d._id.substring(18)}</span>
                      </div>
                    </td>
                    <td>{d.mobile}</td>
                    <td>{d.gstNumber || 'N/A'}</td>
                    <td>{d.address || 'N/A'}</td>
                    <td>₹{d.creditLimit.toLocaleString('en-IN')}</td>
                    <td>
                      <span 
                        className={`badge ${d.outstandingBalance === 0 ? 'success' : (isOverCreditLimit ? 'danger' : 'warning')}`}
                        style={{ fontWeight: 'bold' }}
                      >
                        ₹{d.outstandingBalance.toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => handleOpenLedger(d)}
                          style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="View Ledger Statement"
                        >
                          <BookOpen size={16} /> Ledger
                        </button>
                        <button 
                          onClick={() => handleOpenPayment(d)}
                          style={{ background: 'none', border: 'none', color: 'var(--success)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="Record Payment Receipt"
                        >
                          <DollarSign size={16} /> Pay In
                        </button>
                        {(user?.role === 'admin' || user?.role === 'manager') && (
                          <button 
                            onClick={() => handleOpenEdit(d)}
                            style={{ background: 'none', border: 'none', color: 'var(--info)', cursor: 'pointer' }}
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                        )}
                        {user?.role === 'admin' && (
                          <button 
                            onClick={() => handleDelete(d._id)}
                            style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                            title="Delete"
                          >
                            <Trash size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredDealers.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
                    No dealers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Register/Edit Dealer Modal */}
      {showFormModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingDealer ? 'Edit Dealer Details' : 'Register New Dealer Account'}</h3>
              <button onClick={() => setShowFormModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                {error && <div style={{ color: 'var(--danger)', marginBottom: '16px', fontSize: '0.85rem', fontWeight: '600' }}>{error}</div>}

                <div className="form-group">
                  <label className="form-label">Dealer Store/Shop Name *</label>
                  <input 
                    type="text" 
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Kisan Agro Agency"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Mobile Number *</label>
                    <input 
                      type="text" 
                      className="form-input"
                      value={formData.mobile}
                      onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                      placeholder="e.g. 94250xxxxx"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">GST Number (Optional)</label>
                    <input 
                      type="text" 
                      className="form-input"
                      value={formData.gstNumber}
                      onChange={(e) => setFormData({...formData, gstNumber: e.target.value})}
                      placeholder="e.g. 23AABCK9876D1Z5"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Credit Limit (₹) *</label>
                  <input 
                    type="number" 
                    className="form-input"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({...formData, creditLimit: parseInt(e.target.value) || 0})}
                    placeholder="Maximum credit limit to allow"
                    min="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Shop Address</label>
                  <textarea 
                    className="form-input"
                    rows="3"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="Dealer store location address"
                    style={{ resize: 'vertical' }}
                  ></textarea>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowFormModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">
                  {editingDealer ? 'Save Changes' : 'Register Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Receipt Modal */}
      {showPaymentModal && activeDealer && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Record Payment Receipt</h3>
              <button onClick={() => setShowPaymentModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit}>
              <div className="modal-body">
                {error && <div style={{ color: 'var(--danger)', marginBottom: '16px', fontSize: '0.85rem', fontWeight: '600' }}>{error}</div>}

                <div style={{ marginBottom: '20px', padding: '12px', background: 'var(--bg-base)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <span>Dealer Store: <strong>{activeDealer.name}</strong></span>
                  <span style={{ display: 'block', fontSize: '0.85rem', marginTop: '4px' }}>
                    Outstanding Balance: <strong style={{ color: 'var(--warning)' }}>₹{activeDealer.outstandingBalance.toLocaleString('en-IN')}</strong>
                  </span>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Payment Amount Received (₹) *</label>
                    <input 
                      type="number" 
                      className="form-input"
                      value={paymentData.amount}
                      onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                      placeholder="e.g. 15000"
                      min="1"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Receipt Date *</label>
                    <input 
                      type="date" 
                      className="form-input"
                      value={paymentData.date}
                      onChange={(e) => setPaymentData({...paymentData, date: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Description / Reference</label>
                  <input 
                    type="text" 
                    className="form-input"
                    value={paymentData.description}
                    onChange={(e) => setPaymentData({...paymentData, description: e.target.value})}
                    placeholder="e.g. Cash, GPay, Bank Transfer Ref# 123"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Ledger Statement Modal */}
      {showLedgerModal && activeDealer && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '750px', width: '95%' }}>
            <div className="modal-header">
              <h3>Dealer Account Ledger Statement</h3>
              <button onClick={() => setShowLedgerModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', padding: '16px', background: 'var(--bg-base)', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Dealer Store:</span>
                  <strong style={{ display: 'block', fontSize: '1rem' }}>{activeDealer.name}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Mobile / Address:</span>
                  <span style={{ display: 'block' }}>{activeDealer.mobile}</span>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{activeDealer.address}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Credit Limit:</span>
                  <strong style={{ display: 'block' }}>₹{activeDealer.creditLimit.toLocaleString('en-IN')}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Current Outstanding Balance:</span>
                  <strong style={{ display: 'block', color: 'var(--warning)', fontSize: '1rem' }}>₹{activeDealer.outstandingBalance.toLocaleString('en-IN')}</strong>
                </div>
              </div>

              <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                Transaction History Log
              </h4>

              <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                <table className="responsive-table" style={{ fontSize: '0.85rem' }}>
                  <thead style={{ backgroundColor: 'var(--bg-surface-hover)', position: 'sticky', top: 0 }}>
                    <tr>
                      <th style={{ padding: '10px 16px' }}>Date</th>
                      <th style={{ padding: '10px 16px' }}>Ref Receipt/Inv</th>
                      <th style={{ padding: '10px 16px' }}>Description</th>
                      <th style={{ padding: '10px 16px' }}>Type</th>
                      <th style={{ padding: '10px 16px', textAlign: 'right' }}>Tx Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeDealer.ledger && activeDealer.ledger.map((tx, idx) => (
                      <tr key={idx}>
                        <td style={{ padding: '10px 16px' }}>{new Date(tx.date).toLocaleDateString()}</td>
                        <td style={{ padding: '10px 16px', fontFamily: 'monospace' }}>{tx.referenceId || 'N/A'}</td>
                        <td style={{ padding: '10px 16px' }}>{tx.description}</td>
                        <td style={{ padding: '10px 16px' }}>
                          <span className={`badge ${tx.type === 'SALE' ? 'danger' : 'success'}`} style={{ fontSize: '0.65rem' }}>
                            {tx.type === 'SALE' ? 'Out (Invoice)' : 'In (Payment)'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 'bold', color: tx.type === 'SALE' ? 'var(--danger)' : 'var(--success)' }}>
                          ₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                    {(!activeDealer.ledger || activeDealer.ledger.length === 0) && (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                          No ledger history found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowLedgerModal(false)} className="btn-primary">Close Ledger</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dealers;
