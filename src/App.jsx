import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './Components/Navbar1.jsx';
import { useAuth } from './context/AuthContext1';

// Import all pages
import Home from './Pages/Home1.jsx';
import Login from './Pages/Login1.jsx';
import Register from './Pages/Register1.jsx';
import BookingForm from './Pages/BookingForm1.jsx';
import MyBookings from './Pages/MyBookings1.jsx';
import Logout from'./Pages/Logout1.jsx';


// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Authentication Redirect Route
const AuthRedirectRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/booking" /> : children;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <div className="container">
          <Routes>
            <Route path="/" element={<Home />} />
            
            <Route 
              path="/login" 
              element={
                <AuthRedirectRoute>
                  <Login />
                </AuthRedirectRoute>
              } 
            />
            
            <Route 
              path="/register" 
              element={
                <AuthRedirectRoute>
                  <Register />
                </AuthRedirectRoute>
              } 
            />
            
            <Route 
              path="/book" 
              element={
                <ProtectedRoute>
                  <BookingForm />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/mybookings" 
              element={
                <ProtectedRoute>
                  <MyBookings />
                </ProtectedRoute>
              } 
            />
            <Route path="/logout" element={<Logout />} /> 
            
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;