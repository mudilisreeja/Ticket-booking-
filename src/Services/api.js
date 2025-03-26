// src/services/api.js
const API_URL = 'http://localhost:5000/api';

export const apiService = {
  // Auth endpoints
  register: async (userData) => {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  login: async (credentials) => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    return handleResponse(response);
  },

  // Booking endpoints
  createBooking: async (bookingData, token) => {
    const response = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(bookingData),
    });
    return handleResponse(response);
  },

  getBookings: async (token) => {
    const response = await fetch(`${API_URL}/bookings`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },

  getBookingById: async (id, token) => {
    const response = await fetch(`${API_URL}/bookings/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },

  cancelBooking: async (id, token) => {
    const response = await fetch(`${API_URL}/bookings/${id}/cancel`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    const error = data.message || response.statusText;
    throw new Error(error);
  }
  return data;
};

export default apiService;