import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';

import { SignIn } from './components/SignIn';
import { SignUp } from './components/SignUp';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { EmployeeDashboard } from './components/EmployeeDashboard';
import { HRDashboard } from './components/HRDashboard';
import { ProfileView } from './components/ProfileView';
import { AttendanceView } from './components/AttendanceView';
import { LeaveManagementView } from './components/LeaveManagementView';
import { EmployeeDirectory } from './components/EmployeeDirectory';

import './styles/global.css';
import './styles/auth.css';
import './styles/dashboard.css';
import './styles/profile.css';

const MainLayout = () => {
  const { currentUser, activeTab, setActiveTab } = useAuth();
  const [authMode, setAuthMode] = useState('signin'); // 'signin' | 'signup'
  const [inspectedEmployee, setInspectedEmployee] = useState(null);

  // If user is not logged in, render Sign In / Sign Up screen
  if (!currentUser) {
    return authMode === 'signin' ? (
      <SignIn onSwitchToSignUp={() => setAuthMode('signup')} />
    ) : (
      <SignUp onSwitchToSignIn={() => setAuthMode('signin')} />
    );
  }

  const isHR = currentUser.role === 'HR';

  const handleInspectEmployee = (employee) => {
    setInspectedEmployee(employee);
    setActiveTab('profile');
  };

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return isHR ? (
          <HRDashboard onInspectEmployee={handleInspectEmployee} />
        ) : (
          <EmployeeDashboard />
        );

      case 'profile':
        return (
          <ProfileView
            employeeProfile={inspectedEmployee}
            onBackToDashboard={() => {
              setInspectedEmployee(null);
              setActiveTab('dashboard');
            }}
          />
        );

      case 'attendance':
        return <AttendanceView />;

      case 'leaves':
        return <LeaveManagementView />;

      case 'directory':
        return isHR ? (
          <EmployeeDirectory onSelectEmployee={handleInspectEmployee} />
        ) : (
          <EmployeeDashboard />
        );

      default:
        return <EmployeeDashboard />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <main style={{ flex: 1 }}>{renderActiveTabContent()}</main>
      </div>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <MainLayout />
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
