import React from 'react';
import { Clock, Calendar, CheckCircle, Play, Square, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

export const AttendanceView = () => {
  const { currentUser } = useAuth();
  const { attendanceRecords, clockedInState, clockInTime, handleClockIn, handleClockOut } = useData();

  const userLogs = attendanceRecords.filter(a => a.employeeId === currentUser?.employeeId);

  return (
    <div className="page-container">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">Attendance & Shift Logger</h1>
        <p className="page-subtitle">Track your daily clock-ins, work hours, and view historical attendance logs.</p>
      </div>

      {/* Clock In / Out Widget */}
      <div className="card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Today's Shift Status
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                {clockedInState ? `Clocked In at ${clockInTime}` : 'Not Clocked In Yet'}
              </h2>
              <span className={`badge ${clockedInState ? 'badge-present' : 'badge-warning'}`}>
                {clockedInState ? 'On Duty' : 'Offline'}
              </span>
            </div>
          </div>

          <div>
            {!clockedInState ? (
              <button className="btn btn-success" onClick={handleClockIn} style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}>
                <Play size={20} />
                <span>Clock In Now</span>
              </button>
            ) : (
              <button className="btn btn-danger" onClick={handleClockOut} style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}>
                <Square size={20} />
                <span>Clock Out Shift</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Attendance History Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Clock size={20} color="var(--primary)" />
            <span>Attendance History Log</span>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Clock In</th>
                <th>Clock Out</th>
                <th>Total Hours</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {userLogs.map(log => (
                <tr key={log.id}>
                  <td style={{ fontWeight: 700 }}>{log.date}</td>
                  <td>{log.clockIn}</td>
                  <td>{log.clockOut}</td>
                  <td>{log.totalHours}</td>
                  <td>
                    <span className={`badge ${log.status === 'Present' ? 'badge-present' : 'badge-warning'}`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
