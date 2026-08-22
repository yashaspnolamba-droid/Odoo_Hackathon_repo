import React, { useState } from 'react';
import { Mail, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const EmailVerificationModal = ({ onVerificationSuccess, onBackToLogin }) => {
  const { pendingVerificationUser, verifyEmailOtp } = useAuth();
  const [otp, setOtp] = useState(['1', '2', '3', '4', '5', '6']);
  const [error, setError] = useState('');
  const [isVerifiedSuccess, setIsVerifiedSuccess] = useState(false);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleVerify = (e) => {
    e.preventDefault();
    setError('');
    const fullOtp = otp.join('');
    const res = verifyEmailOtp(fullOtp);

    if (res.success) {
      setIsVerifiedSuccess(true);
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '440px', textAlign: 'center' }}>
        {!isVerifiedSuccess ? (
          <>
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

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>Verify Your Email</h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.25rem' }}>
              We sent a 6-digit security code to{' '}
              <strong style={{ color: '#0f172a' }}>{pendingVerificationUser?.email || 'your email'}</strong>
            </p>

            <div style={{
              background: '#f8fafc',
              border: '1px dashed #cbd5e1',
              borderRadius: '8px',
              padding: '0.625rem',
              fontSize: '0.8rem',
              color: '#047857',
              marginBottom: '1rem'
            }}>
              💡 Demo Tip: Enter code <strong>123456</strong> to verify immediately.
            </div>

            {error && (
              <div className="auth-alert auth-alert-danger">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleVerify}>
              <div className="otp-container">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-input-${idx}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    className="otp-input"
                  />
                ))}
              </div>

              <button type="submit" className="btn btn-primary auth-submit-btn">
                Confirm & Verify Account
              </button>
            </form>
          </>
        ) : (
          <>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#d1fae5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}>
              <CheckCircle size={36} />
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>Account Verified!</h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.75rem' }}>
              Your email has been successfully verified. You can now log in directly to access your dashboard.
            </p>

            <button
              onClick={onBackToLogin}
              className="btn btn-primary auth-submit-btn"
              style={{ display: 'inline-flex', gap: '0.5rem' }}
            >
              <span>Go to Sign In</span>
              <ArrowRight size={18} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
