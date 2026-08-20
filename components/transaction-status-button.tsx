"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function TransactionStatusButton({ id, status }: { id: string; status: "paid" | "unpaid" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggleStatus() {
    setLoading(true);
    const nextStatus = status === "paid" ? "unpaid" : "paid";
    const response = await fetch(`/api/transactions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus })
    });
    setLoading(false);
    if (response.ok) router.refresh();
  }

  return (
    <button className="small-button" disabled={loading} onClick={toggleStatus} type="button">
      {loading ? "Đang lưu..." : status === "paid" ? "Đánh dấu chưa chuyển" : "Đã chuyển"}
    </button>
  );
}
