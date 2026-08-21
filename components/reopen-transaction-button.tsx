"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

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
    <div className="flex flex-col items-start gap-1">
      <Button
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={reopenTransaction}
        className="border-border bg-white/5 hover:bg-orange-500/10 hover:text-orange-400 hover:border-orange-500/30"
      >
        {loading ? "Đang mở lại..." : "Mở lại chưa chuyển"}
      </Button>
      {error ? <span className="text-xs font-bold text-destructive" aria-live="polite">{error}</span> : null}
    </div>
  );
}
