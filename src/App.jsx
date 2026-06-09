import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Companies from './pages/Companies';
import Purchases from './pages/Purchases';
import Billing from './pages/Billing';
import Dealers from './pages/Dealers';
import Reports from './pages/Reports';
import Users from './pages/Users';
import { ShieldAlert, LogIn, Lock } from 'lucide-react';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Login form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(true);

  // Validate session on boot
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const userData = await res.json();
          setCurrentUser(userData);
          setIsAuthenticated(true);
        } else {
          // invalid token
          localStorage.removeItem('token');
        }
      } catch (err) {
        console.error('Session validation error:', err);
      }
      setLoading(false);
    };

    checkSession();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    if (!email || !password) {
      setLoginError('Email and Password are required.');
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.token);
        setCurrentUser(data.user);
        setIsAuthenticated(true);
        setCurrentView('dashboard');
      } else {
        const errData = await res.json();
        setLoginError(errData.message || 'Invalid username or password.');
      }
    } catch (err) {
      setLoginError('Could not reach server. Ensure backend is running.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleNavigate = (view) => {
    setCurrentView(view);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b0f19', color: 'white' }}>
        <h3>Launching Agri ERP Portal...</h3>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
              <Lock size={24} />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-display)' }}>Agri ERP Terminal</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Please enter credentials to login</p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {loginError && (
              <div style={{ color: 'var(--danger)', background: 'var(--danger-light)', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldAlert size={16} />
                <span>{loginError}</span>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Email Address</label>
              <input 
                type="email" 
                className="form-input" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. admin@agri.com"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Password</label>
              <input 
                type="password" 
                className="form-input" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="e.g. admin123"
                required
              />
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
              Sign In to Dashboard
            </button>
          </form>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span><strong>Seeded Logins for Demo:</strong></span>
            <span>Admin: <code>admin@agri.com</code> / <code>admin123</code></span>
            <span>Manager: <code>manager@agri.com</code> / <code>manager123</code></span>
            <span>Staff: <code>staff@agri.com</code> / <code>staff123</code></span>
          </div>
        </div>
      </div>
    );
  }

  // Render view components dynamically
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} user={currentUser} />;
      case 'products':
        return <Products user={currentUser} />;
      case 'companies':
        return <Companies user={currentUser} />;
      case 'purchases':
        return <Purchases user={currentUser} />;
      case 'billing':
        return <Billing user={currentUser} />;
      case 'dealers':
        return <Dealers user={currentUser} />;
      case 'reports':
        return <Reports />;
      case 'users':
        return <Users user={currentUser} />;
      default:
        return <Dashboard onNavigate={handleNavigate} user={currentUser} />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar 
        currentView={currentView} 
        onViewChange={handleNavigate} 
        collapsed={sidebarCollapsed}
        user={currentUser}
        onLogout={handleLogout}
      />
      
      <div className={`main-content ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <Navbar 
          sidebarCollapsed={sidebarCollapsed} 
          onToggleSidebar={toggleSidebar} 
          user={currentUser}
        />
        {renderView()}
      </div>
    </div>
  );
};

export default App;
