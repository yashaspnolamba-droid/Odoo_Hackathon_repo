import React, { useState } from 'react';
import { Search, Eye, Edit3, Shield, Mail, Phone, Building } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const EmployeeDirectory = ({ onSelectEmployee }) => {
  const { users } = useAuth();
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  const departments = ['All', ...new Set(users.map(u => u.department || 'Engineering'))];

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.employeeId.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesDept = departmentFilter === 'All' || u.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="page-container">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">Employee Directory</h1>
        <p className="page-subtitle">View all registered staff members, inspect details, and switch profiles.</p>
      </div>

      {/* Filter & Search Controls */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div className="grid-2">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Search Employees</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search by Name, Employee ID or Email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '2.25rem' }}
              />
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Filter by Department</label>
            <select
              className="form-control"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Directory Grid */}
      <div className="grid-3">
        {filteredUsers.map(emp => (
          <div key={emp.employeeId} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div className="user-avatar-sm" style={{ width: '48px', height: '48px', fontSize: '1.1rem' }}>
                {emp.avatar ? (
                  <img src={emp.avatar} alt={emp.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  emp.name.substring(0, 2).toUpperCase()
                )}
              </div>

              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{emp.name}</h3>
                <div style={{ fontSize: '0.775rem', color: '#64748b' }}>{emp.designation}</div>
                <span className={`badge ${emp.role === 'HR' ? 'badge-hr' : 'badge-employee'}`} style={{ marginTop: '0.25rem' }}>
                  {emp.role}
                </span>
              </div>
            </div>

            <div style={{ fontSize: '0.825rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
              <div><strong>ID:</strong> {emp.employeeId}</div>
              <div><strong>Email:</strong> {emp.email}</div>
              <div><strong>Department:</strong> {emp.department}</div>
              <div><strong>Joining Date:</strong> {emp.joiningDate || '2022-03-15'}</div>
            </div>

            <button
              className="btn btn-primary btn-sm"
              style={{ marginTop: 'auto', width: '100%' }}
              onClick={() => onSelectEmployee(emp)}
            >
              <Eye size={14} />
              <span>Inspect & Edit Profile</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
