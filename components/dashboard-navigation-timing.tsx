"use client";

import { useEffect } from "react";

export const navigationStartedAtKey = "so-san:dashboard-navigation-started-at";

export function DashboardNavigationTiming() {
  useEffect(() => {
    try {
      const startedAt = Number(window.sessionStorage.getItem(navigationStartedAtKey));
      window.sessionStorage.removeItem(navigationStartedAtKey);
      if (!Number.isFinite(startedAt) || startedAt <= 0) return;

      console.info("dashboard.client.timing", {
        navigationMs: Math.max(0, Date.now() - startedAt)
      });
    } catch {
      // Browser storage may be disabled; server timings remain available.
    }
  }, []);

  return null;
}
