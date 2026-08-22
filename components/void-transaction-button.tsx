"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface VoidTransactionButtonProps {
  id: string;
  description: string;
  onVoided?: (reason: string) => void;
}

export function VoidTransactionButton({ id, description, onVoided }: VoidTransactionButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function voidTransaction() {
    const reason = window.prompt(`Hủy giao dịch ${description}\n\nNhập lý do hủy:`)?.trim();
    if (!reason) return;

    setLoading(true);
    setError("");
    const response = await fetch(`/api/transactions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "void", reason })
    });
    const body = (await response.json().catch(() => ({}))) as { message?: string };
    setLoading(false);

    if (!response.ok) {
      setError(body.message ?? "Không hủy được giao dịch");
      return;
    }
    if (onVoided) onVoided(reason);
    else router.refresh();
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        variant="destructive"
        size="sm"
        disabled={loading}
        onClick={voidTransaction}
        className="bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 hover:text-red-300"
      >
        {loading ? "Đang hủy…" : "Hủy giao dịch"}
      </Button>
      {error ? <span className="text-xs font-bold text-destructive" aria-live="polite">{error}</span> : null}
    </div>
  );
}
