
import React from 'react';
import styles from './Totalexpense.module.css';
import { formatINR } from "../../utils/currency";

const CATEGORY_COLORS = {
    Food: 'var(--cat-food)',
    Travel: 'var(--cat-travel)',
    Education: 'var(--cat-education)',
};

function Totalexpense({ expenses }) {
    let total = 0;
    const byCategory = {};

    expenses.forEach((expense) => {
        const amount = Number(expense.amount);
        total += amount;
        byCategory[expense.category] =
            (byCategory[expense.category] || 0) + amount;
    });

    return (
        <div className={styles.receipt}>
            <div className={styles.perforation} aria-hidden="true"></div>

            <p className={styles.label}>Total spent</p>
            <h3 className={styles.amount}>{formatINR(total)}</h3>

            {Object.keys(byCategory).length > 0 && (
                <div className={styles.breakdown}>
                    {Object.entries(byCategory).map(([category, amount]) => (
                        <span key={category} className={styles.chip}>
                            <span
                                className={styles.dot}
                                style={{
                                    background: CATEGORY_COLORS[category]
                                        || 'var(--text-muted)'
                                }}
                            ></span>
                            {category} · {formatINR(amount)}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Totalexpense;
