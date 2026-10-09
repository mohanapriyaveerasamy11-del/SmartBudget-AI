# SmartBudget AI – Financial Planning Agent
### Prompt Engineering Laboratory Experiment

A beginner-friendly, educational web application designed to demonstrate **Ground-Truth Anchoring**, **Role-Based System Prompting**, and **Deterministic Financial Validation** using HTML5, CSS3, JavaScript, and the **Google Gemini API**.

---

## 1. Project Overview

**SmartBudget AI** is an intelligent personal financial planning assistant created for students and researchers in prompt engineering. It accepts hypothetical monthly income, itemized expenses, and a savings goal, categorizes expenses using transparent rules, computes exact financial metrics, and generates an understandable budget plan.

### Core Architecture Highlights
* **Zero Database & Zero Auth:** Beginner-friendly; runs completely locally with no database setup or user registration.
* **Deterministic Mathematical Source of Truth:** JavaScript performs all arithmetic operations (totals, balances, savings rates) with 100% precision. The AI agent is constrained to use these figures as immutable facts, completely eliminating arithmetic hallucinations.
* **Dual Operating Modes:**
  1. **Google Gemini AI Agent Mode:** When configured with a `GEMINI_API_KEY` on the local backend, calls Gemini Flash (`gemini-2.5-flash`) using a structured system instruction.
  2. **Rule-Based Demonstration Engine Mode:** When no API key is provided or offline, seamlessly runs a deterministic rule-based budgeting engine clearly labelled as `[Rule-Based Demonstration Engine]`.
* **Prompt Engineering Lab Inspector:** Built-in modal allowing students to inspect the exact **System Prompt**, dynamically assembled **User Prompt Payload**, and prompt engineering techniques used in real time.
* **Print & Export Support:** Instant PDF/Printer-ready view and downloadable JSON summary reports.

---

## 2. Technologies Used

* **Frontend:**
  * `index.html` – Accessible, semantic HTML5 structure with light theme layout.
  * `style.css` – Modern responsive CSS3 with soft white backgrounds, light green/emerald accents, rounded cards, and print styling (`@media print`).
  * `script.js` – Client-side financial calculations, input validation, categorization toggles, state management, and Prompt Inspector.
* **Backend (Secure API Proxy):**
  * `server.py` – Lightweight Python 3 server using only standard libraries (`http.server`, `urllib.request`). Zero `pip` dependencies.
  * `server.js` – Alternative Node.js server using built-in `http` and `https` modules. Zero `npm` dependencies.

---

## 3. Mathematical Formulas (Ground Truth)

All calculations are evaluated deterministically in JavaScript before being presented to the user or passed to the AI:

| Metric | Formula | Description |
| :--- | :--- | :--- |
| **Total Expenses** | $\sum \text{Expense Amounts}$ | Sum of all individual expense entries |
| **Available Balance** | $\text{Monthly Income} - \text{Total Expenses}$ | Remaining disposable cash before savings |
| **Required Savings** | $\text{User's Savings Goal}$ | Target monthly reserve |
| **Balance After Savings**| $\text{Available Balance} - \text{Required Savings}$ | Net discretionary buffer / surplus |
| **Savings Rate** | $(\text{Required Savings} / \text{Monthly Income}) \times 100$ | Savings target as a % of earnings (0% if income is 0) |
| **Essential Spending %**| $(\text{Essential Expenses} / \text{Monthly Income}) \times 100$ | Baseline survival needs ratio (Needs) |
| **Non-Essential Spending %**| $(\text{Non-Essential Expenses} / \text{Monthly Income}) \times 100$ | Discretionary lifestyle spending ratio (Wants) |

### Transparent Category Classification Rules
* **Essential (Needs):** Housing and Rent, Food and Groceries, Transportation, Education, Utilities, Healthcare.
* **Non-Essential (Wants):** Entertainment, Shopping, Other Expenses.
* **User Override:** Users can toggle any item between *Essential* and *Non-Essential* at any time via the UI badge button.

---

## 4. Prompt Engineering Lab Guide

### The Ground-Truth Anchoring Strategy
Large Language Models frequently make calculation errors when performing multi-step financial planning. In this lab experiment, we apply **Deterministic Ground-Truth Anchoring**:
1. JavaScript computes the exact numbers.
2. The System Prompt sets an absolute constraint:
   > *"CRITICAL: JavaScript is the absolute source of truth for all calculations. You MUST use the exact computed values provided. NEVER recalculate or alter these totals. Do not invent financial numbers."*
3. The model focuses exclusively on **qualitative reasoning, behavioral coaching, category analysis, and actionable advice**, while relying on JavaScript for mathematical precision.

### Feasibility Decision Tree
The prompt instructs the agent to branch into three strictly defined evaluation paths:
1. **Achievable:** $\text{Balance After Savings} \ge 0$. Emphasize safety buffer and automating savings transfers.
2. **Shortfall:** $\text{Available Balance} > 0 \text{ and } \text{Balance After Savings} < 0$. Disclose the exact shortfall gap and suggest cutting non-essential items or phasing the goal. Never claim the goal is achievable.
3. **Deficit:** $\text{Available Balance} < 0$. Issue an urgent deficit alert; expenses exceed income.

---

## 5. How to Run Locally

You can run the project using either **Python 3** or **Node.js** without installing any external packages!

### Option A: Using Python 3 (Recommended)
1. Open PowerShell or Terminal in the project directory:
   ```powershell
   cd C:\Users\Student\.gemini\antigravity\scratch\smartbudget-ai
   ```
2. Start the local server:
   ```bash
   python server.py
   ```
3. Open your web browser and navigate to:
   ```
   http://localhost:8000
   ```

### Option B: Using Node.js
1. Open PowerShell or Terminal in the project directory:
   ```powershell
   cd C:\Users\Student\.gemini\antigravity\scratch\smartbudget-ai
   ```
2. Start the Node server:
   ```bash
   node server.js
   ```
3. Open your web browser and navigate to:
   ```
   http://localhost:8000
   ```

### Option C: Standalone Browser Mode (No Server)
Double-click `index.html` to open it directly in any modern browser. The application will automatically operate in the **Rule-Based Demonstration Engine Mode**.

---

## 6. Configuring Google Gemini API (Securely)

To enable live Google Gemini AI generation:
1. Obtain a free Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2. In the project folder `smartbudget-ai`, copy `.env.example` to `.env`:
   ```powershell
   Copy-Item .env.example .env
   ```
3. Open `.env` in a text editor and paste your API key:
   ```env
   GEMINI_API_KEY=AIzaSyYourActualSecretKeyHere
   GEMINI_MODEL=gemini-2.5-flash
   PORT=8000
   ```
4. Restart the server (`python server.py` or `node server.js`).
5. Refresh `http://localhost:8000`. The header badge will change to:
   `● Gemini AI Connected (gemini-2.5-flash)`

> **Security Note:** The `.env` file is listed in `.gitignore` and is read exclusively by `server.py` / `server.js`. Your secret API key is never exposed to frontend client code or browser network requests.

---

## 7. Laboratory Demonstration Test Scenarios

### Scenario 1: Standard Balanced Case (Official Sample Data)
* Click **Load Sample Data**:
  * Income: ₹30,000
  * Savings Goal: ₹7,000
  * Expenses: Rent (₹8,000), Food (₹4,000), Transport (₹2,000), Education (₹3,000), Entertainment (₹2,000), Other (₹1,000)
* **Expected Output:**
  * Total Expenses: **₹20,000**
  * Available Balance: **₹10,000**
  * Balance After Savings: **₹3,000**
  * Savings Goal Status: **Achievable** (Green Banner)
  * Savings Rate: **23.3%**

### Scenario 2: Savings Goal Shortfall
* Keep Income at ₹30,000 and Expenses at ₹20,000.
* Increase **Savings Goal** to **₹15,000**.
* Click **Generate My Budget**:
  * Available Balance: ₹10,000
  * Balance After Savings: **-₹5,000**
  * Savings Goal Status: **Savings Shortfall** (Amber Banner)
  * AI Output clearly explains that ₹10,000 is available, identifies the ₹5,000 gap, and recommends adjusting non-essential spending.

### Scenario 3: Cash Flow Deficit (Expenses > Income)
* Set Income: **₹20,000**
* Keep Expenses: **₹20,000** + add Shopping: **₹5,000** (Total Expenses: ₹25,000)
* Click **Generate My Budget**:
  * Available Balance: **-₹5,000**
  * Savings Goal Status: **Deficit Warning** (Red Banner)
  * AI Output triggers an urgent emergency freeze recommendation.

### Scenario 4: Boundary & Zero Input Validation
* Set Income: `0` or negative `-5000` -> App displays validation alert and prevents calculation.
* Leave Savings Goal empty -> App rejects submission and highlights field.

---

## 8. Verifying the Automated Test Suite

An automated test suite is provided to verify arithmetic correctness and boundary rules:
```powershell
node test_calculations.js
```
Expected output:
```
==================================================
 ALL TESTS PASSED SUCCESSFULLY! (5/5)
==================================================
```

---

## 9. Educational Disclaimer

> **Disclaimer:** This application is developed strictly for educational and prompt engineering laboratory purposes using hypothetical financial figures. It does not provide certified legal, investment, tax, or financial advisory services.
