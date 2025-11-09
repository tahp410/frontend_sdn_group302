import api from "./apiService";

export const getAllEvents = async () => {
  return await api.get("/events");
};

export const getEventById = async (id) => {
  return await api.get(`/events/${id}`);
};

// Tham gia một sự kiện
export const joinEvent = async (eventId, userId) => {
  // Gửi yêu cầu POST tới /api/events/participants/:id với userId trong body
  return await api.post(`/api/events/participants/${eventId}`, { userId });
};
