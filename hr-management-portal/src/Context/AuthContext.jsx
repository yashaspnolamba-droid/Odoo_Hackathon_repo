import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const validatePassword = (password) => {
  return {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
};

export const isPasswordStrong = (password) => {
  const rules = validatePassword(password);
  return Object.values(rules).every(Boolean);
};

const INITIAL_USERS = [
  {
    employeeId: 'EMP101',
    name: 'Alex Johnson',
    email: 'employee@company.com',
    password: 'Emp@12345',
    role: 'Employee',
    isVerified: true,
    department: 'Engineering',
    designation: 'Senior Frontend Developer',
    phone: '+1 (555) 234-5678',
    address: '742 Evergreen Terrace, Springfield, IL',
    joiningDate: '2022-03-15',
    salary: {
      basic: 65000,
      hra: 25000,
      special: 15000,
      pf: 4800,
      tax: 5200,
      net: 95000
    },
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'
  },
  {
    employeeId: 'HR001',
    name: 'Sarah Jenkins',
    email: 'hr@company.com',
    password: 'Admin@12345',
    role: 'HR',
    isVerified: true,
    department: 'Human Resources',
    designation: 'HR Lead & People Ops Manager',
    phone: '+1 (555) 987-6543',
    address: '100 Corporate Parkway, Suite 400, Chicago, IL',
    joiningDate: '2020-01-10',
    salary: {
      basic: 85000,
      hra: 32000,
      special: 20000,
      pf: 6000,
      tax: 8000,
      net: 123000
    },
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250'
  }
];

export const AuthProvider = ({ children }) => {
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('hr_portal_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('hr_portal_current_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [pendingVerificationUser, setPendingVerificationUser] = useState(null);

  useEffect(() => {
    localStorage.setItem('hr_portal_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('hr_portal_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('hr_portal_current_user');
    }
  }, [currentUser]);

  // Sign Up Function
  const signUp = ({ employeeId, name, email, password, role }) => {
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: 'An account with this email already exists.' };
    }
    if (users.some(u => u.employeeId.toUpperCase() === employeeId.toUpperCase())) {
      return { success: false, error: 'This Employee ID is already registered.' };
    }
    if (!isPasswordStrong(password)) {
      return { success: false, error: 'Password does not meet required security rules.' };
    }

    const newUser = {
      employeeId: employeeId.toUpperCase(),
      name: name || (role === 'HR' ? 'HR Specialist' : 'New Employee'),
      email: email.toLowerCase(),
      password,
      role,
      isVerified: false,
      department: role === 'HR' ? 'Human Resources' : 'Engineering',
      designation: role === 'HR' ? 'HR Associate' : 'Software Engineer',
      phone: '+1 (555) 000-0000',
      address: 'Update address in profile',
      joiningDate: new Date().toISOString().split('T')[0],
      salary: {
        basic: 50000,
        hra: 20000,
        special: 10000,
        pf: 4000,
        tax: 4000,
        net: 72000
      },
      avatar: ''
    };

    setPendingVerificationUser(newUser);
    return { success: true, requiresVerification: true };
  };

  // Verify Email OTP
  const verifyEmailOtp = (otpCode) => {
    if (otpCode !== '123456' && otpCode.length !== 6) {
      return { success: false, error: 'Invalid 6-digit verification OTP code. Use 123456 for demo.' };
    }

    if (!pendingVerificationUser) {
      return { success: false, error: 'No registration pending verification.' };
    }

    const verifiedUser = { ...pendingVerificationUser, isVerified: true };
    setUsers(prev => [...prev, verifiedUser]);
    setPendingVerificationUser(null);
    return { success: true, user: verifiedUser };
  };

  // Sign In Function
  const signIn = (email, password, selectedRole) => {
    const user = users.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (!user) {
      return { success: false, error: 'Invalid email or password. Please check your credentials.' };
    }

    if (!user.isVerified) {
      return { success: false, error: 'Email verification is required before logging in.' };
    }

    if (selectedRole && user.role !== selectedRole) {
      return { success: false, error: `This account is registered as ${user.role}, not ${selectedRole}.` };
    }

    setCurrentUser(user);
    setActiveTab('dashboard');
    return { success: true, user };
  };

  // Update Current User profile details
  const updateCurrentUserProfile = (updatedFields) => {
    setCurrentUser(prev => {
      const updated = { ...prev, ...updatedFields };
      // Also sync back to users array
      setUsers(uList => uList.map(u => u.email === updated.email ? updated : u));
      return updated;
    });
  };

  const logout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        activeTab,
        setActiveTab,
        pendingVerificationUser,
        setPendingVerificationUser,
        signUp,
        verifyEmailOtp,
        signIn,
        logout,
        updateCurrentUserProfile,
        setUsers
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
