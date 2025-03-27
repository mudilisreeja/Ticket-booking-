import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext1';

const Logout = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await logout();
        navigate('/');
      } catch (error) {
        console.error('Logout error:', error);
        navigate('/');
      }
    };

    handleLogout();
  }, [logout, navigate]);

  return null;
};

export default Logout;
