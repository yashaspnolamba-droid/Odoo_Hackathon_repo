import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { apiClient } from '../api/client';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const { currentUser, setUsers } = useAuth();

  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  
  // Payroll state
  const [employeeSalary, setEmployeeSalary] = useState(null);
  const [payslips, setPayslips] = useState([]);
  
  const [clockedInState, setClockedInState] = useState(false);
  const [clockInTime, setClockInTime] = useState(null);
  
  // Loading and Error states
  const [isLoading, setIsLoading] = useState(true);
  const [dataError, setDataError] = useState(null);

  // Fetch initial data when user logs in
  useEffect(() => {
    if (currentUser) {
      const loadAllData = async () => {
        setIsLoading(true);
        setDataError(null);
        try {
          await Promise.all([
            fetchAttendance(),
            fetchLeaves(),
            fetchLeaveTypes(),
            fetchPayroll()
          ]);
        } catch (err) {
          setDataError('Failed to load application data. Please try again.');
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      };

      loadAllData();

      // Dummy announcements for now until backend supports it
      setAnnouncements([
        { id: 1, title: 'Annual Company Townhall', date: 'Aug 28, 2026', category: 'Event', desc: 'Join us at 3:00 PM EST for key leadership updates.' },
        { id: 2, title: 'Updated Health Insurance Policy', date: 'Aug 15, 2026', category: 'Policy', desc: 'New wellness reimbursement options are now available.' }
      ]);
    }
  }, [currentUser]);

  const fetchAttendance = async () => {
    const res = await apiClient.get('attendance/records/');
    setAttendanceRecords(res.data);
    
    // Determine if currently clocked in
    const todayRecord = res.data.find(r => 
      r.date === new Date().toISOString().split('T')[0] && !r.check_out
    );
    if (todayRecord) {
      setClockedInState(true);
      setClockInTime(new Date(todayRecord.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } else {
      setClockedInState(false);
      setClockInTime(null);
    }
  };

  const fetchLeaves = async () => {
    const res = await apiClient.get('leave/requests/');
    setLeaveRequests(res.data);
  };

  const fetchLeaveTypes = async () => {
    const res = await apiClient.get('leave/types/');
    setLeaveTypes(res.data);
  };

  const fetchPayroll = async () => {
    // Fetch latest active salary record
    const salaryRes = await apiClient.get('payroll/salary/');
    if (salaryRes.data.length > 0) {
      setEmployeeSalary(salaryRes.data[0]); // assuming latest is first
    }

    // Fetch payslips
    const payslipsRes = await apiClient.get('payroll/payslips/');
    setPayslips(payslipsRes.data);
  };

  // Clock In
  const handleClockIn = async () => {
    if (!currentUser) return;
    try {
      await apiClient.post('attendance/check-in/', { source: 'WEB' });
      await fetchAttendance();
    } catch (error) {
      console.error('Check-in failed', error);
    }
  };

  // Clock Out
  const handleClockOut = async () => {
    if (!currentUser || !clockedInState) return;
    try {
      await apiClient.post('attendance/check-out/');
      await fetchAttendance();
    } catch (error) {
      console.error('Check-out failed', error);
    }
  };

  // Submit Leave Request
  const applyForLeave = async ({ type, startDate, endDate, reason }) => {
    if (!currentUser) return { success: false, error: 'User must be logged in.' };
    try {
      const res = await apiClient.post('leave/requests/', {
        leave_type: type, // Expecting UUID string
        start_date: startDate,
        end_date: endDate,
        reason
      });
      await fetchLeaves();
      return { success: true, leave: res.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to submit leave request' };
    }
  };

  // HR Approval Action
  const updateLeaveStatus = async (leaveId, newStatus) => {
    try {
      const endpoint = newStatus === 'APPROVED' ? 'approve' : 'reject';
      await apiClient.patch(`leave/requests/${leaveId}/${endpoint}/`);
      await fetchLeaves();
    } catch (error) {
      console.error(`Failed to ${newStatus.toLowerCase()} leave`, error);
    }
  };

  // Admin Profile Update for any employee
  const adminUpdateEmployee = async (employeeId, updatedData) => {
    try {
      await apiClient.patch(`employees/${employeeId}/`, updatedData);
    } catch (error) {
      console.error('Failed to update employee', error);
    }
  };

  return (
    <DataContext.Provider
      value={{
        isLoading,
        dataError,
        attendanceRecords,
        leaveRequests,
        leaveTypes,
        announcements,
        employeeSalary,
        payslips,
        clockedInState,
        clockInTime,
        handleClockIn,
        handleClockOut,
        applyForLeave,
        updateLeaveStatus,
        adminUpdateEmployee,
        refreshData: () => {
          fetchAttendance();
          fetchLeaves();
          fetchPayroll();
        }
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);

