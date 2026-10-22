
import React, { useState, useEffect } from "react";
import Header from "./components/HEADER/Header";
import Expenseform from "./components/EXPENSE FORM/Expenseform";
import Totalexpense from "./components/TOTAL EXPENSE/Totalexpense";
import Expenselist from "./components/EXPENSE LIST/Expenselist";
import Expensechart from "./components/EXPENSE CHART/Expensechart";
import styles from "./App.module.css";
import Login from "./components/Login";
import { apiRequest, refreshAccessToken } from "./api";
import ResetPassword from "./components/Resetpassword";
import Register from "./components/REGISTER/Register";
import Toast from "./components/TOAST/Toast";
import ChangePassword from "./components/Changepassword";
function App() {
  const [showRegister, setShowRegister] = useState(false);
  const [user, setUser] = useState(null);
  const [editedProfileName, setEditedProfileName] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  const [emailVerified, setEmailVerified] = useState(
    new URLSearchParams(window.location.search).get("verified") === "success"
  );

  const [toast, setToast] = useState({
    message: "",
    type: "success",
  });

  const [expensesLoading, setExpensesLoading] = useState(false);
const [expensesError, setExpensesError] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const categories = ["Food", "Travel", "Education"];

  const [searchterm, setsearchterm] = useState("");
  const [sortoption, setsortoption] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editedName, setEditedName] = useState("");
  const [editedAmount, setEditedAmount] = useState("");
  const [editedCategory, setEditedCategory] = useState("");

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

  const handleLogin = async (loggedInUser) => {
    setUser(loggedInUser);

    try {
      await loadExpenses();
    } catch {
      // loadExpenses already displays the error notification.
    }
  };

  
const handleLogout = async () => {
  try {
    await apiRequest("/logout", {
      method: "POST",
    });
  } catch (error) {
    showToast(
      "Unable to confirm logout with the server. Please try again.",
      "error"
    );
    return;
  }

  sessionStorage.removeItem("accessToken");
  setUser(null);
  setExpenses([]);
  setShowProfile(false);
  setShowChangePassword(false);
  setShowRegister(false);
  setSearchterm?.("");
};

  
const handleLogoutAll = async () => {
  try {
    await apiRequest("/logout-all", {
      method: "POST",
    });

    sessionStorage.removeItem("accessToken");
    setUser(null);
    setExpenses([]);
    setShowProfile(false);
    setShowChangePassword(false);
    setShowRegister(false);
    setsearchterm("");
    setsortoption("");

  } catch (error) {
    showToast(
      error.message || "Unable to log out from all devices. Please try again.",
      "error"
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
      "error"
    );
  } finally {
    setProfileSaving(false);
  }
};

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
  try {
    await refreshAccessToken();

    // Strict Mode may have cleaned up this effect while refreshing.
    if (cancelled) return;

    const profileData = await apiRequest("/profile");

    if (cancelled) return;

    setUser(profileData.user ?? profileData);

    try {
      await loadExpenses();
    } catch {
      // loadExpenses already displays an error notification.
    }
  } catch (error) {
    if (cancelled) return;

    sessionStorage.removeItem("accessToken");
    setUser(null);
    setExpenses([]);
  } finally {
    if (!cancelled) {
      setAuthChecking(false);
    }
  }
};

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  const deleteexpense = async (idToDelete) => {
    try {
      await apiRequest(`/expenses/${idToDelete}`, {
        method: "DELETE",
      });

      setExpenses((prevExpenses) =>
        prevExpenses.filter((expense) => expense.id !== idToDelete)
      );

      showToast("Expense deleted successfully!");
    } catch (error) {
      showToast(
        error.message || "Failed to delete expense.",
        "error"
      );
    }
  };

  
const [filterCategory, setFilterCategory] = useState("All");

const filteredexpenses = expenses.filter((expense) => {
  const matchesSearch = expense.name
    .toLowerCase()
    .includes(searchterm.toLowerCase());

  const matchesCategory =
    filterCategory === "All" ||
    expense.category === filterCategory;

  return matchesSearch && matchesCategory;
});

const sortedExpenses = [...filteredexpenses];

if (sortoption === "amountAsc") {
  sortedExpenses.sort((a, b) => Number(a.amount) - Number(b.amount));
}

if (sortoption === "amountDesc") {
  sortedExpenses.sort((a, b) => Number(b.amount) - Number(a.amount));
}

if (sortoption === "nameAsc") {
  sortedExpenses.sort((a, b) => a.name.localeCompare(b.name));
}

if (sortoption === "nameDesc") {
  sortedExpenses.sort((a, b) => b.name.localeCompare(a.name));
}


  const startEditing = (expense) => {
    setEditingId(expense.id);
    setEditedName(expense.name);
    setEditedAmount(expense.amount);
    setEditedCategory(expense.category);
  };

  const saveExpense = async (id) => {
    if (!editedName.trim() || !editedAmount || !editedCategory) {
      showToast("Please fill all fields.", "error");
      return;
    }

    if (
      !Number.isFinite(Number(editedAmount)) ||
      Number(editedAmount) <= 0
    ) {
      showToast("Amount must be greater than 0.", "error");
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

      setExpenses((prevExpenses) =>
        prevExpenses.map((expense) =>
          expense.id === id ? data.expense : expense
        )
      );

      setEditingId(null);
      showToast("Expense updated successfully!");
    } catch (error) {
      showToast(
        error.message || "Failed to update expense.",
        "error"
      );
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

          <p className={styles.verificationEyebrow}>
            EXPENSEFLOW ACCOUNT
          </p>

          <h1>Email verified!</h1>

          <p className={styles.verificationMessage}>
            Your email address has been verified successfully.
            Your account is ready to use.
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
      return (
        <Register onBackToLogin={() => setShowRegister(false)} />
      );
    }

    return (
      <Login
        onLogin={handleLogin}
        onRegister={() => setShowRegister(true)}
      />
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
                .join(",")
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
        onOpenProfile={() => {
          setShowChangePassword(false);
        }}
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

  return (
    <div className={darkMode ? styles.dark : styles.light}>
      <Header
        darkMode={darkMode}
        onToggleTheme={() => setDarkMode(!darkMode)}
        onOpenProfile={() => setShowProfile(true)}
      />

      <main className={styles.main}>
        <h2>My Profile</h2>

        <p>
          <strong>Email:</strong> {user.email || "Not available"}
        </p>

        <form onSubmit={handleProfileUpdate}>
          <label htmlFor="profileName">Full name</label>

          <input
            id="profileName"
            type="text"
            value={editedProfileName}
            onChange={(e) => setEditedProfileName(e.target.value)}
            placeholder="Enter your name"
            required
            disabled={profileSaving}
          />

          <button type="submit" disabled={profileSaving}>
            {profileSaving ? "Saving..." : "Save changes"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setShowChangePassword(true)}
        >
        Change Password
        </button>

        <button
        type="button"
        onClick={handleLogout}
        >
      Logout
      </button>

      <button
  type="button"
  onClick={handleLogoutAll}
>
  Log out from all devices
</button>

        <button
          type="button"
          onClick={() => {
            setEditedProfileName(user.name || "");
            setShowProfile(false);
          }}
        >
          Back to Dashboard
        </button>
      </main>

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={clearToast}
      />
    </div>
  );
}

  return (
    <div className={darkMode ? styles.dark : styles.light}>
      <Header
  darkMode={darkMode}
  onToggleTheme={() => setDarkMode(!darkMode)}
  onOpenProfile={() => {
  setEditedProfileName(user.name || "");
  setShowProfile(true);
}}
/>

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={clearToast}
      />

      <main className={styles.main}>
        <div className={styles.dashboard}>
          <Expenseform
            categories={categories}
            setExpenses={setExpenses}
          />

          <Expensechart expenses={expenses} />
        </div>

        <Totalexpense expenses={expenses} />

        <div className={styles.controls}>
          <input
            className={styles.searchinput}
            type="text"
            placeholder="Search expenses..."
            value={searchterm}
            onChange={(e) => setsearchterm(e.target.value)}
          />

          <select
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
            className={styles.sort}
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            aria-label="Filter expenses by category"
          >
            <option value="All">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          
          <button type="button" onClick={exportExpensesCSV}>
              Export CSV
          </button>

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
        />
      </main>
    </div>
  );
}

export default App;
