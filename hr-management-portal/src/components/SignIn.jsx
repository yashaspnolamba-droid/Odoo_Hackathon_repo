import React, { useState } from 'react';
import { Mail, Lock, Shield, User, AlertCircle, Building, Info, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SignIn = ({ onSwitchToSignUp }) => {
  const { signIn } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Removed demo account fast-login methods

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const res = await signIn(formData.email, formData.password);
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

        {/* Removed Demo Quick Account Selector */}

        {error && (
          <div className="auth-alert auth-alert-danger">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Removed Role Selection UI since backend determines role based on JWT permissions */}

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
