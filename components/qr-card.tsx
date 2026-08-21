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
    <div className="flex items-center gap-3 text-sm font-black text-muted-foreground">
      {qr ? (
        <Image
          alt={`QR chuyển khoản ${formatCurrency(amount)}`}
          className="h-[92px] w-[92px] rounded-xl bg-white object-cover"
          height={92}
          src={qr}
          unoptimized
          width={92}
        />
      ) : (
        <div className="h-[92px] w-[92px] animate-pulse rounded-xl bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800" />
      )}
      <span>{formatCurrency(amount)}</span>
    </div>
  );
}
