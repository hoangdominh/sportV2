"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface TransactionStatusButtonProps {
  id: string;
  onConfirmed?: () => void;
}

export function TransactionStatusButton({ id, onConfirmed }: TransactionStatusButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function confirmPaid() {
    setLoading(true);
    setError("");
    const response = await fetch(`/api/transactions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "paid" })
    });
    const body = (await response.json().catch(() => ({}))) as { message?: string };
    setLoading(false);
    if (response.ok) {
      if (onConfirmed) onConfirmed();
      else router.refresh();
      return;
    }
    setError(body.message ?? "Không cập nhật được trạng thái");
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={confirmPaid}
        className="border-border bg-white/5 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30"
      >
        {loading ? "Đang xác nhận..." : "Xác nhận đã chuyển"}
      </Button>
      {error ? <span className="text-xs font-bold text-destructive" aria-live="polite">{error}</span> : null}
    </div>
  );
}
