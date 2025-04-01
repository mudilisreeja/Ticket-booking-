import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext1';

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    routeStats: [],
    recentBookings: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/admin/stats', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include'
        });

        if (!response.ok) {
          if (response.status === 401) {
            navigate('/login');
            return;
          }
          throw new Error('Failed to fetch admin statistics');
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Error fetching admin stats:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminStats();
  }, [navigate]);

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        if (response.status === 401) {
          navigate('/login');
          return;
        }
        throw new Error('Failed to update booking status');
      }

      // Refresh the stats after successful update
      const statsResponse = await fetch('http://localhost:5000/api/admin/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      if (statsResponse.ok) {
        const data = await statsResponse.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error updating booking status:', err);
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="d-flex justify-content-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Admin Dashboard</h2>
      
      {/* Statistics Cards */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <h5 className="card-title">Total Bookings</h5>
              <h2 className="card-text">{stats.totalBookings}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card bg-success text-white">
            <div className="card-body">
              <h5 className="card-title">Total Revenue</h5>
              <h2 className="card-text">₹{stats.totalRevenue.toLocaleString()}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card bg-info text-white">
            <div className="card-body">
              <h5 className="card-title">Active Routes</h5>
              <h2 className="card-text">{stats.routeStats.length}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Route Statistics */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Route Statistics</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Route</th>
                  <th>Total Bookings</th>
                  <th>Revenue</th>
                  <th>Average Occupancy</th>
                </tr>
              </thead>
              <tbody>
                {stats.routeStats.map((route, index) => (
                  <tr key={index}>
                    <td>{route.route}</td>
                    <td>{route.totalBookings}</td>
                    <td>₹{route.revenue.toLocaleString()}</td>
                    <td>{route.occupancy}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Recent Bookings</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>User</th>
                  <th>Route</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>{booking.id}</td>
                    <td>{booking.username}</td>
                    <td>{booking.starts_from} → {booking.destination}</td>
                    <td>{new Date(booking.travel_date).toLocaleDateString()}</td>
                    <td>₹{booking.total_price.toLocaleString()}</td>
                    <td>
                      <span className={`badge ${booking.status === 'confirmed' ? 'bg-success' : 'bg-warning'}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td>
                      <select 
                        className="form-select form-select-sm"
                        value={booking.status}
                        onChange={(e) => handleStatusUpdate(booking.id, e.target.value)}
                      >
                        <option value="confirmed">Confirmed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard; 