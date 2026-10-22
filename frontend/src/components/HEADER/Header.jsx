
import styles from './Header.module.css';

function Header({ darkMode, onToggleTheme, onOpenProfile }) {
    return (
        <header className={styles.header}>
            <div className={styles.inner}>
                <div className={styles.brand}>
                    <div className={styles.titleGroup}>
                        <h1 className={styles.title}>EXPENSE TRACKER</h1>
                    </div>
                </div>

                <div className={styles.actions}>
                    <button
                        type="button"
                        className={styles.profileButton}
                        onClick={onOpenProfile}
                    >
                        Profile
                    </button>

                    <button
                        type="button"
                        className={styles.toggle}
                        onClick={onToggleTheme}
                        aria-label="Toggle dark mode"
                        aria-pressed={darkMode}
                    >
                        <span className={styles.track}>
                            <span className={darkMode ? styles.thumbDark : styles.thumb}>
                                {darkMode ? (
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                                    </svg>
                                ) : (
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                        <circle cx="12" cy="12" r="4" />
                                        <path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
                                    </svg>
                                )}
                            </span>
                        </span>
                    </button>
                </div>
            </div>
        </header>
    );
}

export default Header;
