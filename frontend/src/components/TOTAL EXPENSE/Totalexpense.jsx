import React from "react";
import styles from "./Totalexpense.module.css";
import { formatINR } from "../../utils/currency";

const CATEGORY_COLORS = {
    Food: "var(--cat-food)",
    Travel: "var(--cat-travel)",
    Education: "var(--cat-education)",
};

function Totalexpense({ expenses = [] }) {
    let total = 0;
    const byCategory = {};

    expenses.forEach((expense) => {
        const amount = Number(expense.amount) || 0;

        total += amount;

        byCategory[expense.category] =
            (byCategory[expense.category] || 0) + amount;
    });

    const categories = Object.entries(byCategory);

    return (
        <div className={styles.receipt}>

            <div className={styles.topRow}>
                <div>
                    <p className={styles.label}>
                        TOTAL SPENDING
                    </p>

                    <h3 className={styles.amount}>
                        {formatINR(total)}
                    </h3>

                    <p className={styles.subtitle}>
                        Across all recorded expenses
                    </p>
                </div>

                <div className={styles.iconWrapper}>
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <rect
                            x="3"
                            y="5"
                            width="18"
                            height="14"
                            rx="3"
                        />
                        <path d="M3 10h18" />
                        <path d="M7 15h3" />
                    </svg>
                </div>
            </div>

            <div className={styles.divider} />

            <div className={styles.breakdownHeader}>
                <span>Category breakdown</span>

                <span>
                    {categories.length}{" "}
                    {categories.length === 1 ? "category" : "categories"}
                </span>
            </div>

            {categories.length > 0 ? (

                <div className={styles.breakdown}>

                    {categories.map(([category, amount]) => {

                        const percentage =
                            total > 0 ? (amount / total) * 100 : 0;

                        return (
                            <div
                                key={category}
                                className={styles.categoryItem}
                            >

                                <div className={styles.categoryInfo}>

                                    <div className={styles.categoryName}>
                                        <span
                                            className={styles.dot}
                                            style={{
                                                background:
                                                    CATEGORY_COLORS[category] ||
                                                    "var(--text-muted)",
                                            }}
                                        />

                                        <span>{category}</span>
                                    </div>

                                    <div className={styles.categoryAmount}>
                                        <strong>
                                            {formatINR(amount)}
                                        </strong>

                                        <span>
                                            {percentage.toFixed(1)}%
                                        </span>
                                    </div>

                                </div>

                                <div className={styles.progressTrack}>
                                    <div
                                        className={styles.progressFill}
                                        style={{
                                            width: `${percentage}%`,
                                            background:
                                                CATEGORY_COLORS[category] ||
                                                "var(--text-muted)",
                                        }}
                                    />
                                </div>

                            </div>
                        );
                    })}

                </div>

            ) : (

                <div className={styles.empty}>
                    No expenses recorded yet.
                </div>

            )}

        </div>
    );
}

export default Totalexpense;