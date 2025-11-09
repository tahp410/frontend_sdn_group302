import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getEventById, joinEvent } from "../../services/event";
import "./EventDetail.scss";

const EventDetail = () => {
    const { id } = useParams();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userInfo, setUserInfo] = useState(null);
    const [isParticipant, setIsParticipant] = useState(false);
    const [joinMessage, setJoinMessage] = useState("");
    const [joining, setJoining] = useState(false); // ✅ ngăn spam

    useEffect(() => {
        const fetchEvent = async () => {
            const storedUserInfo = JSON.parse(localStorage.getItem("userInfo"));
            setUserInfo(storedUserInfo);

            try {
                const { data } = await getEventById(id);
                setEvent(data);

                // Xác định người dùng hiện tại đã tham gia 
                const currentUserId =
                    storedUserInfo?.user?._id || storedUserInfo?.user?.id;

                if (currentUserId && data.participants?.length > 0) {
                    const isMember = data.participants.some(
                        (p) =>
                            p.userId?._id === currentUserId ||
                            p.userId?.id === currentUserId
                    );
                    setIsParticipant(isMember);
                }
            } catch (err) {
                console.error("Lỗi khi lấy thông tin sự kiện:", err);
                setJoinMessage("Không thể tải thông tin sự kiện.");
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
    }, [id]);

    const handleJoinEvent = async () => {
        if (joining || isParticipant) return; // 
        setJoining(true);

        const userId = userInfo?.user?._id || userInfo?.user?.id;

        if (!userId) {
            setJoinMessage("⚠️ Bạn cần đăng nhập để tham gia.");
            setJoining(false);
            return;
        }

        try {
            await joinEvent(id, userId);

            const { data: updatedEvent } = await getEventById(id);
            setEvent(updatedEvent);

            setIsParticipant(true);
            setJoinMessage("✅ Tham gia sự kiện thành công!");
        } catch (error) {
            console.error("Lỗi khi tham gia sự kiện:", error);
            setJoinMessage(
                error.response?.data?.message || "❌ Lỗi khi tham gia sự kiện."
            );
        } finally {
            setJoining(false);
        }
    };

    // --- Giao diện ---
    if (loading)
        return <p className="loading-message">Đang tải dữ liệu sự kiện...</p>;

    if (!event)
        return (
            <p className="error-message">{joinMessage || "Không tìm thấy sự kiện."}</p>
        );

    return (
        <div className="event-detail-page">
            <div className="event-detail-card">
                <div className="event-detail-header">
                    <img
                        src={
                            event.image ||
                            `https://via.placeholder.com/800x400?text=${encodeURIComponent(
                                event.title
                            )}`
                        }
                        alt={event.title}
                        className="event-detail-image"
                    />
                </div>

                <div className="event-detail-body">
                    <h1>{event.title}</h1>
                    <p className="event-detail-description">
                        {event.description}
                    </p>

                    <div className="event-meta">
                        <p>
                            <strong>🗓️ Thời gian:</strong>{" "}
                            {event.date
                                ? new Date(event.date).toLocaleString("vi-VN")
                                : "Chưa có"}
                        </p>
                        <p>
                            <strong>📍 Địa điểm:</strong>{" "}
                            {event.location || "Chưa có"}
                        </p>
                        <p>
                            <strong>Tạo lúc:</strong>{" "}
                            {new Date(event.createdAt).toLocaleString("vi-VN")}
                        </p>
                    </div>

                    <h3>Danh sách tham gia ({event.participants?.length || 0})</h3>
                    <div className="participant-list">
                        {event.participants?.length > 0 ? (
                            event.participants.map((p, i) => (
                                <div key={i} className="participant-item">
                                    <span>{p.userId?.name || "Ẩn danh"}</span>
                                </div>
                            ))
                        ) : (
                            <p>Chưa có ai tham gia.</p>
                        )}
                    </div>

                    {/* --- Nút tham gia sự kiện --- */}
                    {userInfo && userInfo.user.role !== "admin" && (
                        <div className="action-section">
                            {!isParticipant ? (
                                <button
                                    className="join-btn"
                                    onClick={handleJoinEvent}
                                    disabled={joining}
                                >
                                    {joining ? "Đang tham gia..." : "Tham gia sự kiện"}
                                </button>
                            ) : (
                                <button className="joined-btn" disabled>
                                    ✅ Bạn đã tham gia
                                </button>
                            )}

                            {joinMessage && (
                                <p className="message">{joinMessage}</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EventDetail;
