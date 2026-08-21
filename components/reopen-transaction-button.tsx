"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ReopenTransactionButton({ id, description }: { id: string; description: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function reopenTransaction() {
    const reason = window.prompt(`Mở lại giao dịch ${description}\n\nNhập lý do mở lại:`)?.trim();
    if (!reason) return;

    setLoading(true);
    setError("");
    const response = await fetch(`/api/transactions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "unpaid", reason })
    });
    const body = (await response.json().catch(() => ({}))) as { message?: string };
    setLoading(false);

    if (!response.ok) {
      setError(body.message ?? "Không mở lại được giao dịch");
      return;
    }
    router.refresh();
  }

  return (
    <div className="row-action-stack">
      <button className="small-button" disabled={loading} onClick={reopenTransaction} type="button">
        {loading ? "Đang mở lại..." : "Mở lại chưa chuyển"}
      </button>
      {error ? <span aria-live="polite">{error}</span> : null}
    </div>
  );
}
