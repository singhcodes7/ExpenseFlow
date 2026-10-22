
import React, { useState } from "react";
import styles from "./Expenseform.module.css";
import { apiRequest } from "../../api";
import Toast from "../TOAST/Toast";

function Expenseform({ categories, setExpenses }) {
    const [name, setName] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("");
    const [loading, setLoading] = useState(false);

    const [toast, setToast] = useState({
        message: "",
        type: "success",
    });

    const showToast = (message, type = "success") => {
        setToast({ message, type });
    };

    const clearToast = () => {
        setToast({ message: "", type: "success" });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (loading) return;

        if (!name.trim() || !amount || !category) {
            showToast("Please complete all required fields.", "error");
            return;
        }

        if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
            showToast("Enter a valid amount greater than zero.", "error");
            return;
        }

        setLoading(true);

        try {
            const data = await apiRequest("/expenses", {
                method: "POST",
                body: JSON.stringify({
                    name: name.trim(),
                    amount: Number(amount),
                    category,
                }),
            });

            setExpenses((prevExpenses) => [
                data.expense,
                ...prevExpenses,
            ]);

            setName("");
            setAmount("");
            setCategory("");

            showToast("Expense added successfully.");
        } catch (error) {
            showToast(
                error.message || "Unable to add the expense. Please try again.",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <form
            className={styles.container}
            onSubmit={handleSubmit}
            aria-busy={loading}
        >
            <Toast
                message={toast.message}
                type={toast.type}
                onClose={clearToast}
            />

            <p className={styles.eyebrow}>New entry</p>
            <h2 className={styles.title}>Add expense</h2>

            <div className={styles.field}>
                <label
                    className={styles.fieldLabel}
                    htmlFor="expense-name"
                >
                    Name
                </label>

                <input
                    id="expense-name"
                    className={styles.input}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={loading}
                />
            </div>

            <div className={styles.field}>
                <label
                    className={styles.fieldLabel}
                    htmlFor="expense-amount"
                >
                    Amount (₹)
                </label>

                <input
                    id="expense-amount"
                    className={styles.input}
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    disabled={loading}
                />
            </div>

            <div className={styles.field}>
                <label
                    className={styles.fieldLabel}
                    htmlFor="expense-category"
                >
                    Category
                </label>

                <select
                    id="expense-category"
                    className={styles.select}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    disabled={loading}
                >
                    <option value="">Select category</option>

                    {categories.map((item) => (
                        <option key={item} value={item}>
                            {item}
                        </option>
                    ))}
                </select>
            </div>

            <button
                className={styles.button}
                type="submit"
                disabled={loading}
            >
                {loading ? "Saving..." : "Add expense"}
            </button>
        </form>
    );
}

export default Expenseform;
