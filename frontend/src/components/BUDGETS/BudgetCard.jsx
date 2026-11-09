import { useState, useEffect } from "react";
import { apiRequest } from "../../api";
import styles from "./BudgetCard.module.css";

// Helper for formatting Indian Rupee currency
const formatINR = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

function BudgetCard({ totalSpent = 0 }) {
  const [budget, setBudget] = useState(20000);
  const [isEditing, setIsEditing] = useState(false);
  const [inputAmount, setInputAmount] = useState("");
  const currentMonth = new Date().toISOString().slice(0, 7);

  const fetchBudget = async () => {
    try {
      const data = await apiRequest(`/api/budget?month=${currentMonth}`);
      if (data && data.budget) {
        setBudget(Number(data.budget));
      }
    } catch (err) {
      console.error("Failed to load budget", err);
    }
  };

  useEffect(() => {
    fetchBudget();
  }, []);

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    const val = Number(inputAmount);
    if (!val || val <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      const data = await apiRequest("/api/budget", {
        method: "POST",
        body: JSON.stringify({ amount: val, month: currentMonth }),
      });
      if (data && data.budget) {
        setBudget(Number(data.budget.amount));
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Failed to save budget:", err);
      alert(err.message || "Failed to save budget.");
    }
  };

  const percentage = Math.min(Math.round((totalSpent / budget) * 100), 100);
  
  let statusColor = "#20C58A"; 
  let statusText = "On Track";
  if (percentage >= 90) {
    statusColor = "#EF4444"; 
    statusText = "Budget Exceeded / Critical";
  } else if (percentage >= 75) {
    statusColor = "#F59E0B"; 
    statusText = "Approaching Limit";
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Monthly Budget Target</h3>
          <p className={styles.subtitle}>Track your spending limit for this month</p>
        </div>
        {!isEditing ? (
          <button className={styles.editBtn} onClick={() => { setInputAmount(budget); setIsEditing(true); }}>
            Edit Target
          </button>
        ) : (
          <button className={styles.cancelBtn} onClick={() => setIsEditing(false)}>Cancel</button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSaveBudget} className={styles.form}>
          <input
            type="number"
            className={styles.input}
            value={inputAmount}
            onChange={(e) => setInputAmount(e.target.value)}
            placeholder="Enter monthly limit"
            min="1"
            autoFocus
          />
          <button type="submit" className={styles.saveBtn}>Save Target</button>
        </form>
      ) : (
        <>
          <div className={styles.stats}>
            <div>
              <span className={styles.label}>Spent so far</span>
              <h4 className={styles.amount}>{formatINR(totalSpent)}</h4>
            </div>
            <div style={{ textAlign: "right" }}>
              <span className={styles.label}>Monthly Limit</span>
              <h4 className={styles.amount}>{formatINR(budget)}</h4>
            </div>
          </div>

          <div className={styles.progressContainer}>
            <div 
              className={styles.progressBar} 
              style={{ width: `${percentage}%`, backgroundColor: statusColor }} 
            />
          </div>

          <div className={styles.footer}>
            <span style={{ color: statusColor, fontWeight: 600 }}>● {statusText}</span>
            <span className={styles.percentage}>{percentage}% used</span>
          </div>
        </>
      )}
    </div>
  );
}

export default BudgetCard;