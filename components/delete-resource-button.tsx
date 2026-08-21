"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface DeleteResourceButtonProps {
  endpoint: string;
  label?: string;
  confirmText: string;
  redirectTo?: string;
}

export function DeleteResourceButton({ endpoint, label = "Xoá", confirmText, redirectTo }: DeleteResourceButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (!window.confirm(confirmText)) return;

    setLoading(true);
    setError("");
    const response = await fetch(endpoint, { method: "DELETE" });
    const body = (await response.json().catch(() => ({}))) as { message?: string };
    setLoading(false);

    if (!response.ok) {
      setError(body.message ?? "Không xoá được dữ liệu");
      return;
    }

    if (redirectTo) {
      router.push(redirectTo);
      router.refresh();
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        variant="destructive"
        size="sm"
        disabled={loading}
        onClick={handleDelete}
        className="bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 hover:text-red-300"
      >
        {loading ? "Đang xoá…" : label}
      </Button>
      {error ? <span className="text-xs font-bold text-destructive" aria-live="polite">{error}</span> : null}
    </div>
  );
}
