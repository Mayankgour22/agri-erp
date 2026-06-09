import React, { useState, useEffect } from 'react';
import { Plus, UserPlus, Shield, CheckCircle, XCircle } from 'lucide-react';

const Users = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff'
  });

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setUsers(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load user directories:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleActive = async (id, currentStatus) => {
    if (user?.role !== 'admin') {
      alert('Only administrators can enable or disable user accounts.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/auth/users/${id}/active`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ active: !currentStatus })
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const errData = await res.json();
        alert(errData.message || 'Status modification failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.password) {
      setError('Please enter Name, Email and Password.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setShowModal(false);
        fetchUsers();
        // Reset form
        setFormData({ name: '', email: '', password: '', role: 'staff' });
      } else {
        const errData = await res.json();
        setError(errData.message || 'Registration failed');
      }
    } catch (err) {
      setError('Server connection failure');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '4px' }}>User & Team Permissions</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Register operators, configure roles, and enable/disable account permissions.
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <UserPlus size={18} /> Register Staff Profile
        </button>
      </div>

      <div className="dashboard-charts" style={{ gridTemplateColumns: '1.8fr 1.2fr' }}>
        {/* User directory */}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>Loading user profiles...</div>
        ) : (
          <div className="table-container">
            <table className="responsive-table">
              <thead>
                <tr>
                  <th>Staff Name</th>
                  <th>Email Login</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td style={{ fontWeight: '600' }}>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className="badge" style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-color)' }}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${u.active ? 'success' : 'danger'}`}>
                        {u.active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td>
                      {u._id === user?.id ? (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Logged In</span>
                      ) : (
                        <button 
                          onClick={() => handleToggleActive(u._id, u.active)}
                          style={{
                            background: 'none', 
                            border: 'none', 
                            color: u.active ? 'var(--danger)' : 'var(--success)', 
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: '600'
                          }}
                        >
                          {u.active ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Permissions matrix panel */}
        <div className="dashboard-panel">
          <div className="panel-title">
            <span>Role Permissions Matrix</span>
            <Shield size={18} style={{ color: 'var(--accent)' }} />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.85rem' }}>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <strong style={{ color: 'var(--accent)', display: 'block', marginBottom: '4px' }}>ADMIN (Administrator)</strong>
              <p style={{ color: 'var(--text-secondary)' }}>Full read/write permissions. Access to edit and delete all catalog profiles, ledger transactions, and user logins.</p>
            </div>
            
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <strong style={{ color: 'var(--info)', display: 'block', marginBottom: '4px' }}>MANAGER (Operations Manager)</strong>
              <p style={{ color: 'var(--text-secondary)' }}>Write permissions for creating catalog items, manufacturer profiles, purchases, and invoices. Cannot delete entries or manage staff login profiles.</p>
            </div>

            <div>
              <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>STAFF (Billing Clerk)</strong>
              <p style={{ color: 'var(--text-secondary)' }}>Billing invoice generation and basic customer directory lookup. Cannot access core config pages or edit transaction records.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3>Create Operator Login Profile</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
                <Plus size={20} style={{ transform: 'rotate(45deg)' }} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div style={{ color: 'var(--danger)', marginBottom: '16px', fontSize: '0.85rem', fontWeight: '600' }}>{error}</div>}

                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input 
                    type="text" 
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Vikas Sharma"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address (Username) *</label>
                  <input 
                    type="email" 
                    className="form-input"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="e.g. vikas@agri.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Login Password *</label>
                  <input 
                    type="password" 
                    className="form-input"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="e.g. min 6 characters"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Assign Role *</label>
                  <select 
                    className="filter-select"
                    style={{ width: '100%' }}
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="staff">Staff (Billing / POS Clerk)</option>
                    <option value="manager">Manager (Inventory / Procurements)</option>
                    <option value="admin">Admin (Full Access)</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Register Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
