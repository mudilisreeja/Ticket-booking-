import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext1';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="container">
      <div className="jumbotron bg-light p-5 rounded shadow-sm">
        <h1 className="display-4 text-primary">Welcome to Ticket Booking</h1>
        <p className="lead text-muted">
          Book your tickets easily and securely for your next journey.
        </p>
        <hr className="my-4" />
        <p className="text-secondary">
          Start by searching for your destination and book your tickets in just a few clicks.
        </p>
        {user ? (
          <Link to="/book" className="btn btn-primary btn-lg">
            Book a Ticket
          </Link>
        ) : (
          <Link to="/login" className="btn btn-primary btn-lg">
            Login to Book
          </Link>
        )}
      </div>

      <div className="row mt-5">
        <div className="col-md-4">
          <div className="card mb-4 h-100 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center mb-3">
                <i className="bi bi-ticket-detailed me-3 text-primary fs-2"></i>
                <h5 className="card-title mb-0">Easy Booking</h5>
              </div>
              <p className="card-text text-muted">
                Book tickets with a simple and intuitive process. Add multiple passengers with ease.
              </p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card mb-4 h-100 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center mb-3">
                <i className="bi bi-list-check me-3 text-success fs-2"></i>
                <h5 className="card-title mb-0">Manage Bookings</h5>
              </div>
              <p className="card-text text-muted">
                View, download or cancel your bookings anytime from your account.
              </p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card mb-4 h-100 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center mb-3">
                <i className="bi bi-shield-lock me-3 text-warning fs-2"></i>
                <h5 className="card-title mb-0">Secure Payments</h5>
              </div>
              <p className="card-text text-muted">
                Your payment information is securely processed and protected.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Feature Preview Section */}
      <div className="row mt-5 bg-light p-4 rounded">
        <div className="col-12 text-center">
          <h3 className="mb-4">Quick Features</h3>
          <div className="d-flex justify-content-around">
            <div className="text-center">
              <i className="bi bi-calendar-check text-primary fs-1"></i>
              <p className="mt-2">Real-time Availability</p>
            </div>
            <div className="text-center">
              <i className="bi bi-clock-history text-success fs-1"></i>
              <p className="mt-2">Fast Booking</p>
            </div>
            <div className="text-center">
              <i className="bi bi-credit-card text-info fs-1"></i>
              <p className="mt-2">Multiple Payment Options</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;