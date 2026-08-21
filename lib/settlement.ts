import type { SettlementInput, SettlementResult } from "./types";

const roundMoney = (value: number) => Math.round(value);

function assertInvariant(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`Settlement invariant failed: ${message}`);
}

export function calculateSettlement(participants: SettlementInput[]): SettlementResult {
  if (participants.length === 0) {
    throw new Error("Cần có ít nhất một người tham gia");
  }

  if (
    participants.some(
      (participant) =>
        !Number.isFinite(participant.paidAmount) ||
        participant.paidAmount < 0 ||
        !Number.isFinite(participant.adjustmentAmount ?? 0)
    )
  ) {
    throw new Error("Số tiền settlement không hợp lệ");
  }

  const roundedPaidAmounts = participants.map((participant) => roundMoney(participant.paidAmount));
  const roundedAdjustments = participants.map((participant) => roundMoney(participant.adjustmentAmount ?? 0));
  const totalAmount = roundedPaidAmounts.reduce((sum, amount) => sum + amount, 0);
  const adjustmentTotal = roundedAdjustments.reduce((sum, amount) => sum + amount, 0);
  if (adjustmentTotal !== 0) throw new Error("Tổng tiền điều chỉnh phải bằng 0");

  const perPersonAmount = Math.floor(totalAmount / participants.length);
  const shareRemainder = totalAmount % participants.length;

  const settledParticipants = participants.map((participant, index) => {
    const paidAmount = roundedPaidAmounts[index];
    const adjustmentAmount = roundedAdjustments[index];
    const shareAmount = perPersonAmount + (index < shareRemainder ? 1 : 0);
    const baseBalance = paidAmount - shareAmount;

    return {
      ...participant,
      paidAmount,
      adjustmentAmount,
      shareAmount,
      baseBalance,
      balance: baseBalance + adjustmentAmount
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
        amount
      });
    }

    debtor.remaining -= amount;
    creditor.remaining -= amount;

    if (debtor.remaining === 0) debtorIndex += 1;
    if (creditor.remaining === 0) creditorIndex += 1;
  }

  const balanceSum = settledParticipants.reduce((sum, participant) => sum + participant.balance, 0);
  const debtorTotal = settledParticipants.reduce(
    (sum, participant) => sum + Math.max(-participant.balance, 0),
    0
  );
  const creditorTotal = settledParticipants.reduce(
    (sum, participant) => sum + Math.max(participant.balance, 0),
    0
  );
  const transferTotal = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);

  assertInvariant(balanceSum === 0, "sum balances must equal zero");
  assertInvariant(debtorTotal === creditorTotal, "debtor and creditor totals must match");
  assertInvariant(transferTotal === debtorTotal, "transaction total must settle all debt");
  assertInvariant(
    debtors.every((participant) => participant.remaining === 0) &&
      creditors.every((participant) => participant.remaining === 0),
    "all participant balances must be exhausted"
  );

  return { participants: settledParticipants, totalAmount, perPersonAmount, transactions };
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(amount);
}
