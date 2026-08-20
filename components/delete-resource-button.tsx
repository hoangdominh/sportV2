"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
    <div className="row-action-stack">
      <button className="danger-button" disabled={loading} onClick={handleDelete} type="button">
        {loading ? "Đang xoá…" : label}
      </button>
      {error ? <span aria-live="polite">{error}</span> : null}
    </div>
  );
}
