import axios from 'axios';

// Create a centralized Axios client
export const apiClient = axios.create({
  // The default Django backend port is 8000. All APIs are under /api/v1/
  baseURL: 'http://localhost:8000/api/v1/',
  headers: {
    'Content-Type': 'application/json',
  },
});
