import React from "react";
import styles from "./Expenselist.module.css";
import { formatINR } from "../../utils/currency";
const CATEGORY_CLASS = {
  Food: "food",
  Travel: "travel",
  Education: "education",
};

function Expenselist({
  expenses,
  categories,
  deleteexpense,
  editingId,
  startEditing,
  saveExpense,
  editedName,
  setEditedName,
  editedAmount,
  setEditedAmount,
  editedCategory,
  setEditedCategory,
  expensesLoading,
  expensesError,
}) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <p className={styles.eyebrow}>History</p>
        <h2 className={styles.title}>All expenses</h2>
      </div>

      {expensesLoading ? (
  <div className={styles.empty} role="status">
    <p>Loading expenses...</p>
    <span>Please wait while your expenses are retrieved.</span>
  </div>
) : expensesError ? (
  <div className={styles.empty} role="alert">
    <p>Unable to load expenses</p>
    <span>Please try again shortly.</span>
  </div>
) : expenses.length === 0 ? (
  <div className={styles.empty}>
    <p>No expenses yet</p>
    <span>Add your first expense above to start tracking.</span>
  </div>
) : (
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Amount</th>
                <th>Category</th>
                <th aria-label="Actions"></th>
              </tr>
            </thead>

            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id}>
                  <td>
                    {editingId === expense.id ? (
                      <input
                        className={styles.editInput}
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                      />
                    ) : (
                      expense.name
                    )}
                  </td>

                  <td className={styles.amountCell}>
                    {editingId === expense.id ? (
                      <input
                        className={styles.editInput}
                        type="number"
                        step="0.01"
                        value={editedAmount}
                        onChange={(e) => setEditedAmount(e.target.value)}
                      />
                    ) : formatINR(expense.amount)}
                  </td>

                  <td>
                    {editingId === expense.id ? (
                      <select
                        className={styles.editSelect}
                        value={editedCategory}
                        onChange={(e) => setEditedCategory(e.target.value)}
                      >
                        {categories.map((item) => (
                        <option key={item.id} value={item.name}>
                          {item.name}
                        </option> 
                        ))}
                      </select>
                    ) : (
                      <span
                        className={`${styles.badge} ${
                          styles[CATEGORY_CLASS[expense.category]] || styles.other
                        }`}
                      >
                        {expense.category}
                      </span>
                    )}
                  </td>

                  <td className={styles.actions}>
                    {editingId === expense.id ? (
                      <button
                        className={styles.saveButton}
                        onClick={() => saveExpense(expense.id)}
                      >
                        Save
                      </button>
                    ) : (
                      <>
                        <button
                          className={styles.iconButton}
                          onClick={() => startEditing(expense)}
                          aria-label="Edit expense"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                          </svg>
                        </button>
                        <button
                          className={styles.iconButtonDanger}
                          onClick={() => deleteexpense(expense.id)}
                          aria-label="Delete expense"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18" />
                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" />
                          </svg>
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Expenselist;