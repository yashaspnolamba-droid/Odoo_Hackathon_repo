import React, { useState } from 'react';
import { X, Lock, CheckCircle, Save, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

export const ProfileEditModal = ({ targetUser, onClose, onSaveComplete }) => {
  const { currentUser, updateCurrentUserProfile } = useAuth();
  const { adminUpdateEmployee } = useData();

  const isHR = currentUser?.role === 'HR';
  const isEditingOwnProfile = currentUser?.employeeId === targetUser?.employeeId;

  // Editable form state initialized with target user info
  const [formData, setFormData] = useState({
    name: targetUser?.name || '',
    phone: targetUser?.phone || '',
    address: targetUser?.address || '',
    avatar: targetUser?.avatar || '',
    department: targetUser?.department || '',
    designation: targetUser?.designation || '',
    role: targetUser?.role || 'Employee',
    salaryBasic: targetUser?.salary?.basic || 50000,
    salaryHra: targetUser?.salary?.hra || 20000,
    salarySpecial: targetUser?.salary?.special || 10000,
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarPreset = (url) => {
    setFormData(prev => ({ ...prev, avatar: url }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const netSalary = Number(formData.salaryBasic) + Number(formData.salaryHra) + Number(formData.salarySpecial) - 10000;

    const updatedPayload = {
      phone: formData.phone,
      address: formData.address,
      avatar: formData.avatar,
      ...(isHR ? {
        name: formData.name,
        department: formData.department,
        designation: formData.designation,
        role: formData.role,
        salary: {
          basic: Number(formData.salaryBasic),
          hra: Number(formData.salaryHra),
          special: Number(formData.salarySpecial),
          pf: 5000,
          tax: 5000,
          net: netSalary
        }
      } : {})
    };

    if (isEditingOwnProfile) {
      updateCurrentUserProfile(updatedPayload);
    }
    if (isHR) {
      adminUpdateEmployee(targetUser.employeeId, updatedPayload);
    }

    if (onSaveComplete) onSaveComplete();
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
            Edit Profile: {targetUser?.name}
          </h2>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {!isHR && (
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem', marginBottom: '1.25rem', fontSize: '0.825rem', color: '#64748b', display: 'flex', gap: '0.5rem' }}>
            <Lock size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>
              <strong>Employee Scope:</strong> You can edit your Phone, Address, and Profile Picture. Job details and Salary parameters are managed by HR.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Avatar Selector */}
          <div className="form-group">
            <label className="form-label">Profile Avatar URL / Preset</label>
            <input
              type="text"
              name="avatar"
              value={formData.avatar}
              onChange={handleChange}
              placeholder="Paste Image URL or select preset below"
              className="form-control"
            />
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleAvatarPreset('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250')}
              >
                Preset Avatar 1
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleAvatarPreset('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250')}
              >
                Preset Avatar 2
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleAvatarPreset('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250')}
              >
                Preset Avatar 3
              </button>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Residential Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>
          </div>

          {/* Admin Exclusive Fields */}
          {isHR && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', marginTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, fontSize: '0.875rem', color: 'var(--primary)', marginBottom: '1rem' }}>
                <ShieldAlert size={16} />
                <span>Admin Controls (HR Editable Fields)</span>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Designation</label>
                  <input
                    type="text"
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">System Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="form-control"
                  >
                    <option value="Employee">Employee</option>
                    <option value="HR">HR / Admin</option>
                  </select>
                </div>
              </div>

              <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#475569', margin: '0.75rem 0 0.5rem' }}>
                Salary Structure Adjustments (USD/Month)
              </div>
              <div className="grid-3">
                <div className="form-group">
                  <label className="form-label">Basic Pay</label>
                  <input
                    type="number"
                    name="salaryBasic"
                    value={formData.salaryBasic}
                    onChange={handleChange}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">HRA</label>
                  <input
                    type="number"
                    name="salaryHra"
                    value={formData.salaryHra}
                    onChange={handleChange}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Special Allowance</label>
                  <input
                    type="number"
                    name="salarySpecial"
                    value={formData.salarySpecial}
                    onChange={handleChange}
                    className="form-control"
                  />
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={16} />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
