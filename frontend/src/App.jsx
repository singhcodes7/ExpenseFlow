
import React, { useState, useEffect } from "react";
import Header from "./components/HEADER/Header";
import Expenseform from "./components/EXPENSE FORM/Expenseform";
import Totalexpense from "./components/TOTAL EXPENSE/Totalexpense";
import Expenselist from "./components/EXPENSE LIST/Expenselist";
import Expensechart from "./components/EXPENSE CHART/Expensechart";
import styles from "./App.module.css";
import Login from "./components/Login";
import {
  apiRequest,
  apiUpload,
  refreshAccessToken,
  API_URL,
} from "./api";
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
    new URLSearchParams(window.location.search).get("verified") === "success"
  );

  const [toast, setToast] = useState({
    message: "",
    type: "success",
  });
  const [selectedProfileImage, setSelectedProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState("");
  const [profileImageUploading, setProfileImageUploading] = useState(false);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [expensesError, setExpensesError] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [categoriesError, setCategoriesError] = useState("");
  const [showChangePassword, setShowChangePassword] = useState(false);

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

  const loadCategories = async () => {
  setCategoriesLoading(true);
  setCategoriesError("");

  try {
    const data = await apiRequest("/categories");
    setCategories(data.categories ?? []);
  } catch (error) {
    setCategoriesError(
      error.message || "Failed to load categories"
    );
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

    setCategories((previous) => [
      ...previous,
      data.category,
    ].sort((a, b) => a.name.localeCompare(b.name)));

    setNewCategory("");
    setToast({
      message: "Category added successfully!",
      type: "success",
    });
  } catch (error) {
    setCategoriesError(
      error.message || "Failed to add category."
    );
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
  setsearchterm?.("");
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

  const handleProfilePictureUpload = async () => {
  if (!selectedProfileImage || profileImageUploading) return;

  setProfileImageUploading(true);

  try {
    const formData = new FormData();
    formData.append("profilePicture", selectedProfileImage);

    const data = await apiUpload("/profile-picture", formData);
    console.log("Profile picture upload response:", data);
    setUser(data.user);
    setSelectedProfileImage(null);
    setProfileImagePreview("");

    showToast("Profile picture updated successfully.");
  } catch (error) {
    showToast(
      error.message || "Unable to upload profile picture.",
      "error"
    );
  } finally {
    setProfileImageUploading(false);
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
      await Promise.all([
    loadExpenses(),
    loadCategories(),
  ]);
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
        onOpenProfile={() => setShowProfile(true)}
      />

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={clearToast}
      />

      
<main className={styles.main}>
    <section className={styles.profilePage}>
        <button
            type="button"
            className={styles.backArrow}
            onClick={() => {
                setEditedProfileName(user.name || "");
                setShowProfile(false);
            }}
            aria-label="Back to dashboard"
            title="Back to dashboard"
        >
            <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <path d="M19 12H5" />
                <path d="m12 19-7-7 7-7" />
            </svg>
        </button>

        <header className={styles.profileHeading}>

            <p className={styles.profileEyebrow}>ACCOUNT SETTINGS</p>
            <h1 className={styles.profileTitle}>My profile</h1>
            <p className={styles.profileSubtitle}>
              Manage your personal information and account security.
            </p>
          </header>

          <section className={styles.profileHero}>
            <div className={styles.profileAvatar} aria-label="Profile picture">
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
      type="file"
      accept="image/jpeg,image/png,image/webp"
      hidden
      disabled={profileImageUploading}
      onChange={(e) => {
        const file = e.target.files?.[0];
        e.target.value = "";

        if (!file) return;

        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
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
      className={styles.profileButton}
      type="button"
      disabled={profileImageUploading}
      onClick={() => {
        URL.revokeObjectURL(profileImagePreview);
        setProfileImagePreview("");
        setSelectedProfileImage(null);
      }}
    >
      Cancel
    </button>
  )}
</div>
          </section>

          <div className={styles.profileGrid}>
            <section className={styles.profileCard}>
              <div className={styles.profileCardHeader}>
                <div>
                  <h2 className={styles.profileCardTitle}>
                    Personal information
                  </h2>
                  <p className={styles.profileCardDescription}>
                    Update the name associated with your account.
                  </p>
                </div>
                <span aria-hidden="true">✎</span>
              </div>

              <form onSubmit={handleProfileUpdate}>
                <div className={styles.profileField}>
                  <label
                    className={styles.profileLabel}
                    htmlFor="profileName"
                  >
                    Full name
                  </label>
                  <input
                    className={styles.profileInput}
                    id="profileName"
                    type="text"
                    value={editedProfileName}
                    onChange={(e) =>
                      setEditedProfileName(e.target.value)
                    }
                    placeholder="Enter your full name"
                    autoComplete="name"
                    maxLength={100}
                    required
                    disabled={profileSaving}
                  />
                </div>

                <div className={styles.profileField}>
                  <label className={styles.profileLabel}>Email address</label>
                  <div className={styles.profileReadOnly}>
                    {profileEmail}
                  </div>
                  <p className={styles.profileCardDescription}>
                    Your email is managed by your account settings.
                  </p>
                </div>

                <div className={styles.profileButtonRow}>
                  <button
                    className={`${styles.profileButton} ${styles.profileButtonPrimary}`}
                    type="submit"
                    disabled={
                      profileSaving ||
                      !editedProfileName.trim() ||
                      editedProfileName.trim() === (user.name || "")
                    }
                  >
                    {profileSaving ? "Saving..." : "Save changes"}
                  </button>

                  <button
                    className={styles.profileButton}
                    type="button"
                    disabled={profileSaving}
                    onClick={() => setEditedProfileName(user.name || "")}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </section>

            <section className={styles.profileCard}>
              <div className={styles.profileCardHeader}>
                <div>
                  <h2 className={styles.profileCardTitle}>
                    Security
                  </h2>
                  <p className={styles.profileCardDescription}>
                    Keep your account and sessions secure.
                  </p>
                </div>
                <span aria-hidden="true">⌑</span>
              </div>

              <div className={styles.profileAction}>
                <div>
                  <h3 className={styles.profileActionTitle}>
                    Password
                  </h3>
                  <p className={styles.profileActionDescription}>
                    Change your password to protect your account.
                  </p>
                </div>
                <button
                  className={styles.profileButton}
                  type="button"
                  onClick={() => setShowChangePassword(true)}
                >
                  Change
                </button>
              </div>

              <div className={styles.profileAction}>
                <div>
                  <h3 className={styles.profileActionTitle}>
                    Current session
                  </h3>
                  <p className={styles.profileActionDescription}>
                    Sign out of this device.
                  </p>
                </div>
                <button
                  className={`${styles.profileButton} ${styles.profileButtonDanger}`}
                  type="button"
                  onClick={handleLogout}
                >
                  Log out
                </button>
              </div>

              <div className={styles.profileAction}>
                <div>
                  <h3 className={styles.profileActionTitle}>
                    All devices
                  </h3>
                  <p className={styles.profileActionDescription}>
                    Sign out of all active sessions.
                  </p>
                </div>
               <button
  className={`${styles.profileButton} ${styles.profileButtonDanger}`}
  type="button"
  onClick={() => setShowLogoutAllModal(true)}
>
  Log out all
</button>
              </div>
            </section>
          </div>
          
          {showLogoutAllModal && (
  <div
    className={styles.modalOverlay}
    onMouseDown={(e) => {
      if (
        e.target === e.currentTarget &&
        !loggingOutAll
      ) {
        setShowLogoutAllModal(false);
      }
    }}
  >
    <section
      className={styles.confirmModal}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="logoutModalTitle"
      aria-describedby="logoutModalDescription"
    >
      <div className={styles.modalIcon} aria-hidden="true">
        !
      </div>

      <p className={styles.profileEyebrow}>
        SECURITY CONFIRMATION
      </p>

      <h2
        id="logoutModalTitle"
        className={styles.confirmModalTitle}
      >
        Log out from all devices?
      </h2>

      <p
        id="logoutModalDescription"
        className={styles.profileCardDescription}
      >
        This will end your active sessions. You may need to
        sign in again on your other devices.
      </p>

      <div className={styles.profileButtonRow}>
        <button
          className={styles.profileButton}
          type="button"
          disabled={loggingOutAll}
          onClick={() => setShowLogoutAllModal(false)}
        >
          Cancel
        </button>

        <button
          className={`${styles.profileButton} ${styles.profileButtonDanger}`}
          type="button"
          disabled={loggingOutAll}
          onClick={async () => {
            setLoggingOutAll(true);
            try {
              await handleLogoutAll();
            } finally {
              setLoggingOutAll(false);
              setShowLogoutAllModal(false);
            }
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
    <section className={styles.dashboardHeading}>
        <div>
            <p className={styles.dashboardEyebrow}>YOUR MONEY, IN CONTROL</p>
            <h1 className={styles.dashboardTitle}>Your dashboard</h1>
            <p className={styles.dashboardSubtitle}>
                Track your spending and keep your finances organized.
            </p>
        </div>
    </section>

    <Totalexpense expenses={expenses} />

    
<div className={styles.dashboard}>
  <div className={styles.dashboardLeft}>
    <Expenseform
      categories={categories}
      setExpenses={setExpenses}
    />

    <form
      onSubmit={handleAddCategory}
      className={styles.categoryForm}
    >
      <h3>Manage Categories</h3>
      <p className={styles.categoryDescription}>
        Create categories that fit your spending.
      </p>

      <div className={styles.categoryFormRow}>
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="New category name"
          maxLength={50}
          aria-label="New category name"
        />
        <button type="submit">Add</button>
      </div>

      {categoriesError && (
        <p className={styles.categoryError}>{categoriesError}</p>
      )}
    </form>
  </div>

  <Expensechart expenses={expenses} />
</div>



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
          <option key={category.id} value={category.name}>
          {category.name}
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
          expensesLoading={expensesLoading}
          expensesError={expensesError}
        />
      </main>
    </div>
  );
}

export default App;
