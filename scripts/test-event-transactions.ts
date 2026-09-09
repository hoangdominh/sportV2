import assert from "node:assert/strict";
import { activityTypes, getActivityType, isActivityType } from "../lib/activity";
import { boundTransactionPage, parseTransactionFilters, transactionsHref, TRANSACTIONS_PAGE_SIZE } from "../lib/transaction-filters";

for (const type of activityTypes) {
  assert.equal(isActivityType(type), true);
  assert.equal(getActivityType(type), type);
}
for (const value of [undefined, null, "", "Cầu lông", "football night", {}, 1]) {
  assert.equal(isActivityType(value), false);
  assert.equal(getActivityType(value), "other");
}

const defaults = { from: "all", to: "all", event: "all", status: "unpaid", page: 1 } as const;
assert.deepEqual(parseTransactionFilters({}), defaults);
assert.equal(TRANSACTIONS_PAGE_SIZE, 5);
for (const page of ["0", "-1", "1.5", "abc", "Infinity", "1e3", "9007199254740992", ["1", "2"]]) {
  assert.equal(parseTransactionFilters({ page }).page, 1);
}
assert.equal(parseTransactionFilters({ page: "3" }).page, 3);
assert.equal(boundTransactionPage(999, 11), 3);
assert.equal(boundTransactionPage(3, 10), 2); // Last row on page 3 moved to another status.
assert.equal(boundTransactionPage(2, 5), 1);
assert.equal(boundTransactionPage(5, 0), 1);
assert.equal(boundTransactionPage(1, 6), 1);

const id = "abcdef0123456789abcdef01";
const filters = parseTransactionFilters({ from: id.toUpperCase(), to: id, event: id, status: "void", page: "2" });
assert.deepEqual(filters, { from: id, to: id, event: id, status: "void", page: 2 });
assert.deepEqual(parseTransactionFilters({ from: "{$ne:null}", to: [id, id], event: "123", status: ["paid", "void"] }), defaults);
assert.equal(transactionsHref(defaults), "/transactions");
assert.equal(transactionsHref(filters), `/transactions?from=${id}&to=${id}&event=${id}&status=void&page=2`);
assert.equal(transactionsHref({ ...filters, status: "paid", page: 1 }), `/transactions?from=${id}&to=${id}&event=${id}&status=paid`);
for (const status of ["all", "unpaid", "paid", "void"] as const) {
  const original = { ...filters, status };
  const url = new URL(transactionsHref(original), "http://localhost");
  assert.deepEqual(parseTransactionFilters(Object.fromEntries(url.searchParams)), original);
}

console.log("Activity and transaction filter tests passed");
