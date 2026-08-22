import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';

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

export const AuthProvider = ({ children }) => {
  // Use a loading state while checking session
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('hr_portal_current_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [pendingVerificationUser, setPendingVerificationUser] = useState(null);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('hr_portal_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('hr_portal_current_user');
    }
  }, [currentUser]);

  // On mount, if we have a token, fetch the latest user profile
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const res = await apiClient.get('employees/me/');
          setCurrentUser(res.data);
        } catch (error) {
          console.error("Failed to restore session:", error);
          setCurrentUser(null);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      }
      setLoading(false);
    };
    checkSession();
  }, []);

  // Sign Up Function (Admin Org Creation)
  const signUp = async ({ name, email, password }) => {
    if (!isPasswordStrong(password)) {
      return { success: false, error: 'Password does not meet required security rules.' };
    }

    try {
      const res = await apiClient.post('auth/register-organization/', {
        organization_name: `${name}'s Organization`,
        admin_first_name: name.split(' ')[0],
        admin_last_name: name.split(' ').slice(1).join(' ') || 'Admin',
        admin_email: email,
        password: password
      });
      setPendingVerificationUser({ email });
      return { success: true, requiresVerification: true, data: res.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to register organization.' };
    }
  };

  // Sign In Function
  const signIn = async (email, password) => {
    try {
      const res = await apiClient.post('auth/login/', {
        email,
        password
      });

      // Save tokens
      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);

      // Fetch user profile
      const userRes = await apiClient.get('employees/me/');
      const userData = userRes.data;

      setCurrentUser(userData);
      setActiveTab('dashboard');
      return { success: true, user: userData };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Invalid email or password.' };
    }
  };

  // Update Current User profile details
  const updateCurrentUserProfile = async (updatedFields) => {
    try {
      // In a real scenario, this would PATCH to the backend
      // const res = await apiClient.patch('employees/me/', updatedFields);
      // setCurrentUser(res.data);
      
      setCurrentUser(prev => ({ ...prev, ...updatedFields }));
    } catch (error) {
      console.error('Failed to update profile', error);
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        activeTab,
        setActiveTab,
        pendingVerificationUser,
        setPendingVerificationUser,
        signUp,
        signIn,
        logout,
        updateCurrentUserProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
