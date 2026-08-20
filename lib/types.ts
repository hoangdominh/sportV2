import type { ObjectId } from "mongodb";

export type Role = "admin" | "member";
export type TransactionStatus = "paid" | "unpaid";
export type EventStatus = "open" | "settled";

export interface UserDoc {
  _id: ObjectId;
  name: string;
  username: string;
  passwordHash: string;
  role: Role;
  bankBin?: string;
  bankName?: string;
  bankAccountNo?: string;
  bankAccountName?: string;
  createdAt: Date;
}

export interface ParticipantDoc {
  userId: ObjectId;
  name: string;
  paidAmount: number;
  adjustmentAmount: number;
  baseBalance: number;
  balance: number;
}

export interface EventDoc {
  _id: ObjectId;
  name: string;
  date: Date;
  participants: ParticipantDoc[];
  totalAmount: number;
  perPersonAmount: number;
  status: EventStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionDoc {
  _id: ObjectId;
  eventId: ObjectId;
  fromUserId: ObjectId;
  fromName: string;
  toUserId: ObjectId;
  toName: string;
  amount: number;
  status: TransactionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface SettlementInput {
  userId: string;
  name: string;
  paidAmount: number;
  adjustmentAmount?: number;
}

export interface SettlementResult {
  participants: Array<SettlementInput & { adjustmentAmount: number; baseBalance: number; balance: number }>;
  totalAmount: number;
  perPersonAmount: number;
  transactions: Array<{
    fromUserId: string;
    fromName: string;
    toUserId: string;
    toName: string;
    amount: number;
  }>;
}
