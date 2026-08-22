import React from 'react';
import { LayoutDashboard, User, Clock, Calendar, Users, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = () => {
  const { currentUser, activeTab, setActiveTab, logout } = useAuth();

  if (!currentUser) return null;

  const isHR = currentUser.role === 'HR';

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'leaves', label: 'Leave Requests', icon: Calendar },
  ];

  if (isHR) {
    menuItems.push({ id: 'directory', label: 'Employee Directory', icon: Users });
  }

  return (
    <aside className="sidebar">
      <div style={{ padding: '0.5rem 0.5rem 1rem', borderBottom: '1px solid #1e293b', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', fontWeight: 700 }}>
          {isHR ? 'HR Portal Menu' : 'Employee Workspace'}
        </span>
      </div>

      <div className="sidebar-menu">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="sidebar-footer">
        <div style={{ background: '#1e293b', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={16} color="var(--primary-light)" />
          <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
            ID: <strong>{currentUser.employeeId}</strong>
          </div>
        </div>
        <button className="sidebar-item" onClick={logout} style={{ color: '#ef4444' }}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
