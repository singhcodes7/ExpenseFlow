import React from "react";
import styles from "./Expenselist.module.css";
import { formatINR } from "../../utils/currency";

const CATEGORY_CLASS = {
  Food: "food",
  Travel: "travel",
  Education: "education",
};

function Expenselist({
  expenses = [],
  categories = [],
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
  onCancelEdit,
}) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <p className={styles.eyebrow}>TRANSACTION HISTORY</p>

          <h2 className={styles.title}>Recent expenses</h2>

          <p className={styles.subtitle}>
            Manage and track all your transactions.
          </p>
        </div>

        <div className={styles.countBadge}>
          {expenses.length}{" "}
          {expenses.length === 1 ? "transaction" : "transactions"}
        </div>
      </div>

      {expensesLoading ? (
        <div className={styles.empty} role="status">
          <div className={styles.loadingSpinner} />

          <p>Loading expenses...</p>

          <span>Please wait while your transactions are retrieved.</span>
        </div>
      ) : expensesError ? (
        <div className={styles.empty} role="alert">
          <div className={styles.emptyIcon}>!</div>

          <p>Unable to load expenses</p>

          <span>{expensesError}</span>
        </div>
      ) : expenses.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>↗</div>

          <p>No expenses yet</p>

          <span>Add your first expense to start tracking your spending.</span>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>DESCRIPTION</th>
                <th>AMOUNT</th>
                <th>CATEGORY</th>
                <th className={styles.actionHeading}>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {expenses.map((expense) => {
                const isEditing = editingId === expense.id;

                return (
                  <tr key={expense.id}>
                    <td>
                      {isEditing ? (
                        <input
                          className={styles.editInput}
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          aria-label="Expense name"
                        />
                      ) : (
                        <div className={styles.nameCell}>
                          <div className={styles.transactionIcon}>
                            {expense.name?.charAt(0)?.toUpperCase() || "E"}
                          </div>

                          <span className={styles.expenseName}>
                            {expense.name}
                          </span>
                        </div>
                      )}
                    </td>

                    <td className={styles.amountCell}>
                      {isEditing ? (
                        <input
                          className={styles.editInput}
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={editedAmount}
                          onChange={(e) => setEditedAmount(e.target.value)}
                          aria-label="Expense amount"
                        />
                      ) : (
                        <span>{formatINR(expense.amount)}</span>
                      )}
                    </td>

                    <td>
                      {isEditing ? (
                        <select
                          className={styles.editSelect}
                          value={editedCategory}
                          onChange={(e) => setEditedCategory(e.target.value)}
                          aria-label="Expense category"
                        >
                          {categories.map((item) => {
                            const value =
                              typeof item === "string" ? item : item.name;

                            return (
                              <option key={value} value={value}>
                                {value}
                              </option>
                            );
                          })}
                        </select>
                      ) : (
                        <span
                          className={`${styles.badge} ${
                            styles[CATEGORY_CLASS[expense.category]] ||
                            styles.other
                          }`}
                        >
                          {expense.category}
                        </span>
                      )}
                    </td>

                    <td className={styles.actions}>
                      {isEditing ? (
                        <div className={styles.editActions}>
                          <button
                            type="button"
                            className={styles.saveButton}
                            onClick={() => saveExpense(expense.id)}
                          >
                            Save
                          </button>

                          <button
                            type="button"
                            className={styles.cancelButton}
                            onClick={onCancelEdit}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className={styles.actionGroup}>
                          <button
                            type="button"
                            className={styles.iconButton}
                            onClick={() => startEditing(expense)}
                            aria-label={`Edit ${expense.name}`}
                            title="Edit expense"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                            </svg>
                          </button>

                          <button
                            type="button"
                            className={styles.iconButtonDanger}
                            onClick={() => deleteexpense(expense.id)}
                            aria-label={`Delete ${expense.name}`}
                            title="Delete expense"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M3 6h18" />
                              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Expenselist;
