import React, { useState, useEffect } from 'react';
import { Calendar, Plus, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

export const LeaveManagementView = () => {
  const { currentUser } = useAuth();
  const { leaveRequests, leaveTypes, applyForLeave, updateLeaveStatus } = useData();

  const isHR = currentUser?.role === 'HR';

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [formData, setFormData] = useState({
    type: '',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Pre-select first leave type if available
  useEffect(() => {
    if (leaveTypes.length > 0 && !formData.type) {
      setFormData(prev => ({ ...prev, type: leaveTypes[0].id }));
    }
  }, [leaveTypes]);

  // The backend already filters based on role, so we can just use leaveRequests directly.
  const displayLeaves = leaveRequests;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });

    if (!formData.startDate || !formData.endDate || !formData.type) {
      setMsg({ type: 'danger', text: 'Please fill out all required fields.' });
      return;
    }

    const res = await applyForLeave(formData);
    if (res.success) {
      setMsg({ type: 'success', text: 'Leave request submitted successfully!' });
      setShowApplyModal(false);
      setFormData({ type: leaveTypes[0]?.id || '', startDate: '', endDate: '', reason: '' });
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
                        <div style={{ fontWeight: 700 }}>{leave.employee_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>ID: {leave.employee}</div>
                      </td>
                    )}
                    <td>
                      <span className="badge badge-primary">{leave.leave_type_name}</span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {leave.start_date} to {leave.end_date}
                    </td>
                    <td>{leave.days_requested} day(s)</td>
                    <td style={{ fontSize: '0.825rem', color: '#475569', maxWidth: '250px' }}>{leave.reason}</td>
                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {new Date(leave.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <span className={`badge ${leave.status === 'APPROVED' ? 'badge-approved' : leave.status === 'PENDING' ? 'badge-pending' : 'badge-rejected'}`}>
                        {leave.status}
                      </span>
                    </td>
                    {isHR && (
                      <td>
                        {leave.status === 'PENDING' ? (
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => updateLeaveStatus(leave.id, 'APPROVED')}
                            >
                              Approve
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => updateLeaveStatus(leave.id, 'REJECTED')}
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
                  required
                >
                  {leaveTypes.map(lt => (
                    <option key={lt.id} value={lt.id}>{lt.name}</option>
                  ))}
                  {leaveTypes.length === 0 && <option value="">No Leave Types Found</option>}
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
                <button type="submit" className="btn btn-primary" disabled={leaveTypes.length === 0}>
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
