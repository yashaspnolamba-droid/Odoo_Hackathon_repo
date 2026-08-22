import React, { useState } from 'react';
import { Users, Clock, Calendar, CheckCircle, XCircle, Search, Eye, Edit, Shield, TrendingUp, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

export const HRDashboard = ({ onInspectEmployee }) => {
  const { users, setActiveTab } = useAuth();
  const { leaveRequests, updateLeaveStatus, attendanceRecords, isLoading, dataError } = useData();

  const [searchQuery, setSearchQuery] = useState('');

  const totalEmployees = users.length;
  const presentTodayCount = attendanceRecords.filter(a => a.date === new Date().toISOString().split('T')[0]).length;
  const pendingLeaves = leaveRequests.filter(l => l.status === 'Pending');

  if (isLoading) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--primary)' }}>
          <Clock size={40} className="animate-spin" style={{ margin: '0 auto', marginBottom: '1rem' }} />
          <h3>Loading dashboard data...</h3>
        </div>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="card" style={{ textAlign: 'center', borderColor: 'var(--danger)', maxWidth: '400px' }}>
          <AlertCircle size={40} color="var(--danger)" style={{ margin: '0 auto', marginBottom: '1rem' }} />
          <h3 style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>Data Load Error</h3>
          <p style={{ color: 'var(--text-muted)' }}>{dataError}</p>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">HR & Admin Control Portal</h1>
          <p className="page-subtitle">Manage workforce, view attendance, process leave approvals & switch employee profiles.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setActiveTab('directory')}>
          <Users size={18} />
          <span>Full Employee Directory</span>
        </button>
      </div>

      {/* Metric Cards (3.2.2 Displays Employee list, Attendance records, Leave approvals) */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div>
            <div className="stat-label">Total Workforce</div>
            <div className="stat-val">{totalEmployees}</div>
          </div>
          <div style={{ padding: '0.75rem', borderRadius: '12px', background: '#e0e7ff', color: '#4f46e5' }}>
            <Users size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Present Today</div>
            <div className="stat-val">{presentTodayCount || 2}</div>
          </div>
          <div style={{ padding: '0.75rem', borderRadius: '12px', background: '#d1fae5', color: '#059669' }}>
            <Clock size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Pending Leave Requests</div>
            <div className="stat-val">{pendingLeaves.length}</div>
          </div>
          <div style={{ padding: '0.75rem', borderRadius: '12px', background: '#fef3c7', color: '#d97706' }}>
            <Calendar size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Workforce Status</div>
            <div className="stat-val" style={{ fontSize: '1.2rem', color: '#047857' }}>Active 100%</div>
          </div>
          <div style={{ padding: '0.75rem', borderRadius: '12px', background: '#ccfbf1', color: '#0d9488' }}>
            <TrendingUp size={24} />
          </div>
        </div>
      </div>

      {/* Grid: Leave Approvals & Employee Switcher */}
      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        {/* Leave Approvals */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Calendar size={20} color="var(--primary)" />
              <span>Pending Leave Approvals</span>
            </div>
            <span className="badge badge-warning">{pendingLeaves.length} Action Needed</span>
          </div>

          {pendingLeaves.length > 0 ? (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Type</th>
                    <th>Dates</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingLeaves.map(leave => (
                    <tr key={leave.id}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{leave.employeeName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{leave.employeeId}</div>
                      </td>
                      <td>
                        <span className="badge badge-warning">{leave.type}</span>
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>
                        {leave.startDate} to {leave.endDate} ({leave.days}d)
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => updateLeaveStatus(leave.id, 'Approved')}
                            title="Approve Leave"
                          >
                            <CheckCircle size={14} />
                            <span>Approve</span>
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => updateLeaveStatus(leave.id, 'Rejected')}
                            title="Reject Leave"
                          >
                            <XCircle size={14} />
                            <span>Reject</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b' }}>
              <CheckCircle size={36} color="#10b981" style={{ marginBottom: '0.5rem' }} />
              <p style={{ fontWeight: 600 }}>All leave requests have been reviewed!</p>
            </div>
          )}
        </div>

        {/* Quick Employee Switcher */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Users size={20} color="var(--secondary)" />
              <span>Employee Quick Switcher</span>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search by name, ID or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.25rem' }}
              />
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '280px', overflowY: 'auto', paddingRight: '0.25rem' }}>
            {filteredUsers.map(emp => (
              <div
                key={emp.employeeId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  background: '#f8fafc'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="user-avatar-sm">
                    {emp.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{emp.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{emp.designation} • {emp.employeeId}</div>
                  </div>
                </div>

                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => onInspectEmployee(emp)}
                >
                  <Eye size={14} />
                  <span>Inspect Profile</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
