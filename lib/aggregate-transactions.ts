import type { EventDoc, TransactionDoc, TransactionStatus } from "./types";

export interface AggregatedTransactionItem {
  id: string;
  eventId: string;
  eventName: string;
  amount: number;
}

export interface AggregatedTransaction {
  key: string;
  fromUserId: string;
  fromName: string;
  toUserId: string;
  toName: string;
  totalAmount: number;
  status: TransactionStatus;
  items: AggregatedTransactionItem[];
}

export function aggregateTransactions(
  transactions: TransactionDoc[],
  events: EventDoc[],
  status: TransactionStatus = "unpaid"
) {
  const eventMap = new Map(events.map((event) => [event._id.toString(), event]));
  const groups = new Map<string, AggregatedTransaction>();

  for (const transaction of transactions) {
    if (transaction.status !== status) continue;

    const fromUserId = transaction.fromUserId.toString();
    const toUserId = transaction.toUserId.toString();
    const key = `${fromUserId}:${toUserId}:${status}`;
    const event = eventMap.get(transaction.eventId.toString());
    const current = groups.get(key);
    const item: AggregatedTransactionItem = {
      id: transaction._id.toString(),
      eventId: transaction.eventId.toString(),
      eventName: event?.name ?? "Buổi đã xoá",
      amount: transaction.amount
    };

    if (current) {
      current.totalAmount += transaction.amount;
      current.items.push(item);
      continue;
    }

    groups.set(key, {
      key,
      fromUserId,
      fromName: transaction.fromName,
      toUserId,
      toName: transaction.toName,
      totalAmount: transaction.amount,
      status,
      items: [item]
    });
  }

  return [...groups.values()].sort((a, b) => b.totalAmount - a.totalAmount);
}
