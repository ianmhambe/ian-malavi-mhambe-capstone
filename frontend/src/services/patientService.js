import api from './api';

export const patientService = {
  getMyProfile: async () => {
    const response = await api.get('/patients/profile');
    return response.data;
  },

  updateMyProfile: async (data) => {
    const response = await api.put('/patients/profile', data);
    return response.data;
  },

  // Admin
  getAllPatients: async (params = {}) => {
    const response = await api.get('/patients', { params });
    return response.data;
  },

  getPatientById: async (patientId) => {
    const response = await api.get(`/patients/${patientId}`);
    return response.data;
  },

  togglePatientStatus: async (patientId) => {
    const response = await api.patch(`/patients/${patientId}/toggle-status`);
    return response.data;
  },

  deletePatient: async (patientId) => {
    const response = await api.delete(`/patients/${patientId}`);
    return response.data;
  },
};
