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
    <div ref={containerRef} className="flex w-full min-w-0 items-center gap-3 text-sm font-black text-muted-foreground sm:w-auto">
      {qr ? (
        <Image
          alt={`QR chuyển khoản ${formatCurrency(amount)}`}
          className="h-20 w-20 shrink-0 rounded-xl bg-white object-cover sm:h-[92px] sm:w-[92px]"
          height={92}
          src={qr}
          unoptimized
          width={92}
        />
      ) : (
        <div className="h-20 w-20 shrink-0 animate-pulse rounded-xl bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 sm:h-[92px] sm:w-[92px]" />
      )}
      <span className="min-w-0 truncate">{formatCurrency(amount)}</span>
    </div>
  );
}
