import React, { useState } from 'react';
import { Calendar, CheckCircle, XCircle, MessageSquare, Filter, ShieldCheck, User } from 'lucide-react';
import { useData } from '../context/DataContext';
import '../styles/leaveApproval.css';

export const LeaveApproval = () => {
  const { leaveRequests, updateLeaveStatus } = useData();

  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [hrComment, setHrComment] = useState('');
  const [actionType, setActionType] = useState(''); // 'Approved' | 'Rejected'

  const filteredLeaves = leaveRequests.filter(l => {
    if (filterStatus === 'All') return true;
    return l.status === filterStatus;
  });

  const pendingCount = leaveRequests.filter(l => l.status === 'Pending').length;
  const approvedCount = leaveRequests.filter(l => l.status === 'Approved').length;
  const rejectedCount = leaveRequests.filter(l => l.status === 'Rejected').length;

  const handleOpenActionModal = (leave, type) => {
    setSelectedLeave(leave);
    setActionType(type);
    setHrComment(leave.comment || '');
  };

  const handleConfirmAction = (e) => {
    e.preventDefault();
    if (!selectedLeave) return;

    updateLeaveStatus(selectedLeave.id, actionType, hrComment);
    setSelectedLeave(null);
    setHrComment('');
  };

  return (
    <div className="page-container">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">3.5.2 Leave Approval (Admin/HR)</h1>
        <p className="page-subtitle">Review employee leave applications, approve/reject requests, add remarks, and sync records immediately.</p>
      </div>

      {/* Stats Bar */}
      <div className="approval-stats-bar">
        <div className="approval-stat-item">
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#b45309' }}>Pending Approvals</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#d97706' }}>{pendingCount}</div>
          </div>
          <div style={{ padding: '0.75rem', borderRadius: '12px', background: '#fef3c7', color: '#d97706' }}>
            <Calendar size={22} />
          </div>
        </div>

        <div className="approval-stat-item">
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#047857' }}>Approved Leaves</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#059669' }}>{approvedCount}</div>
          </div>
          <div style={{ padding: '0.75rem', borderRadius: '12px', background: '#d1fae5', color: '#059669' }}>
            <CheckCircle size={22} />
          </div>
        </div>

        <div className="approval-stat-item">
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#b91c1c' }}>Rejected Applications</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#dc2626' }}>{rejectedCount}</div>
          </div>
          <div style={{ padding: '0.75rem', borderRadius: '12px', background: '#fee2e2', color: '#dc2626' }}>
            <XCircle size={22} />
          </div>
        </div>
      </div>

      {/* Leave Approval Table */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div className="card-title">
            <ShieldCheck size={20} color="var(--primary)" />
            <span>All Employee Leave Applications</span>
          </div>

          {/* Status Filter Tabs */}
          <div className="filter-tab-bar">
            {['All', 'Pending', 'Approved', 'Rejected'].map(st => (
              <button
                key={st}
                className={`filter-btn ${filterStatus === st ? 'active' : ''}`}
                onClick={() => setFilterStatus(st)}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Employee Details</th>
                <th>Leave Type</th>
                <th>Dates & Duration</th>
                <th>Remarks / Reason</th>
                <th>Current Status</th>
                <th>HR Comments</th>
                <th>Admin Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeaves.length > 0 ? (
                filteredLeaves.map(leave => (
                  <tr key={leave.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{leave.employeeName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>ID: {leave.employeeId}</div>
                    </td>
                    <td>
                      <span className="badge badge-primary">{leave.type}</span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      <div style={{ fontWeight: 600 }}>{leave.startDate} to {leave.endDate}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{leave.days} day(s) duration</div>
                    </td>
                    <td style={{ fontSize: '0.825rem', color: '#475569', maxWidth: '200px' }}>
                      {leave.reason}
                    </td>
                    <td>
                      <span className={`badge ${leave.status === 'Approved' ? 'badge-approved' : leave.status === 'Pending' ? 'badge-pending' : 'badge-rejected'}`}>
                        {leave.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#475569' }}>
                      {leave.comment ? leave.comment : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>None</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleOpenActionModal(leave, 'Approved')}
                        >
                          <CheckCircle size={14} />
                          <span>Approve</span>
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleOpenActionModal(leave, 'Rejected')}
                        >
                          <XCircle size={14} />
                          <span>Reject</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    No leave requests matching the "{filterStatus}" filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* HR Comment & Action Modal */}
      {selectedLeave && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                {actionType} Leave for {selectedLeave.employeeName}
              </h2>
              <button className="modal-close-btn" onClick={() => setSelectedLeave(null)}>✕</button>
            </div>

            <form onSubmit={handleConfirmAction}>
              <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                <div><strong>Leave Type:</strong> {selectedLeave.type}</div>
                <div><strong>Duration:</strong> {selectedLeave.startDate} to {selectedLeave.endDate} ({selectedLeave.days} days)</div>
                <div style={{ marginTop: '0.35rem', color: '#475569' }}><strong>Remarks:</strong> {selectedLeave.reason}</div>
              </div>

              <div className="form-group">
                <label className="form-label">Add HR Comment / Note to Employee</label>
                <textarea
                  rows={3}
                  className="form-control"
                  placeholder="Add approval instructions or rejection reasons..."
                  value={hrComment}
                  onChange={(e) => setHrComment(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedLeave(null)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`btn ${actionType === 'Approved' ? 'btn-success' : 'btn-danger'}`}
                >
                  Confirm {actionType}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
