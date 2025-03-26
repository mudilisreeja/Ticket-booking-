import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Fetch bookings on component mount
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get('http://localhost:5000/api/my_bookings', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setBookings(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load bookings');
        setLoading(false);

        // Redirect to login if unauthorized
        if (err.response && err.response.status === 401) {
          navigate('/login');
        }
      }
    };

    fetchBookings();
  }, [navigate]);

  // Handle ticket download
  const handleDownloadTicket = async (bookingId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/bookings/${bookingId}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download ticket');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Create and click the download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `ticket_${bookingId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      // Improved error handling
      console.error('Download error:', err);
      alert(`Error downloading ticket: ${err.message}`);
    }
  };

  // Handle cancel booking with confirmation
  const handleCancelBooking = async (bookingId) => {
    // Add confirmation dialog
    const confirmCancel = window.confirm('Are you sure you want to cancel this booking?');
    
    if (!confirmCancel) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/bookings/${bookingId}/cancel`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to cancel booking');
      }

      // Improved user feedback
      alert('Booking canceled successfully!');
      setBookings((prevBookings) => prevBookings.filter((booking) => booking.id !== bookingId));
    } catch (err) {
      // Improved error handling
      console.error('Cancel booking error:', err);
      alert(`Error canceling booking: ${err.message}`);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{height: '100vh'}}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="alert alert-danger text-center" role="alert">
        {error}
        <br />
        <button 
          className="btn btn-primary mt-3" 
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header">
          <h3 className="mb-0">My Bookings</h3>
        </div>
        <div className="card-body">
          {bookings.length === 0 ? (
            <div className="text-center">
              <p>You don't have any bookings yet.</p>
              <Link to="/booking" className="btn btn-primary">
                Book a Ticket Now
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Booking ID</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Travel Date</th>
                    <th>Passengers</th>
                    <th>Total Price (₹)</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id}>
                      <td>{booking.id}</td>
                      <td>{booking.startsFrom}</td>
                      <td>{booking.destination}</td>
                      <td>{new Date(booking.travelDate).toLocaleDateString()}</td>
                      <td>{booking.passengers.length}</td>
                      <td>₹{booking.totalPrice.toLocaleString()}</td>
                      <td>
                        <div className="d-flex flex-column">
                          <button
                            className="btn btn-sm btn-success mb-2"
                            onClick={() => handleDownloadTicket(booking.id)}
                          >
                            Download Ticket
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleCancelBooking(booking.id)}
                          >
                            Cancel Booking
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MyBookings;