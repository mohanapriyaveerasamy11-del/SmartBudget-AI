/**
 * SmartBudget AI – Financial Planning Agent
 * Frontend Logic, Deterministic Financial Calculations, and Prompt Engineering Lab
 */

// ============================================================================
// 1. Data Structures & Category Configuration
// ============================================================================

/**
 * Default category classification mapping.
 * Transparent rule:
 * - Housing, Food, Transportation, Education, Utilities, Healthcare -> Essential
 * - Entertainment, Shopping, Other Expenses -> Non-Essential
 */
const DEFAULT_CLASSIFICATIONS = {
  "Housing and Rent": "Essential",
  "Food and Groceries": "Essential",
  "Transportation": "Essential",
  "Education": "Essential",
  "Utilities": "Essential",
  "Healthcare": "Essential",
  "Entertainment": "Non-Essential",
  "Shopping": "Non-Essential",
  "Other Expenses": "Non-Essential"
};

/**
 * Official demonstration sample dataset (as specified in lab guidelines)
 */
const SAMPLE_DATA = {
  income: 30000,
  savingsGoal: 7000,
  expenses: [
    { category: "Housing and Rent", description: "Apartment Rent", amount: 8000, classification: "Essential" },
    { category: "Food and Groceries", description: "Monthly Groceries & Dining", amount: 4000, classification: "Essential" },
    { category: "Transportation", description: "Fuel & Public Transit", amount: 2000, classification: "Essential" },
    { category: "Education", description: "Online Courses & Books", amount: 3000, classification: "Essential" },
    { category: "Entertainment", description: "Streaming & Outings", amount: 2000, classification: "Non-Essential" },
    { category: "Other Expenses", description: "Miscellaneous Purchases", amount: 1000, classification: "Non-Essential" }
  ]
};

// Global Application State
const state = {
  expenses: [],
  lastCalculation: null,
  activeEngine: "checking", // "gemini" | "rule-based" | "checking"
  systemPromptTemplate: "",
  backendAvailable: false
};

// ============================================================================
// 2. DOM Elements Cache
// ============================================================================
const dom = {
  monthlyIncome: document.getElementById("monthly-income"),
  savingsGoal: document.getElementById("savings-goal"),
  expenseCategory: document.getElementById("expense-category"),
  expenseDesc: document.getElementById("expense-desc"),
  expenseAmount: document.getElementById("expense-amount"),
  expenseClassification: document.getElementById("expense-classification"),
  classificationHint: document.getElementById("classification-hint"),
  
  btnAddExpense: document.getElementById("btn-add-expense"),
  btnLoadSample: document.getElementById("btn-load-sample"),
  btnPlaceholderSample: document.getElementById("btn-placeholder-sample"),
  btnReset: document.getElementById("btn-reset"),
  btnGenerateBudget: document.getElementById("btn-generate-budget"),
  
  expensesTableBody: document.getElementById("expenses-table-body"),
  emptyExpensesRow: document.getElementById("empty-expenses-row"),
  expenseCount: document.getElementById("expense-count"),
  quickEssentialTotal: document.getElementById("quick-essential-total"),
  quickNonEssentialTotal: document.getElementById("quick-non-essential-total"),
  quickTotalExpenses: document.getElementById("quick-total-expenses"),
  
  validationAlert: document.getElementById("validation-alert"),
  validationMessage: document.getElementById("validation-message"),
  
  resultsPlaceholder: document.getElementById("results-placeholder"),
  resultsContent: document.getElementById("results-content"),
  
  // Status banner
  goalStatusBanner: document.getElementById("goal-status-banner"),
  goalStatusIcon: document.getElementById("goal-status-icon"),
  goalStatusBadge: document.getElementById("goal-status-badge"),
  goalStatusHeading: document.getElementById("goal-status-heading"),
  goalStatusDesc: document.getElementById("goal-status-desc"),
  
  // KPI values
  kpiIncome: document.getElementById("kpi-income"),
  kpiExpenses: document.getElementById("kpi-expenses"),
  kpiExpensesBreakdown: document.getElementById("kpi-expenses-breakdown"),
  kpiAvailable: document.getElementById("kpi-available"),
  kpiGoal: document.getElementById("kpi-goal"),
  kpiBalanceAfter: document.getElementById("kpi-balance-after"),
  kpiSavingsRate: document.getElementById("kpi-savings-rate"),
  
  // Analytics
  savingsProgressPercent: document.getElementById("savings-progress-percent"),
  savingsProgressFill: document.getElementById("savings-progress-fill"),
  progressGoalTxt: document.getElementById("progress-goal-txt"),
  progressAvailTxt: document.getElementById("progress-avail-txt"),
  
  splitRatioTag: document.getElementById("split-ratio-tag"),
  splitEssentialFill: document.getElementById("split-essential-fill"),
  splitNonEssentialFill: document.getElementById("split-non-essential-fill"),
  splitEssentialTxt: document.getElementById("split-essential-txt"),
  splitNonEssentialTxt: document.getElementById("split-non-essential-txt"),
  
  benchmarkBars: document.getElementById("benchmark-bars"),
  categoryDistributionList: document.getElementById("category-distribution-list"),
  calculationSteps: document.getElementById("calculation-steps"),
  
  // AI output
  aiEngineActiveBadge: document.getElementById("ai-engine-active-badge"),
  aiLoadingSkeleton: document.getElementById("ai-loading-skeleton"),
  aiOutputBody: document.getElementById("ai-output-body"),
  btnCopyPlan: document.getElementById("btn-copy-plan"),
  btnPrintReport: document.getElementById("btn-print-report"),
  btnExportJson: document.getElementById("btn-export-json"),
  
  // Header Engine status
  engineStatusPill: document.getElementById("engine-status-pill"),
  engineStatusText: document.getElementById("engine-status-text"),
  
  // Prompt Inspector Modal
  btnOpenPromptInspector: document.getElementById("btn-open-prompt-inspector"),
  promptInspectorModal: document.getElementById("prompt-inspector-modal"),
  btnCloseInspector: document.getElementById("btn-close-inspector"),
  btnDismissInspector: document.getElementById("btn-dismiss-inspector"),
  inspectorSystemPrompt: document.getElementById("inspector-system-prompt"),
  inspectorUserPrompt: document.getElementById("inspector-user-prompt"),
  btnCopyInspectorPrompt: document.getElementById("btn-copy-inspector-prompt"),
  modalTabs: document.querySelectorAll(".modal-tab")
};

// ============================================================================
// 3. System Prompt Definition (Lab Experiment Spec)
// ============================================================================
const SYSTEM_PROMPT = `You are SmartBudget AI, an educational personal financial planning assistant created for a Prompt Engineering Laboratory experiment.

Your objective is to provide a comprehensive, encouraging, and clear monthly budget evaluation and recommendations based strictly on the user's supplied financial data.

CRITICAL CONSTRAINTS & BEHAVIORAL RULES:
1. MATHEMATICAL GROUND TRUTH: JavaScript is the absolute source of truth for all financial calculations. You MUST use the exact computed values provided in the calculation summary (Monthly Income, Total Expenses, Available Balance, Savings Goal, Balance After Savings, Savings Rate, Essential Total, Non-Essential Total). NEVER recalculate or alter these totals.
2. NO HALLUCINATION OF FINANCIAL NUMBERS: Do not invent any numbers, hypothetical interest rates, returns, or expenses that were not supplied in the input.
3. OBJECTIVE FEASIBILITY EVALUATION:
   - If Balance After Savings >= 0: Affirm that the savings goal is ACHIVABLE with a surplus safety margin.
   - If Available Balance > 0 but Balance After Savings < 0: State clearly that the savings goal has a SHORTFALL. Explain the exact gap and suggest realistic spending reductions or a phased savings target. NEVER claim the goal is achievable.
   - If Available Balance < 0: Issue an urgent DEFICIT warning. The user is overspending their income. Prioritize immediate spending cuts in non-essential areas before any savings can be realized.
4. CATEGORIZATION & TRANSPARENCY:
   - Detail how expenses are classified into Essential (Needs) and Non-Essential (Wants).
   - Acknowledge any custom classifications provided by the user.
5. ACTIONABLE RECOMMENDATIONS:
   - Provide practical, realistic strategies to reduce non-essential spending.
   - Propose a monthly budget allocation comparing actual spending against the 50/30/20 guideline (50% Needs, 30% Wants, 20% Savings).
6. CLARITY & ACCESSIBILITY:
   - Write in simple, crystal-clear English.
   - Avoid complex financial jargon.
   - Structure your response strictly using clear Markdown headings and bullet points.
7. EDUCATIONAL DISCLAIMER:
   - Conclude by identifying assumptions and reminding the user that this is an educational simulation using hypothetical figures, not certified financial advice.`;

state.systemPromptTemplate = SYSTEM_PROMPT;

// ============================================================================
// 4. Initialization & Backend Discovery
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
  checkBackendStatus();
  updateQuickExpensesSummary();
});

/**
 * Checks if the local backend server is running and configured with Gemini API
 */
async function checkBackendStatus() {
  try {
    const res = await fetch("/api/status", { method: "GET" });
    if (res.ok) {
      const data = await res.json();
      state.backendAvailable = true;
      if (data.configured) {
        state.activeEngine = "gemini";
        dom.engineStatusPill.className = "status-pill status-gemini";
        dom.engineStatusText.textContent = `Gemini AI Connected (${data.model || "Flash"})`;
        dom.aiEngineActiveBadge.className = "badge lab-badge";
        dom.aiEngineActiveBadge.textContent = `Google Gemini AI (${data.model || "gemini-2.5-flash"})`;
        return;
      }
    }
  } catch (err) {
    // Backend not running or static standalone mode
  }

  // Fallback to Rule-Based Demonstration Mode
  state.activeEngine = "rule-based";
  dom.engineStatusPill.className = "status-pill status-demo";
  dom.engineStatusText.textContent = "Rule-Based Demo Mode";
  dom.aiEngineActiveBadge.className = "badge status-demo";
  dom.aiEngineActiveBadge.textContent = "Rule-Based Demonstration Engine";
}

// ============================================================================
// 5. Event Listeners Setup
// ============================================================================
function setupEventListeners() {
  // Category change auto-classifies
  dom.expenseCategory.addEventListener("change", (e) => {
    const category = e.target.value;
    const defaultType = DEFAULT_CLASSIFICATIONS[category] || "Essential";
    dom.expenseClassification.value = defaultType;
    dom.classificationHint.textContent = `Transparent rule: "${category}" defaults to ${defaultType}. You may change it.`;
  });

  // Add Expense button
  dom.btnAddExpense.addEventListener("click", handleAddExpense);

  // Allow enter key in amount to submit expense
  dom.expenseAmount.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddExpense();
    }
  });

  // Load sample data buttons
  dom.btnLoadSample.addEventListener("click", loadSampleData);
  dom.btnPlaceholderSample.addEventListener("click", loadSampleData);

  // Reset button
  dom.btnReset.addEventListener("click", handleReset);

  // Generate budget button
  dom.btnGenerateBudget.addEventListener("click", handleGenerateBudget);

  // Copy Plan button
  dom.btnCopyPlan.addEventListener("click", copyPlanToClipboard);

  // Print & Export
  dom.btnPrintReport.addEventListener("click", () => window.print());
  dom.btnExportJson.addEventListener("click", exportJsonSummary);

  // Prompt Inspector Modal triggers
  dom.btnOpenPromptInspector.addEventListener("click", openPromptInspector);
  dom.btnCloseInspector.addEventListener("click", closePromptInspector);
  dom.btnDismissInspector.addEventListener("click", closePromptInspector);
  dom.btnCopyInspectorPrompt.addEventListener("click", copySystemPrompt);

  // Modal Tabs
  dom.modalTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      dom.modalTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      const targetId = tab.dataset.tab;
      document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.add("active");
    });
  });

  // Close modal on click outside
  dom.promptInspectorModal.addEventListener("click", (e) => {
    if (e.target === dom.promptInspectorModal) {
      closePromptInspector();
    }
  });
}

// ============================================================================
// 6. Expense Management (Add, Remove, Toggle Classification)
// ============================================================================
function handleAddExpense() {
  hideValidation();
  const category = dom.expenseCategory.value.trim();
  const description = dom.expenseDesc.value.trim() || category;
  const amountStr = dom.expenseAmount.value.trim();
  const classification = dom.expenseClassification.value;

  if (!category) {
    showValidation("Please select an expense category.");
    dom.expenseCategory.focus();
    return;
  }

  if (!amountStr) {
    showValidation("Please enter an expense amount.");
    dom.expenseAmount.focus();
    return;
  }

  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
    showValidation("Expense amount must be a positive number greater than ₹0.");
    dom.expenseAmount.focus();
    return;
  }

  // Add to state
  const expenseItem = {
    id: "exp_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
    category,
    description,
    amount,
    classification
  };

  state.expenses.push(expenseItem);

  // Reset inputs
  dom.expenseDesc.value = "";
  dom.expenseAmount.value = "";
  dom.expenseCategory.focus();

  renderExpensesTable();
  updateQuickExpensesSummary();
}

function removeExpense(id) {
  state.expenses = state.expenses.filter(e => e.id !== id);
  renderExpensesTable();
  updateQuickExpensesSummary();
}

function toggleClassification(id) {
  const item = state.expenses.find(e => e.id === id);
  if (item) {
    item.classification = item.classification === "Essential" ? "Non-Essential" : "Essential";
    renderExpensesTable();
    updateQuickExpensesSummary();
  }
}

function renderExpensesTable() {
  const tbody = dom.expensesTableBody;
  tbody.innerHTML = "";

  if (state.expenses.length === 0) {
    tbody.innerHTML = `
      <tr class="empty-row" id="empty-expenses-row">
        <td colspan="5">
          <div class="empty-state">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <p>No expenses added yet. Click <strong>Load Sample Data</strong> or enter items above.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  state.expenses.forEach(item => {
    const tr = document.createElement("tr");
    const isEssential = item.classification === "Essential";
    const badgeClass = isEssential ? "is-essential" : "is-non-essential";

    tr.innerHTML = `
      <td><strong>${escapeHtml(item.category)}</strong></td>
      <td>${escapeHtml(item.description)}</td>
      <td>
        <button 
          type="button"
          class="type-badge-btn ${badgeClass}" 
          title="Click to toggle between Essential and Non-Essential"
          onclick="toggleClassification('${item.id}')"
        >
          ${isEssential ? "● Essential (Need)" : "○ Non-Essential (Want)"}
        </button>
      </td>
      <td class="text-right font-mono">₹${item.amount.toLocaleString("en-IN")}</td>
      <td class="text-center">
        <button 
          type="button" 
          class="btn-icon-danger" 
          title="Remove this expense" 
          onclick="removeExpense('${item.id}')"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function updateQuickExpensesSummary() {
  const total = state.expenses.reduce((sum, e) => sum + e.amount, 0);
  const essential = state.expenses.filter(e => e.classification === "Essential").reduce((sum, e) => sum + e.amount, 0);
  const nonEssential = total - essential;

  dom.expenseCount.textContent = state.expenses.length;
  dom.quickTotalExpenses.textContent = `₹${total.toLocaleString("en-IN")}`;
  dom.quickEssentialTotal.textContent = `₹${essential.toLocaleString("en-IN")}`;
  dom.quickNonEssentialTotal.textContent = `₹${nonEssential.toLocaleString("en-IN")}`;
}

// ============================================================================
// 7. Load Sample Data & Reset
// ============================================================================
function loadSampleData() {
  hideValidation();
  dom.monthlyIncome.value = SAMPLE_DATA.income;
  dom.savingsGoal.value = SAMPLE_DATA.savingsGoal;
  
  // Clone sample expenses with fresh IDs
  state.expenses = SAMPLE_DATA.expenses.map((e, idx) => ({
    ...e,
    id: "sample_" + idx + "_" + Date.now()
  }));

  renderExpensesTable();
  updateQuickExpensesSummary();

  // Trigger calculation automatically for immediate visual feedback
  handleGenerateBudget();
}

function handleReset() {
  hideValidation();
  dom.monthlyIncome.value = "";
  dom.savingsGoal.value = "";
  dom.expenseCategory.selectedIndex = 0;
  dom.expenseDesc.value = "";
  dom.expenseAmount.value = "";
  dom.expenseClassification.value = "Essential";
  dom.classificationHint.textContent = "Default rule: Select a category to auto-suggest classification";

  state.expenses = [];
  state.lastCalculation = null;

  renderExpensesTable();
  updateQuickExpensesSummary();

  // Reset results view to placeholder
  dom.resultsContent.style.display = "none";
  dom.resultsPlaceholder.style.display = "block";
}

// ============================================================================
// 8. Financial Calculations Engine (JavaScript Mathematical Ground Truth)
// ============================================================================
function calculateFinancials(income, savingsGoal, expenses) {
  // 1. Total Expenses = Sum of All Expense Amounts
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // 2. Available Balance = Monthly Income - Total Expenses
  const availableBalance = income - totalExpenses;

  // 3. Required Savings = User's Savings Goal
  const requiredSavings = savingsGoal;

  // 4. Balance After Savings = Available Balance - Required Savings
  const balanceAfterSavings = availableBalance - requiredSavings;

  // 5. Savings Rate = (Required Savings / Monthly Income) * 100
  // Prevent division by zero
  const savingsRate = income > 0 ? (requiredSavings / income) * 100 : 0;

  // 6. Classification Sub-totals
  const essentialExpenses = expenses
    .filter(e => e.classification === "Essential")
    .reduce((sum, e) => sum + e.amount, 0);

  const nonEssentialExpenses = totalExpenses - essentialExpenses;

  // 7. Allocation percentages relative to Income
  const essentialRate = income > 0 ? (essentialExpenses / income) * 100 : 0;
  const nonEssentialRate = income > 0 ? (nonEssentialExpenses / income) * 100 : 0;

  // 8. Category Breakdown
  const categoryBreakdown = {};
  expenses.forEach(e => {
    if (!categoryBreakdown[e.category]) {
      categoryBreakdown[e.category] = { amount: 0, classification: e.classification, items: [] };
    }
    categoryBreakdown[e.category].amount += e.amount;
    categoryBreakdown[e.category].items.push(e);
  });

  // 9. Feasibility Status Determination
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
    categoryBreakdown,
    status,
    statusMessage,
    shortfall
  };
}

// ============================================================================
// 9. Budget Generation Handler & Input Validation
// ============================================================================
async function handleGenerateBudget() {
  hideValidation();

  // Validate Monthly Income
  const incomeStr = dom.monthlyIncome.value.trim();
  if (!incomeStr) {
    showValidation("Please enter your Monthly Income.");
    dom.monthlyIncome.focus();
    return;
  }
  const income = parseFloat(incomeStr);
  if (isNaN(income) || income < 0) {
    showValidation("Monthly Income cannot be negative or invalid.");
    dom.monthlyIncome.focus();
    return;
  }
  if (income === 0) {
    showValidation("Monthly Income is ₹0. Please enter a positive income to construct a valid budget.");
    dom.monthlyIncome.focus();
    return;
  }

  // Validate Savings Goal
  const goalStr = dom.savingsGoal.value.trim();
  if (!goalStr) {
    showValidation("Please enter your Monthly Savings Goal.");
    dom.savingsGoal.focus();
    return;
  }
  const savingsGoal = parseFloat(goalStr);
  if (isNaN(savingsGoal) || savingsGoal < 0) {
    showValidation("Savings Goal cannot be negative or invalid.");
    dom.savingsGoal.focus();
    return;
  }

  // Validate at least one expense
  if (state.expenses.length === 0) {
    showValidation("Please add at least one expense or click 'Load Sample Data'.");
    dom.expenseCategory.focus();
    return;
  }

  // Perform deterministic financial calculations
  const calc = calculateFinancials(income, savingsGoal, state.expenses);
  state.lastCalculation = calc;

  // Render Dashboard
  renderDashboard(calc);

  // Generate AI Budget Recommendations (or Rule-Based Fallback)
  await generateBudgetRecommendations(calc);
}

// ============================================================================
// 10. Dashboard Rendering
// ============================================================================
function renderDashboard(calc) {
  // Hide placeholder, display results container
  dom.resultsPlaceholder.style.display = "none";
  dom.resultsContent.style.display = "block";

  // 1. Feasibility Banner
  updateStatusBanner(calc);

  // 2. 6 KPI Cards
  dom.kpiIncome.textContent = `₹${calc.income.toLocaleString("en-IN")}`;
  dom.kpiExpenses.textContent = `₹${calc.totalExpenses.toLocaleString("en-IN")}`;
  dom.kpiExpensesBreakdown.textContent = `Ess: ₹${calc.essentialExpenses.toLocaleString("en-IN")} | Non: ₹${calc.nonEssentialExpenses.toLocaleString("en-IN")}`;
  
  dom.kpiAvailable.textContent = `₹${calc.availableBalance.toLocaleString("en-IN")}`;
  dom.kpiAvailable.className = `kpi-value ${calc.availableBalance >= 0 ? "text-accent" : "text-danger"}`;

  dom.kpiGoal.textContent = `₹${calc.savingsGoal.toLocaleString("en-IN")}`;

  dom.kpiBalanceAfter.textContent = `₹${calc.balanceAfterSavings.toLocaleString("en-IN")}`;
  dom.kpiBalanceAfter.className = `kpi-value ${calc.balanceAfterSavings >= 0 ? "text-primary" : "text-danger"}`;

  dom.kpiSavingsRate.textContent = `${calc.savingsRate.toFixed(1)}%`;

  // 3. Savings Progress Bar
  const savingsPct = calc.availableBalance > 0
    ? Math.min(100, Math.round((calc.availableBalance / calc.savingsGoal) * 100))
    : 0;
  
  dom.savingsProgressPercent.textContent = `${savingsPct}% funded`;
  dom.savingsProgressFill.style.width = `${Math.min(100, savingsPct)}%`;
  dom.savingsProgressFill.className = `progress-bar-fill ${
    calc.status === "achievable" ? "fill-green" : calc.status === "shortfall" ? "fill-amber" : "fill-red"
  }`;
  dom.progressGoalTxt.textContent = `₹${calc.savingsGoal.toLocaleString("en-IN")}`;
  dom.progressAvailTxt.textContent = `₹${calc.availableBalance.toLocaleString("en-IN")}`;

  // 4. Needs vs Wants Split Bar
  const totalExp = calc.totalExpenses || 1;
  const essPctOfExp = Math.round((calc.essentialExpenses / totalExp) * 100);
  const nonEssPctOfExp = 100 - essPctOfExp;

  dom.splitRatioTag.textContent = `${essPctOfExp}% Needs / ${nonEssPctOfExp}% Wants`;
  dom.splitEssentialFill.style.width = `${essPctOfExp}%`;
  dom.splitNonEssentialFill.style.width = `${nonEssPctOfExp}%`;
  dom.splitEssentialTxt.textContent = `₹${calc.essentialExpenses.toLocaleString("en-IN")} (${essPctOfExp}%)`;
  dom.splitNonEssentialTxt.textContent = `₹${calc.nonEssentialExpenses.toLocaleString("en-IN")} (${nonEssPctOfExp}%)`;

  // 5. 50/30/20 Rule Benchmark Comparison
  renderBenchmarkBars(calc);

  // 6. Category Breakdown List
  renderCategoryBreakdown(calc);

  // 7. Calculation Steps Explanation
  renderCalculationAudit(calc);

  // Smooth scroll into results on mobile
  if (window.innerWidth < 1024) {
    dom.resultsContent.scrollIntoView({ behavior: "smooth" });
  }
}

function updateStatusBanner(calc) {
  const banner = dom.goalStatusBanner;
  banner.className = "status-banner";

  if (calc.status === "achievable") {
    banner.classList.add("status-achievable");
    dom.goalStatusIcon.textContent = "✓";
    dom.goalStatusBadge.textContent = "Goal Achievable";
    dom.goalStatusHeading.textContent = "Savings Goal is Achievable!";
    dom.goalStatusDesc.textContent = `After reserving ₹${calc.savingsGoal.toLocaleString("en-IN")} for your savings goal, you will retain an unallocated safety balance of ₹${calc.balanceAfterSavings.toLocaleString("en-IN")} per month.`;
  } else if (calc.status === "shortfall") {
    banner.classList.add("status-shortfall");
    dom.goalStatusIcon.textContent = "!";
    dom.goalStatusBadge.textContent = "Savings Shortfall";
    dom.goalStatusHeading.textContent = `Goal Shortfall of ₹${calc.shortfall.toLocaleString("en-IN")}`;
    dom.goalStatusDesc.textContent = `Your available balance of ₹${calc.availableBalance.toLocaleString("en-IN")} is insufficient to meet your ₹${calc.savingsGoal.toLocaleString("en-IN")} goal. Reduce non-essential expenses or adjust your monthly target.`;
  } else {
    banner.classList.add("status-deficit");
    dom.goalStatusIcon.textContent = "✕";
    dom.goalStatusBadge.textContent = "Deficit Warning";
    dom.goalStatusHeading.textContent = `Overspending Deficit of ₹${Math.abs(calc.availableBalance).toLocaleString("en-IN")}`;
    dom.goalStatusDesc.textContent = `Total expenses (₹${calc.totalExpenses.toLocaleString("en-IN")}) exceed your monthly earnings (₹${calc.income.toLocaleString("en-IN")}). Immediate spending cuts are required.`;
  }
}

function renderBenchmarkBars(calc) {
  const benchmarkContainer = dom.benchmarkBars;
  benchmarkContainer.innerHTML = "";

  const items = [
    {
      label: "Needs (Essential)",
      targetPct: 50,
      actualPct: calc.essentialRate,
      color: "#10b981",
      note: "Standard guideline: ≤ 50%"
    },
    {
      label: "Wants (Non-Essential)",
      targetPct: 30,
      actualPct: calc.nonEssentialRate,
      color: "#f59e0b",
      note: "Standard guideline: ≤ 30%"
    },
    {
      label: "Savings Target",
      targetPct: 20,
      actualPct: calc.savingsRate,
      color: "#0284c7",
      note: "Standard guideline: ≥ 20%"
    }
  ];

  items.forEach(item => {
    const div = document.createElement("div");
    div.className = "benchmark-item";
    const widthPct = Math.min(100, Math.max(0, item.actualPct));

    div.innerHTML = `
      <div class="benchmark-labels">
        <span>${item.label}</span>
        <span>${item.actualPct.toFixed(1)}% of income <span style="font-weight: 400; color: #64748b;">(Target: ${item.targetPct}%)</span></span>
      </div>
      <div class="benchmark-bar-track" title="Current: ${item.actualPct.toFixed(1)}% | Guideline: ${item.targetPct}%">
        <div class="benchmark-bar-fill" style="width: ${widthPct}%; background-color: ${item.color};"></div>
        <div class="benchmark-bar-target" style="left: ${item.targetPct}%;" title="50/30/20 target line"></div>
      </div>
    `;
    benchmarkContainer.appendChild(div);
  });
}

function renderCategoryBreakdown(calc) {
  const list = dom.categoryDistributionList;
  list.innerHTML = "";

  const entries = Object.entries(calc.categoryBreakdown)
    .sort((a, b) => b[1].amount - a[1].amount);

  entries.forEach(([catName, data]) => {
    const pctOfExpenses = Math.round((data.amount / calc.totalExpenses) * 100);
    const isEssential = data.classification === "Essential";
    const row = document.createElement("div");
    row.className = "cat-item-row";

    row.innerHTML = `
      <div class="cat-name-group">
        <span class="cat-pill-type ${isEssential ? "tag-essential" : "tag-non-essential"}">
          ${isEssential ? "Need" : "Want"}
        </span>
        <strong>${escapeHtml(catName)}</strong>
      </div>
      <div class="cat-bar-wrap" title="${pctOfExpenses}% of total spending">
        <div class="cat-bar-fill" style="width: ${pctOfExpenses}%;"></div>
      </div>
      <div class="cat-amount">₹${data.amount.toLocaleString("en-IN")} <span style="font-size:0.75rem; color:#64748b;">(${pctOfExpenses}%)</span></div>
    `;
    list.appendChild(row);
  });
}

function renderCalculationAudit(calc) {
  const container = dom.calculationSteps;
  container.innerHTML = `
    <div class="calc-step-card">
      <div class="calc-step-title">1. Total Expenses</div>
      <div class="calc-step-formula">Σ (All Expense Items)</div>
      <div class="calc-step-eval">= ₹${calc.totalExpenses.toLocaleString("en-IN")}</div>
    </div>

    <div class="calc-step-card">
      <div class="calc-step-title">2. Available Balance</div>
      <div class="calc-step-formula">Monthly Income − Total Expenses</div>
      <div class="calc-step-eval">₹${calc.income.toLocaleString("en-IN")} − ₹${calc.totalExpenses.toLocaleString("en-IN")} = ₹${calc.availableBalance.toLocaleString("en-IN")}</div>
    </div>

    <div class="calc-step-card">
      <div class="calc-step-title">3. Balance After Savings</div>
      <div class="calc-step-formula">Available Balance − Savings Goal</div>
      <div class="calc-step-eval">₹${calc.availableBalance.toLocaleString("en-IN")} − ₹${calc.savingsGoal.toLocaleString("en-IN")} = ₹${calc.balanceAfterSavings.toLocaleString("en-IN")}</div>
    </div>

    <div class="calc-step-card">
      <div class="calc-step-title">4. Savings Rate</div>
      <div class="calc-step-formula">(Savings Goal / Monthly Income) × 100</div>
      <div class="calc-step-eval">(₹${calc.savingsGoal.toLocaleString("en-IN")} / ₹${calc.income.toLocaleString("en-IN")}) × 100 = ${calc.savingsRate.toFixed(1)}%</div>
    </div>
  `;
}

// ============================================================================
// 11. AI Agent Orchestration & Rule-Based Fallback
// ============================================================================
/**
 * Assembles the dynamic User Prompt payload with ground truth figures
 */
function buildUserPromptPayload(calc) {
  const expenseLines = state.expenses
    .map(e => `  - ${e.category} (${e.description}): ₹${e.amount.toLocaleString("en-IN")} [${e.classification}]`)
    .join("\n");

  return `Please review the following hypothetical monthly financial data and generate an educational budget plan:

### User Financial Summary:
- Monthly Take-Home Income: ₹${calc.income.toLocaleString("en-IN")}
- Target Monthly Savings Goal: ₹${calc.savingsGoal.toLocaleString("en-IN")}

### Itemized Expenses:
${expenseLines}

### Deterministic Calculations (JavaScript Ground Truth):
- Total Expenses: ₹${calc.totalExpenses.toLocaleString("en-IN")}
  * Essential (Needs): ₹${calc.essentialExpenses.toLocaleString("en-IN")} (${calc.essentialRate.toFixed(1)}% of income)
  * Non-Essential (Wants): ₹${calc.nonEssentialExpenses.toLocaleString("en-IN")} (${calc.nonEssentialRate.toFixed(1)}% of income)
- Available Balance (Income - Expenses): ₹${calc.availableBalance.toLocaleString("en-IN")}
- Balance After Savings (Available - Savings Goal): ₹${calc.balanceAfterSavings.toLocaleString("en-IN")}
- Savings Rate: ${calc.savingsRate.toFixed(1)}%
- Goal Feasibility Status: ${calc.status.toUpperCase()} (${calc.statusMessage})

Please provide your response structured in the following sections:
1. Executive Summary & Feasibility Evaluation
2. Expense Categorization & Classification Analysis
3. Recommended Monthly Budget (Essential vs. Non-Essential)
4. Practical Spending Optimization Strategies
5. Simple English Budget Explanation
6. Key Assumptions & Educational Disclaimer`;
}

/**
 * Generates recommendations via Gemini API if available, or seamlessly via Rule-Based Engine
 */
async function generateBudgetRecommendations(calc) {
  const userPayload = buildUserPromptPayload(calc);

  // Update prompt inspector text for laboratory evaluation
  dom.inspectorSystemPrompt.textContent = SYSTEM_PROMPT;
  dom.inspectorUserPrompt.textContent = userPayload;

  // Show loading skeleton
  dom.aiLoadingSkeleton.style.display = "block";
  dom.aiOutputBody.innerHTML = "";

  // If backend is detected, attempt Gemini API generation
  if (state.activeEngine === "gemini") {
    try {
      const response = await fetch("/api/generate-budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt: SYSTEM_PROMPT,
          userPrompt: userPayload,
          calc
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.content) {
          dom.aiLoadingSkeleton.style.display = "none";
          dom.aiEngineActiveBadge.className = "badge lab-badge";
          dom.aiEngineActiveBadge.textContent = `Google Gemini AI (${data.model || "Flash"})`;
          renderMarkdown(data.content, dom.aiOutputBody);
          return;
        }
      }
    } catch (err) {
      console.warn("Backend Gemini API call failed, transitioning to rule-based demonstration engine.", err);
    }
  }

  // Fallback to Rule-Based Demonstration Engine
  dom.aiLoadingSkeleton.style.display = "none";
  dom.aiEngineActiveBadge.className = "badge status-demo";
  dom.aiEngineActiveBadge.textContent = "Rule-Based Demonstration Engine";
  
  const ruleBasedOutput = generateRuleBasedBudgetPlan(calc);
  renderMarkdown(ruleBasedOutput, dom.aiOutputBody);
}

/**
 * High-quality deterministic rule-based budgeting engine.
 * Fully transparent, beginner-friendly, and strictly adheres to the 10 prompt criteria.
 */
function generateRuleBasedBudgetPlan(calc) {
  const isAchievable = calc.status === "achievable";
  const isShortfall = calc.status === "shortfall";
  const isDeficit = calc.status === "deficit";

  let feasibilitySection = "";
  if (isAchievable) {
    feasibilitySection = `### 1. Executive Summary & Feasibility Evaluation
* **Status:** <span style="color:#059669; font-weight:700;">ACHIEVABLE</span>
* **Cash Flow Health:** Positive
* **Feasibility Analysis:** Your monthly take-home income of **₹${calc.income.toLocaleString("en-IN")}** comfortably covers your current expenses of **₹${calc.totalExpenses.toLocaleString("en-IN")}**, leaving an available balance of **₹${calc.availableBalance.toLocaleString("en-IN")}**.
* **Safety Buffer:** Reserving your savings goal of **₹${calc.savingsGoal.toLocaleString("en-IN")}** leaves an unallocated safety reserve of **₹${calc.balanceAfterSavings.toLocaleString("en-IN")}** every month. This surplus can be used for unexpected miscellaneous expenses or emergency funds.`;
  } else if (isShortfall) {
    feasibilitySection = `### 1. Executive Summary & Feasibility Evaluation
* **Status:** <span style="color:#d97706; font-weight:700;">SAVINGS SHORTFALL</span>
* **Cash Flow Health:** Constrained
* **Feasibility Analysis:** While your monthly income of **₹${calc.income.toLocaleString("en-IN")}** covers your living expenses, the remaining available balance of **₹${calc.availableBalance.toLocaleString("en-IN")}** is insufficient to meet your desired savings target of **₹${calc.savingsGoal.toLocaleString("en-IN")}**.
* **Shortfall Gap:** You are currently **₹${calc.shortfall.toLocaleString("en-IN")}** short of your goal each month. You must either trim non-essential spending or temporarily lower your savings target to ₹${calc.availableBalance.toLocaleString("en-IN")}.`;
  } else {
    feasibilitySection = `### 1. Executive Summary & Feasibility Evaluation
* **Status:** <span style="color:#e11d48; font-weight:700;">BUDGET DEFICIT</span>
* **Cash Flow Health:** Critical Negative Cash Flow
* **Feasibility Analysis:** Your monthly spending of **₹${calc.totalExpenses.toLocaleString("en-IN")}** exceeds your monthly income of **₹${calc.income.toLocaleString("en-IN")}** by **₹${Math.abs(calc.availableBalance).toLocaleString("en-IN")}**.
* **Immediate Risk:** No savings can occur while spending exceeds earnings. Immediate budget adjustments are required to restore solvency.`;
  }

  // Categorization & Breakdown
  const topNonEssential = state.expenses
    .filter(e => e.classification === "Non-Essential")
    .sort((a, b) => b.amount - a.amount);

  const nonEssentialListText = topNonEssential.length > 0
    ? topNonEssential.map(e => `  - **${e.category}** (${e.description}): ₹${e.amount.toLocaleString("en-IN")}`).join("\n")
    : "  - No non-essential expenses recorded.";

  return `${feasibilitySection}

### 2. Expense Categorization & Classification Analysis
* **Essential Expenses (Needs):** ₹${calc.essentialExpenses.toLocaleString("en-IN")} (${calc.essentialRate.toFixed(1)}% of income)
  - Categories designated as essential include core survival items: housing, nutrition, transit, utilities, education, and healthcare.
* **Non-Essential Expenses (Wants):** ₹${calc.nonEssentialExpenses.toLocaleString("en-IN")} (${calc.nonEssentialRate.toFixed(1)}% of income)
  - Discretionary items that enhance comfort but can be temporarily adjusted if cash flow tightens.
${nonEssentialListText}

### 3. Recommended Monthly Budget (Essential vs. Non-Essential)
Comparing your numbers with the classic **50/30/20 Personal Finance Guideline**:
* **Needs Target (50%):** Standard guideline suggests up to **₹${(calc.income * 0.5).toLocaleString("en-IN")}**. Your actual is **₹${calc.essentialExpenses.toLocaleString("en-IN")}** (${calc.essentialRate.toFixed(1)}%). ${calc.essentialRate <= 50 ? "✓ Well controlled." : "⚠️ Consumes over half your income."}
* **Wants Target (30%):** Standard guideline suggests up to **₹${(calc.income * 0.3).toLocaleString("en-IN")}**. Your actual is **₹${calc.nonEssentialExpenses.toLocaleString("en-IN")}** (${calc.nonEssentialRate.toFixed(1)}%). ${calc.nonEssentialRate <= 30 ? "✓ Prudent spending." : "⚠️ Discretionary expenses are elevated."}
* **Savings Target (20%):** Standard guideline suggests at least **₹${(calc.income * 0.2).toLocaleString("en-IN")}**. Your target is **₹${calc.savingsGoal.toLocaleString("en-IN")}** (${calc.savingsRate.toFixed(1)}%).

### 4. Practical Spending Optimization Strategies
1. **Audit Discretionary Wants:** Review entertainment and shopping spending. Trimming non-essential items by just 20% to 30% can immediately expand your monthly safety buffer.
2. **Review Recurring Subscriptions:** Cancel unused digital memberships, dining out extras, or impulse online purchases.
3. **Automate the Target:** If the goal is achievable, schedule an automatic bank transfer on payday for **₹${calc.savingsGoal.toLocaleString("en-IN")}** directly into a separate high-yield savings account.
${isShortfall ? `4. **Phased Goal Adjustment:** Consider starting with an interim savings goal of **₹${Math.max(1000, calc.availableBalance - 500).toLocaleString("en-IN")}** while you gradually renegotiate lifestyle expenses.` : ""}
${isDeficit ? `4. **Emergency Spending Freeze:** Immediately pause all non-essential shopping and entertainment until expenses fall below **₹${calc.income.toLocaleString("en-IN")}**.` : ""}

### 5. Plain English Budget Explanation
* You make **₹${calc.income.toLocaleString("en-IN")}** per month.
* Your current obligations consume **₹${calc.totalExpenses.toLocaleString("en-IN")}**.
* This leaves you with **₹${calc.availableBalance.toLocaleString("en-IN")}** in liquid cash each month.
* ${isAchievable ? `Subtracting your ₹${calc.savingsGoal.toLocaleString("en-IN")} savings target leaves you with a surplus cushion of ₹${calc.balanceAfterSavings.toLocaleString("en-IN")}.` : `Your planned ₹${calc.savingsGoal.toLocaleString("en-IN")} savings target exceeds your ₹${calc.availableBalance.toLocaleString("en-IN")} liquid balance by ₹${calc.shortfall.toLocaleString("en-IN")}.`}

### 6. Key Assumptions & Educational Disclaimer
* **Assumptions:** Income is assumed to be regular and post-tax; inflation, debt interest, and unexpected emergency medical expenses are not modeled in this baseline monthly view.
* **Educational Notice:** *This budget plan is produced as part of a Prompt Engineering Laboratory demonstration using deterministic rule modeling. It does not constitute certified professional financial advice.*`;
}

// ============================================================================
// 12. Markdown Renderer
// ============================================================================
function renderMarkdown(mdText, targetEl) {
  if (!mdText) {
    targetEl.innerHTML = "<p>No analysis generated.</p>";
    return;
  }

  // Simple, safe markdown to HTML parser
  const lines = mdText.split("\n");
  let html = "";
  let inList = false;

  lines.forEach(line => {
    const trimmed = line.trim();

    if (trimmed.startsWith("### ")) {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<h3>${formatInline(trimmed.substring(4))}</h3>`;
    } else if (trimmed.startsWith("## ")) {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<h2>${formatInline(trimmed.substring(3))}</h2>`;
    } else if (trimmed.startsWith("# ")) {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<h1>${formatInline(trimmed.substring(2))}</h1>`;
    } else if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
      if (!inList) { html += "<ul>"; inList = true; }
      html += `<li>${formatInline(trimmed.substring(2))}</li>`;
    } else if (trimmed.match(/^\d+\.\s/)) {
      if (inList) { html += "</ul>"; inList = false; }
      const itemContent = trimmed.replace(/^\d+\.\s/, "");
      html += `<p style="margin-left: 1rem; margin-bottom: 0.35rem;"><strong>${trimmed.match(/^\d+/)[0]}.</strong> ${formatInline(itemContent)}</p>`;
    } else if (trimmed === "") {
      if (inList) { html += "</ul>"; inList = false; }
    } else {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<p>${formatInline(trimmed)}</p>`;
    }
  });

  if (inList) html += "</ul>";
  targetEl.innerHTML = html;
}

function formatInline(str) {
  return str
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function escapeHtml(text) {
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

// ============================================================================
// 13. UI Helpers: Alerts, Copy, Export, Inspector
// ============================================================================
function showValidation(msg) {
  dom.validationMessage.textContent = msg;
  dom.validationAlert.style.display = "flex";
  dom.validationAlert.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function hideValidation() {
  dom.validationAlert.style.display = "none";
}

function copyPlanToClipboard() {
  const text = dom.aiOutputBody.innerText;
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    const originalText = dom.btnCopyPlan.innerHTML;
    dom.btnCopyPlan.innerHTML = `✓ Copied!`;
    setTimeout(() => {
      dom.btnCopyPlan.innerHTML = originalText;
    }, 2000);
  });
}

function exportJsonSummary() {
  if (!state.lastCalculation) return;

  const exportPayload = {
    app: "SmartBudget AI",
    version: "1.0-lab",
    timestamp: new Date().toISOString(),
    currency: "INR (₹)",
    financialSummary: state.lastCalculation,
    expensesList: state.expenses,
    budgetPlanText: dom.aiOutputBody.innerText
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `smartbudget-report-${Date.now()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

function openPromptInspector() {
  dom.inspectorSystemPrompt.textContent = SYSTEM_PROMPT;
  if (state.lastCalculation) {
    dom.inspectorUserPrompt.textContent = buildUserPromptPayload(state.lastCalculation);
  } else {
    dom.inspectorUserPrompt.textContent = "// Click 'Generate My Budget' or 'Load Sample Data' to view assembled payload.";
  }
  dom.promptInspectorModal.style.display = "flex";
}

function closePromptInspector() {
  dom.promptInspectorModal.style.display = "none";
}

function copySystemPrompt() {
  navigator.clipboard.writeText(SYSTEM_PROMPT).then(() => {
    const originalText = dom.btnCopyInspectorPrompt.textContent;
    dom.btnCopyInspectorPrompt.textContent = "✓ Copied System Prompt!";
    setTimeout(() => {
      dom.btnCopyInspectorPrompt.textContent = originalText;
    }, 2000);
  });
}

// Make functions available on window for inline event handlers
window.toggleClassification = toggleClassification;
window.removeExpense = removeExpense;
