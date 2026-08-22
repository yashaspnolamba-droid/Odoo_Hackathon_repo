import React from 'react';
import { Building, LogOut, User, Shield, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const { currentUser, logout, setActiveTab } = useAuth();

  if (!currentUser) return null;

  const initials = currentUser.name
    ? currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U';

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <div className="nav-brand-icon">
          <Building size={20} />
        </div>
        <div>
          HR<span style={{ color: 'var(--primary)' }}>Pulse</span>
        </div>
      </div>

      <div className="nav-user-profile">
        <div style={{ position: 'relative', cursor: 'pointer', padding: '0.5rem', color: '#64748b' }}>
          <Bell size={20} />
          <span style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'var(--primary)'
          }}></span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '0.5rem', borderLeft: '1px solid var(--border)' }}>
          <div
            className="user-avatar-sm"
            onClick={() => setActiveTab('profile')}
            style={{ cursor: 'pointer' }}
          >
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              initials
            )}
          </div>

          <div className="user-meta-info" onClick={() => setActiveTab('profile')} style={{ cursor: 'pointer' }}>
            <span className="user-meta-name">{currentUser.name}</span>
            <span className={`badge ${currentUser.role === 'HR' ? 'badge-hr' : 'badge-employee'}`} style={{ width: 'fit-content' }}>
              {currentUser.role === 'HR' ? 'HR Admin' : 'Employee'}
            </span>
          </div>

          <button
            onClick={logout}
            className="btn btn-secondary btn-sm"
            title="Log Out"
            style={{ marginLeft: '0.5rem', padding: '0.4rem 0.6rem' }}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};
