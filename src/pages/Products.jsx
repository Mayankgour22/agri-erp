import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash, X, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

const Products = ({ user }) => {
  const [products, setProducts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Track expanded product rows to view batches
  const [expandedRows, setExpandedRows] = useState({});

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    company: '',
    category: 'Pesticide',
    purchasePrice: '',
    sellingPrice: '',
    gstPercentage: 18,
    minStockLevel: 10,
    image: ''
  });

  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      // Fetch Products
      const prodRes = await fetch('/api/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const prodData = await prodRes.json();
      setProducts(prodData);

      // Fetch companies for dropdown selector
      const compRes = await fetch('/api/companies', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const compData = await compRes.json();
      setCompanies(compData);

      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch product inventory data:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleRow = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: '',
      company: companies[0]?._id || '',
      category: 'Pesticide',
      purchasePrice: '',
      sellingPrice: '',
      gstPercentage: 18,
      minStockLevel: 10,
      image: ''
    });
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      sku: p.sku,
      company: p.company?._id || '',
      category: p.category,
      purchasePrice: p.purchasePrice,
      sellingPrice: p.sellingPrice,
      gstPercentage: p.gstPercentage,
      minStockLevel: p.minStockLevel,
      image: p.image || ''
    });
    setError('');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
      } else {
        const errData = await res.json();
        alert(errData.message || 'Failed to delete product');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.sku || !formData.company || !formData.purchasePrice || !formData.sellingPrice) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const url = editingProduct ? `/api/products/${editingProduct._id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setShowModal(false);
        fetchData();
      } else {
        const errData = await res.json();
        setError(errData.message || 'Error saving product');
      }
    } catch (err) {
      setError('Connection failure');
    }
  };

  // Convert image file upload to base64 for ease of preview/storage
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === '' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '4px' }}>Agricultural Medicine Catalog</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Manage chemicals, pesticides, fertilizers catalog with batch stocks and expiry alerts.
          </p>
        </div>
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <button onClick={handleOpenAdd} className="btn-primary">
            <Plus size={18} /> Add Product SKU
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="table-header-row">
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div className="search-wrapper">
            <Search size={18} className="search-icon-inside" />
            <input 
              type="text" 
              placeholder="Search product name, SKU..." 
              className="search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <select 
            className="filter-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="Pesticide">Pesticides</option>
            <option value="Fungicide">Fungicides</option>
            <option value="Fertilizer">Fertilizers</option>
            <option value="Herbicide">Herbicides</option>
            <option value="Growth Promoter">Growth Promoters</option>
            <option value="Seeds">Seeds</option>
            <option value="Other">Other Inputs</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>Loading product inventory...</div>
      ) : (
        <div className="table-container">
          <table className="responsive-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                <th>Dawai Name</th>
                <th>SKU</th>
                <th>Manufacturer</th>
                <th>Category</th>
                <th>Prices (Buy/Sell)</th>
                <th>GST %</th>
                <th>Stock Level</th>
                <th>Min Stock</th>
                {(user?.role === 'admin' || user?.role === 'manager') && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(p => {
                const isLowStock = p.currentStock <= p.minStockLevel;
                const isExpanded = !!expandedRows[p._id];
                
                return (
                  <React.Fragment key={p._id}>
                    <tr>
                      <td>
                        <button 
                          onClick={() => toggleRow(p._id)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {p.image ? (
                            <img 
                              src={p.image} 
                              alt={p.name} 
                              style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                            />
                          ) : (
                            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontWeight: 'bold', fontSize: '0.8rem' }}>
                              DR
                            </div>
                          )}
                          <span style={{ fontWeight: '600' }}>{p.name}</span>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{p.sku}</td>
                      <td>{p.company?.name || 'Unknown'}</td>
                      <td>
                        <span className="badge" style={{ backgroundColor: 'var(--bg-surface-hover)', color: 'var(--text-primary)' }}>
                          {p.category}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.85rem' }}>Sell: <strong>₹{p.sellingPrice}</strong></span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Buy: ₹{p.purchasePrice}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: '600' }}>{p.gstPercentage}%</td>
                      <td>
                        <span className={`badge ${isLowStock ? 'warning' : 'success'}`} style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
                          {isLowStock && <AlertCircle size={12} />}
                          {p.currentStock} Units
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{p.minStockLevel}</td>
                      {(user?.role === 'admin' || user?.role === 'manager') && (
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              onClick={() => handleOpenEdit(p)}
                              style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer' }}
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            {user?.role === 'admin' && (
                              <button 
                                onClick={() => handleDelete(p._id)}
                                style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                                title="Delete"
                              >
                                <Trash size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                    
                    {/* Expanded Row for Batches */}
                    {isExpanded && (
                      <tr>
                        <td colSpan="10" style={{ backgroundColor: 'rgba(255,255,255,0.01)', padding: '12px 24px 24px 60px' }}>
                          <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', backgroundColor: 'var(--bg-base)' }}>
                            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Available Stock Batches
                            </h4>
                            {p.batches && p.batches.length > 0 ? (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                                {p.batches.map((b, idx) => {
                                  const isExpired = new Date(b.expiryDate) < new Date();
                                  return (
                                    <div 
                                      key={idx} 
                                      style={{ 
                                        border: '1px solid var(--border-color)', 
                                        borderRadius: '8px', 
                                        padding: '12px',
                                        backgroundColor: 'var(--bg-surface)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '6px',
                                        position: 'relative'
                                      }}
                                    >
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '0.85rem' }}>{b.batchNumber}</span>
                                        <span className={`badge ${b.quantity === 0 ? 'danger' : (isExpired ? 'danger' : 'success')}`} style={{ fontSize: '0.65rem' }}>
                                          {b.quantity === 0 ? 'Empty' : (isExpired ? 'Expired' : 'Active')}
                                        </span>
                                      </div>
                                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        Expiry: <strong style={{ color: isExpired ? 'var(--danger)' : 'var(--text-primary)' }}>{new Date(b.expiryDate).toLocaleDateString()}</strong>
                                      </div>
                                      <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                                        Stock: {b.quantity} Units
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                                No stock batches found for this product. Use "Purchases (Stock-In)" to load inventory.
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
                    No products found in the catalog.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3>{editingProduct ? 'Edit Dawai SKU details' : 'Register New Dawai (Medicine / Fertilizer)'}</h3>
              <button 
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div style={{ color: 'var(--danger)', marginBottom: '16px', fontSize: '0.85rem', fontWeight: '600' }}>{error}</div>}
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Dawai (Product) Name *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. Confidor Soluble SL"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">SKU Code (Unique) *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={formData.sku}
                      onChange={(e) => setFormData({...formData, sku: e.target.value})}
                      placeholder="e.g. BAY-CON-100"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Chemical Manufacturer *</label>
                    <select 
                      className="filter-select"
                      style={{ width: '100%' }}
                      value={formData.company}
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                      required
                    >
                      {companies.map(c => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                      {companies.length === 0 && <option value="">No manufacturer registered</option>}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Input Category *</label>
                    <select 
                      className="filter-select"
                      style={{ width: '100%' }}
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      required
                    >
                      <option value="Pesticide">Pesticide</option>
                      <option value="Fungicide">Fungicide</option>
                      <option value="Fertilizer">Fertilizer</option>
                      <option value="Herbicide">Herbicide</option>
                      <option value="Growth Promoter">Growth Promoter</option>
                      <option value="Seeds">Seeds</option>
                      <option value="Other">Other Input</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Purchase Cost Price (₹) *</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={formData.purchasePrice}
                      onChange={(e) => setFormData({...formData, purchasePrice: e.target.value})}
                      placeholder="Cost price we buy from company"
                      min="0"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Dealer Selling Price (₹) *</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={formData.sellingPrice}
                      onChange={(e) => setFormData({...formData, sellingPrice: e.target.value})}
                      placeholder="Rate we charge to dealer"
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">GST Tax Rate (%) *</label>
                    <select 
                      className="filter-select"
                      style={{ width: '100%' }}
                      value={formData.gstPercentage}
                      onChange={(e) => setFormData({...formData, gstPercentage: parseInt(e.target.value)})}
                      required
                    >
                      <option value="0">0% (GST Exempt)</option>
                      <option value="5">5% (Fertilizers / Seeds)</option>
                      <option value="12">12% (Organic pesticides)</option>
                      <option value="18">18% (Standard chemical dawai)</option>
                      <option value="28">28%</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Min Stock Level (Alert threshold) *</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={formData.minStockLevel}
                      onChange={(e) => setFormData({...formData, minStockLevel: e.target.value})}
                      placeholder="Reorder warning quantity"
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Product Image File</label>
                  <input 
                    type="file" 
                    className="form-input" 
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  {formData.image && (
                    <div style={{ marginTop: '10px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Preview:</span>
                      <img 
                        src={formData.image} 
                        alt="Preview" 
                        style={{ display: 'block', width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover', marginTop: '4px', border: '1px solid var(--border-color)' }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">
                  {editingProduct ? 'Save Product Details' : 'Create Product Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
