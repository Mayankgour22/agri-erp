import React, { useState, useEffect } from 'react';
import { Menu, Sun, Moon, Bell, ChevronRight, AlertTriangle, Calendar } from 'lucide-react';

const Navbar = ({ sidebarCollapsed, onToggleSidebar, user }) => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Apply theme on load/change
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Fetch low-stock and expiry warnings as notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Fetch low stock products
        const lowStockRes = await fetch('/api/products/low-stock', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const lowStock = await lowStockRes.json();

        // Fetch expiry alerts
        const expiryRes = await fetch('/api/products/expiry-alerts', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const expiryAlerts = await expiryRes.json();

        const notifs = [
          ...lowStock.map(p => ({
            id: `low-${p._id}`,
            type: 'stock',
            title: 'Low Stock Alert',
            message: `${p.name} is running low on stock. Current: ${p.currentStock}`,
            severity: 'warning'
          })),
          ...expiryAlerts.map(a => ({
            id: `exp-${a.productId}-${a.batchNumber}`,
            type: 'expiry',
            title: a.isExpired ? 'Expired Batch' : 'Upcoming Expiry',
            message: `${a.name} (Batch: ${a.batchNumber}) ${a.isExpired ? 'has expired' : 'expires soon'}: ${new Date(a.expiryDate).toLocaleDateString()}`,
            severity: a.isExpired ? 'danger' : 'warning'
          }))
        ];

        setNotifications(notifs);
        setUnreadCount(notifs.length);
      } catch (err) {
        console.error('Failed to load notifications:', err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className={`navbar ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button 
          onClick={onToggleSidebar} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}
        >
          <Menu size={22} />
        </button>
        <span style={{ fontSize: '1rem', fontWeight: '500', color: 'var(--text-secondary)' }}>
          Agri Chemical & Fertilizer Distribution ERP
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* Date Display */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }} className="no-print">
          <Calendar size={15} />
          <span>{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>

        {/* Theme Switcher */}
        <button 
          onClick={toggleTheme}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="no-print"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Notifications Icon */}
        <div style={{ position: 'relative' }} className="no-print">
          <button 
            onClick={() => { setShowNotif(!showNotif); setUnreadCount(0); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', position: 'relative' }}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                background: 'var(--danger)',
                color: 'white',
                borderRadius: '50%',
                width: '16px',
                height: '16px',
                fontSize: '0.65rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotif && (
            <div className="notifications-dropdown">
              <div className="notif-header">
                <span>Alerts & Notifications</span>
                <button 
                  onClick={() => setShowNotif(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--accent)' }}
                >
                  Close
                </button>
              </div>
              <div className="notif-body">
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No pending alerts! Stock & batches are healthy.
                  </div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className="notif-item">
                      <div style={{ color: n.severity === 'danger' ? 'var(--danger)' : 'var(--warning)', marginTop: '2px' }}>
                        <AlertTriangle size={16} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>{n.title}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{n.message}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
