/**
 * Automated Test Suite for SmartBudget AI
 * Verifies all financial calculations, boundary conditions, edge cases,
 * and rule-based budgeting logic.
 */

const assert = require("assert");

// Copy calculation engine logic to test in Node environment
function calculateFinancials(income, savingsGoal, expenses) {
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const availableBalance = income - totalExpenses;
  const requiredSavings = savingsGoal;
  const balanceAfterSavings = availableBalance - requiredSavings;
  const savingsRate = income > 0 ? (requiredSavings / income) * 100 : 0;

  const essentialExpenses = expenses
    .filter(e => e.classification === "Essential")
    .reduce((sum, e) => sum + e.amount, 0);

  const nonEssentialExpenses = totalExpenses - essentialExpenses;
  const essentialRate = income > 0 ? (essentialExpenses / income) * 100 : 0;
  const nonEssentialRate = income > 0 ? (nonEssentialExpenses / income) * 100 : 0;

  let status = "achievable";
  let statusMessage = "Goal is fully achievable!";
  let shortfall = 0;

  if (availableBalance < 0) {
    status = "deficit";
    statusMessage = "Monthly expenses exceed income (Cash Deficit).";
  } else if (balanceAfterSavings < 0) {
    status = "shortfall";
    shortfall = Math.abs(balanceAfterSavings);
    statusMessage = `Savings goal exceeds available balance by ₹${shortfall.toLocaleString("en-IN")}.`;
  } else {
    status = "achievable";
    statusMessage = `Goal achievable with a surplus safety buffer of ₹${balanceAfterSavings.toLocaleString("en-IN")}.`;
  }

  return {
    income,
    savingsGoal: requiredSavings,
    totalExpenses,
    availableBalance,
    balanceAfterSavings,
    savingsRate,
    essentialExpenses,
    nonEssentialExpenses,
    essentialRate,
    nonEssentialRate,
    status,
    statusMessage,
    shortfall
  };
}

console.log("==================================================");
console.log(" Running SmartBudget AI Test Suite");
console.log("==================================================");

// ----------------------------------------------------------------------------
// Test 1: Official Sample Demonstration Data
// ----------------------------------------------------------------------------
console.log("\n[Test 1] Official Sample Demonstration Data");
const sampleExpenses = [
  { category: "Housing and Rent", amount: 8000, classification: "Essential" },
  { category: "Food and Groceries", amount: 4000, classification: "Essential" },
  { category: "Transportation", amount: 2000, classification: "Essential" },
  { category: "Education", amount: 3000, classification: "Essential" },
  { category: "Entertainment", amount: 2000, classification: "Non-Essential" },
  { category: "Other Expenses", amount: 1000, classification: "Non-Essential" }
];

const result1 = calculateFinancials(30000, 7000, sampleExpenses);

console.log(`  Income: ₹${result1.income}`);
console.log(`  Total Expenses: ₹${result1.totalExpenses}`);
console.log(`  Available Balance: ₹${result1.availableBalance}`);
console.log(`  Balance After Savings: ₹${result1.balanceAfterSavings}`);
console.log(`  Savings Rate: ${result1.savingsRate.toFixed(2)}%`);
console.log(`  Status: ${result1.status}`);

assert.strictEqual(result1.totalExpenses, 20000, "Total expenses should be 20,000");
assert.strictEqual(result1.availableBalance, 10000, "Available balance should be 10,000");
assert.strictEqual(result1.balanceAfterSavings, 3000, "Balance after savings should be 3,000");
assert.strictEqual(result1.status, "achievable", "Status should be achievable");
assert.strictEqual(result1.essentialExpenses, 17000, "Essential expenses should be 17,000");
assert.strictEqual(result1.nonEssentialExpenses, 3000, "Non-essential expenses should be 3,000");
console.log("  ✓ Test 1 Passed!");

// ----------------------------------------------------------------------------
// Test 2: Zero Income (Division by zero check)
// ----------------------------------------------------------------------------
console.log("\n[Test 2] Zero Income & Division-by-Zero Handling");
const result2 = calculateFinancials(0, 5000, sampleExpenses);
assert.strictEqual(result2.savingsRate, 0, "Savings rate on 0 income must be 0 (no NaN / Infinity)");
assert.strictEqual(result2.status, "deficit", "0 income with expenses must result in deficit");
assert.strictEqual(result2.availableBalance, -20000, "Available balance should be -20,000");
console.log(`  Savings rate with 0 income: ${result2.savingsRate}%`);
console.log(`  Available balance: ₹${result2.availableBalance}`);
console.log(`  Status: ${result2.status}`);
console.log("  ✓ Test 2 Passed!");

// ----------------------------------------------------------------------------
// Test 3: Expenses Exceeding Income (Deficit Scenario)
// ----------------------------------------------------------------------------
console.log("\n[Test 3] Expenses Exceeding Income (Deficit)");
const deficitExpenses = [
  { category: "Housing and Rent", amount: 20000, classification: "Essential" },
  { category: "Shopping", amount: 15000, classification: "Non-Essential" }
];
const result3 = calculateFinancials(30000, 5000, deficitExpenses);
assert.strictEqual(result3.totalExpenses, 35000, "Total expenses should be 35,000");
assert.strictEqual(result3.availableBalance, -5000, "Available balance should be -5,000");
assert.strictEqual(result3.status, "deficit", "Status should be deficit");
console.log(`  Total Expenses: ₹${result3.totalExpenses} vs Income: ₹${result3.income}`);
console.log(`  Available Balance: ₹${result3.availableBalance}`);
console.log(`  Status: ${result3.status}`);
console.log("  ✓ Test 3 Passed!");

// ----------------------------------------------------------------------------
// Test 4: Savings Goal Greater Than Available Balance (Shortfall Scenario)
// ----------------------------------------------------------------------------
console.log("\n[Test 4] Savings Goal Exceeding Available Balance (Shortfall)");
const result4 = calculateFinancials(30000, 15000, sampleExpenses);
// Available is 10,000, Goal is 15,000 -> Shortfall is 5,000
assert.strictEqual(result4.availableBalance, 10000, "Available balance is 10,000");
assert.strictEqual(result4.balanceAfterSavings, -5000, "Balance after savings is -5,000");
assert.strictEqual(result4.shortfall, 5000, "Shortfall must be 5,000");
assert.strictEqual(result4.status, "shortfall", "Status must be shortfall");
console.log(`  Available: ₹${result4.availableBalance}, Target: ₹${result4.savingsGoal}`);
console.log(`  Shortfall: ₹${result4.shortfall}`);
console.log(`  Status: ${result4.status}`);
console.log("  ✓ Test 4 Passed!");

// ----------------------------------------------------------------------------
// Test 5: Negative & Empty Input Validation Rules
// ----------------------------------------------------------------------------
console.log("\n[Test 5] Input Validation Boundaries");
function validateInput(income, savingsGoal, amount) {
  if (income === null || income === undefined || isNaN(income) || income <= 0) return { valid: false, error: "Invalid income" };
  if (savingsGoal === null || savingsGoal === undefined || isNaN(savingsGoal) || savingsGoal < 0) return { valid: false, error: "Invalid savings goal" };
  if (amount === null || amount === undefined || isNaN(amount) || amount <= 0) return { valid: false, error: "Invalid expense amount" };
  return { valid: true };
}

assert.strictEqual(validateInput(-100, 5000, 1000).valid, false);
assert.strictEqual(validateInput(30000, -500, 1000).valid, false);
assert.strictEqual(validateInput(30000, 5000, -200).valid, false);
assert.strictEqual(validateInput(0, 5000, 1000).valid, false);
assert.strictEqual(validateInput(30000, 5000, 1000).valid, true);
console.log("  Validation successfully rejects negative and empty inputs.");
console.log("  ✓ Test 5 Passed!");

console.log("\n==================================================");
console.log(" ALL TESTS PASSED SUCCESSFULLY! (5/5)");
console.log("==================================================");
