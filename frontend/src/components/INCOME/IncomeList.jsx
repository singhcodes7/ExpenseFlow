import React from "react";
import styles from "../EXPENSE LIST/Expenselist.module.css";
import { formatINR } from "../../utils/currency";

function IncomeList({
  income = [],
  categories = [],
  deleteIncome,
  editingId,
  startEditing,
  saveIncome,
  editedName,
  setEditedName,
  editedAmount,
  setEditedAmount,
  editedCategory,
  setEditedCategory,
  incomeLoading,
  incomeError,
  onCancelEdit,
}) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <p className={styles.eyebrow}>INCOME HISTORY</p>
          <h2 className={styles.title}>Recent income</h2>
          <p className={styles.subtitle}>Manage and track all your earnings.</p>
        </div>

        <div className={styles.countBadge}>
          {income.length} {income.length === 1 ? "transaction" : "transactions"}
        </div>
      </div>

      {incomeLoading ? (
        <div className={styles.empty} role="status">
          <div className={styles.loadingSpinner} />
          <p>Loading income...</p>
          <span>Please wait while your income is retrieved.</span>
        </div>
      ) : incomeError ? (
        <div className={styles.empty} role="alert">
          <div className={styles.emptyIcon}>!</div>
          <p>Unable to load income</p>
          <span>{incomeError}</span>
        </div>
      ) : income.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>↗</div>
          <p>No income yet</p>
          <span>Add your first income to start tracking your earnings.</span>
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
              {income.map((item) => {
                const isEditing = editingId === item.id;

                return (
                  <tr key={item.id}>
                    <td>
                      {isEditing ? (
                        <input
                          className={styles.editInput}
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          aria-label="Income name"
                        />
                      ) : (
                        <div className={styles.nameCell}>
                          <div className={styles.transactionIcon}>
                            {item.name?.charAt(0)?.toUpperCase() || "I"}
                          </div>
                          <span className={styles.expenseName}>
                            {item.name}
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
                          aria-label="Income amount"
                        />
                      ) : (
                        <span>{formatINR(item.amount)}</span>
                      )}
                    </td>

                    <td>
                      {isEditing ? (
                        <select
                          className={styles.editSelect}
                          value={editedCategory}
                          onChange={(e) => setEditedCategory(e.target.value)}
                          aria-label="Income category"
                        >
                          {categories.map((category) => {
                            const value =
                              typeof category === "string"
                                ? category
                                : category.name;

                            return (
                              <option key={value} value={value}>
                                {value}
                              </option>
                            );
                          })}
                        </select>
                      ) : (
                        <span className={styles.badge}>{item.category}</span>
                      )}
                    </td>

                    <td className={styles.actions}>
                      {isEditing ? (
                        <div className={styles.editActions}>
                          <button
                            type="button"
                            className={styles.saveButton}
                            onClick={() => saveIncome(item.id)}
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
                            onClick={() => startEditing(item)}
                            aria-label={`Edit ${item.name}`}
                            title="Edit income"
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
                            onClick={() => deleteIncome(item.id)}
                            aria-label={`Delete ${item.name}`}
                            title="Delete income"
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

export default IncomeList;
