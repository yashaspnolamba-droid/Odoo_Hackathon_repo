import React, { useState } from 'react';
import { Mail, Lock, Shield, User, AlertCircle, Building, Info, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SignIn = ({ onSwitchToSignUp }) => {
  const { signIn } = useAuth();

  const [formData, setFormData] = useState({
    email: 'employee@company.com',
    password: 'Emp@12345',
    role: 'Employee'
  });

  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleQuickDemo = (role) => {
    if (role === 'Employee') {
      setFormData({
        email: 'employee@company.com',
        password: 'Emp@12345',
        role: 'Employee'
      });
    } else {
      setFormData({
        email: 'hr@company.com',
        password: 'Admin@12345',
        role: 'HR'
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const res = signIn(formData.email, formData.password, formData.role);
    if (!res.success) {
      setError(res.error);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo-icon">
            <Building size={24} />
          </div>
          <div className="auth-logo-text">
            HR<span>Pulse</span>
          </div>
        </div>

        <div className="auth-header">
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to access your HR workspace</p>
        </div>

        {/* Demo Quick Account Selector */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '0.85rem',
          marginBottom: '1.5rem',
          fontSize: '0.825rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>
            <Info size={14} />
            <span>Quick Demo Accounts:</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ flex: 1, fontSize: '0.75rem' }}
              onClick={() => handleQuickDemo('Employee')}
            >
              Demo Employee
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ flex: 1, fontSize: '0.75rem' }}
              onClick={() => handleQuickDemo('HR')}
            >
              Demo HR Manager
            </button>
          </div>
        </div>

        {error && (
          <div className="auth-alert auth-alert-danger">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Role Selection */}
          <div className="form-group">
            <label className="form-label">Signing in as:</label>
            <div className="role-selector">
              <div
                className={`role-pill ${formData.role === 'Employee' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, role: 'Employee' })}
              >
                <User size={18} />
                <span>Employee</span>
              </div>
              <div
                className={`role-pill ${formData.role === 'HR' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, role: 'HR' })}
              >
                <Shield size={18} />
                <span>HR / Admin</span>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Work Email</label>
            <input
              type="email"
              name="email"
              placeholder="email@company.com"
              value={formData.email}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary auth-submit-btn">
            Sign In to Dashboard
          </button>
        </form>

        <div className="auth-footer-link">
          Don't have an account yet?{' '}
          <button type="button" onClick={onSwitchToSignUp}>
            Sign Up Now
          </button>
        </div>
      </div>
    </div>
  );
};
