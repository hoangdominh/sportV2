"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { formatCurrency } from "@/lib/settlement";

const qrCache = new Map<string, string>();
export function QrCard({ amount, description, toUserId }: { amount: number; description: string; toUserId?: string }) {
  const cacheKey = `${amount}:${description}:${toUserId ?? ""}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [qr, setQr] = useState<string | undefined>(() => qrCache.get(cacheKey));

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    if (qrCache.has(cacheKey)) {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "240px" }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [cacheKey]);

  useEffect(() => {
    const cachedQr = qrCache.get(cacheKey);
    if (cachedQr) {
      setQr(cachedQr);
      return;
    }
    if (!shouldLoad) return;

    const controller = new AbortController();
    const params = new URLSearchParams({ amount: String(amount), description });
    if (toUserId) params.set("toUserId", toUserId);
    fetch(`/api/qr?${params.toString()}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((data: { qrDataUrl: string }) => {
        qrCache.set(cacheKey, data.qrDataUrl);
        setQr(data.qrDataUrl);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setQr(undefined);
      });
    return () => controller.abort();
  }, [amount, cacheKey, description, shouldLoad, toUserId]);

  return (
    <div ref={containerRef} className="flex items-center gap-3 text-sm font-black text-muted-foreground">
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
