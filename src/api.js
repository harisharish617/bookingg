import axios from 'axios';

const http = axios.create({ baseURL: '/api', timeout: 10000 });

http.interceptors.request.use(config => {
  const token = localStorage.getItem('stayease_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const user = localStorage.getItem('stayease_user');
  if (user) config.headers['X-Demo-User'] = user;
  console.info(`%c[HTTP REQUEST] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
    'color:#2563eb;font-weight:bold', {
      params: config.params,
      hasAuthToken: Boolean(token)
    });
  return config;
});

http.interceptors.response.use(
  response => {
    console.info(`%c[HTTP RESPONSE] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`,
      'color:#059669;font-weight:bold');
    return response;
  },
  error => {
    console.error('%c[HTTP ERROR]', 'color:#dc2626;font-weight:bold', {
      method: error.config?.method?.toUpperCase(),
      url: error.config?.url,
      status: error.response?.status,
      message: error.message
    });
    return Promise.reject(error);
  }
);

export const api = {
  getHotels: () => http.get('/hotels'),
  getHotel: id => http.get(`/hotels/${id}`),
  getReservations: () => http.get('/reservations'),
  createReservation: payload => http.post('/reservations', payload),
  updateReservation: (id, changes) => http.patch(`/reservations/${id}`, changes),
  deleteReservation: id => http.delete(`/reservations/${id}`)
};
