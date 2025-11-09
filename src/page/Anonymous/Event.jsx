import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { getAllEvents } from "../../services/event";
import Carousel from 'react-bootstrap/Carousel';
import Card from "../../components/Card";
import './Event.scss';

const EventList = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data } = await getAllEvents();
        const sortedEvents = data.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        setEvents(sortedEvents);
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) {
    return <div style={{ padding: '24px' }}>Đang tải danh sách sự kiện...</div>;
  }

  // Lọc sự kiện dựa trên nội dung tìm kiếm
  const filteredEvents = events.filter((event) =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="event-page">
      {/* Carousel hiển thị các sự kiện nổi bật */}
      {/* Ẩn carousel khi người dùng đang tìm kiếm để tập trung vào kết quả */}
      {events.length > 0 && !searchTerm && (
        <div className="featured-carousel">
          <Carousel>
            {events.slice(0, 3).map((event) => (
              <Carousel.Item key={event._id} onClick={() => navigate(`/event/${event._id}`)}>
                <img
                  className="d-block w-100"
                  src={event.image || `https://via.placeholder.com/800x400?text=${encodeURIComponent(event.title)}`}
                  alt={event.title}
                />
                <Carousel.Caption>
                  <h3>{event.title}</h3>
                  <p>{event.location || "Sự kiện sắp diễn ra"}</p>
                </Carousel.Caption>
              </Carousel.Item>
            ))}
          </Carousel>
        </div>
      )}

      <h2 className="event-page-title">Danh sách sự kiện</h2>

      {/* Thanh tìm kiếm */}
      <div className="search-bar-container">
        <input
          type="text"
          placeholder="Tìm kiếm sự kiện theo tên..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="club-grid">
        {filteredEvents.map((event) => (
          <Card
            key={event._id}
            title={event.title}
            image={event.image || `https://via.placeholder.com/400x200?text=${encodeURIComponent(event.title)}`}
            subtitle={event.location || "Chưa có địa điểm"}
            description={event.description}
            onClick={() => navigate(`/event/${event._id}`)}
          >
            <p>
              <strong>🗓️ Thời gian:</strong>{" "}
              {event.date
                ? new Date(event.date).toLocaleString("vi-VN")
                : "Chưa có"}
            </p>
            <p><strong>👥 Tham gia:</strong> {event.participants?.length || 0}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default EventList;
