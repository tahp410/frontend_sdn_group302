import api from "./apiService";

// Lấy tất cả requests (có thể filter theo clubId, status, studentId)
export const getAllRequests = async (params = {}) => {
  return await api.get("/requests", { params });
};

// Lấy requests của các clubs mà user là manager
export const getMyClubRequests = async (params = {}) => {
  return await api.get("/requests/my-clubs", { params });
};

// Tạo request mới
export const createRequest = async (clubId, message = "") => {
  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  return await api.post("/requests", {
    studentId: userInfo?.user?._id,
    clubId,
    message,
  });
};

// Cập nhật trạng thái request (accept/reject)
export const updateRequestStatus = async (requestId, status) => {
  return await api.put(`/requests/${requestId}/status`, { status });
};

// Lấy thống kê requests
export const getRequestsStats = async () => {
  return await api.get("/requests/stats");
};

