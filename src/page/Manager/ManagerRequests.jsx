import React, { useState, useEffect } from "react";
import { getMyClubRequests, updateRequestStatus } from "../../services/request";
import { getMyManagedClubs } from "../../services/club";
import "./manager-requests.scss";

const ManagerRequests = () => {
  const [requests, setRequests] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedClub, setSelectedClub] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("pending");

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));

  useEffect(() => {
    fetchData();
  }, [selectedClub, selectedStatus]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setMessage(""); // Clear previous messages
      
      // Lấy danh sách clubs của manager (bao gồm cả pending và approved)
      const { data: clubsData } = await getMyManagedClubs();
      setClubs(clubsData || []);
      const managerClubs = clubsData || [];
      
      // Lấy requests của các clubs mà user là manager (từ backend)
      const params = {};
      if (selectedClub !== "all") {
        params.clubId = selectedClub;
      }
      if (selectedStatus !== "all") {
        params.status = selectedStatus;
      }

      const { data: requestsData } = await getMyClubRequests(params);
      
      if (requestsData?.message) {
        setMessage(requestsData.message);
        setRequests([]);
      } else {
        setRequests(requestsData?.data || []);
        
        if ((requestsData?.data || []).length === 0) {
          if (selectedStatus !== "all" || selectedClub !== "all") {
            setMessage("Không có yêu cầu nào phù hợp với bộ lọc hiện tại.");
          } else if (managerClubs.length === 0) {
            setMessage("Bạn chưa có CLB nào để quản lý. Vui lòng tạo CLB trước.");
          }
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setMessage("Lỗi khi tải dữ liệu: " + (error.response?.data?.error || error.message));
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (requestId, status) => {
    try {
      await updateRequestStatus(requestId, status);
      setMessage(`Đã ${status === "accepted" ? "chấp nhận" : "từ chối"} yêu cầu thành công!`);
      fetchData(); // Refresh danh sách
    } catch (error) {
      setMessage("Lỗi khi cập nhật: " + (error.response?.data?.error || error.message));
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { text: "Chờ duyệt", class: "pending" },
      accepted: { text: "Đã chấp nhận", class: "accepted" },
      rejected: { text: "Đã từ chối", class: "rejected" },
    };
    const statusInfo = statusMap[status] || { text: status, class: "" };
    return (
      <span className={`status-badge ${statusInfo.class}`}>{statusInfo.text}</span>
    );
  };

  // Clubs đã là clubs của manager (từ backend)
  const managerClubs = clubs;

  if (loading) {
    return (
      <div className="manager-requests-page">
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="manager-requests-page">
      <div className="container">
        <h1 className="page-title">📋 Quản lý yêu cầu tham gia</h1>

        {message && (
          <div className={`message ${message.includes("thành công") ? "success" : "error"}`}>
            {message}
          </div>
        )}

        {/* Filters */}
        <div className="filters">
          <div className="filter-group">
            <label>Lọc theo CLB:</label>
            <select
              value={selectedClub}
              onChange={(e) => setSelectedClub(e.target.value)}
            >
              <option value="all">Tất cả CLB của tôi</option>
              {managerClubs.map((club) => (
                <option key={club._id} value={club._id}>
                  {club.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Lọc theo trạng thái:</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">Tất cả</option>
              <option value="pending">Chờ duyệt</option>
              <option value="accepted">Đã chấp nhận</option>
              <option value="rejected">Đã từ chối</option>
            </select>
          </div>
        </div>

        {/* Requests List */}
        {requests.length === 0 ? (
          <div className="no-requests">
            <p>Không có yêu cầu nào.</p>
          </div>
        ) : (
          <div className="requests-list">
            {requests.map((request) => (
              <div key={request._id} className="request-card">
                <div className="request-header">
                  <div className="request-info">
                    <h3>{request.studentId?.name || "Ẩn danh"}</h3>
                    <p className="club-name">
                      CLB: {request.clubId?.name || "Không rõ"}
                    </p>
                    <p className="request-date">
                      Ngày gửi: {new Date(request.createdAt).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                {request.message && (
                  <div className="request-message">
                    <strong>Lời nhắn:</strong>
                    <p>{request.message}</p>
                  </div>
                )}

                {request.status === "pending" && (
                  <div className="request-actions">
                    <button
                      onClick={() => handleUpdateStatus(request._id, "accepted")}
                      className="btn-accept"
                    >
                      ✅ Chấp nhận
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(request._id, "rejected")}
                      className="btn-reject"
                    >
                      ❌ Từ chối
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerRequests;

