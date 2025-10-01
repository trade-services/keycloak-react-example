import axios from 'axios';

const httpClient = axios.create({
  timeout: 10000, // 10 second timeout
});

// Add request interceptor to ensure token is always fresh
httpClient.interceptors.request.use(
  (config) => {
    // Log the request for debugging
    console.log('Making request to:', config.url);
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle authentication errors
httpClient.interceptors.response.use(
  (response) => {
    // Log successful responses for debugging
    console.log('Response received:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('HTTP Error:', error.response?.status, error.response?.statusText, error.config?.url);
    
    // Handle specific HTTP status codes
    if (error.response?.status === 401) {
      console.error('Unauthorized - token may be invalid or expired');
      // You might want to trigger a re-authentication here
    } else if (error.response?.status === 403) {
      console.error('Forbidden - insufficient permissions');
    } else if (error.response?.status >= 500) {
      console.error('Server error - check backend service');
    }
    
    return Promise.reject(error);
  }
);

export {httpClient}