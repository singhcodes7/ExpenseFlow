
import { useEffect } from "react";
import styles from "./Toast.module.css";

function Toast({ message, type = "success", onClose }) {
    useEffect(() => {
        if (!message) return;

        const timer = setTimeout(() => {
            onClose();
        }, 3000);

        return () => clearTimeout(timer);
    }, [message, type, onClose]);

    if (!message) return null;

    return (
        <div
            className={`${styles.toast} ${styles[type]}`}
            role={type === "error" ? "alert" : "status"}
        >
            <span>{message}</span>

            <button
                className={styles.closeButton}
                onClick={onClose}
                aria-label="Dismiss notification"
                type="button"
            >
                ×
            </button>
        </div>
    );
}

export default Toast;
