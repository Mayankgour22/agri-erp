import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash, X } from 'lucide-react';

const Companies = ({ user }) => {
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    gstNumber: '',
    address: '',
    contactPerson: '',
    email: '',
    mobile: ''
  });

  const [error, setError] = useState('');

  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/companies', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setCompanies(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch manufacturers:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleOpenAdd = () => {
    setEditingCompany(null);
    setFormData({
      name: '',
      gstNumber: '',
      address: '',
      contactPerson: '',
      email: '',
      mobile: ''
    });
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      gstNumber: company.gstNumber,
      address: company.address || '',
      contactPerson: company.contactPerson || '',
      email: company.email || '',
      mobile: company.mobile
    });
    setError('');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this manufacturer?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/companies/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchCompanies();
      } else {
        const errData = await res.json();
        alert(errData.message || 'Failed to delete');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.name || !formData.gstNumber || !formData.mobile) {
      setError('Name, GST Number, and Mobile are required.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const url = editingCompany ? `/api/companies/${editingCompany._id}` : '/api/companies';
      const method = editingCompany ? 'PUT' : 'POST';

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
        fetchCompanies();
      } else {
        const errData = await res.json();
        setError(errData.message || 'Something went wrong');
      }
    } catch (err) {
      setError('Server connection failed');
    }
  };

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.gstNumber.toLowerCase().includes(search.toLowerCase()) ||
    (c.contactPerson && c.contactPerson.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '4px' }}>Manufacturer Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Register and manage pharmaceutical & chemical manufacturing suppliers.
          </p>
        </div>
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <button onClick={handleOpenAdd} className="btn-primary">
            <Plus size={18} /> Add Manufacturer
          </button>
        )}
      </div>

      <div className="table-header-row">
        <div className="search-wrapper">
          <Search size={18} className="search-icon-inside" />
          <input 
            type="text" 
            placeholder="Search manufacturers, GST..." 
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>Loading manufacturers...</div>
      ) : (
        <div className="table-container">
          <table className="responsive-table">
            <thead>
              <tr>
                <th>Manufacturer Name</th>
                <th>GST Number</th>
                <th>Contact Details</th>
                <th>Email</th>
                <th>Address</th>
                {(user?.role === 'admin' || user?.role === 'manager') && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.map(c => (
                <tr key={c._id}>
                  <td style={{ fontWeight: '600' }}>{c.name}</td>
                  <td>{c.gstNumber}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>{c.contactPerson || 'N/A'}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{c.mobile}</span>
                    </div>
                  </td>
                  <td>{c.email || 'N/A'}</td>
                  <td>{c.address || 'N/A'}</td>
                  {(user?.role === 'admin' || user?.role === 'manager') && (
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => handleOpenEdit(c)}
                          style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer' }}
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        {user?.role === 'admin' && (
                          <button 
                            onClick={() => handleDelete(c._id)}
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
              ))}
              {filteredCompanies.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
                    No manufacturers found.
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
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingCompany ? 'Edit Manufacturer Details' : 'Add New Chemical Manufacturer'}</h3>
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
                
                <div className="form-group">
                  <label className="form-label">Manufacturer Company Name *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Bayer CropScience Ltd"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">GST Number *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={formData.gstNumber}
                      onChange={(e) => setFormData({...formData, gstNumber: e.target.value})}
                      placeholder="e.g. 27AADCB1234F1Z1"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mobile Number *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={formData.mobile}
                      onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                      placeholder="e.g. 9876543210"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Contact Person Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                      placeholder="e.g. Ramesh Sharma"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input 
                      type="email" 
                      className="form-input" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="e.g. contact@bayer.in"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Office Address</label>
                  <textarea 
                    className="form-input" 
                    rows="3"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="Complete company office address"
                    style={{ resize: 'vertical' }}
                  ></textarea>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">
                  {editingCompany ? 'Save Changes' : 'Create Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Companies;
