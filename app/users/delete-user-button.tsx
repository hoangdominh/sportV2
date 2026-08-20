"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteUserButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function deleteUser() {
    const confirmed = window.confirm(`Xoá user "${name}"? User này sẽ không đăng nhập được nữa.`);
    if (!confirmed) return;

    setLoading(true);
    setError("");
    const response = await fetch(`/api/users/${id}`, { method: "DELETE" });
    const body = (await response.json()) as { message?: string };
    setLoading(false);

    if (!response.ok) {
      setError(body.message ?? "Không xoá được user");
      return;
    }

    router.refresh();
  }

  return (
    <div className="row-action-stack">
      <button className="danger-button" disabled={loading} onClick={deleteUser} type="button">
        {loading ? "Đang xoá..." : "Xoá"}
      </button>
      {error ? <span>{error}</span> : null}
    </div>
  );
}
