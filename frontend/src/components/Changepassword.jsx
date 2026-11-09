import { useState } from "react";
import { apiRequest } from "../api";
import styles from "../App.module.css";

function ChangePassword({ onBack, onPasswordChanged }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setMessage("");
    setError("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("New password must be different from the current password.");
      return;
    }

    setLoading(true);

    try {
      const data = await apiRequest("/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      setMessage(data.message || "Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onPasswordChanged();
    } catch (err) {
      setError(err.message || "Unable to change password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={styles.profileCard} style={{ maxWidth: "600px", margin: "0 auto" }}>
      <div className={styles.profileCardHeading}>
        <p className={styles.profileEyebrow}>SECURITY</p>
        <h2>Change password</h2>
        <p className={styles.profileCardDescription}>
          Ensure your account is using a long, secure password.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ marginTop: "20px" }}>
        <div className={styles.profileField}>
          <label className={styles.profileLabel} htmlFor="currentPassword">Current password</label>
          <input
            id="currentPassword"
            className={styles.profileInput}
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className={styles.profileField}>
          <label className={styles.profileLabel} htmlFor="newPassword">New password</label>
          <input
            id="newPassword"
            className={styles.profileInput}
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className={styles.profileField}>
          <label className={styles.profileLabel} htmlFor="confirmPassword">Confirm new password</label>
          <input
            id="confirmPassword"
            className={styles.profileInput}
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        {error && (
          <div className={styles.loginError} role="alert" style={{ marginBottom: "16px" }}>
            <span>!</span> {error}
          </div>
        )}

        {message && (
          <div className={styles.authSuccess} role="status" style={{ marginBottom: "16px", padding: "12px", borderRadius: "9px" }}>
            {message}
          </div>
        )}

        <div className={styles.profileButtonRow}>
          <button
            type="submit"
            className={`${styles.profileButton} ${styles.profileButtonPrimary}`}
            disabled={loading}
          >
            {loading ? "Changing password..." : "Update password"}
          </button>

          <button
            type="button"
            className={styles.profileButton}
            onClick={onBack}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}

export default ChangePassword;