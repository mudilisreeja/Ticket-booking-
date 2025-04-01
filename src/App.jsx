import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './Components/Navbar1.jsx';
import { useAuth } from './Context/AuthContext1';
import { AuthProvider } from './Context/AuthContext1';

// Pages
import Home from './Pages/Home1.jsx';
import Login from './Pages/Login1.jsx';
import Register from './Pages/Register1.jsx';
import BookingForm from './Pages/BookingForm1.jsx';
import MyBookings from './Pages/MyBookings1.jsx';
import Logout from './Pages/Logout1.jsx';
import AdminDashboard from './Pages/AdminDashboard1';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

// Auth Redirect Route
const AuthRedirectRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? <Navigate to="/book" replace /> : children;
};

// Protected Admin Route Component
const ProtectedAdminRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user || !user.isAdmin) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
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

            <Route 
              path="/admin" 
              element={
                <ProtectedAdminRoute>
                  <AdminDashboard />
                </ProtectedAdminRoute>
              } 
            />

            {/* Optional 404 Route */}
            <Route path="*" element={<h2 className="text-center mt-5">404 - Page Not Found</h2>} />
          </Routes>
        </div>
      </div>
    </AuthProvider>
  );
}

export default App;
