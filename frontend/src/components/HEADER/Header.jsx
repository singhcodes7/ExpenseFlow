import styles from "./Header.module.css";

function Header({ darkMode, onToggleTheme, onOpenProfile, compact = false }) {
    return (
        <header className={`${styles.header} ${compact ? styles.compact : ""}`}>
            <div className={styles.inner}>
                <button
                    type="button"
                    className={styles.brand}
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    aria-label="ExpenseFlow home"
                >
                   
                    <span className={styles.brandText}>
                        <span className={styles.brandName}>
                            Expense<span className={styles.brandAccent}>Flow</span>
                        </span>
                    </span>
                </button>

                <div className={styles.actions}>
                    <button
                        type="button"
                        className={styles.toggle}
                        onClick={onToggleTheme}
                        aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                        aria-pressed={darkMode}
                        title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                    >
                        {darkMode ? (
                            <svg width="19" height="19" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
                                strokeLinejoin="round" aria-hidden="true">
                                <circle cx="12" cy="12" r="4" />
                                <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
                            </svg>
                        ) : (
                            <svg width="19" height="19" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
                                strokeLinejoin="round" aria-hidden="true">
                                <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />
                            </svg>
                        )}
                    </button>

                    <button
                        type="button"
                        className={styles.profileButton}
                        onClick={onOpenProfile}
                    >
                        <span className={styles.profileIcon} aria-hidden="true">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
                                strokeLinejoin="round">
                                <circle cx="12" cy="8" r="4" />
                                <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
                            </svg>
                        </span>
                        <span>My profile</span>
                        <span className={styles.profileArrow} aria-hidden="true">↗</span>
                    </button>
                </div>
            </div>
        </header>
    );
}

export default Header;