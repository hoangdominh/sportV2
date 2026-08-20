"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function BulkTransactionStatusButton({
  fromUserId,
  toUserId,
  fromName,
  toName,
  status = "paid"
}: {
  fromUserId: string;
  toUserId: string;
  fromName: string;
  toName: string;
  status?: "paid" | "unpaid";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function markBulkPaid() {
    const confirmed = window.confirm(`Đánh dấu toàn bộ khoản ${fromName} chuyển cho ${toName} là đã chuyển?`);
    if (!confirmed) return;

    setLoading(true);
    setError("");
    const response = await fetch("/api/transactions/bulk", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromUserId, toUserId, status })
    });
    const body = (await response.json().catch(() => ({}))) as { message?: string };
    setLoading(false);

    if (!response.ok) {
      setError(body.message ?? "Không cập nhật được giao dịch tổng hợp");
      return;
    }

    router.refresh();
  }

  return (
    <div className="row-action-stack">
      <button className="small-button" disabled={loading} onClick={markBulkPaid} type="button">
        {loading ? "Đang lưu…" : "Đã chuyển tất cả"}
      </button>
      {error ? <span aria-live="polite">{error}</span> : null}
    </div>
  );
}
