import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext1';

const Logout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Perform logout
    logout();
    
    navigate('/');
  }, [logout, navigate]);

  return null;  
};

export default Logout;
