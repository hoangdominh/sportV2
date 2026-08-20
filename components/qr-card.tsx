"use client";

import Image from "next/image";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/settlement";

export function QrCard({ amount, description, toUserId }: { amount: number; description: string; toUserId?: string }) {
  const [qr, setQr] = useState<string>();

  useEffect(() => {
    const params = new URLSearchParams({ amount: String(amount), description });
    if (toUserId) params.set("toUserId", toUserId);
    fetch(`/api/qr?${params.toString()}`)
      .then((response) => response.json())
      .then((data: { qrDataUrl: string }) => setQr(data.qrDataUrl))
      .catch(() => setQr(undefined));
  }, [amount, description, toUserId]);

  return (
    <div className="qr-card">
      {qr ? (
        <Image alt={`QR chuyển khoản ${formatCurrency(amount)}`} height={92} src={qr} unoptimized width={92} />
      ) : (
        <div className="qr-skeleton" />
      )}
      <span>{formatCurrency(amount)}</span>
    </div>
  );
}
