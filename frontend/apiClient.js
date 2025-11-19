import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const predictFull = async (features) => {
  try {
    const response = await api.post('/api/predict/full', {
      features
    });
    return response.data;
  } catch (error) {
    console.error('Prediction error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || error.message || 'Failed to get prediction');
  }
};

export const predictTop10 = async (features) => {
  try {
    const response = await api.post('/api/predict/top10', {
      features
    });
    return response.data;
  } catch (error) {
    console.error('Prediction error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || error.message || 'Failed to get prediction');
  }
};

export const healthCheck = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Health check error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || error.message || 'Health check failed');
  }
};

export default api;