import React, { useState } from 'react';
import { User, Mail, Lock, Shield, Check, X, UserCheck, AlertCircle, Building, Layers } from 'lucide-react';
import { useAuth, validatePassword, isPasswordStrong } from '../context/AuthContext';
import { EmailVerificationModal } from './EmailVerificationModal';

export const SignUp = ({ onSwitchToSignIn }) => {
  const { signUp } = useAuth();

  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Employee'
  });

  const [error, setError] = useState('');
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  const passwordRules = validatePassword(formData.password);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.employeeId.trim()) {
      setError('Employee ID is required.');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email address is required.');
      return;
    }
    if (!isPasswordStrong(formData.password)) {
      setError('Password does not satisfy all required security rules.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const res = signUp({
      employeeId: formData.employeeId,
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role
    });

    if (res.success) {
      setShowVerificationModal(true);
    } else {
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
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Register to join your organization portal</p>
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
            <label className="form-label">Select Account Role</label>
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

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Employee ID</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  name="employeeId"
                  placeholder="e.g. EMP202"
                  value={formData.employeeId}
                  onChange={handleChange}
                  className="form-control"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                name="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Work Email</label>
            <input
              type="email"
              name="email"
              placeholder="name@company.com"
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

            {/* Password Rules Checklist */}
            <div className="password-rules">
              <div className="password-rules-title">Password Requirements:</div>
              <div className={`password-rule-item ${passwordRules.minLength ? 'valid' : 'invalid'}`}>
                {passwordRules.minLength ? <Check size={14} /> : <X size={14} />} At least 8 characters
              </div>
              <div className={`password-rule-item ${passwordRules.hasUpper ? 'valid' : 'invalid'}`}>
                {passwordRules.hasUpper ? <Check size={14} /> : <X size={14} />} At least 1 uppercase letter (A-Z)
              </div>
              <div className={`password-rule-item ${passwordRules.hasLower ? 'valid' : 'invalid'}`}>
                {passwordRules.hasLower ? <Check size={14} /> : <X size={14} />} At least 1 lowercase letter (a-z)
              </div>
              <div className={`password-rule-item ${passwordRules.hasNumber ? 'valid' : 'invalid'}`}>
                {passwordRules.hasNumber ? <Check size={14} /> : <X size={14} />} At least 1 number (0-9)
              </div>
              <div className={`password-rule-item ${passwordRules.hasSpecial ? 'valid' : 'invalid'}`}>
                {passwordRules.hasSpecial ? <Check size={14} /> : <X size={14} />} At least 1 special character (!@#$)
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary auth-submit-btn">
            Sign Up & Verify Email
          </button>
        </form>

        <div className="auth-footer-link">
          Already have an account?{' '}
          <button type="button" onClick={onSwitchToSignIn}>
            Sign In Here
          </button>
        </div>
      </div>

      {showVerificationModal && (
        <EmailVerificationModal
          onVerificationSuccess={() => {
            setShowVerificationModal(false);
            onSwitchToSignIn();
          }}
          onBackToLogin={() => {
            setShowVerificationModal(false);
            onSwitchToSignIn();
          }}
        />
      )}
    </div>
  );
};
