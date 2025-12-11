import api from './api';

export const doctorService = {
  getAllDoctors: async (params = {}) => {
    const response = await api.get('/doctors', { params });
    return response.data;
  },

  getDoctorById: async (doctorId) => {
    const response = await api.get(`/doctors/${doctorId}`);
    return response.data;
  },

  getSpecializations: async () => {
    const response = await api.get('/doctors/specializations');
    return response.data;
  },

  getDoctorAvailability: async (doctorId) => {
    const response = await api.get(`/doctors/${doctorId}/availability`);
    return response.data;
  },

  getAvailableSlots: async (doctorId, date) => {
    const response = await api.get(`/doctors/${doctorId}/slots`, { params: { date } });
    return response.data;
  },

  // Doctor profile
  getMyProfile: async () => {
    const response = await api.get('/doctors/me/profile');
    return response.data;
  },

  updateMyProfile: async (data) => {
    const response = await api.put('/doctors/me/profile', data);
    return response.data;
  },

  getMyAvailability: async () => {
    const response = await api.get('/doctors/me/availability');
    return response.data;
  },

  setAvailability: async (availabilityData) => {
    const response = await api.post('/doctors/me/availability', availabilityData);
    return response.data;
  },

  setBulkAvailability: async (availability) => {
    const response = await api.post('/doctors/me/availability/bulk', { availability });
    return response.data;
  },

  // Admin
  toggleDoctorStatus: async (doctorId) => {
    const response = await api.patch(`/doctors/${doctorId}/toggle-status`);
    return response.data;
  },

  deleteDoctor: async (doctorId) => {
    const response = await api.delete(`/doctors/${doctorId}`);
    return response.data;
  },
};
