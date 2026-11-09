import { useState } from "react";
import styles from "./Expenseform.module.css";
import { apiRequest } from "../../api";

function Expenseform({ categories = [], setExpenses }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(categories[0] || "Food");
  const [customCategory, setCustomCategory] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceInterval, setRecurrenceInterval] = useState("monthly");
  const [paymentMode, setPaymentMode] = useState("UPI");
  const [isCapitalExpense, setIsCapitalExpense] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const parsedAmount = Number(amount);
    const selectedCategory = category === "Other" ? customCategory.trim() : category;

    if (!trimmedName) {
      setError("Please enter a description for the expense.");
      return;
    }

    if (!parsedAmount || parsedAmount <= 0) {
      setError("Please enter a valid amount greater than zero.");
      return;
    }

    if (!selectedCategory) {
      setError("Please select or enter a valid category.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const data = await apiRequest("/expenses", {
        method: "POST",
        body: JSON.stringify({
          name: trimmedName,
          amount: parsedAmount,
          category: selectedCategory,
          is_recurring: isRecurring,
          recurrence_interval: isRecurring ? recurrenceInterval : null,
          payment_mode: paymentMode,
          is_capital_expense: isCapitalExpense,
        }),
      });

      setExpenses((prev) => [data.expense, ...prev]);
      setName("");
      setAmount("");
      setCustomCategory("");
      setCategory(categories[0] || "Food");
      setIsRecurring(false);
      setRecurrenceInterval("monthly");
      setPaymentMode("UPI");
      setIsCapitalExpense(false);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.field}>
        <label className={styles.fieldLabel} htmlFor="expense-name">
          Description
        </label>
        <input
          id="expense-name"
          className={styles.input}
          type="text"
          placeholder="e.g. Grocery store, Wi-Fi bill"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          disabled={loading}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.fieldLabel} htmlFor="expense-amount">
          Amount (₹)
        </label>
        <input
          id="expense-amount"
          className={styles.input}
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={loading}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.fieldLabel} htmlFor="expense-category">
          Category
        </label>
        <select
          id="expense-category"
          className={styles.select}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          disabled={loading}
        >
          {categories.map((cat) => {
            const catName = typeof cat === "string" ? cat : cat.name;
            return (
              <option key={catName} value={catName}>
                {catName}
              </option>
            );
          })}
          <option value="Other">Other (Custom category)</option>
        </select>
      </div>

      {category === "Other" && (
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="custom-category">
            Custom category name
          </label>
          <input
            id="custom-category"
            className={styles.input}
            type="text"
            placeholder="e.g. Gadgets, Subscriptions"
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            maxLength={50}
            disabled={loading}
          />
        </div>
      )}

      <div className={styles.field}>
        <label className={styles.fieldLabel} htmlFor="payment-mode">
          Payment mode / Account
        </label>
        <select
          id="payment-mode"
          className={styles.select}
          value={paymentMode}
          onChange={(e) => setPaymentMode(e.target.value)}
          disabled={loading}
        >
          <option value="UPI">UPI / Google Pay</option>
          <option value="Credit Card">Credit Card</option>
          <option value="Debit Card">Debit Card / Bank Account</option>
          <option value="Cash">Cash</option>
        </select>
      </div>

      <div
        className={styles.field}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: "10px",
          marginTop: "4px",
        }}
      >
        <input
          id="is-capital"
          type="checkbox"
          checked={isCapitalExpense}
          onChange={(e) => setIsCapitalExpense(e.target.checked)}
          disabled={loading}
          style={{ width: "18px", height: "18px", cursor: "pointer" }}
        />
        <label
          htmlFor="is-capital"
          style={{ cursor: "pointer", fontSize: "14px", fontWeight: 500 }}
        >
          Mark as Capital Asset / Major Purchase (Excludes from monthly budget limit)
        </label>
      </div>

      <div
        className={styles.field}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: "10px",
          marginTop: "4px",
        }}
      >
        <input
          id="is-recurring"
          type="checkbox"
          checked={isRecurring}
          onChange={(e) => setIsRecurring(e.target.checked)}
          disabled={loading}
          style={{ width: "18px", height: "18px", cursor: "pointer" }}
        />
        <label
          htmlFor="is-recurring"
          style={{ cursor: "pointer", fontSize: "14px", fontWeight: 500 }}
        >
          Make this a recurring subscription / expense
        </label>
      </div>

      {isRecurring && (
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="recurrence-interval">
            Repeat frequency
          </label>
          <select
            id="recurrence-interval"
            className={styles.select}
            value={recurrenceInterval}
            onChange={(e) => setRecurrenceInterval(e.target.value)}
            disabled={loading}
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      )}

      <button type="submit" className={styles.button} disabled={loading}>
        {loading ? "Adding..." : "Add expense"}
      </button>
    </form>
  );
}

export default Expenseform;