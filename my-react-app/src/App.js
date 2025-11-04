import AdminDashboard from "./components/AdminDashboard";
import CommissionerDashboard from "./components/CommissionerDashboard";
import EEPHDashboard from "./components/EEPHDashboard";
import Login from "./components/Login";
import React, { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import SEPHDashboard from "./components/SEPHDashboard";
import ENCPHDashboard from "./components/ENCPHDashboard";
import CDMADashboard from "./components/CDMADashboard";
import { getUser, verifyToken, clearAuth, logout as apiLogout } from "./services/api";

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
    const saveToLocalStorage = async () => {
      try {
        // Helper function to convert File to base64 data URL (async)
        const fileToDataUrl = (file) => {
          return new Promise((resolve) => {
            if (!file) {
              resolve(null);
              return;
            }
            // If it's already a string (URL or data URL), return it
            if (typeof file === 'string') {
              resolve(file);
              return;
            }
            // If it's a File object, convert to base64 data URL
            if (file instanceof File) {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.onerror = () => resolve(null);
              reader.readAsDataURL(file);
            } else {
              resolve(null);
            }
          });
        };

        // Convert all File objects to base64 data URLs
        const serializable = await Promise.all(
          forwardedSubmissions.map(async (sub) => {
            const copy = { ...sub };
            
            // Convert File objects to base64 data URLs
            copy.workImage = await fileToDataUrl(copy.workImage);
            copy.detailedReport = await fileToDataUrl(copy.detailedReport);
            copy.committeeReport = await fileToDataUrl(copy.committeeReport);
            copy.councilResolution = await fileToDataUrl(copy.councilResolution);
            
            return copy;
          })
        );

        localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
        console.log("💾 Saved submissions to localStorage:", serializable.length);
      } catch (error) {
        console.error("Error saving submissions to localStorage:", error);
      }
    };

    saveToLocalStorage();
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
  const [loading, setLoading] = useState(true); // Loading state for session restoration

  // Restore session from stored token on mount
  useEffect(() => {
    const restoreSession = async () => {
      console.log("🔄 APP: Checking for existing session...");
      const storedUser = getUser();
      
      if (storedUser) {
        console.log("📋 APP: Found stored user session");
        console.log("   - User:", storedUser.username);
        console.log("   - Role:", storedUser.role);
        console.log("🔍 APP: Verifying token with server...");
        
        try {
          // Verify token with backend
          const response = await verifyToken();
          if (response.success && response.user) {
            console.log("✅ APP: Session restored successfully");
            console.log("   - Verified user:", response.user.username);
            console.log("   - Role:", response.user.role);
            console.log("⏰ Session restored at:", new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
            
            setUser({
              role: response.user.role,
              username: response.user.username,
            });
          } else {
            // Token invalid, clear auth
            console.log("❌ APP: Token verification failed, clearing session");
            clearAuth();
          }
        } catch (error) {
          // Token invalid or expired, clear auth
          console.log("❌ APP: Session restoration failed");
          console.log("   - Error:", error.message);
          console.log("   - Clearing invalid session");
          clearAuth();
        }
      } else {
        console.log("ℹ️  APP: No stored session found");
      }
      
      setLoading(false);
      console.log("✅ APP: Session check completed");
    };

    restoreSession();
  }, []);

  const logout = async () => {
    console.log("🔄 APP: Logout initiated from App component");
    await apiLogout(); // Call API logout for server-side logging
    setUser(null);
    console.log("✅ APP: User state cleared");
  };

  // Show loading state while restoring session
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login onLogin={setUser} />} />
        <Route
          path="/admin"
          element={
            user?.role === "engineer" ? (
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

        <Route
          path="/cdma"
          element={
            user?.role === "cdma" ? (
              <CDMADashboard
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
