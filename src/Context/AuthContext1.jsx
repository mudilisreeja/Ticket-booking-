import React, { createContext, useState, useContext } from 'react';

// Create the AuthContext
export const AuthContext = createContext({
  currentUser: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  register: () => {},
});

// AuthProvider Component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);

  // Login function for session-based auth
  const login = (userData) => {
    // Just set the current user info from server response
    setCurrentUser(userData);
  };

  // Logout function
  const logout = () => {
    // Clear the current user (optionally call a logout API)
    setCurrentUser(null);
  };

  // Register function (Optional - depends on your flow)
  const register = (userData) => {
    setCurrentUser(userData);
  };

  const value = {
    currentUser,
    isAuthenticated: !!currentUser, // true if user is logged in
    login,
    logout,
    register,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
