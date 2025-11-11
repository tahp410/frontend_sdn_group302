import React, { useCallback, useEffect, useState } from "react";
import "./messages.scss";
import { fetchMessageUsers } from "../../services/message";
import { getClubMembers, getMyMemberClubs } from "../../services/club";

const createDefaultForm = () => ({
  type: "DIRECT",
  participantIds: [],
  clubId: "",
  eventId: "",
  content: "",
});

const NewThreadModal = ({ isOpen, onClose, onCreate, currentUserId }) => {
  const [form, setForm] = useState(createDefaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [availableUsers, setAvailableUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [clubOptions, setClubOptions] = useState([]);
  const [clubsLoading, setClubsLoading] = useState(false);
  const [clubMembers, setClubMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const loadUsers = useCallback(
    async (searchTerm = "") => {
      setUsersLoading(true);
      try {
        const response = await fetchMessageUsers({
          search: searchTerm,
          limit: 50,
        });
        setAvailableUsers(response.data?.data || []);
      } catch (err) {
        setError(
          err.response?.data?.error ||
            err.response?.data?.message ||
            "Không thể tải danh sách người dùng."
        );
      } finally {
        setUsersLoading(false);
      }
    },
    []
  );

  const loadClubMembers = useCallback(async (clubId) => {
    if (!clubId) {
      setClubMembers([]);
      return;
    }

    setMembersLoading(true);
    try {
      const response = await getClubMembers(clubId);
      const members = response.data?.data?.members || [];
      setClubMembers(members);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Không thể tải danh sách thành viên CLB."
      );
      setClubMembers([]);
    } finally {
      setMembersLoading(false);
    }
  }, []);

  const loadUserClubs = useCallback(async () => {
    setClubsLoading(true);
    try {
      const response = await getMyMemberClubs();
      const clubs = response.data?.data || [];
      setClubOptions(clubs);
      return clubs;
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Không thể tải danh sách CLB của bạn."
      );
      setClubOptions([]);
      return [];
    } finally {
      setClubsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setForm(createDefaultForm());
    setError("");
    setUserSearch("");
    setClubOptions([]);
    setClubMembers([]);
    loadUsers();
  }, [isOpen, loadUsers]);

  useEffect(() => {
    if (!isOpen || form.type !== "USER_CLUB") {
      return;
    }

    if (clubOptions.length === 0) {
      let isMounted = true;
      const fetchClubs = async () => {
        const clubs = await loadUserClubs();
        if (!isMounted) {
          return;
        }
        if (!form.clubId && clubs.length > 0) {
          const defaultClubId = clubs[0]?._id || "";
          setForm((prev) => ({
            ...prev,
            clubId: defaultClubId,
            content:
              prev.content && prev.content.trim().length > 0
                ? prev.content
                : clubs[0]?.name
                ? `CLUB_${clubs[0].name}`
                : prev.content,
          }));
        }
      };

      fetchClubs();

      return () => {
        isMounted = false;
      };
    }

    if (!form.clubId && clubOptions.length > 0) {
      const defaultClub = clubOptions[0];
      setForm((prev) => ({
        ...prev,
        clubId: defaultClub?._id || "",
        content:
          prev.content && prev.content.trim().length > 0
            ? prev.content
            : defaultClub?.name
            ? `CLUB_${defaultClub.name}`
            : prev.content,
      }));
    }
  }, [isOpen, form.type, form.clubId, clubOptions, loadUserClubs]);

  useEffect(() => {
    if (!isOpen || form.type !== "USER_CLUB") {
      return;
    }

    if (form.clubId) {
      loadClubMembers(form.clubId);
    } else {
      setClubMembers([]);
    }
  }, [isOpen, form.type, form.clubId, loadClubMembers]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "type") {
      if (value === "USER_CLUB") {
        setClubOptions([]);
        setClubMembers([]);
      }
      setForm({
        type: value,
        participantIds: value === "DIRECT" ? [] : "",
        clubId: "",
        eventId: "",
        content: "",
      });
      setError("");
      return;
    }

    if (name === "clubId") {
      setForm((prev) => {
        const selected = clubOptions.find((club) => club._id === value);
        const autoLabel = selected?.name ? `CLUB_${selected.name}` : prev.content;
        const shouldAutoFill =
          !prev.content || prev.content.startsWith("CLUB_");
        return {
          ...prev,
          clubId: value,
          content: shouldAutoFill ? autoLabel : prev.content,
        };
      });
      setError("");
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUserSelect = (event) => {
    const selected = Array.from(event.target.selectedOptions).map(
      (option) => option.value
    );

    setForm((prev) => ({
      ...prev,
      participantIds: selected,
    }));
  };

  const sanitizeParticipantIds = () => {
    if (Array.isArray(form.participantIds)) {
      return form.participantIds.filter(Boolean);
    }

    if (typeof form.participantIds === "string") {
      return form.participantIds
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
    }

    return [];
  };

  const buildParticipantsPayload = () => {
    switch (form.type) {
      case "DIRECT": {
        const ids = sanitizeParticipantIds().filter(
          (id) => id !== currentUserId
        );
        const uniqueIds = [...new Set(ids)];

        if (!currentUserId) {
          throw new Error("Không xác định được người dùng hiện tại.");
        }

        if (uniqueIds.length === 0) {
          throw new Error("Vui lòng chọn ít nhất một người nhận.");
        }

        const participants = [
          { userId: currentUserId },
          ...uniqueIds.map((id) => ({ userId: id })),
        ];

        return participants;
      }

      case "USER_CLUB": {
        if (!form.clubId.trim()) {
          throw new Error("Vui lòng chọn câu lạc bộ.");
        }

        const allUserIds = [
          ...new Set(
            [
              ...(clubMembers || []).map((member) => member?._id || member?.id),
              ...(Array.isArray(form.participantIds)
                ? form.participantIds
                : []),
              currentUserId,
            ]
              .filter(Boolean)
              .map((id) => id.toString())
          ),
        ];

        const participants = allUserIds.map((userId) => ({ userId }));
        participants.push({ clubId: form.clubId.trim() });

        return participants;
      }

      case "CLUB_BROADCAST": {
        if (!form.clubId.trim()) {
          throw new Error("Vui lòng nhập clubId.");
        }
        return [{ clubId: form.clubId.trim() }];
      }

      case "EVENT": {
        if (!form.eventId.trim()) {
          throw new Error("Vui lòng nhập eventId.");
        }
        return [{ eventId: form.eventId.trim() }];
      }

      default:
        return [];
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const participants = buildParticipantsPayload();
      const selectedClub = clubOptions.find((club) => club._id === form.clubId);
      const groupLabel = selectedClub?.name
        ? `CLUB_${selectedClub.name}`
        : undefined;
      const baseContent =
        form.content && form.content.trim().length > 0
          ? form.content.trim()
          : form.type === "USER_CLUB"
          ? groupLabel
          : undefined;

      await onCreate({
        type: form.type,
        participants,
        content: baseContent,
        meta:
          form.type === "USER_CLUB"
            ? {
                clubId: form.clubId.trim(),
                clubName: selectedClub?.name || "",
              }
            : undefined,
      });

      setForm(createDefaultForm());
      onClose();
    } catch (err) {
      setError(err.message || "Không thể tạo hội thoại.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  const renderTypeFields = () => {
    switch (form.type) {
      case "DIRECT":
        return (
          <div className="messages__form-group">
            <label>Người nhận</label>
            <div className="messages__user-search">
              <input
                type="text"
                value={userSearch}
                onChange={(event) => setUserSearch(event.target.value)}
                placeholder="Nhập tên hoặc email người nhận"
              />
              <button
                type="button"
                className="messages__button messages__button--ghost"
                onClick={() => loadUsers(userSearch)}
                disabled={usersLoading}
              >
                {usersLoading ? "Đang tìm..." : "Tìm"}
              </button>
            </div>
            <select
              multiple
              name="participantIds"
              value={Array.isArray(form.participantIds) ? form.participantIds : []}
              onChange={handleUserSelect}
              size={6}
              disabled={usersLoading}
            >
              {availableUsers.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
            {availableUsers.length === 0 && !usersLoading && (
              <small>Không tìm thấy người dùng phù hợp.</small>
            )}
            {usersLoading && <small>Đang tải danh sách người dùng...</small>}
            <small>Giữ Ctrl/Cmd để chọn nhiều người nhận.</small>
          </div>
        );

      case "USER_CLUB":
        return (
          <>
            <div className="messages__form-group">
              <label>Chọn câu lạc bộ</label>
              <select
                name="clubId"
                value={form.clubId}
                onChange={handleChange}
                disabled={clubsLoading || clubOptions.length === 0}
                required
              >
                <option value="">-- Chọn câu lạc bộ --</option>
                {clubOptions.map((club) => (
                  <option key={club._id} value={club._id}>
                    {club.name}
                  </option>
                ))}
              </select>
              {clubsLoading && <small>Đang tải danh sách CLB...</small>}
              {!clubsLoading && clubOptions.length === 0 && (
                <small>Bạn chưa tham gia câu lạc bộ nào.</small>
              )}
            </div>
            <div className="messages__form-group">
              <label>Thành viên CLB</label>
              {membersLoading ? (
                <div className="messages__placeholder">
                  Đang tải danh sách thành viên...
                </div>
              ) : clubMembers.length === 0 ? (
                <div className="messages__placeholder">
                  Chưa có thành viên nào trong CLB.
                </div>
              ) : (
                <ul>
                  {clubMembers.map((member) => (
                    <li key={member._id || member.id}>👤 {member.name}</li>
                  ))}
                </ul>
              )}
              <small>
                Hội thoại sẽ tự động bao gồm tất cả thành viên của CLB.
              </small>
            </div>
          </>
        );

      case "CLUB_BROADCAST":
        return (
          <div className="messages__form-group">
            <label>Club ID</label>
            <input
              type="text"
              name="clubId"
              value={form.clubId}
              onChange={handleChange}
              required
            />
          </div>
        );

      case "EVENT":
        return (
          <div className="messages__form-group">
            <label>Event ID</label>
            <input
              type="text"
              name="eventId"
              value={form.eventId}
              onChange={handleChange}
              required
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="messages__modal-backdrop">
      <div className="messages__modal">
        <div className="messages__modal-header">
          <h3>Tạo hội thoại mới</h3>
          <button
            type="button"
            className="messages__icon-button"
            onClick={() => {
              setForm(createDefaultForm());
              setError("");
              onClose();
            }}
            disabled={submitting}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="messages__form-group">
            <label>Loại hội thoại</label>
            <select name="type" value={form.type} onChange={handleChange}>
              <option value="DIRECT">DIRECT</option>
              <option value="USER_CLUB">USER_CLUB</option>
              <option value="CLUB_BROADCAST">CLUB_BROADCAST</option>
              <option value="EVENT">EVENT</option>
            </select>
          </div>

          {renderTypeFields()}

          <div className="messages__form-group">
            <label>
              {form.type === "USER_CLUB"
                ? "Tên nhóm / tin nhắn đầu tiên"
                : "Tin nhắn đầu tiên (tuỳ chọn)"}
            </label>
            <textarea
              name="content"
              rows={3}
              value={form.content}
              onChange={handleChange}
              placeholder="Nội dung mở đầu cuộc trò chuyện"
            />
          </div>

          {error && <div className="messages__error">{error}</div>}

          <div className="messages__modal-actions">
            <button
              type="button"
              className="messages__button messages__button--ghost"
              onClick={() => {
                setForm(createDefaultForm());
                setError("");
                onClose();
              }}
              disabled={submitting}
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="messages__button messages__button--primary"
              disabled={submitting}
            >
              {submitting ? "Đang xử lý..." : "Tạo hội thoại"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewThreadModal;

