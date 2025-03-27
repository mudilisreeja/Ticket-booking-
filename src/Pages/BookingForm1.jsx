import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { cities, priceMatrix } from '../data/cities';
import PaymentModal from '../Components/PaymentModal';

const BookingForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    startsFrom: '',
    destination: '',
    travelDate: new Date(),
    adults: 1,
    children: 0,
    totalPrice: 0,
  });

  const [passengers, setPassengers] = useState([
    { name: '', age: '', isAdult: true, idNumber: '', idType: 'aadhar' }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentBooking, setCurrentBooking] = useState(null);

  // Calculate total price when cities or passenger count changes
  useEffect(() => {
    if (formData.startsFrom && formData.destination) {
      const routeKey = `${formData.startsFrom}-${formData.destination}`;
      const basePrice = priceMatrix[routeKey] || 0;
      const totalPassengers = formData.adults + formData.children;
      const totalPrice = basePrice * totalPassengers;
      setFormData(prev => ({ ...prev, totalPrice }));
    }
  }, [formData.startsFrom, formData.destination, formData.adults, formData.children]);

  // Validation helper functions
  const validateAadhar = (aadhar) => {
    const aadharRegex = /^\d{12}$/;
    return aadharRegex.test(aadhar);
  };

  const validatePassport = (passport) => {
    const passportRegex = /^[A-Z]{1,2}\d{7}$/;
    return passportRegex.test(passport);
  };

  const validateDrivingLicense = (license) => {
    const licenseRegex = /^[A-Z]{2}\d{13}$/;
    return licenseRegex.test(license);
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/check_session', {
          credentials: 'include'
        });
        const data = await response.json();
        
        if (!data.logged_in) {
          navigate('/login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        navigate('/login');
      }
    };

    checkAuth();
  }, [navigate]);

  useEffect(() => {
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
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleTravelDateChange = (date) => {
    setFormData(prevData => ({
      ...prevData,
      travelDate: date,
    }));
  };

  const handlePassengerChange = (index, e) => {
    const { name, value } = e.target;
    setPassengers(prevPassengers => {
      const updatedPassengers = [...prevPassengers];
      updatedPassengers[index] = {
        ...updatedPassengers[index],
        [name]: value
      };
      return updatedPassengers;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationErrors = [];

    // Passenger validation
    passengers.forEach((passenger, index) => {
      if (!passenger.name.trim()) {
        validationErrors.push(`Passenger ${index + 1} name is required`);
      }

      const age = parseInt(passenger.age);
      if (isNaN(age) || age < 0 || age > 120) {
        validationErrors.push(`Passenger ${index + 1} age is invalid`);
      }

      if (passenger.isAdult) {
        switch(passenger.idType) {
          case 'aadhar':
            if (!validateAadhar(passenger.idNumber)) {
              validationErrors.push(`Passenger ${index + 1} Aadhar number is invalid`);
            }
            break;
          case 'passport':
            if (!validatePassport(passenger.idNumber)) {
              validationErrors.push(`Passenger ${index + 1} Passport number is invalid`);
            }
            break;
          case 'driving_license':
            if (!validateDrivingLicense(passenger.idNumber)) {
              validationErrors.push(`Passenger ${index + 1} Driving License number is invalid`);
            }
            break;
          default:
            break;
        }
      }
    });

    // Travel details validation
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
      console.log('Submitting booking with data:', {
        ...formData,
        travelDate: formData.travelDate.toISOString().split('T')[0],
        passengers: passengers.map(p => ({
          ...p,
          idNumber: (p.isAdult || (parseInt(p.age) > 5)) ? p.idNumber : ''
        }))
      });

      const response = await fetch('http://localhost:5000/api/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify({
          ...formData,
          travelDate: formData.travelDate.toISOString().split('T')[0],
          passengers: passengers.map(p => ({
            ...p,
            idNumber: (p.isAdult || (parseInt(p.age) > 5)) ? p.idNumber : ''
          }))
        })
      });

      const data = await response.json();
      console.log('Server response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create booking');
      }

      // Instead of showing payment modal, directly navigate to bookings
      alert('Booking created successfully!');
      navigate('/mybookings');
    } catch (err) {
      console.error('Booking error details:', {
        message: err.message,
        stack: err.stack,
        formData,
        passengers
      });
      
      setError(err.message || 'Failed to create booking. Please try again.');
      
      if (err.message.includes('Session expired') || err.message.includes('401')) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    alert('Payment successful!');
    navigate('/mybookings');
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
              <select
                className="form-select"
                id="startsFrom"
                name="startsFrom"
                value={formData.startsFrom}
                onChange={handleChange}
                required
              >
                <option value="">Select Departure City</option>
                {cities.map(city => (
                  <option key={city.id} value={city.name}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label htmlFor="destination" className="form-label">To</label>
              <select
                className="form-select"
                id="destination"
                name="destination"
                value={formData.destination}
                onChange={handleChange}
                required
              >
                <option value="">Select Destination City</option>
                {cities.map(city => (
                  <option key={city.id} value={city.name}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Price Display */}
          {formData.startsFrom && formData.destination && (
            <div className="alert alert-info mb-3">
              <h5>Price Details:</h5>
              <p className="mb-1">Base Price per Person: ₹{priceMatrix[`${formData.startsFrom}-${formData.destination}`]}</p>
              <p className="mb-1">Total Passengers: {Number(formData.adults) + Number(formData.children)}</p>
              <p className="mb-0">Total Price: ₹{formData.totalPrice}</p>
            </div>
          )}

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
                {[0, 1, 2, 3, 4, 5].map((num) => (
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
                      {passenger.age && parseInt(passenger.age) <= 5 && (
                        <small className="text-muted">No ID required for children 5 and under</small>
                      )}
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">ID Type</label>
                      <select
                        className="form-select"
                        name="idType"
                        value={passenger.idType}
                        onChange={(e) => handlePassengerChange(index, e)}
                        disabled={!passenger.isAdult && parseInt(passenger.age) <= 5}
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
                        required={passenger.isAdult || (passenger.age && parseInt(passenger.age) > 5)}
                        disabled={!passenger.isAdult && parseInt(passenger.age) <= 5}
                      />
                      {passenger.isAdult && (
                        <small className="text-muted">
                          {passenger.idType === 'aadhar' && "12-digit Aadhar number"}
                          {passenger.idType === 'passport' && "Passport format: 1-2 letters followed by 7 digits"}
                          {passenger.idType === 'driving_license' && "Driving License format: 2 letters followed by 13 digits"}
                        </small>
                      )}
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

      {showPaymentModal && currentBooking && (
        <PaymentModal
          booking={currentBooking}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default BookingForm;