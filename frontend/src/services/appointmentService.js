import api from './api';

export const appointmentService = {
  createAppointment: async (data) => {
    const response = await api.post('/appointments', data);
    return response.data;
  },

  getMyAppointments: async (params = {}) => {
    const response = await api.get('/appointments', { params });
    return response.data;
  },

  getAppointmentById: async (appointmentId) => {
    const response = await api.get(`/appointments/${appointmentId}`);
    return response.data;
  },

  updateAppointmentStatus: async (appointmentId, data) => {
    const response = await api.patch(`/appointments/${appointmentId}/status`, data);
    return response.data;
  },

  getUpcomingAppointments: async (limit = 5) => {
    const response = await api.get('/appointments/upcoming', { params: { limit } });
    return response.data;
  },

  // Admin
  getAllAppointments: async (params = {}) => {
    const response = await api.get('/appointments/admin/all', { params });
    return response.data;
  },
};
