import React, { useState } from 'react';

export const PaymentModal = ({ booking, onClose, onSuccess }) => {
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateCardNumber = (number) => {
    const cardRegex = /^\d{16}$/;
    return cardRegex.test(number);
  };

  const validateExpiryDate = (date) => {
    const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
    if (!expiryRegex.test(date)) return false;

    const [month, year] = date.split('/');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;

    if (parseInt(year) < currentYear || 
        (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
      return false;
    }

    return true;
  };

  const validateCVV = (cvv) => {
    const cvvRegex = /^\d{3,4}$/;
    return cvvRegex.test(cvv);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate card number
    if (!validateCardNumber(paymentData.cardNumber)) {
      setError('Please enter a valid 16-digit card number');
      return;
    }

    // Validate card name
    if (!paymentData.cardName.trim()) {
      setError('Please enter the cardholder name');
      return;
    }

    // Validate expiry date
    if (!validateExpiryDate(paymentData.expiryDate)) {
      setError('Please enter a valid expiry date (MM/YY)');
      return;
    }

    // Validate CVV
    if (!validateCVV(paymentData.cvv)) {
      setError('Please enter a valid CVV');
      return;
    }

    try {
      // Here you would typically make an API call to process the payment
      // For demo purposes, we'll just simulate a successful payment
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Call the success callback
      onSuccess();
    } catch (err) {
      setError('Payment processing failed. Please try again.');
    }
  };

  return (
    <div className="modal show d-block" tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Payment Details</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="alert alert-info mb-3">
              <h6>Booking Summary</h6>
              <p className="mb-1">From: {booking.starts_from}</p>
              <p className="mb-1">To: {booking.destination}</p>
              <p className="mb-1">Date: {new Date(booking.travel_date).toLocaleDateString()}</p>
              <p className="mb-0">Total Amount: ₹{booking.total_price}</p>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="cardNumber" className="form-label">Card Number</label>
                <input
                  type="text"
                  className="form-control"
                  id="cardNumber"
                  name="cardNumber"
                  value={paymentData.cardNumber}
                  onChange={handleChange}
                  placeholder="1234 5678 9012 3456"
                  maxLength="16"
                  required
                />
              </div>

              <div className="mb-3">
                <label htmlFor="cardName" className="form-label">Cardholder Name</label>
                <input
                  type="text"
                  className="form-control"
                  id="cardName"
                  name="cardName"
                  value={paymentData.cardName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label htmlFor="expiryDate" className="form-label">Expiry Date</label>
                  <input
                    type="text"
                    className="form-control"
                    id="expiryDate"
                    name="expiryDate"
                    value={paymentData.expiryDate}
                    onChange={handleChange}
                    placeholder="MM/YY"
                    maxLength="5"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="cvv" className="form-label">CVV</label>
                  <input
                    type="text"
                    className="form-control"
                    id="cvv"
                    name="cvv"
                    value={paymentData.cvv}
                    onChange={handleChange}
                    placeholder="123"
                    maxLength="4"
                    required
                  />
                </div>
              </div>

              <div className="d-grid gap-2">
                <button type="submit" className="btn btn-primary">
                  Pay ₹{booking.total_price}
                </button>
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
