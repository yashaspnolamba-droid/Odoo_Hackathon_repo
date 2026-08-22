import React from 'react';
import { User, Clock, Calendar, LogOut, AlertCircle, ArrowRight, CheckCircle, Bell, Briefcase } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

export const EmployeeDashboard = () => {
  const { currentUser, setActiveTab, logout } = useAuth();
  const { announcements, leaveRequests, attendanceRecords, clockedInState, clockInTime, handleClockIn, handleClockOut } = useData();

  const myLeaves = leaveRequests.filter(l => l.employeeId === currentUser.employeeId);
  const pendingLeavesCount = myLeaves.filter(l => l.status === 'Pending').length;

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Welcome back, {currentUser.name}! 👋</h1>
          <p className="page-subtitle">Here is your daily activity overview & quick access portal.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {!clockedInState ? (
            <button className="btn btn-success" onClick={handleClockIn}>
              <Clock size={18} />
              <span>Clock In Now</span>
            </button>
          ) : (
            <button className="btn btn-danger" onClick={handleClockOut}>
              <Clock size={18} />
              <span>Clock Out ({clockInTime})</span>
            </button>
          )}
        </div>
      </div>

      {/* 3.2.1 Displays quick-access cards: Profile, Attendance, Leave Requests, Logout */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#334155' }}>Quick Access</h2>
      <div className="quick-access-grid">
        <div className="qa-card" onClick={() => setActiveTab('profile')}>
          <div className="qa-card-icon blue">
            <User size={24} />
          </div>
          <div>
            <div className="qa-card-title">My Profile</div>
            <div className="qa-card-desc">View & update personal, salary and job details</div>
          </div>
          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700 }}>
            <span>Access Profile</span>
            <ArrowRight size={14} />
          </div>
        </div>

        <div className="qa-card" onClick={() => setActiveTab('attendance')}>
          <div className="qa-card-icon teal">
            <Clock size={24} />
          </div>
          <div>
            <div className="qa-card-title">Attendance</div>
            <div className="qa-card-desc">Log work hours, view monthly logs & status</div>
          </div>
          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--secondary)', fontWeight: 700 }}>
            <span>View Logs</span>
            <ArrowRight size={14} />
          </div>
        </div>

        <div className="qa-card" onClick={() => setActiveTab('leaves')}>
          <div className="qa-card-icon amber">
            <Calendar size={24} />
          </div>
          <div>
            <div className="qa-card-title">Leave Requests</div>
            <div className="qa-card-desc">Apply for time off & track approval status</div>
          </div>
          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="badge badge-warning">{pendingLeavesCount} Pending</span>
            <ArrowRight size={14} color="#d97706" />
          </div>
        </div>

        <div className="qa-card" onClick={logout}>
          <div className="qa-card-icon red">
            <LogOut size={24} />
          </div>
          <div>
            <div className="qa-card-title">Logout</div>
            <div className="qa-card-desc">Safely end your session on this device</div>
          </div>
          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 700 }}>
            <span>Sign Out</span>
            <ArrowRight size={14} />
          </div>
        </div>
      </div>

      {/* Grid for Recent Activity & Announcements */}
      <div className="grid-2">
        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <CheckCircle size={20} color="var(--primary)" />
              <span>Recent Activity & Logs</span>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('attendance')}>
              View All
            </button>
          </div>

          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-dot" style={{ background: clockedInState ? '#10b981' : '#64748b' }}></div>
              <div className="activity-content">
                <div className="activity-title">
                  {clockedInState ? `Clocked in today at ${clockInTime}` : 'Attendance shift recorded for today'}
                </div>
                <div className="activity-time">Today</div>
              </div>
            </div>

            {myLeaves.length > 0 ? (
              myLeaves.map(leave => (
                <div key={leave.id} className="activity-item">
                  <div className="activity-dot" style={{ background: leave.status === 'Approved' ? '#10b981' : leave.status === 'Pending' ? '#f59e0b' : '#ef4444' }}></div>
                  <div className="activity-content">
                    <div className="activity-title">
                      Leave request ({leave.type}) status: <strong>{leave.status}</strong>
                    </div>
                    <div className="activity-time">Applied on {leave.appliedOn}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="activity-item">
                <div className="activity-dot"></div>
                <div className="activity-content">
                  <div className="activity-title">No recent leave requests filed</div>
                  <div className="activity-time">System update</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Company Announcements / Alerts */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Bell size={20} color="var(--secondary)" />
              <span>Company Announcements & Alerts</span>
            </div>
          </div>

          <div className="activity-list">
            {announcements.map((item) => (
              <div key={item.id} className="activity-item">
                <div className="activity-content">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>{item.title}</span>
                    <span className="badge badge-primary">{item.category}</span>
                  </div>
                  <p style={{ fontSize: '0.825rem', color: '#64748b', marginBottom: '0.35rem' }}>{item.desc}</p>
                  <span className="activity-time">{item.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
