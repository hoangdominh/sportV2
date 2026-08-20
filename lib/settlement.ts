import type { SettlementInput, SettlementResult } from "./types";

const roundMoney = (value: number) => Math.round(value);

export function calculateSettlement(participants: SettlementInput[]): SettlementResult {
  if (participants.length === 0) {
    throw new Error("Cần có ít nhất một người tham gia");
  }

  const totalAmount = roundMoney(
    participants.reduce((sum, participant) => sum + participant.paidAmount, 0)
  );
  const perPersonAmount = roundMoney(totalAmount / participants.length);

  const settledParticipants = participants.map((participant) => {
    const paidAmount = roundMoney(participant.paidAmount);
    const adjustmentAmount = roundMoney(participant.adjustmentAmount ?? 0);
    const baseBalance = roundMoney(paidAmount - perPersonAmount);

    return {
      ...participant,
      paidAmount,
      adjustmentAmount,
      baseBalance,
      balance: roundMoney(baseBalance + adjustmentAmount)
    };
  });

  const debtors = settledParticipants
    .filter((participant) => participant.balance < 0)
    .map((participant) => ({ ...participant, remaining: Math.abs(participant.balance) }))
    .sort((a, b) => b.remaining - a.remaining);

  const creditors = settledParticipants
    .filter((participant) => participant.balance > 0)
    .map((participant) => ({ ...participant, remaining: participant.balance }))
    .sort((a, b) => b.remaining - a.remaining);

  const transactions: SettlementResult["transactions"] = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amount = Math.min(debtor.remaining, creditor.remaining);

    if (amount > 0) {
      transactions.push({
        fromUserId: debtor.userId,
        fromName: debtor.name,
        toUserId: creditor.userId,
        toName: creditor.name,
        amount: roundMoney(amount)
      });
    }

    debtor.remaining = roundMoney(debtor.remaining - amount);
    creditor.remaining = roundMoney(creditor.remaining - amount);

    if (debtor.remaining === 0) debtorIndex += 1;
    if (creditor.remaining === 0) creditorIndex += 1;
  }

  return { participants: settledParticipants, totalAmount, perPersonAmount, transactions };
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(amount);
}
