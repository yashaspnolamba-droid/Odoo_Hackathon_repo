import React, { useState } from 'react';
import { Calendar, Plus, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

export const LeaveManagementView = () => {
  const { currentUser } = useAuth();
  const { leaveRequests, applyForLeave, updateLeaveStatus } = useData();

  const isHR = currentUser?.role === 'HR';

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'Casual Leave',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [msg, setMsg] = useState({ type: '', text: '' });

  const myLeaves = leaveRequests.filter(l => l.employeeId === currentUser?.employeeId);
  const displayLeaves = isHR ? leaveRequests : myLeaves;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });

    if (!formData.startDate || !formData.endDate) {
      setMsg({ type: 'danger', text: 'Please select both start and end dates.' });
      return;
    }

    const res = applyForLeave(formData);
    if (res.success) {
      setMsg({ type: 'success', text: 'Leave request submitted successfully!' });
      setShowApplyModal(false);
      setFormData({ type: 'Casual Leave', startDate: '', endDate: '', reason: '' });
    } else {
      setMsg({ type: 'danger', text: res.error });
    }
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">{isHR ? 'HR Leave Approvals & Management' : 'My Leave Requests'}</h1>
          <p className="page-subtitle">
            {isHR ? 'Review, approve, or reject employee leave applications.' : 'Apply for paid time off, sick leaves, and track approval status.'}
          </p>
        </div>
        {!isHR && (
          <button className="btn btn-primary" onClick={() => setShowApplyModal(true)}>
            <Plus size={18} />
            <span>Apply for Leave</span>
          </button>
        )}
      </div>

      {msg.text && (
        <div className={`auth-alert ${msg.type === 'success' ? 'auth-alert-success' : 'auth-alert-danger'}`} style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={16} />
          <span>{msg.text}</span>
        </div>
      )}

      {/* Leave Request List */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Calendar size={20} color="var(--primary)" />
            <span>{isHR ? 'All Employee Leave Records' : 'My Applications'}</span>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                {isHR && <th>Employee</th>}
                <th>Leave Type</th>
                <th>Dates</th>
                <th>Duration</th>
                <th>Reason</th>
                <th>Applied On</th>
                <th>Status</th>
                {isHR && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {displayLeaves.length > 0 ? (
                displayLeaves.map(leave => (
                  <tr key={leave.id}>
                    {isHR && (
                      <td>
                        <div style={{ fontWeight: 700 }}>{leave.employeeName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{leave.employeeId}</div>
                      </td>
                    )}
                    <td>
                      <span className="badge badge-primary">{leave.type}</span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {leave.startDate} to {leave.endDate}
                    </td>
                    <td>{leave.days} day(s)</td>
                    <td style={{ fontSize: '0.825rem', color: '#475569', maxWidth: '250px' }}>{leave.reason}</td>
                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{leave.appliedOn}</td>
                    <td>
                      <span className={`badge ${leave.status === 'Approved' ? 'badge-approved' : leave.status === 'Pending' ? 'badge-pending' : 'badge-rejected'}`}>
                        {leave.status}
                      </span>
                    </td>
                    {isHR && (
                      <td>
                        {leave.status === 'Pending' ? (
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => updateLeaveStatus(leave.id, 'Approved')}
                            >
                              Approve
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => updateLeaveStatus(leave.id, 'Rejected')}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>Decided</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isHR ? 8 : 7} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    No leave requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Apply for Leave</h2>
              <button className="modal-close-btn" onClick={() => setShowApplyModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Leave Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="form-control"
                >
                  <option value="Casual Leave">Casual Leave</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Earned / Paid Leave">Earned / Paid Leave</option>
                  <option value="Unpaid Leave">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className="form-control"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Reason for Time Off</label>
                <textarea
                  name="reason"
                  rows={3}
                  placeholder="Provide brief details for your leave request..."
                  value={formData.reason}
                  onChange={handleChange}
                  className="form-control"
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowApplyModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
