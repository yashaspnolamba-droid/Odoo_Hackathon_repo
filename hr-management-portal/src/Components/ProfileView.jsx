import React, { useState } from 'react';
import { User, Briefcase, DollarSign, FileText, Camera, Edit3, Shield, Mail, Phone, MapPin, Calendar, CheckCircle, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ProfileEditModal } from './ProfileEditModal';

export const ProfileView = ({ employeeProfile, onBackToDashboard }) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [showEditModal, setShowEditModal] = useState(false);

  // If HR is inspecting another employee, use employeeProfile, else use currentUser
  const user = employeeProfile || currentUser;
  const isSelf = user.employeeId === currentUser?.employeeId;
  const isHR = currentUser?.role === 'HR';

  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'EMP';

  return (
    <div className="page-container">
      {employeeProfile && (
        <button className="btn btn-secondary btn-sm" onClick={onBackToDashboard} style={{ marginBottom: '1rem' }}>
          ← Back to Dashboard
        </button>
      )}

      {/* Header Card with Profile Picture */}
      <div className="profile-header-card">
        <div className="profile-avatar-wrapper">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="profile-avatar-lg" />
          ) : (
            <div className="profile-avatar-lg">{initials}</div>
          )}
          <div className="avatar-edit-badge" onClick={() => setShowEditModal(true)} title="Edit Profile Picture">
            <Camera size={16} />
          </div>
        </div>

        <div className="profile-header-info">
          <h1 className="profile-name">{user.name}</h1>
          <div className="profile-designation">{user.designation} • {user.department}</div>
          <div className="profile-meta-tags">
            <span className="meta-tag">ID: {user.employeeId}</span>
            <span className="meta-tag">Role: {user.role}</span>
            <span className="meta-tag">Joined: {user.joiningDate || '2022-03-15'}</span>
          </div>
        </div>

        <button className="btn btn-primary" onClick={() => setShowEditModal(true)}>
          <Edit3 size={16} />
          <span>Edit Profile</span>
        </button>
      </div>

      {/* Navigation Tabs (3.3.1 Personal, Job, Salary, Documents) */}
      <div className="profile-tabs">
        <button
          className={`profile-tab-btn ${activeTab === 'personal' ? 'active' : ''}`}
          onClick={() => setActiveTab('personal')}
        >
          Personal Details
        </button>
        <button
          className={`profile-tab-btn ${activeTab === 'job' ? 'active' : ''}`}
          onClick={() => setActiveTab('job')}
        >
          Job Details
        </button>
        <button
          className={`profile-tab-btn ${activeTab === 'salary' ? 'active' : ''}`}
          onClick={() => setActiveTab('salary')}
        >
          Salary Structure
        </button>
        <button
          className={`profile-tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          Documents
        </button>
      </div>

      {/* Tab Contents */}
      <div className="card">
        {/* Personal Details */}
        {activeTab === 'personal' && (
          <div>
            <h2 className="card-title" style={{ marginBottom: '1.25rem' }}>
              <User size={20} color="var(--primary)" />
              <span>Personal Information</span>
            </h2>
            <div className="detail-row">
              <div className="detail-label">Full Name</div>
              <div className="detail-value">{user.name}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Email Address</div>
              <div className="detail-value">{user.email}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Phone Number</div>
              <div className="detail-value">{user.phone || '+1 (555) 234-5678'}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Residential Address</div>
              <div className="detail-value">{user.address || '742 Evergreen Terrace, Springfield, IL'}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Emergency Contact</div>
              <div className="detail-value">+1 (555) 999-8877 (Spouse / Guardian)</div>
            </div>
          </div>
        )}

        {/* Job Details */}
        {activeTab === 'job' && (
          <div>
            <h2 className="card-title" style={{ marginBottom: '1.25rem' }}>
              <Briefcase size={20} color="var(--secondary)" />
              <span>Job & Employment Information</span>
            </h2>
            <div className="detail-row">
              <div className="detail-label">Employee ID</div>
              <div className="detail-value">{user.employeeId}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Designation</div>
              <div className="detail-value">{user.designation}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Department</div>
              <div className="detail-value">{user.department}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Date of Joining</div>
              <div className="detail-value">{user.joiningDate || '2022-03-15'}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Work Location</div>
              <div className="detail-value">Headquarters - Chicago, IL (Hybrid)</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Reporting Manager</div>
              <div className="detail-value">Sarah Jenkins (HR Lead)</div>
            </div>
          </div>
        )}

        {/* Salary Structure */}
        {activeTab === 'salary' && (
          <div>
            <h2 className="card-title" style={{ marginBottom: '1.25rem' }}>
              <DollarSign size={20} color="#059669" />
              <span>Monthly Salary Breakdown</span>
            </h2>

            <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Earnings Component
                </div>
                <div className="detail-row">
                  <div className="detail-label">Basic Salary</div>
                  <div className="detail-value">${user.salary?.basic?.toLocaleString() || '65,000'} / mo</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">House Rent Allowance (HRA)</div>
                  <div className="detail-value">${user.salary?.hra?.toLocaleString() || '25,000'} / mo</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Special Allowance</div>
                  <div className="detail-value">${user.salary?.special?.toLocaleString() || '15,000'} / mo</div>
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Deductions Component
                </div>
                <div className="detail-row">
                  <div className="detail-label">Provident Fund (PF)</div>
                  <div className="detail-value" style={{ color: '#dc2626' }}>-${user.salary?.pf?.toLocaleString() || '4,800'} / mo</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Income Tax (TDS)</div>
                  <div className="detail-value" style={{ color: '#dc2626' }}>-${user.salary?.tax?.toLocaleString() || '5,200'} / mo</div>
                </div>
              </div>
            </div>

            <div className="salary-card-highlight">
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#065f46' }}>Net Monthly Take-Home Salary</div>
              <div className="salary-num">${user.salary?.net?.toLocaleString() || '95,000'}</div>
            </div>
          </div>
        )}

        {/* Documents */}
        {activeTab === 'documents' && (
          <div>
            <h2 className="card-title" style={{ marginBottom: '1.25rem' }}>
              <FileText size={20} color="var(--primary)" />
              <span>Employee Documents & Contracts</span>
            </h2>

            <div className="doc-item">
              <div className="doc-info">
                <div className="doc-icon">
                  <FileText size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Employment Offer Letter & Contract.pdf</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Verified on {user.joiningDate || '2022-03-15'}</div>
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => alert('Downloading Employment Offer Letter...')}>
                <Download size={14} />
                <span>Download</span>
              </button>
            </div>

            <div className="doc-item">
              <div className="doc-info">
                <div className="doc-icon">
                  <FileText size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Government ID & Identity Proof.pdf</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Verified on file</div>
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => alert('Downloading Identity Proof...')}>
                <Download size={14} />
                <span>Download</span>
              </button>
            </div>

            <div className="doc-item">
              <div className="doc-info">
                <div className="doc-icon">
                  <FileText size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Tax Declaration Form FY2026.pdf</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Updated for current tax year</div>
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => alert('Downloading Tax Slip...')}>
                <Download size={14} />
                <span>Download</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {showEditModal && (
        <ProfileEditModal
          targetUser={user}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
};
