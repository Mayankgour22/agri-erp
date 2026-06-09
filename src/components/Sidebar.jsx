import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Building2, 
  ShoppingCart, 
  Receipt, 
  Users2, 
  BarChart3, 
  Users, 
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const Sidebar = ({ currentView, onViewChange, collapsed, onToggleCollapse, user, onLogout }) => {
  // Navigation items with roles required (empty array means all users)
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [] },
    { id: 'products', label: 'Products (Dawai)', icon: Package, roles: [] },
    { id: 'companies', label: 'Manufacturers', icon: Building2, roles: [] },
    { id: 'purchases', label: 'Purchases (Stock-In)', icon: ShoppingCart, roles: [] },
    { id: 'billing', label: 'Billing / Invoice', icon: Receipt, roles: [] },
    { id: 'dealers', label: 'Dealers Network', icon: Users2, roles: [] },
    { id: 'reports', label: 'Analytics & Reports', icon: BarChart3, roles: [] },
    { id: 'users', label: 'User Management', icon: Users, roles: ['admin', 'manager'] }
  ];

  // Filter menu items by user role
  const visibleItems = menuItems.filter(item => 
    item.roles.length === 0 || (user && item.roles.includes(user.role))
  );

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <Package size={24} />
        </div>
        <span className="sidebar-title">AgriDistribute</span>
      </div>

      <ul className="sidebar-menu">
        {visibleItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <li 
              key={item.id}
              className={`sidebar-item ${currentView === item.id ? 'active' : ''}`}
              onClick={() => onViewChange(item.id)}
              title={collapsed ? item.label : ''}
            >
              <IconComponent size={20} />
              <span className="sidebar-item-label">{item.label}</span>
            </li>
          );
        })}
      </ul>

      <div className="sidebar-footer">
        <div className="user-badge">
          <div className="user-avatar">
            {user && user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="user-info">
            <span className="user-name">{user ? user.name : 'Guest User'}</span>
            <span className="user-role">{user ? user.role : 'staff'}</span>
          </div>
        </div>
        <button 
          className="sidebar-item" 
          onClick={onLogout}
          style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left' }}
          title={collapsed ? 'Logout' : ''}
        >
          <LogOut size={20} />
          <span className="sidebar-item-label">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
