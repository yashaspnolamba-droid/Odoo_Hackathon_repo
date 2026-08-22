import React from 'react';
import { Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const EmailVerificationModal = ({ onVerificationSuccess, onBackToLogin }) => {
  const { pendingVerificationUser } = useAuth();

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '440px', textAlign: 'center' }}>
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: '#e0e7ff',
          color: '#4f46e5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem'
        }}>
          <Mail size={30} />
        </div>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>Check Your Email</h2>
        <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.25rem' }}>
          We sent a verification link to{' '}
          <strong style={{ color: '#0f172a' }}>{pendingVerificationUser?.email || 'your email'}</strong>
        </p>

        <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.75rem' }}>
          Please click the link in the email to verify your organization account before logging in.
        </p>

        <button
          onClick={onBackToLogin}
          className="btn btn-primary auth-submit-btn"
          style={{ display: 'inline-flex', gap: '0.5rem' }}
        >
          <span>Return to Sign In</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

