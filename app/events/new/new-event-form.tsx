"use client";

import Link from "next/link";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { DatePicker } from "@/components/date-picker";
import { MemberAvatar } from "@/components/member-avatar";
import { activityLabels, activityTypes } from "@/lib/activity";

interface UserOption {
  id: string;
  name: string;
  username: string;
  role: "admin" | "member";
}

export function NewEventForm() {
  const router = useRouter();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [paidAmounts, setPaidAmounts] = useState<Record<string, string>>({});
  const [adjustmentAmounts, setAdjustmentAmounts] = useState<Record<string, string>>({});
  const [eventDate, setEventDate] = useState<Date | undefined>(new Date());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/users")
      .then((response) => response.json())
      .then((data: UserOption[]) => {
        setUsers(data);
        setSelected(Object.fromEntries(data.map((user) => [user.id, false])));
      });
  }, []);

  const selectedCount = users.filter((user) => selected[user.id]).length;
  const selectedUsers = users.filter((user) => selected[user.id]);
  const adjustmentTotal = selectedUsers.reduce((sum, user) => sum + Number(adjustmentAmounts[user.id] || 0), 0);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    if (!eventDate) {
      setLoading(false);
      setError("Chọn ngày của buổi này.");
      return;
    }
    const participants = selectedUsers.map((user) => ({
      userId: user.id,
      paidAmount: Number(paidAmounts[user.id] || 0),
      adjustmentAmount: Number(adjustmentAmounts[user.id] || 0)
    }));

    if (participants.length < 2) {
      setLoading(false);
      setError("Chọn ít nhất 2 người tham gia buổi này. Chỉ những người được tick mới bị chia tiền.");
      return;
    }

    if (adjustmentTotal !== 0) {
      setLoading(false);
      setError("Tổng tiền kèo phải bằng 0. Người thua nhập số âm, người thắng nhập số dương.");
      return;
    }

    const response = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        activityType: formData.get("activityType"),
        date: format(eventDate, "yyyy-MM-dd"),
        participants
      })
    });
    setLoading(false);

    if (!response.ok) {
      const body = (await response.json()) as { message?: string };
      setError(body.message ?? "Không tạo được buổi mới");
      return;
    }

    const body = (await response.json()) as { id: string };
    router.push(`/events/${body.id}`);
    router.refresh();
  }

  return (
    <div className="new-event-view">
      <header className="topbar">
        <div>
          <h1>Tạo buổi mới</h1>
          <p className="muted">Điền thông tin buổi và chọn những người cùng chia tiền.</p>
        </div>
        <Link className="ghost-button" href="/dashboard">
          Về dashboard
        </Link>
      </header>
      <form className="panel event-form" onSubmit={handleSubmit}>
        <section className="event-details" aria-labelledby="event-details-title">
          <h2 id="event-details-title">Thông tin buổi</h2>
          <div className="event-details-fields">
        <label>
          Tên buổi
          <input name="name" placeholder="Ví dụ: Cầu lông tối thứ Sáu" required />
        </label>
        <label>
          Loại hoạt động
          <select name="activityType" required defaultValue="">
            <option value="" disabled>Chọn loại hoạt động</option>
            {activityTypes.map((type) => <option key={type} value={type}>{activityLabels[type]}</option>)}
          </select>
        </label>
        <label>
          Ngày diễn ra
          <DatePicker date={eventDate} onChange={setEventDate} />
        </label>
          </div>
        </section>

        <div className="participants-editor">
          <div className="section-heading-inline">
            <div>
              <h2>Người tham gia</h2>
              <span>
                {selectedCount}/{users.length} người được chọn · Tổng kèo {new Intl.NumberFormat("vi-VN").format(adjustmentTotal)} đ
              </span>
            </div>
            <button
              className="small-button"
              onClick={() => setSelected(Object.fromEntries(users.map((user) => [user.id, selectedCount !== users.length])))}
              type="button"
            >
              {users.length > 0 && selectedCount === users.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
            </button>
          </div>
          <p className="event-help">Chỉ người được chọn mới chia tiền. Tiền kèo: người thua nhập âm, người thắng nhập dương; tổng phải bằng 0.</p>
          <div className="event-participant-list">
          {users.map((user) => (
            <div className="participant-input" data-selected={Boolean(selected[user.id])} key={user.id}>
              <label className="check-line">
                <input
                  checked={Boolean(selected[user.id])}
                  onChange={(event) => setSelected((current) => ({ ...current, [user.id]: event.target.checked }))}
                  type="checkbox"
                />
                <MemberAvatar userId={user.id} name={user.name} />
                <span>{user.name}</span>
              </label>
              <div className="participant-money-grid">
                <label className="amount-field">
                  Đã ứng (₫)
                  <input
                    aria-label={`Tiền đã ứng của ${user.name}`}
                    placeholder="0"
                    inputMode="numeric"
                    min="0"
                    onChange={(event) => setPaidAmounts((current) => ({ ...current, [user.id]: event.target.value }))}
                    type="number"
                    value={paidAmounts[user.id] ?? ""}
                  />
                </label>
                <label className="amount-field">
                  Tiền kèo (+/− ₫)
                  <input
                    aria-label={`Tiền kèo của ${user.name}`}
                    placeholder="0"
                    inputMode="numeric"
                    onChange={(event) => setAdjustmentAmounts((current) => ({ ...current, [user.id]: event.target.value }))}
                    type="number"
                    value={adjustmentAmounts[user.id] ?? ""}
                  />
                </label>
              </div>
            </div>
          ))}
          </div>
        </div>

        <div className="event-form-footer">
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <button className="primary-button" disabled={loading} type="submit">
          {loading ? "Đang tính chia tiền…" : "Tạo buổi và chia tiền"}
        </button>
        </div>
      </form>
    </div>
  );
}
