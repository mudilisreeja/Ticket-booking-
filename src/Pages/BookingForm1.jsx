import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const BookingForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    startsFrom: '',
    destination: '',
    travelDate: new Date(),
    adults: 1,
    children: 0,
    totalPrice: 500,
  });

  const [passengers, setPassengers] = useState([
    { name: '', age: '', isAdult: true, idNumber: '', idType: 'aadhar' }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    // Update passenger list based on number of adults and children
    const newPassengers = [];
    
    // Add adult passengers
    for (let i = 0; i < formData.adults; i++) {
      newPassengers.push({ 
        name: passengers[i]?.name || '', 
        age: passengers[i]?.age || '', 
        isAdult: true, 
        idNumber: passengers[i]?.idNumber || '', 
        idType: passengers[i]?.idType || 'aadhar' 
      });
    }

    // Add child passengers
    for (let i = 0; i < formData.children; i++) {
      newPassengers.push({ 
        name: passengers[formData.adults + i]?.name || '', 
        age: passengers[formData.adults + i]?.age || '', 
        isAdult: false, 
        idNumber: passengers[formData.adults + i]?.idNumber || '', 
        idType: passengers[formData.adults + i]?.idType || 'aadhar' 
      });
    }

    setPassengers(newPassengers);
  }, [formData.adults, formData.children]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleTravelDateChange = (date) => {
    setFormData({
      ...formData,
      travelDate: date,
    });
  };

  const handlePassengerChange = (index, e) => {
    const { name, value } = e.target;
    const updatedPassengers = [...passengers];
    updatedPassengers[index] = {
      ...updatedPassengers[index],
      [name]: value
    };
    setPassengers(updatedPassengers);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Enhanced validation
    const validationErrors = [];

    // Validate passengers
    passengers.forEach((passenger, index) => {
      if (!passenger.name) {
        validationErrors.push(`Passenger ${index + 1} name is required`);
      }
      if (!passenger.age) {
        validationErrors.push(`Passenger ${index + 1} age is required`);
      }
    });

    // Validate travel details
    if (!formData.startsFrom) {
      validationErrors.push('Starting location is required');
    }
    if (!formData.destination) {
      validationErrors.push('Destination is required');
    }

    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:5000/api/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Add token for authentication
        },
        body: JSON.stringify({
          ...formData,
          travelDate: formData.travelDate.toISOString().split('T')[0],
          passengers,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create booking');
      }

      navigate(`/ticket/${data.booking_id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card shadow">
      <div className="card-body">
        <h2 className="text-center mb-4">Book Your Ticket</h2>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="row mb-3">
            <div className="col-md-6">
              <label htmlFor="startsFrom" className="form-label">From</label>
              <input
                type="text"
                className="form-control"
                id="startsFrom"
                name="startsFrom"
                value={formData.startsFrom}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="destination" className="form-label">To</label>
              <input
                type="text"
                className="form-control"
                id="destination"
                name="destination"
                value={formData.destination}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="row mb-3">
            <div className="col-md-6">
              <label htmlFor="travelDate" className="form-label">Travel Date</label>
              <DatePicker
                selected={formData.travelDate}
                onChange={handleTravelDateChange}
                minDate={new Date()}
                className="form-control"
                dateFormat="yyyy-MM-dd"
              />
            </div>
            <div className="col-md-3">
              <label htmlFor="adults" className="form-label">Adults</label>
              <select
                className="form-select"
                id="adults"
                name="adults"
                value={formData.adults}
                onChange={handleChange}
                required
              >
                {[...Array(5).keys()].map((num) => (
                  <option key={num} value={num + 1}>
                    {num + 1}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label htmlFor="children" className="form-label">Children</label>
              <select
                className="form-select"
                id="children"
                name="children"
                value={formData.children}
                onChange={handleChange}
              >
                {[...Array(6).keys()].map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Passenger Details Section */}
          <div className="mb-3">
            <h4>Passenger Details</h4>
            {passengers.map((passenger, index) => (
              <div key={index} className="card mb-2">
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-4">
                      <label className="form-label">Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="name"
                        value={passenger.name}
                        onChange={(e) => handlePassengerChange(index, e)}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Age</label>
                      <input
                        type="number"
                        className="form-control"
                        name="age"
                        value={passenger.age}
                        onChange={(e) => handlePassengerChange(index, e)}
                        required
                        min="0"
                        max="120"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">ID Type</label>
                      <select
                        className="form-select"
                        name="idType"
                        value={passenger.idType}
                        onChange={(e) => handlePassengerChange(index, e)}
                      >
                        <option value="aadhar">Aadhar Card</option>
                        <option value="passport">Passport</option>
                        <option value="driving_license">Driving License</option>
                      </select>
                    </div>
                  </div>
                  <div className="row mt-2">
                    <div className="col-md-12">
                      <label className="form-label">ID Number</label>
                      <input
                        type="text"
                        className="form-control"
                        name="idNumber"
                        value={passenger.idNumber}
                        onChange={(e) => handlePassengerChange(index, e)}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Book Ticket'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookingForm;