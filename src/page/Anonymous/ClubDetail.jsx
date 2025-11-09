import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getClubDetailById } from "../../services/club";
import { createRequest, getAllRequests } from "../../services/request";
import "./clubdetail.scss";

const ClubDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [message, setMessage] = useState("");
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [requestStatus, setRequestStatus] = useState(null); // pending, accepted, rejected
  const [loadingRequest, setLoadingRequest] = useState(false);

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));

  useEffect(() => {
    const fetchClub = async () => {
      try {
        const { data } = await getClubDetailById(id);
        setClub(data);

        // Kiểm tra user đã là thành viên chưa
        const isMember = data.members.some(
          (m) => m.userId?._id === userInfo?.user?._id
        );
        setJoined(isMember);

        // Kiểm tra request status nếu user đã đăng nhập
        if (userInfo?.user?._id && !isMember) {
          try {
            const { data: requestsData } = await getAllRequests({
              clubId: id,
              studentId: userInfo.user._id,
            });
            
            if (requestsData?.data && requestsData.data.length > 0) {
              // Lấy request mới nhất (đã được sort từ backend)
              const latestRequest = requestsData.data[0];
              // Chỉ hiển thị status nếu request chưa được xử lý hoặc bị reject
              if (latestRequest.status === "pending" || latestRequest.status === "rejected") {
                setRequestStatus(latestRequest.status);
              } else if (latestRequest.status === "accepted") {
                // Nếu đã được accept, refresh lại để kiểm tra membership
                setRequestStatus("accepted");
              }
            }
          } catch (err) {
            console.error("Lỗi khi kiểm tra request:", err);
            // Nếu có lỗi (có thể do chưa đăng nhập), không làm gì
          }
        }
      } catch (err) {
        console.error("Lỗi khi lấy thông tin CLB:", err);
        setMessage("Không thể tải thông tin câu lạc bộ.");
      } finally {
        setLoading(false);
      }
    };
    fetchClub();
  }, [id, userInfo]);

  const handleJoinClick = () => {
    if (!userInfo) {
      navigate("/login");
      return;
    }
    setShowRequestForm(true);
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setLoadingRequest(true);
    setMessage("");

    try {
      await createRequest(id, requestMessage);
      setMessage("Đã gửi yêu cầu tham gia thành công! Vui lòng chờ manager xét duyệt.");
      setRequestStatus("pending");
      setShowRequestForm(false);
      setRequestMessage("");
    } catch (error) {
      setMessage(
        error.response?.data?.error || "Lỗi khi gửi yêu cầu tham gia."
      );
    } finally {
      setLoadingRequest(false);
    }
  };

  if (loading) return <p>Đang tải dữ liệu...</p>;
  if (!club) return <p>Không tìm thấy câu lạc bộ.</p>;

  return (
    <div className="club-detail-page">
      <div className="club-card">
        <div className="club-header">
          <img
            src={
              club.logo || "https://via.placeholder.com/400x200?text=No+Image"
            }
            alt={club.name}
            className="club-logo"
          />
          <div className="club-info">
            <h1>{club.name}</h1>
            <p className="club-category">{club.category}</p>
            <p className={`club-status ${club.status}`}>{club.status}</p>
          </div>
        </div>

        <div className="club-body">
          <h3>Giới thiệu</h3>
          <p className="club-description">{club.description}</p>

          <div className="club-meta">
            <p>
              <strong>Người quản lý:</strong>{" "}
              {club.managerId?.name || "Không rõ"}
            </p>
            <p>
              <strong>Email:</strong> {club.managerId?.email || "Chưa có email"}
            </p>
          </div>

          <h3>Thành viên ({club.members.length})</h3>
          <div className="member-list">
            {club.members.length > 0 ? (
              club.members.map((m, i) => (
                <div key={i} className="member-item">
                  <span>{m.userId?.name || "Ẩn danh"}</span>
                  <span className="join-date">
                    {new Date(m.joinedAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              ))
            ) : (
              <p>Chưa có thành viên nào.</p>
            )}
          </div>

          {/* Hiển thị button và form request */}
          {!userInfo ? (
            <button className="join-btn" onClick={() => navigate("/login")}>
              Đăng nhập để tham gia
            </button>
          ) : joined ? (
            <button className="joined-btn" disabled>
              ✅ Đã tham gia
            </button>
          ) : requestStatus === "pending" ? (
            <div className="request-status pending">
              <p>⏳ Yêu cầu tham gia đang chờ duyệt...</p>
            </div>
          ) : requestStatus === "accepted" ? (
            <button className="joined-btn" disabled>
              ✅ Đã được chấp nhận
            </button>
          ) : requestStatus === "rejected" ? (
            <div className="request-status rejected">
              <p>❌ Yêu cầu tham gia đã bị từ chối</p>
              <button className="join-btn" onClick={handleJoinClick}>
                Gửi lại yêu cầu
              </button>
            </div>
          ) : (
            <button className="join-btn" onClick={handleJoinClick}>
              Tham gia CLB
            </button>
          )}

          {/* Form request */}
          {showRequestForm && (
            <div className="request-form-overlay" onClick={() => setShowRequestForm(false)}>
              <div className="request-form" onClick={(e) => e.stopPropagation()}>
                <h3>Gửi yêu cầu tham gia</h3>
                <form onSubmit={handleSubmitRequest}>
                  <div className="form-group">
                    <label>Lời nhắn (tùy chọn)</label>
                    <textarea
                      value={requestMessage}
                      onChange={(e) => setRequestMessage(e.target.value)}
                      placeholder="Hãy giới thiệu về bản thân và lý do bạn muốn tham gia..."
                      rows="4"
                    />
                  </div>
                  <div className="form-actions">
                    <button
                      type="button"
                      onClick={() => {
                        setShowRequestForm(false);
                        setRequestMessage("");
                      }}
                      className="cancel-btn"
                    >
                      Hủy
                    </button>
                    <button type="submit" disabled={loadingRequest} className="submit-btn">
                      {loadingRequest ? "Đang gửi..." : "Gửi yêu cầu"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {message && (
            <div className={`message ${message.includes("thành công") ? "success" : "error"}`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClubDetail;
