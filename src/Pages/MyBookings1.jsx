import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext1';

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch bookings on component mount
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchBookings = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/mybookings', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include',
          mode: 'cors'
        });

        if (!response.ok) {
          if (response.status === 401) {
            navigate('/login');
            return;
          }
          throw new Error('Failed to fetch bookings');
        }

        const data = await response.json();
        setBookings(data);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [navigate, user]);

  // Handle ticket download
  const handleDownloadTicket = async (bookingId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/bookings/${bookingId}/download`, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf'
        },
        credentials: 'include'
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
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download ticket');
      if (err.message.includes('401')) {
        navigate('/login');
      }
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
      const response = await fetch(`http://localhost:5000/api/bookings/${bookingId}/cancel`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
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
      if (err.message.includes('401')) {
        navigate('/login');
      }
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
      <h2 className="mb-4">My Bookings</h2>
      {bookings.length === 0 ? (
        <div className="alert alert-info">
          You haven't made any bookings yet.
          <Link to="/book" className="alert-link ms-2">Book a ticket now!</Link>
        </div>
      ) : (
        <div className="row">
          {bookings.map((booking) => (
            <div key={booking.id} className="col-md-6 mb-4">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">Booking #{booking.id}</h5>
                  <p className="card-text">
                    <strong>From:</strong> {booking.starts_from}<br />
                    <strong>To:</strong> {booking.destination}<br />
                    <strong>Date:</strong> {new Date(booking.travel_date).toLocaleDateString()}<br />
                    <strong>Total Price:</strong> ₹{booking.total_price}<br />
                    <strong>Status:</strong> <span className={`badge ${booking.status === 'confirmed' ? 'bg-success' : 'bg-warning'}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </p>
                  <div className="d-flex flex-column">
                    <button
                      className="btn btn-primary mb-2"
                      onClick={() => handleDownloadTicket(booking.id)}
                    >
                      Download Ticket
                    </button>
                    {booking.status !== 'cancelled' && (
                      <button
                        className="btn btn-danger"
                        onClick={() => handleCancelBooking(booking.id)}
                      >
                        Cancel Booking
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyBookings;