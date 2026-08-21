"use client";

import Link from "next/link";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { DatePicker } from "@/components/date-picker";

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
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Tạo buổi chia tiền</h1>
          <span className="muted">Chỉ những người được chọn ở buổi này mới được đưa vào công thức chia đầu người.</span>
        </div>
        <Link className="ghost-button" href="/dashboard">
          Về dashboard
        </Link>
      </header>
      <form className="panel event-form" onSubmit={handleSubmit}>
        <label>
          Tên buổi
          <input name="name" required />
        </label>
        <label>
          Ngày (YYYY-MM-DD)
          <DatePicker date={eventDate} onChange={setEventDate} />
        </label>

        <div className="participants-editor">
          <div className="section-heading-inline">
            <div>
              <h2>Người tham gia, tiền ứng và tiền kèo</h2>
              <span>
                {selectedCount}/{users.length} người được chọn · Tổng kèo {new Intl.NumberFormat("vi-VN").format(adjustmentTotal)} đ
              </span>
            </div>
            <button
              className="small-button"
              onClick={() => setSelected(Object.fromEntries(users.map((user) => [user.id, true])))}
              type="button"
            >
              Chọn tất cả
            </button>
          </div>
          {users.map((user) => (
            <div className="participant-input" key={user.id}>
              <label className="check-line">
                <input
                  checked={Boolean(selected[user.id])}
                  onChange={(event) => setSelected((current) => ({ ...current, [user.id]: event.target.checked }))}
                  type="checkbox"
                />
                <span>{user.name}</span>
              </label>
              <div className="participant-money-grid">
                <label className="amount-field">
                  Đã ứng
                  <input
                    inputMode="numeric"
                    min="0"
                    onChange={(event) => setPaidAmounts((current) => ({ ...current, [user.id]: event.target.value }))}
                    type="number"
                    value={paidAmounts[user.id] ?? ""}
                  />
                </label>
                <label className="amount-field">
                  Kèo +/-
                  <input
                    aria-label={`Tiền kèo của ${user.name}`}
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

        {error ? <p className="form-error">{error}</p> : null}
        <button className="primary-button" disabled={loading} type="submit">
          {loading ? "Đang tính settlement…" : "Tạo và tính chia tiền"}
        </button>
      </form>
    </>
  );
}
