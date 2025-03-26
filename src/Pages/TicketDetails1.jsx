// src/pages/TicketDetails.js
import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../Context/AuthContext1';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const TicketDetails = () => {
  const { id } = useParams();
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const ticketRef = useRef(null);
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Redirect if not logged in
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    const fetchBookingDetails = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/bookings/${id}`, {
          headers: {
            'Authorization': `Bearer ${currentUser.token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch booking details');
        }
        
        const data = await response.json();
        setBooking(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookingDetails();
  }, [currentUser, navigate, id]);

  const handleCancelBooking = async () => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:5000/api/bookings/${id}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${currentUser.token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to cancel booking');
      }
      
      // Redirect back to bookings
      navigate('/my-bookings');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDownloadTicket = () => {
    if (!ticketRef.current) return;
    
    html2canvas(ticketRef.current).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`ticket-${booking.id}.pdf`);
    });
  };

  if (loading) {
    return <div className="text-center mt-5">Loading...</div>;
  }

  if (!booking) {
    return (
      <div className="text-center mt-5">
        <div className="alert alert-danger">Booking not found</div>
        <Link to="/my-bookings" className="btn btn-primary">
          Back to My Bookings
        </Link>
      </div>
    );
  }

  return (
    <div className="card shadow">
      <div className="card-body">
        <h2 className="text-center mb-4">Ticket Details</h2>
        {error && <div className="alert alert-danger">{error}</div>}
        
        <div className="text-end mb-3">
          <button onClick={handleDownloadTicket} className="btn btn-success me-2">
            <i className="bi bi-download"></i> Download Ticket
          </button>
          {!booking.cancelled && (
            <button onClick={handleCancelBooking} className="btn btn-danger">
              <i className="bi bi-x-circle"></i> Cancel Booking
            </button>
          )}
        </div>
        
        <div ref={ticketRef} className="p-4 border rounded bg-light">
          <div className="text-center mb-4">
            <h3>Ticket Booking</h3>
            <p className="text-muted">Booking ID: {booking.id}</p>
          </div>
          
          <div className="row mb-3">
            <div className="col-md-6">
              <h5>Journey Details</h5>
              <table className="table table-sm">
                <tbody>
                  <tr>
                    <th>From:</th>
                    <td>{booking.startsFrom}</td>
                  </tr>
                  <tr>
                    <th>To:</th>
                    <td>{booking.destination}</td>
                  </tr>
                  <tr>
                    <th>Travel Date:</th>
                    <td>{booking.travelDate}</td>
                  </tr>
                  <tr>
                    <th>Booking Date:</th>
                    <td>{booking.bookingDate}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="col-md-6">
              <h5>Ticket Summary</h5>
              <table className="table table-sm">
                <tbody>
                  <tr>
                    <th>Adults:</th>
                    <td>{booking.adults}</td>
                  </tr>
                  <tr>
                    <th>Children:</th>
                    <td>{booking.children}</td>
                  </tr>
                  <tr>
                    <th>Total Passengers:</th>
                    <td>{booking.adults + booking.children}</td>
                  </tr>
                  <tr>
                    <th>Total Price:</th>
                    <td>₹{booking.totalPrice}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <h5>Passenger Details</h5>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Age</th>
                <th>Type</th>
                <th>ID Type</th>
                <th>ID Number</th>
              </tr>
            </thead>
            <tbody>
              {booking.passengers.map((passenger, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{passenger.name}</td>
                  <td>{passenger.age}</td>
                  <td>{passenger.isAdult ? 'Adult' : 'Child'}</td>
                  <td>{passenger.idType && passenger.idType.toUpperCase()}</td>
                  <td>{passenger.idNumber}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {booking.cancelled && (
            <div className="alert alert-danger text-center mt-3">
              <strong>CANCELLED</strong>
              {booking.cancelledDate && (
                <div>Cancelled on: {booking.cancelledDate}</div>
              )}
            </div>
          )}
          
          <div className="text-center mt-4">
            <p className="small text-muted">Thank you for booking with us!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetails;