import assert from "node:assert/strict";
import { activityTypes, getActivityType, isActivityType } from "../lib/activity";
import { boundTransactionPayerPage, groupTransactionsByPayer, paginateTransactionPayers, parseTransactionFilters, transactionsHref, TRANSACTION_PAYERS_PAGE_SIZE } from "../lib/transaction-filters";

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
assert.equal(TRANSACTION_PAYERS_PAGE_SIZE, 5);
for (const page of ["0", "-1", "1.5", "abc", "Infinity", "1e3", "9007199254740992", ["1", "2"]]) {
  assert.equal(parseTransactionFilters({ page }).page, 1);
}
assert.equal(parseTransactionFilters({ page: "3" }).page, 3);
assert.equal(boundTransactionPayerPage(999, 11), 3);
assert.equal(boundTransactionPayerPage(3, 10), 2); // Last payer on page 3 moved to another status.
assert.equal(boundTransactionPayerPage(2, 5), 1);
assert.equal(boundTransactionPayerPage(5, 0), 1);
assert.equal(boundTransactionPayerPage(1, 6), 1);

// Database output is sorted by name then ID; equal names remain distinct payers.
const payers = Array.from({ length: 11 }, (_, index) => ({ id: String(index).padStart(2, "0"), name: "Same name" }));
const obligations = payers.flatMap((payer, index) => Array.from({ length: index === 0 ? 9 : index === 5 ? 7 : 1 }, (_, item) => ({
  id: `${payer.id}-${item}`, fromUserId: payer.id, fromName: payer.name
})));
const seen = new Set<string>();
for (const requestedPage of [1, 2, 3]) {
  const result = paginateTransactionPayers(payers, requestedPage);
  assert.equal(result.page, requestedPage);
  assert.equal(result.totalPayers, 11);
  assert.equal(result.payers.length, requestedPage === 3 ? 1 : 5);
  const selectedIds = new Set(result.payers.map((payer) => payer.id));
  const transactions = obligations.filter((item) => selectedIds.has(item.fromUserId));
  const groups = groupTransactionsByPayer(transactions);
  assert.deepEqual(groups.map((group) => group.fromUserId), [...selectedIds]);
  for (const group of groups) {
    assert.equal(seen.has(group.fromUserId), false, "A payer must never span pages");
    seen.add(group.fromUserId);
    assert.deepEqual(group.items, obligations.filter((item) => item.fromUserId === group.fromUserId));
  }
  if (requestedPage === 1) assert.equal(transactions.length, 13); // Not capped at five obligations.
  if (requestedPage === 2) assert.equal(transactions.length, 11);
}
assert.equal(seen.size, 11);
assert.deepEqual(paginateTransactionPayers([], 999), { page: 1, totalPayers: 0, payers: [] });
assert.equal(paginateTransactionPayers(payers.slice(0, 10), 3).page, 2);
assert.equal(paginateTransactionPayers(payers.slice(0, 5), 2).page, 1);
// A payer losing only some matching obligations does not alter payer boundaries.
const remaining = obligations.filter((item) => item.id !== "00-0");
assert.equal(groupTransactionsByPayer(remaining).length, 11);
assert.equal(groupTransactionsByPayer(remaining)[0].items.length, 8);
// Preserve server payer order and per-payer transaction order; group by ID, not name.
assert.deepEqual(groupTransactionsByPayer([
  { fromUserId: "b", fromName: "Old name", id: "newest" },
  { fromUserId: "b", fromName: "New name", id: "oldest" },
  { fromUserId: "a", fromName: "Old name", id: "other" }
]).map((group) => [group.fromUserId, group.items.map((item) => item.id)]), [["b", ["newest", "oldest"]], ["a", ["other"]]]);

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
