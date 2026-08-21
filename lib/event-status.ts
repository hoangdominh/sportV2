import type { EventStatus, TransactionStatus } from "./types";

export function deriveEventStatus(statuses: readonly TransactionStatus[]): EventStatus {
  if (statuses.includes("unpaid")) return "open";
  if (statuses.includes("void")) return "needs_review";
  return "settled";
}
