import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext1'; // If you're using AuthContext

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');

  const navigate = useNavigate();
  const { login } = useAuth(); // Optional: Using context to set user session

  const validateEmail = (emailToValidate) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailToValidate) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(emailToValidate)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateEmail(email)) return;

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        'http://127.0.0.1:5000/api/login',
        { email, password },
        { withCredentials: true } // Important for session cookie
      );

      // Optional: Set user data in Context
      login(response.data); // If you're using AuthContext

      // Clear the form fields after login
      setEmail('');
      setPassword('');

      navigate('/book');
    } catch (err) {
      if (err.response) {
        setError(err.response.data.message || 'Login failed');
      } else if (err.request) {
        setError('No response from server. Check your network connection.');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-6">
        <div className="card shadow">
          <div className="card-body">
            <h2 className="text-center mb-4">Login</h2>
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  type="email"
                  className={`form-control ${emailError ? 'is-invalid' : ''}`}
                  id="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    validateEmail(e.target.value);
                  }}
                  onBlur={() => validateEmail(email)}
                  required
                />
                {emailError && <div className="invalid-feedback">{emailError}</div>}
              </div>
              <div className="mb-3">
                <label htmlFor="password" className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="form-check">
                  <input type="checkbox" className="form-check-input" id="rememberMe" />
                  <label className="form-check-label" htmlFor="rememberMe">
                    Remember Me
                  </label>
                </div>
                <Link to="/forgot-password">Forgot Password?</Link>
              </div>
              <button
                type="submit"
                className="btn btn-primary w-100"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
            <div className="text-center mt-3">
              Don't have an account? <Link to="/register">Register</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
