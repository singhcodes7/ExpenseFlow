import React, { useState, useEffect } from "react";
import Header from "./components/HEADER/Header";
import Expenseform from "./components/EXPENSE FORM/Expenseform";
import IncomeForm from "./components/INCOME/Incomeform";
import IncomeList from "./components/INCOME/IncomeList";
import Expenselist from "./components/EXPENSE LIST/Expenselist";
import Expensechart from "./components/EXPENSE CHART/Expensechart";
import styles from "./App.module.css";
import Login from "./components/Login";
import { apiRequest, apiUpload, refreshAccessToken, API_URL } from "./api";
import ResetPassword from "./components/Resetpassword";
import Register from "./components/REGISTER/Register";
import Toast from "./components/TOAST/Toast";
import ChangePassword from "./components/Changepassword";

function App() {
  const [showLogoutAllModal, setShowLogoutAllModal] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [user, setUser] = useState(null);
  const [editedProfileName, setEditedProfileName] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  const [emailVerified, setEmailVerified] = useState(
    new URLSearchParams(window.location.search).get("verified") === "success",
  );

  const [toast, setToast] = useState({
    message: "",
    type: "success",
  });

  const [selectedProfileImage, setSelectedProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState("");
  useEffect(() => {
    return () => {
      if (profileImagePreview) {
        URL.revokeObjectURL(profileImagePreview);
      }
    };
  }, [profileImagePreview]);
  const [profileImageUploading, setProfileImageUploading] = useState(false);

  const [expensesLoading, setExpensesLoading] = useState(false);
  const [expensesError, setExpensesError] = useState("");
  const [expenses, setExpenses] = useState([]);

  const [income, setIncome] = useState([]);
  const [incomeLoading, setIncomeLoading] = useState(false);
  const [incomeError, setIncomeError] = useState("");

  const [incomeCategories, setIncomeCategories] = useState([]);
  const [incomeCategoriesLoading, setIncomeCategoriesLoading] = useState(false);
  const [incomeCategoriesError, setIncomeCategoriesError] = useState("");

  const [incomeSummary, setIncomeSummary] = useState(null);

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [categoriesError, setCategoriesError] = useState("");

  const [showChangePassword, setShowChangePassword] = useState(false);

  const [searchterm, setsearchterm] = useState("");
  const [sortoption, setsortoption] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");

  const [editingId, setEditingId] = useState(null);
  const [editedName, setEditedName] = useState("");
  const [editedAmount, setEditedAmount] = useState("");
  const [editedCategory, setEditedCategory] = useState("");

  const [incomeEditingId, setIncomeEditingId] = useState(null);
  const [incomeEditedName, setIncomeEditedName] = useState("");
  const [incomeEditedAmount, setIncomeEditedAmount] = useState("");
  const [incomeEditedCategory, setIncomeEditedCategory] = useState("");

  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("darkMode");

    if (savedTheme === null) return false;

    return JSON.parse(savedTheme);
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const clearToast = () => {
    setToast({ message: "", type: "success" });
  };

  const loadCategories = async () => {
    setCategoriesLoading(true);
    setCategoriesError("");

    try {
      const data = await apiRequest("/categories");
      setCategories(data.categories ?? []);
    } catch (error) {
      setCategoriesError(error.message || "Failed to load categories");
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();

    const name = newCategory.trim();

    if (!name) {
      setCategoriesError("Please enter a category name.");
      return;
    }

    setCategoriesError("");

    try {
      const data = await apiRequest("/categories", {
        method: "POST",
        body: JSON.stringify({ name }),
      });

      setCategories((previous) =>
        [...previous, data.category].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      );

      setNewCategory("");

      setToast({
        message: "Category added successfully!",
        type: "success",
      });
    } catch (error) {
      setCategoriesError(error.message || "Failed to add category.");
    }
  };

  const loadExpenses = async () => {
    setExpensesLoading(true);
    setExpensesError("");

    try {
      const data = await apiRequest("/expenses");
      setExpenses(data.expenses);
    } catch (error) {
      const message =
        error.message || "Unable to load expenses. Please try again.";

      setExpensesError(message);
      showToast(message, "error");
      throw error;
    } finally {
      setExpensesLoading(false);
    }
  };

  const loadIncome = async () => {
    setIncomeLoading(true);
    setIncomeError("");

    try {
      const data = await apiRequest("/income");
      setIncome(data.income ?? []);
    } catch (error) {
      const message = error.message || "Failed to load income.";
      setIncomeError(message);
      showToast(message, "error");
    } finally {
      setIncomeLoading(false);
    }
  };

  const loadIncomeCategories = async () => {
    setIncomeCategoriesLoading(true);
    setIncomeCategoriesError("");

    try {
      const data = await apiRequest("/income-categories");
      setIncomeCategories(data.categories ?? []);
    } catch (error) {
      const message = error.message || "Failed to load income categories.";
      setIncomeCategoriesError(message);
      showToast(message, "error");
    } finally {
      setIncomeCategoriesLoading(false);
    }
  };

  const loadIncomeSummary = async () => {
    try {
      const data = await apiRequest("/income/summary");
      setIncomeSummary(data);
    } catch (error) {
      console.error("Failed to load income summary:", error);
    }
  };

  const handleLogin = async (loggedInUser) => {
    setUser(loggedInUser);

    await Promise.all([
      loadExpenses(),
      loadCategories(),
      loadIncome(),
      loadIncomeCategories(),
      loadIncomeSummary(),
    ]);
  };

  const handleLogout = async () => {
    try {
      await apiRequest("/logout", {
        method: "POST",
      });
    } catch (error) {
      showToast(
        "Unable to confirm logout with the server. Please try again.",
        "error",
      );
      return;
    }

    sessionStorage.removeItem("accessToken");
    setUser(null);
    setExpenses([]);
    setIncome([]);
    setIncomeCategories([]);
    setIncomeSummary(null);
    setIncomeError("");
    setIncomeCategoriesError("");
    setShowProfile(false);
    setShowChangePassword(false);
    setShowRegister(false);
    setsearchterm("");
  };

  const handleLogoutAll = async () => {
    try {
      await apiRequest("/logout-all", {
        method: "POST",
      });

      sessionStorage.removeItem("accessToken");
      setUser(null);
      setExpenses([]);
      setIncome([]);
      setIncomeCategories([]);
      setIncomeSummary(null);
      setIncomeError("");
      setIncomeCategoriesError("");
      setShowProfile(false);
      setShowChangePassword(false);
      setShowRegister(false);
      setsearchterm("");
      setsortoption("");
    } catch (error) {
      showToast(
        error.message ||
          "Unable to log out from all devices. Please try again.",
        "error",
      );
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();

    const name = editedProfileName.trim();

    if (!name) {
      showToast("Name cannot be empty.", "error");
      return;
    }

    if (profileSaving) return;

    setProfileSaving(true);

    try {
      const data = await apiRequest("/profile", {
        method: "PATCH",
        body: JSON.stringify({ name }),
      });

      setUser(data.user);
      setEditedProfileName(data.user.name);
      showToast("Profile updated successfully.");
    } catch (error) {
      showToast(
        error.message || "Unable to update your profile. Please try again.",
        "error",
      );
    } finally {
      setProfileSaving(false);
    }
  };

  const handleProfilePictureUpload = async () => {
    if (!selectedProfileImage || profileImageUploading) return;

    setProfileImageUploading(true);

    try {
      const formData = new FormData();
      formData.append("profilePicture", selectedProfileImage);

      const data = await apiUpload("/profile-picture", formData);

      setUser(data.user);
      setSelectedProfileImage(null);
      setProfileImagePreview("");

      showToast("Profile picture updated successfully.");
    } catch (error) {
      showToast(error.message || "Unable to upload profile picture.", "error");
    } finally {
      setProfileImageUploading(false);
    }
  };

  const handleRemoveProfilePicture = async () => {
    try {
      const data = await apiRequest("/profile-picture", {
        method: "DELETE",
      });

      setUser(data.user);
      setSelectedProfileImage(null);
      setProfileImagePreview("");

      showToast("Profile picture removed successfully.");
    } catch (error) {
      showToast(error.message || "Unable to remove profile picture.", "error");
    }
  };

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    let active = true;

    const checkSession = async () => {
      try {
        const token = await refreshAccessToken();

        if (!token || !active) return;

        const data = await apiRequest("/profile");

        if (!active) return;

        setUser(data.user);
        await Promise.all([
          loadExpenses(),
          loadCategories(),
          loadIncome(),
          loadIncomeCategories(),
          loadIncomeSummary(),
        ]);
      } catch (error) {
        if (active) {
          sessionStorage.removeItem("accessToken");
        }
      } finally {
        if (active) {
          setAuthChecking(false);
        }
      }
    };

    checkSession();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleIncomeUpdate = () => {
      loadIncomeSummary();
    };

    window.addEventListener("income-updated", handleIncomeUpdate);

    return () => {
      window.removeEventListener("income-updated", handleIncomeUpdate);
    };
  }, []);

  const startEditing = (expense) => {
    setEditingId(expense.id);
    setEditedName(expense.name);
    setEditedAmount(String(expense.amount));
    setEditedCategory(expense.category);
  };

  const startIncomeEditing = (item) => {
    setIncomeEditingId(item.id);
    setIncomeEditedName(item.name);
    setIncomeEditedAmount(String(item.amount));
    setIncomeEditedCategory(item.category);
  };

  const deleteexpense = async (id) => {
    try {
      await apiRequest(`/expenses/${id}`, {
        method: "DELETE",
      });

      setExpenses((previous) =>
        previous.filter((expense) => expense.id !== id),
      );

      showToast("Expense deleted successfully!");
    } catch (error) {
      showToast(error.message || "Failed to delete expense.", "error");
    }
  };

  const deleteIncome = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this income transaction?",
    );

    if (!confirmed) return;

    try {
      await apiRequest(`/income/${id}`, {
        method: "DELETE",
      });

      setIncome((prevIncome) => prevIncome.filter((item) => item.id !== id));

      if (incomeEditingId === id) {
        setIncomeEditingId(null);
      }

      await loadIncomeSummary();

      showToast("Income deleted successfully.");
    } catch (error) {
      showToast(error.message || "Unable to delete income.", "error");
    }
  };

  const saveExpense = async (id) => {
    if (!editedName.trim() || !editedAmount || Number(editedAmount) <= 0) {
      showToast("Please enter valid expense details.", "error");
      return;
    }

    try {
      const data = await apiRequest(`/expenses/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: editedName.trim(),
          amount: Number(editedAmount),
          category: editedCategory,
        }),
      });

      setExpenses((previousExpenses) =>
        previousExpenses.map((expense) =>
          expense.id === id ? data.expense : expense,
        ),
      );

      setEditingId(null);
      showToast("Expense updated successfully!");
    } catch (error) {
      showToast(error.message || "Failed to update expense.", "error");
    }
  };

  const saveIncome = async (id) => {
    if (
      !incomeEditedName.trim() ||
      !incomeEditedAmount ||
      !incomeEditedCategory
    ) {
      showToast("Please complete all required fields.", "error");
      return;
    }

    if (
      !Number.isFinite(Number(incomeEditedAmount)) ||
      Number(incomeEditedAmount) <= 0
    ) {
      showToast("Enter a valid amount greater than zero.", "error");
      return;
    }

    try {
      const data = await apiRequest(`/income/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: incomeEditedName.trim(),
          amount: Number(incomeEditedAmount),
          category: incomeEditedCategory,
        }),
      });

      setIncome((prevIncome) =>
        prevIncome.map((item) => (item.id === id ? data.income : item)),
      );

      setIncomeEditingId(null);

      await loadIncomeSummary();

      showToast("Income updated successfully.");
    } catch (error) {
      showToast(error.message || "Unable to update income.", "error");
    }
  };

  if (authChecking) {
    return <p>Checking your session...</p>;
  }

  const params = new URLSearchParams(window.location.search);
  const resetToken = params.get("token");
  const isResetPage = window.location.pathname === "/reset-password";

  if (isResetPage) {
    return (
      <ResetPassword
        token={resetToken || ""}
        onBack={() => {
          window.history.replaceState({}, "", "/");
          window.location.href = "/";
        }}
      />
    );
  }

  if (emailVerified) {
    return (
      <div className={styles.verificationPage}>
        <div className={styles.verificationCard}>
          <div className={styles.verificationIcon}>✓</div>

          <p className={styles.verificationEyebrow}>EXPENSEFLOW ACCOUNT</p>

          <h1>Email verified!</h1>

          <p className={styles.verificationMessage}>
            Your email address has been verified successfully. Your account is
            ready to use.
          </p>

          <button
            className={styles.verificationButton}
            onClick={() => {
              window.history.replaceState({}, "", "/");
              setEmailVerified(false);
            }}
          >
            Continue to sign in
          </button>

          <p className={styles.verificationFooter}>
            ExpenseFlow · Your finances, organized.
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (showRegister) {
      return <Register onBackToLogin={() => setShowRegister(false)} />;
    }

    return (
      <Login onLogin={handleLogin} onRegister={() => setShowRegister(true)} />
    );
  }

  const exportExpensesCSV = () => {
    if (expenses.length === 0) {
      showToast("No expenses to export.", "error");
      return;
    }

    const headers = ["Name", "Amount", "Category"];

    const rows = expenses.map((expense) => [
      expense.name,
      expense.amount,
      expense.category,
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `expenseflow-expenses-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  if (showProfile) {
    if (showChangePassword) {
      return (
        <div className={darkMode ? styles.dark : styles.light}>
          <Header
            darkMode={darkMode}
            onToggleTheme={() => setDarkMode(!darkMode)}
            onOpenProfile={() => setShowChangePassword(false)}
          />

          <main className={styles.main}>
            <ChangePassword
              onBack={() => setShowChangePassword(false)}
              onPasswordChanged={() => {
                sessionStorage.removeItem("accessToken");
                setUser(null);
                setExpenses([]);
                setShowChangePassword(false);
                setShowProfile(false);
                setShowRegister(false);
              }}
            />
          </main>
        </div>
      );
    }

    const profileName = user.name || "ExpenseFlow User";
    const profileEmail = user.email || "Email unavailable";

    const initials = profileName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();

    return (
      <div className={darkMode ? styles.dark : styles.light}>
        <Header
          darkMode={darkMode}
          onToggleTheme={() => setDarkMode(!darkMode)}
          onOpenProfile={() => setShowProfile(false)}
        />

        <Toast message={toast.message} type={toast.type} onClose={clearToast} />

        <main className={styles.main}>
          <section className={styles.profilePage}>
            <header className={styles.profileHeading}>
              <button
                type="button"
                className={styles.backButton}
                onClick={() => setShowProfile(false)}
                aria-label="Back to dashboard"
              >
                ← Back to dashboard
              </button>

              <p className={styles.profileEyebrow}>ACCOUNT SETTINGS</p>
              <h1 className={styles.profileTitle}>My profile</h1>
              <p className={styles.profileSubtitle}>
                Manage your personal information and account security.
              </p>
            </header>

            <section className={styles.profileHero}>
              <div
                className={styles.profileAvatar}
                aria-label="Profile picture"
              >
                {profileImagePreview ? (
                  <img
                    src={profileImagePreview}
                    alt="Selected profile preview"
                  />
                ) : user.profile_picture ? (
                  <img
                    src={`${API_URL}${user.profile_picture}`}
                    alt={`${profileName}'s profile`}
                  />
                ) : (
                  initials || "EF"
                )}
              </div>

              <div className={styles.profileHeroInfo}>
                <h2 className={styles.profileName}>{profileName}</h2>
                <p className={styles.profileEmail}>{profileEmail}</p>
                <span className={styles.profileVerified}>
                  <span aria-hidden="true">●</span>
                  ExpenseFlow account
                </span>
              </div>

              <div className={styles.profileImageControls}>
                <label className={styles.profileButton}>
                  {selectedProfileImage ? "Choose another" : "Upload photo"}

                  <input
                    id="profile-picture"
                    name="profilePicture"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    hidden
                    disabled={profileImageUploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";

                      if (!file) return;

                      if (
                        !["image/jpeg", "image/png", "image/webp"].includes(
                          file.type,
                        )
                      ) {
                        showToast("Choose a JPG, PNG, or WEBP image.", "error");
                        return;
                      }

                      if (file.size > 2 * 1024 * 1024) {
                        showToast("Image must be 2 MB or smaller.", "error");
                        return;
                      }

                      setSelectedProfileImage(file);
                      setProfileImagePreview(URL.createObjectURL(file));
                    }}
                  />
                </label>

                {selectedProfileImage && (
                  <button
                    className={`${styles.profileButton} ${styles.profileButtonPrimary}`}
                    type="button"
                    disabled={profileImageUploading}
                    onClick={handleProfilePictureUpload}
                  >
                    {profileImageUploading ? "Uploading..." : "Save photo"}
                  </button>
                )}

                {profileImagePreview && (
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={() => {
                      setSelectedProfileImage(null);
                      setProfileImagePreview("");
                    }}
                  >
                    Cancel
                  </button>
                )}

                {user.profile_picture && !selectedProfileImage && (
                  <button
                    className={styles.profileButton}
                    type="button"
                    onClick={handleRemoveProfilePicture}
                  >
                    Remove photo
                  </button>
                )}
              </div>
            </section>

            <section className={styles.profileCard}>
              <div className={styles.profileCardHeading}>
                <div>
                  <p className={styles.profileEyebrow}>PERSONAL DETAILS</p>
                  <h2>Profile information</h2>
                </div>
              </div>

              <form
                onSubmit={handleProfileUpdate}
                className={styles.profileForm}
              >
                <label htmlFor="profile-name">Full name</label>
                <input
                  id="profile-name"
                  name="profileName"
                  type="text"
                  value={editedProfileName}
                  onChange={(e) => setEditedProfileName(e.target.value)}
                  maxLength={80}
                  required
                />

                <label htmlFor="profile-email">Email address</label>
                <input
                  id="profile-email"
                  name="profileEmail"
                  type="email"
                  value={profileEmail}
                  disabled
                />

                <button
                  type="submit"
                  className={styles.profileSaveButton}
                  disabled={profileSaving}
                >
                  {profileSaving ? "Saving..." : "Save changes"}
                </button>
              </form>
            </section>

            <section className={styles.profileCard}>
              <div className={styles.profileCardHeading}>
                <div>
                  <p className={styles.profileEyebrow}>ACCOUNT SECURITY</p>
                  <h2>Security settings</h2>
                </div>
              </div>

              <div className={styles.securityRow}>
                <div>
                  <strong>Password</strong>
                  <p>Update your password to keep your account secure.</p>
                </div>

                <button
                  type="button"
                  className={styles.profileButton}
                  onClick={() => setShowChangePassword(true)}
                >
                  Change password
                </button>
              </div>

              <div className={styles.securityRow}>
                <div>
                  <strong>Active sessions</strong>
                  <p>Sign out from all devices where your account is active.</p>
                </div>

                <button
                  type="button"
                  className={styles.dangerButton}
                  onClick={() => setShowLogoutAllModal(true)}
                >
                  Log out all devices
                </button>
              </div>

              <div className={styles.securityRow}>
                <div>
                  <strong>Sign out</strong>
                  <p>Sign out of your current session.</p>
                </div>

                <button
                  type="button"
                  className={styles.dangerButton}
                  onClick={handleLogout}
                >
                  Log out
                </button>
              </div>
            </section>

            {showLogoutAllModal && (
              <div className={styles.modalOverlay}>
                <section className={styles.confirmModal}>
                  <h2>Log out from all devices?</h2>
                  <p>
                    This will end all active sessions associated with your
                    account.
                  </p>

                  <div className={styles.modalActions}>
                    <button
                      type="button"
                      className={styles.profileButton}
                      onClick={() => setShowLogoutAllModal(false)}
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      className={styles.dangerButton}
                      disabled={loggingOutAll}
                      onClick={async () => {
                        setLoggingOutAll(true);
                        await handleLogoutAll();
                        setLoggingOutAll(false);
                        setShowLogoutAllModal(false);
                      }}
                    >
                      {loggingOutAll ? "Logging out..." : "Yes, log out"}
                    </button>
                  </div>
                </section>
              </div>
            )}

            <footer className={styles.profileFooter}>
              <p className={styles.profileCardDescription}>
                ExpenseFlow · Your finances, organized.
              </p>
            </footer>
          </section>
        </main>
      </div>
    );
  }

  const totalSpent = expenses.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0,
  );

  const largestExpense = expenses.reduce(
    (largest, item) =>
      Number(item.amount) > Number(largest?.amount || 0) ? item : largest,
    null,
  );

  const categoryCount = new Set(expenses.map((item) => item.category)).size;

  const totalIncome = income.reduce(
    (total, item) => total + Number(item.amount),
    0,
  );

  const monthlyIncome = Number(incomeSummary?.summary?.monthly_income ?? 0);

  const incomeTransactionCount = income.length;

  const formattedIncome = totalIncome.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });

  const formattedMonthlyIncome = monthlyIncome.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });

  const formattedTotal = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(totalSpent);

  const greetingName = (user.name || "there").trim().split(/\s+/)[0];

  const filteredexpenses = expenses.filter((expense) => {
    const matchesSearch = expense.name
      .toLowerCase()
      .includes(searchterm.toLowerCase());

    const matchesCategory =
      filterCategory === "All" || expense.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  const sortedExpenses = [...filteredexpenses];

  if (sortoption === "amountAsc") {
    sortedExpenses.sort((a, b) => Number(a.amount) - Number(b.amount));
  } else if (sortoption === "amountDesc") {
    sortedExpenses.sort((a, b) => Number(b.amount) - Number(a.amount));
  } else if (sortoption === "nameAsc") {
    sortedExpenses.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortoption === "nameDesc") {
    sortedExpenses.sort((a, b) => b.name.localeCompare(a.name));
  }

  return (
    <div
      className={`${darkMode ? styles.dark : styles.light} ${styles.appShell}`}
    >
      <aside className={styles.sidebar}>
        <button
          type="button"
          className={styles.sidebarBrand}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <span className={styles.sidebarLogo} aria-hidden="true">
            ↗
          </span>
          <span>
            Expense<span>Flow</span>
          </span>
        </button>

        <p className={styles.sidebarLabel}>WORKSPACE</p>

        <nav className={styles.sideNav} aria-label="Main navigation">
          <a
            className={`${styles.navLink} ${styles.navActive}`}
            href="#overview"
          >
            <span>▦</span> Overview
          </a>

          <a className={styles.navLink} href="#analytics">
            <span>◔</span> Analytics
          </a>

          <a className={styles.navLink} href="#transactions">
            <span>⇄</span> Transactions
          </a>

          <a className={styles.navLink} href="#add-expense">
            <span>＋</span> Add expense
          </a>

          <a className={styles.navLink} href="#income">
            <span>₹</span> Income
          </a>
        </nav>

        <div className={styles.sidebarBottom}>
          <div className={styles.sidebarHelp}>
            <span className={styles.helpIcon}>✦</span>
            <strong>Stay on top of it</strong>
            <p>Small steps today make stronger money habits tomorrow.</p>
          </div>

          <button
            type="button"
            className={styles.sideProfile}
            onClick={() => {
              setEditedProfileName(user.name || "");
              setShowProfile(true);
            }}
          >
            <span className={styles.sideAvatar}>
              {(user.name || "EF")
                .trim()
                .split(/\s+/)
                .slice(0, 2)
                .map((x) => x[0])
                .join("")
                .toUpperCase()}
            </span>

            <span className={styles.sideUser}>
              <strong>{user.name || "My account"}</strong>
              <small>Personal account</small>
            </span>

            <span className={styles.sideMore}>···</span>
          </button>
        </div>
      </aside>

      <div className={styles.workspace}>
        <Header
          darkMode={darkMode}
          onToggleTheme={() => setDarkMode(!darkMode)}
          onOpenProfile={() => {
            setEditedProfileName(user.name || "");
            setShowProfile(true);
          }}
          compact
        />

        <Toast message={toast.message} type={toast.type} onClose={clearToast} />

        <main className={styles.main}>
          <section id="overview" className={styles.dashboardHeading}>
            <div>
              <p className={styles.dashboardEyebrow}>YOUR FINANCIAL SPACE</p>

              <h1 className={styles.dashboardTitle}>
                Good to see you, {greetingName}{" "}
                <span aria-hidden="true">✦</span>
              </h1>

              <p className={styles.dashboardSubtitle}>
                Here's what's happening with your money.
              </p>
            </div>

            <button
              type="button"
              className={styles.exportButton}
              onClick={exportExpensesCSV}
            >
              <span aria-hidden="true">⇩</span> Export report
            </button>
          </section>

          <section className={styles.statGrid} aria-label="Expense summary">
            <article className={`${styles.statCard} ${styles.statPrimary}`}>
              <div className={styles.statTop}>
                <span>Total expenses</span>
                <span className={styles.statIcon}>₹</span>
              </div>

              <strong>{formattedTotal}</strong>
              <small>All recorded spending</small>

              <div className={styles.statSpark} aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
            </article>

            <article className={styles.statCard}>
              <div className={styles.statTop}>
                <span>Transactions</span>
                <span className={styles.statIcon}>⇄</span>
              </div>

              <strong>{expenses.length}</strong>
              <small>Expenses recorded</small>
              <span className={styles.statFoot}>Across your account</span>
            </article>

            <article className={styles.statCard}>
              <div className={styles.statTop}>
                <span>Categories used</span>
                <span className={styles.statIcon}>◈</span>
              </div>

              <strong>{categoryCount}</strong>
              <small>Spending categories</small>
              <span className={styles.statFoot}>
                {categories.length} categories available
              </span>
            </article>

            <article className={styles.statCard}>
              <div className={styles.statTop}>
                <span>Largest expense</span>
                <span className={styles.statIcon}>↗</span>
              </div>

              <strong>
                {largestExpense
                  ? new Intl.NumberFormat("en-IN", {
                      style: "currency",
                      currency: "INR",
                      maximumFractionDigits: 0,
                    }).format(Number(largestExpense.amount))
                  : "₹0"}
              </strong>

              <small>{largestExpense?.name || "No expenses yet"}</small>

              <span className={styles.statFoot}>
                {largestExpense?.category || "Add your first expense"}
              </span>
            </article>
          </section>

          <section id="analytics" className={styles.analyticsGrid}>
            <div className={styles.panel}>
              <div className={styles.panelHeading}>
                <div>
                  <p className={styles.panelEyebrow}>SPENDING OVERVIEW</p>
                  <h2>Where your money goes</h2>
                </div>

                <span className={styles.panelBadge}>By category</span>
              </div>

              <Expensechart expenses={expenses} />
            </div>

            <div className={styles.panel}>
              <div className={styles.panelHeading}>
                <div>
                  <p className={styles.panelEyebrow}>QUICK ACTION</p>
                  <h2>Add a transaction</h2>
                </div>

                <span className={styles.quickPlus}>＋</span>
              </div>

              <div id="add-expense">
                <Expenseform
                  categories={categories}
                  setExpenses={setExpenses}
                />
              </div>

              <form
                onSubmit={handleAddCategory}
                className={styles.categoryForm}
              >
                <h3>Manage categories</h3>

                <p className={styles.categoryDescription}>
                  Create categories that fit your spending.
                </p>

                <div className={styles.categoryFormRow}>
                  <input
                    id="new-category-name"
                    name="categoryName"
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="New category name"
                    maxLength={50}
                  />

                  <button type="submit">Add</button>
                </div>

                {categoriesError && (
                  <p className={styles.categoryError}>{categoriesError}</p>
                )}
              </form>
            </div>
          </section>

          <section id="transactions" className={styles.transactionsSection}>
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.panelEyebrow}>YOUR ACTIVITY</p>
                <h2>Recent transactions</h2>
                <p>Review, search and manage your expenses.</p>
              </div>
            </div>

            <div className={styles.controls}>
              <input
                id="expense-search"
                name="expenseSearch"
                className={styles.searchinput}
                type="search"
                placeholder="Search expenses..."
                value={searchterm}
                onChange={(e) => setsearchterm(e.target.value)}
              />

              <select
                id="expense-sort"
                name="expenseSort"
                className={styles.sort}
                value={sortoption}
                onChange={(e) => setsortoption(e.target.value)}
              >
                <option value="">Default order</option>
                <option value="amountAsc">Amount: low to high</option>
                <option value="amountDesc">Amount: high to low</option>
                <option value="nameAsc">Name: A to Z</option>
                <option value="nameDesc">Name: Z to A</option>
              </select>

              <select
                id="expense-category-filter"
                name="expenseCategoryFilter"
                className={styles.sort}
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                aria-label="Filter expenses by category"
              >
                <option value="All">All categories</option>

                {categories.map((category) => {
                  const categoryName =
                    typeof category === "string" ? category : category.name;

                  const categoryId =
                    typeof category === "string" ? category : category.id;

                  return (
                    <option key={categoryId} value={categoryName}>
                      {categoryName}
                    </option>
                  );
                })}
              </select>
            </div>

            <Expenselist
              expenses={sortedExpenses}
              categories={categories}
              deleteexpense={deleteexpense}
              editingId={editingId}
              startEditing={startEditing}
              saveExpense={saveExpense}
              editedName={editedName}
              setEditedName={setEditedName}
              editedAmount={editedAmount}
              setEditedAmount={setEditedAmount}
              editedCategory={editedCategory}
              setEditedCategory={setEditedCategory}
              expensesLoading={expensesLoading}
              expensesError={expensesError}
              onCancelEdit={() => setEditingId(null)}
            />
          </section>
          <section id="income" className={styles.transactionsSection}>
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.panelEyebrow}>YOUR FINANCES</p>
                <h2>Income overview</h2>
                <p>Monitor your earnings and income sources.</p>
              </div>
            </div>

            <div className={styles.incomeSummaryGrid}>
              <div className={styles.incomeSummaryCard}>
                <p>Total income</p>
                <h3>{formattedIncome}</h3>
                <span>All-time earnings</span>
              </div>

              <div className={styles.incomeSummaryCard}>
                <p>Monthly income</p>
                <h3>{formattedMonthlyIncome}</h3>
                <span>Earned this month</span>
              </div>

              <div className={styles.incomeSummaryCard}>
                <p>Income transactions</p>
                <h3>{incomeTransactionCount}</h3>
                <span>Recorded entries</span>
              </div>
            </div>

            <div className={styles.analyticsGrid}>
              <div>
                <div className={styles.sectionHeading}>
                  <div>
                    <p className={styles.panelEyebrow}>NEW ENTRY</p>
                    <h2>Add income</h2>
                    <p>Record money you've received.</p>
                  </div>
                </div>

                <div className={styles.incomeFormWrapper}>
                  <IncomeForm
                    categories={incomeCategories}
                    setIncome={setIncome}
                  />
                </div>
                <div className={styles.incomeFormWrapper}>
                  <IncomeList
                    income={income}
                    categories={incomeCategories}
                    deleteIncome={deleteIncome}
                    editingId={incomeEditingId}
                    startEditing={startIncomeEditing}
                    saveIncome={saveIncome}
                    editedName={incomeEditedName}
                    setEditedName={setIncomeEditedName}
                    editedAmount={incomeEditedAmount}
                    setEditedAmount={setIncomeEditedAmount}
                    editedCategory={incomeEditedCategory}
                    setEditedCategory={setIncomeEditedCategory}
                    incomeLoading={incomeLoading}
                    incomeError={incomeError}
                    onCancelEdit={() => setIncomeEditingId(null)}
                  />
                </div>
              </div>
            </div>
          </section>
          <footer className={styles.dashboardFooter}>
            ExpenseFlow <span>·</span> Your finances, organized.
          </footer>
        </main>
      </div>
    </div>
  );
}

export default App;
