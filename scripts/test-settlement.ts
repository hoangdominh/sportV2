import assert from "node:assert/strict";
import { deriveEventStatus } from "../lib/event-status";
import { calculateSettlement } from "../lib/settlement";

function assertExactSettlement(result: ReturnType<typeof calculateSettlement>) {
  const balanceSum = result.participants.reduce((sum, participant) => sum + participant.balance, 0);
  const debtorTotal = result.participants.reduce((sum, participant) => sum + Math.max(-participant.balance, 0), 0);
  const creditorTotal = result.participants.reduce((sum, participant) => sum + Math.max(participant.balance, 0), 0);
  const transferTotal = result.transactions.reduce((sum, transaction) => sum + transaction.amount, 0);

  assert.equal(balanceSum, 0);
  assert.equal(debtorTotal, creditorTotal);
  assert.equal(transferTotal, debtorTotal);
}

const hundredByThree = calculateSettlement([
  { userId: "a", name: "A", paidAmount: 100 },
  { userId: "b", name: "B", paidAmount: 0 },
  { userId: "c", name: "C", paidAmount: 0 }
]);
assert.deepEqual(hundredByThree.participants.map((participant) => participant.shareAmount), [34, 33, 33]);
assert.deepEqual(hundredByThree.participants.map((participant) => participant.balance), [66, -33, -33]);
assertExactSettlement(hundredByThree);

const adjusted = calculateSettlement([
  { userId: "a", name: "A", paidAmount: 100, adjustmentAmount: 10 },
  { userId: "b", name: "B", paidAmount: 100, adjustmentAmount: -4 },
  { userId: "c", name: "C", paidAmount: 100, adjustmentAmount: -6 }
]);
assert.deepEqual(adjusted.participants.map((participant) => participant.balance), [10, -4, -6]);
assertExactSettlement(adjusted);

const ordinary = calculateSettlement([
  { userId: "a", name: "A", paidAmount: 600_000 },
  { userId: "b", name: "B", paidAmount: 300_000 },
  { userId: "c", name: "C", paidAmount: 0 },
  { userId: "d", name: "D", paidAmount: 100_000 }
]);
assert.equal(ordinary.totalAmount, 1_000_000);
assert.equal(ordinary.perPersonAmount, 250_000);
assertExactSettlement(ordinary);

assert.throws(
  () =>
    calculateSettlement([
      { userId: "a", name: "A", paidAmount: 10, adjustmentAmount: 1 },
      { userId: "b", name: "B", paidAmount: 0 }
    ]),
  /Tổng tiền điều chỉnh phải bằng 0/
);

assert.equal(deriveEventStatus([]), "settled");
assert.equal(deriveEventStatus(["unpaid"]), "open");
assert.equal(deriveEventStatus(["paid"]), "settled");
assert.equal(deriveEventStatus(["void"]), "needs_review");
assert.equal(deriveEventStatus(["paid", "void"]), "needs_review");
assert.equal(deriveEventStatus(["paid", "void", "unpaid"]), "open");

console.log("Settlement tests passed");
