import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const DataContext = createContext();

const INITIAL_ATTENDANCE = [
  { id: '1', employeeId: 'EMP101', date: '2026-08-22', clockIn: '09:00 AM', clockOut: '05:30 PM', totalHours: '8h 30m', status: 'Present' },
  { id: '2', employeeId: 'EMP101', date: '2026-08-21', clockIn: '09:15 AM', clockOut: '05:45 PM', totalHours: '8h 30m', status: 'Present' },
  { id: '3', employeeId: 'EMP101', date: '2026-08-20', clockIn: '09:05 AM', clockOut: '05:15 PM', totalHours: '8h 10m', status: 'Present' },
  { id: '4', employeeId: 'HR001', date: '2026-08-22', clockIn: '08:45 AM', clockOut: '05:00 PM', totalHours: '8h 15m', status: 'Present' }
];

const INITIAL_LEAVES = [
  {
    id: 'L-101',
    employeeId: 'EMP101',
    employeeName: 'Alex Johnson',
    type: 'Casual Leave',
    startDate: '2026-08-25',
    endDate: '2026-08-26',
    days: 2,
    reason: 'Family event and personal work.',
    status: 'Pending',
    appliedOn: '2026-08-21'
  },
  {
    id: 'L-102',
    employeeId: 'EMP101',
    employeeName: 'Alex Johnson',
    type: 'Sick Leave',
    startDate: '2026-07-10',
    endDate: '2026-07-11',
    days: 2,
    reason: 'Viral fever rest prescribed by physician.',
    status: 'Approved',
    appliedOn: '2026-07-09'
  }
];

const INITIAL_ANNOUNCEMENTS = [
  { id: 1, title: 'Annual Company Townhall 2026', date: 'Aug 28, 2026', category: 'Event', desc: 'Join us at 3:00 PM EST for key leadership updates and Q&A session.' },
  { id: 2, title: 'Updated Health Insurance Policy', date: 'Aug 15, 2026', category: 'Policy', desc: 'New wellness reimbursement options are now available under your portal profile.' },
  { id: 3, title: 'Upcoming Labor Day Holiday', date: 'Sep 01, 2026', category: 'Holiday', desc: 'Company offices will remain closed. Plan your leave requests accordingly.' }
];

export const DataProvider = ({ children }) => {
  const { currentUser, setUsers } = useAuth();

  const [attendanceRecords, setAttendanceRecords] = useState(() => {
    const saved = localStorage.getItem('hr_portal_attendance');
    return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE;
  });

  const [leaveRequests, setLeaveRequests] = useState(() => {
    const saved = localStorage.getItem('hr_portal_leaves');
    return saved ? JSON.parse(saved) : INITIAL_LEAVES;
  });

  const [announcements] = useState(INITIAL_ANNOUNCEMENTS);
  const [clockedInState, setClockedInState] = useState(false);
  const [clockInTime, setClockInTime] = useState(null);

  useEffect(() => {
    localStorage.setItem('hr_portal_attendance', JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  useEffect(() => {
    localStorage.setItem('hr_portal_leaves', JSON.stringify(leaveRequests));
  }, [leaveRequests]);

  // Clock In
  const handleClockIn = () => {
    if (!currentUser) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toISOString().split('T')[0];

    setClockedInState(true);
    setClockInTime(timeStr);

    const newRecord = {
      id: Date.now().toString(),
      employeeId: currentUser.employeeId,
      date: dateStr,
      clockIn: timeStr,
      clockOut: '--:--',
      totalHours: 'In Progress',
      status: 'Present'
    };

    setAttendanceRecords(prev => [newRecord, ...prev]);
  };

  // Clock Out
  const handleClockOut = () => {
    if (!currentUser || !clockedInState) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setClockedInState(false);
    setAttendanceRecords(prev => {
      return prev.map(rec => {
        if (rec.employeeId === currentUser.employeeId && rec.totalHours === 'In Progress') {
          return {
            ...rec,
            clockOut: timeStr,
            totalHours: '8h 00m'
          };
        }
        return rec;
      });
    });
  };

  // Submit Leave Request
  const applyForLeave = ({ type, startDate, endDate, reason }) => {
    if (!currentUser) return { success: false, error: 'User must be logged in.' };

    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end.getTime() - start.getTime();
    const dayCount = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1);

    const newLeave = {
      id: `L-${Math.floor(100 + Math.random() * 900)}`,
      employeeId: currentUser.employeeId,
      employeeName: currentUser.name,
      type,
      startDate,
      endDate,
      days: dayCount,
      reason,
      status: 'Pending',
      appliedOn: new Date().toISOString().split('T')[0]
    };

    setLeaveRequests(prev => [newLeave, ...prev]);
    return { success: true, leave: newLeave };
  };

  // HR Approval Action
  const updateLeaveStatus = (leaveId, newStatus) => {
    setLeaveRequests(prev => prev.map(l => l.id === leaveId ? { ...l, status: newStatus } : l));
  };

  // Admin Profile Update for any employee
  const adminUpdateEmployee = (employeeId, updatedData) => {
    setUsers(prevUsers => {
      return prevUsers.map(u => {
        if (u.employeeId === employeeId) {
          return {
            ...u,
            ...updatedData,
            salary: updatedData.salary ? { ...u.salary, ...updatedData.salary } : u.salary
          };
        }
        return u;
      });
    });
  };

  return (
    <DataContext.Provider
      value={{
        attendanceRecords,
        leaveRequests,
        announcements,
        clockedInState,
        clockInTime,
        handleClockIn,
        handleClockOut,
        applyForLeave,
        updateLeaveStatus,
        adminUpdateEmployee
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
