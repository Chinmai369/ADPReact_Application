import AdminDashboard from "./components/AdminDashboard";
import CommissionerDashboard from "./components/CommissionerDashboard";
import EEPHDashboard from "./components/EEPHDashboard";
import Login from "./components/Login";
import React, { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import SEPHDashboard from "./components/SEPHDashboard";
import ENCPHDashboard from "./components/ENCPHDashboard";

// localStorage key for persisted submissions
const STORAGE_KEY = "forwardedSubmissions";

function App() {
  // Load submissions from localStorage on mount
  const [forwardedSubmissions, setForwardedSubmissions] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      console.log("🔌 App.js loading from localStorage:", saved ? "found" : "empty");
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log("✅ Loaded submissions from localStorage:", parsed.length);
        // Handle File objects - they can't be serialized, so we'll handle them separately
        // For now, we'll parse what we can
        return parsed || [];
      }
    } catch (error) {
      console.error("❌ Error loading submissions from localStorage:", error);
    }
    console.log("📝 Initializing with empty array");
    return [];
  });

  // Save to localStorage whenever forwardedSubmissions changes
  useEffect(() => {
    try {
      // Create a serializable copy (exclude File objects for localStorage)
      const serializable = forwardedSubmissions.map((sub) => {
        const copy = { ...sub };
        // Remove File objects as they can't be serialized
        // We'll need to handle file persistence separately if needed
        delete copy.workImage;
        delete copy.detailedReport;
        delete copy.committeeReport;
        delete copy.councilResolution;
        return copy;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
      console.log("💾 Saved submissions to localStorage:", serializable.length);
    } catch (error) {
      console.error("Error saving submissions to localStorage:", error);
    }
  }, [forwardedSubmissions]);

  // Wrapper for setForwardedSubmissions that handles serialization
  const updateForwardedSubmissions = (updater) => {
    setForwardedSubmissions((prev) => {
      const newValue = typeof updater === "function" ? updater(prev) : updater;
      return newValue;
    });
  };

  // Minimal auth state for routing
  const [user, setUser] = useState(null); // { role: 'admin'|'commissioner', username }

  const logout = () => setUser(null);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login onLogin={setUser} />} />
        <Route
          path="/admin"
          element={
            user?.role === "engg" ? (
              <AdminDashboard
                user={user}
                logout={logout}
                forwardedSubmissions={forwardedSubmissions}
                setForwardedSubmissions={updateForwardedSubmissions}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/commissioner"
          element={
            user?.role === "Commissioner" ? (
              <CommissionerDashboard
                user={user}
                logout={logout}
                forwardedSubmissions={forwardedSubmissions}
                setForwardedSubmissions={updateForwardedSubmissions}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
              <Route
                  path="/eeph"
                  element={
                    user?.role === "eeph" ? (
                      <EEPHDashboard
                        user={user}
                        logout={logout}
                        forwardedSubmissions={forwardedSubmissions}
                        setForwardedSubmissions={updateForwardedSubmissions}
            />
    ) : (
      <Navigate to="/" replace />
    )
  }
/>

        <Route
          path="/seph"
          element={
            user?.role === "seph" ? (
              <SEPHDashboard
                user={user}
                logout={logout}
                forwardedSubmissions={forwardedSubmissions}
                setForwardedSubmissions={updateForwardedSubmissions}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/encph"
          element={
            user?.role === "encph" ? (
              <ENCPHDashboard
                user={user}
                logout={logout}
                forwardedSubmissions={forwardedSubmissions}
                setForwardedSubmissions={updateForwardedSubmissions}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
