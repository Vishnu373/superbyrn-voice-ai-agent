import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const apiService = {
    // Appointments
    getAllAppointments: async () => {
        const response = await api.get('/v1/appointments');
        return response.data;
    },

    getUserAppointments: async (phone) => {
        const response = await api.get(`/v1/appointments/${phone}`);
        return response.data;
    },

    bookAppointment: async (slotId, phone, patientName, notes) => {
        const response = await api.post('/v1/appointments', {
            slot_id: slotId,
            phone,
            patient_name: patientName,
            notes
        });
        return response.data;
    },

    cancelAppointment: async (appointmentId) => {
        const response = await api.post(`/v1/appointments/${appointmentId}/cancel`);
        return response.data;
    },

    modifyAppointment: async (appointmentId, newSlotId) => {
        const response = await api.put(`/v1/appointments/${appointmentId}`, {
            new_slot_id: newSlotId
        });
        return response.data;
    },

    // Slots
    getAllSlots: async () => {
        const response = await api.get('/v1/slots');
        return response.data;
    },

    getAvailableSlots: async () => {
        const response = await api.get('/v1/slots/available');
        return response.data;
    },

    // Users
    getUser: async (phone) => {
        const response = await api.get(`/v1/users/${phone}`);
        return response.data;
    },

    createOrGetUser: async (phone, name) => {
        const response = await api.post('/v1/users', { phone, name });
        return response.data;
    },

    // Summaries
    getAllSummaries: async () => {
        const response = await api.get('/v1/summaries');
        return response.data;
    },

    getUserSummaries: async (phone) => {
        const response = await api.get(`/v1/summaries/${phone}`);
        return response.data;
    },

    // Billing (Admin)
    getAllBilling: async () => {
        const response = await api.get('/v1/billing');
        return response.data;
    },

    // LiveKit
    getLiveKitToken: async (phone) => {
        const response = await api.post('/v1/livekit/token', {
            phone
        });
        return response.data;
    }
};

export default apiService;
