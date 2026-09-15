import type { TransactionStatus } from "./types";

export const TRANSACTION_PAYERS_PAGE_SIZE = 5;
export type TransactionSearchParams = Record<string, string | string[] | undefined>;
export interface TransactionFilters {
  from: string;
  to: string;
  event: string;
  status: TransactionStatus | "all";
  page: number;
}
export interface FilterOption { id: string; name: string }
export interface TransactionFilterOptions { from: FilterOption[]; to: FilterOption[]; event: FilterOption[] }
export type TransactionCounts = Record<TransactionStatus, number>;

function parseId(value: string | string[] | undefined) {
  return typeof value === "string" && /^[a-f\d]{24}$/i.test(value) ? value.toLowerCase() : "all";
}

export function parseTransactionFilters(params: TransactionSearchParams): TransactionFilters {
  const status = params.status;
  const page = typeof params.page === "string" && /^\d+$/.test(params.page) ? Number(params.page) : 1;
  return {
    from: parseId(params.from),
    to: parseId(params.to),
    event: parseId(params.event),
    status: status === "paid" || status === "void" || status === "all" ? status : "unpaid",
    page: Number.isSafeInteger(page) && page > 0 ? page : 1
  };
}

export function boundTransactionPayerPage(page: number, totalPayers: number) {
  return Math.max(1, Math.min(page, Math.ceil(totalPayers / TRANSACTION_PAYERS_PAGE_SIZE)));
}

// Input is already grouped and stably sorted by payer name + ID by the database.
// Slice payers, never transactions: every obligation for a selected payer belongs
// on the same page, regardless of how many obligations that payer has.
export function paginateTransactionPayers<T>(sortedPayers: readonly T[], requestedPage: number) {
  const totalPayers = sortedPayers.length;
  const page = boundTransactionPayerPage(requestedPage, totalPayers);
  const offset = (page - 1) * TRANSACTION_PAYERS_PAGE_SIZE;
  return { page, totalPayers, payers: sortedPayers.slice(offset, offset + TRANSACTION_PAYERS_PAGE_SIZE) };
}

export function groupTransactionsByPayer<T extends { fromUserId: string; fromName: string }>(transactions: readonly T[]) {
  const grouped = new Map<string, { fromUserId: string; fromName: string; items: T[] }>();
  for (const transaction of transactions) {
    const current = grouped.get(transaction.fromUserId);
    if (current) current.items.push(transaction);
    else grouped.set(transaction.fromUserId, { fromUserId: transaction.fromUserId, fromName: transaction.fromName, items: [transaction] });
  }
  return [...grouped.values()];
}

export function transactionsHref(filters: TransactionFilters) {
  const params = new URLSearchParams();
  for (const key of ["from", "to", "event"] as const) {
    if (filters[key] !== "all") params.set(key, filters[key]);
  }
  if (filters.status !== "unpaid") params.set("status", filters.status);
  if (filters.page > 1) params.set("page", String(filters.page));
  const query = params.toString();
  return `/transactions${query ? `?${query}` : ""}`;
}
