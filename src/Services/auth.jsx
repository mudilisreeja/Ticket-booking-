// API service using fetch with credentials to handle cookies
const API_URL = 'http://localhost:5000/api';

// Configure fetch to include credentials for all requests
const fetchWithCredentials = (url, options = {}) => {
  return fetch(url, {
    ...options,
    credentials: 'include',  // This is crucial for sending/receiving cookies
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
    }
  });
};

// Authentication Service
const AuthService = {
  // Register a new user
  register: async (username, email, password) => {
    try {
      const response = await fetchWithCredentials(`${API_URL}/register`, {
        method: 'POST',
        body: JSON.stringify({ username, email, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      // Store user info in localStorage
      localStorage.setItem('user', JSON.stringify({
        id: data.user_id,
        username: data.username
      }));
      
      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },
  
  // Login user
  login: async (email, password) => {
    try {
      const response = await fetchWithCredentials(`${API_URL}/login`, {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      // Store user info in localStorage
      localStorage.setItem('user', JSON.stringify({
        id: data.user_id,
        username: data.username,
        email: data.email
      }));
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  // Logout user
  logout: async () => {
    try {
      const response = await fetchWithCredentials(`${API_URL}/logout`, {
        method: 'POST'
      });
      
      // Clear user from localStorage
      localStorage.removeItem('user');
      
      return await response.json();
    } catch (error) {
      console.error('Logout error:', error);
      // Still remove from localStorage even if server request fails
      localStorage.removeItem('user');
      throw error;
    }
  },
  
  // Get current user from localStorage
  getCurrentUser: () => {
    return JSON.parse(localStorage.getItem('user'));
  },
  
  // Check if user is logged in
  isAuthenticated: () => {
    return !!localStorage.getItem('user');
  }
};

// Booking Service
const BookingService = {
  // Create a new booking
  createBooking: async (bookingData) => {
    try {
      const response = await fetchWithCredentials(`${API_URL}/bookings`, {
        method: 'POST',
        body: JSON.stringify(bookingData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Booking failed');
      }
      
      return data;
    } catch (error) {
      console.error('Booking error:', error);
      throw error;
    }
  },
  
  // Get user's bookings
  getUserBookings: async () => {
    try {
      const response = await fetchWithCredentials(`${API_URL}/my-bookings`);
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to fetch bookings');
      }
      
      return data;
    } catch (error) {
      console.error('Fetch bookings error:', error);
      throw error;
    }
  },
  
  // Get booking details by ID
  getBookingById: async (id) => {
    try {
      const response = await fetchWithCredentials(`${API_URL}/bookings/${id}`);
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to fetch booking');
      }
      
      return data;
    } catch (error) {
      console.error('Fetch booking error:', error);
      throw error;
    }
  },
  
  // Get booking by reference
  getBookingByReference: async (reference) => {
    try {
      const response = await fetchWithCredentials(`${API_URL}/bookings/reference/${reference}`);
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to fetch booking');
      }
      
      return data;
    } catch (error) {
      console.error('Fetch booking by reference error:', error);
      throw error;
    }
  },
  
  // Cancel booking
  cancelBooking: async (id) => {
    try {
      const response = await fetchWithCredentials(`${API_URL}/bookings/${id}/cancel`, {
        method: 'PUT'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to cancel booking');
      }
      
      return data;
    } catch (error) {
      console.error('Cancel booking error:', error);
      throw error;
    }
  },
  
  // Download ticket
  downloadTicket: (id) => {
    // For file downloads, we need to redirect the browser
    window.open(`${API_URL}/bookings/${id}/download-ticket`, '_blank');
  }
};

// User Profile Service
const UserService = {
  // Get user profile
  getUserProfile: async () => {
    try {
      const response = await fetchWithCredentials(`${API_URL}/user`);
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to fetch profile');
      }
      
      return data;
    } catch (error) {
      console.error('Fetch profile error:', error);
      throw error;
    }
  },
  
  // Update user profile
  updateProfile: async (userData) => {
    try {
      const response = await fetchWithCredentials(`${API_URL}/user/update`, {
        method: 'PUT',
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to update profile');
      }
      
      // Update local storage with new user data
      const currentUser = AuthService.getCurrentUser();
      localStorage.setItem('user', JSON.stringify({
        ...currentUser,
        username: data.username,
        email: data.email
      }));
      
      return data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }
};

// Export the services
export { AuthService, BookingService, UserService };