import React, { useState } from 'react';
import { Calendar, Plus, Clock, CheckCircle, XCircle, AlertCircle, FileText, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import '../styles/applyLeave.css';

export const ApplyLeave = () => {
  const { currentUser } = useAuth();
  const { leaveRequests, applyForLeave } = useData();

  const [formData, setFormData] = useState({
    type: 'Paid Leave',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });
  const [showApplyModal, setShowApplyModal] = useState(false);

  const myLeaves = leaveRequests.filter(l => l.employeeId === currentUser?.employeeId);

  // Leave balance counters (Simulated total yearly allocation - used days)
  const approvedPaid = myLeaves.filter(l => l.type === 'Paid Leave' && l.status === 'Approved').reduce((acc, l) => acc + l.days, 0);
  const approvedSick = myLeaves.filter(l => l.type === 'Sick Leave' && l.status === 'Approved').reduce((acc, l) => acc + l.days, 0);
  const approvedCasual = myLeaves.filter(l => l.type === 'Casual Leave' && l.status === 'Approved').reduce((acc, l) => acc + l.days, 0);
  const approvedUnpaid = myLeaves.filter(l => l.type === 'Unpaid Leave' && l.status === 'Approved').reduce((acc, l) => acc + l.days, 0);

  const balances = {
    paid: 15 - approvedPaid,
    sick: 10 - approvedSick,
    casual: 8 - approvedCasual,
    unpaid: approvedUnpaid
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setAlertMsg({ type: '', text: '' });

    if (!formData.startDate || !formData.endDate) {
      setAlertMsg({ type: 'danger', text: 'Please select both start date and end date.' });
      return;
    }

    const res = applyForLeave(formData);
    if (res.success) {
      setAlertMsg({ type: 'success', text: 'Leave application submitted successfully for HR approval.' });
      setShowApplyModal(false);
      setFormData({ type: 'Paid Leave', startDate: '', endDate: '', reason: '' });
    } else {
      setAlertMsg({ type: 'danger', text: res.error });
    }
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Apply for Leave (Employee)</h1>
          <p className="page-subtitle">Submit time-off requests, choose dates, add remarks, and track status.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowApplyModal(true)}>
          <Plus size={18} />
          <span>New Leave Request</span>
        </button>
      </div>

      {alertMsg.text && (
        <div className={`auth-alert ${alertMsg.type === 'success' ? 'auth-alert-success' : 'auth-alert-danger'}`} style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={16} />
          <span>{alertMsg.text}</span>
        </div>
      )}

      {/* Leave Balances Grid */}
      <div className="leave-balance-grid">
        <div className="leave-balance-card">
          <div className="leave-balance-icon paid">
            <Calendar size={22} />
          </div>
          <div>
            <div className="leave-balance-count">{balances.paid} Days</div>
            <div className="leave-balance-label">Paid Leave Balance</div>
          </div>
        </div>

        <div className="leave-balance-card">
          <div className="leave-balance-icon sick">
            <Clock size={22} />
          </div>
          <div>
            <div className="leave-balance-count">{balances.sick} Days</div>
            <div className="leave-balance-label">Sick Leave Balance</div>
          </div>
        </div>

        <div className="leave-balance-card">
          <div className="leave-balance-icon casual">
            <FileText size={22} />
          </div>
          <div>
            <div className="leave-balance-count">{balances.casual} Days</div>
            <div className="leave-balance-label">Casual Leave Balance</div>
          </div>
        </div>

        <div className="leave-balance-card">
          <div className="leave-balance-icon unpaid">
            <Info size={22} />
          </div>
          <div>
            <div className="leave-balance-count">{balances.unpaid} Days</div>
            <div className="leave-balance-label">Unpaid Leave Taken</div>
          </div>
        </div>
      </div>

      {/* My Leave Requests Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Calendar size={20} color="var(--primary)" />
            <span>My Submitted Leave Applications</span>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Leave Type</th>
                <th>Date Range</th>
                <th>Days</th>
                <th>Remarks / Reason</th>
                <th>Applied Date</th>
                <th>Status</th>
                <th>HR Comments</th>
              </tr>
            </thead>
            <tbody>
              {myLeaves.length > 0 ? (
                myLeaves.map(leave => (
                  <tr key={leave.id}>
                    <td>
                      <span className={`badge ${leave.type.includes('Paid') ? 'badge-primary' : leave.type.includes('Sick') ? 'badge-danger' : 'badge-warning'}`}>
                        {leave.type}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      {leave.startDate} to {leave.endDate}
                    </td>
                    <td style={{ fontWeight: 700 }}>{leave.days} d</td>
                    <td style={{ fontSize: '0.825rem', color: '#475569', maxWidth: '220px' }}>{leave.reason}</td>
                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{leave.appliedOn}</td>
                    <td>
                      <span className={`badge ${leave.status === 'Approved' ? 'badge-approved' : leave.status === 'Pending' ? 'badge-pending' : 'badge-rejected'}`}>
                        {leave.status}
                      </span>
                    </td>
                    <td>
                      {leave.comment ? (
                        <div className="hr-comment-box">
                          <strong>HR:</strong> {leave.comment}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>No comments yet</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    No leave requests found. Click "New Leave Request" above to apply.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal Dialog */}
      {showApplyModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
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
                  <option value="Paid Leave">Paid Leave</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Casual Leave">Casual Leave</option>
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
                <label className="form-label">Remarks / Reason</label>
                <textarea
                  name="reason"
                  rows={3}
                  placeholder="Explain why you are requesting this leave..."
                  value={formData.reason}
                  onChange={handleChange}
                  className="form-control"
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
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
