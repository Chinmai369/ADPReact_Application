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
const STORAGE_TIMESTAMP_KEY = "forwardedSubmissions_timestamp";
const STORAGE_DURATION = 24 * 60 * 60 * 1000; // 1 day in milliseconds

function App() {
  // Load submissions from localStorage on mount
  const [forwardedSubmissions, setForwardedSubmissions] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const timestamp = localStorage.getItem(STORAGE_TIMESTAMP_KEY);
      
      console.log("🔌 App.js loading from localStorage:", saved ? "found" : "empty");
      
      if (saved && timestamp) {
        const savedTime = parseInt(timestamp, 10);
        const currentTime = Date.now();
        const ageInMs = currentTime - savedTime;
        const ageInHours = ageInMs / (1000 * 60 * 60);
        
        console.log("📅 Data age:", {
          savedAt: new Date(savedTime).toLocaleString(),
          currentTime: new Date(currentTime).toLocaleString(),
          ageInHours: ageInHours.toFixed(2),
          ageInDays: (ageInHours / 24).toFixed(2),
          isExpired: ageInMs > STORAGE_DURATION
        });
        
        // Check if data is older than 1 day
        if (ageInMs > STORAGE_DURATION) {
          console.warn("⚠️ Stored data is older than 1 day, clearing localStorage");
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
          console.log("📝 Initializing with empty array (data expired)");
          return [];
        }
        
        const parsed = JSON.parse(saved);
        console.log("✅ Loaded submissions from localStorage:", {
          count: parsed.length,
          age: `${ageInHours.toFixed(2)} hours`,
          expiresIn: `${((STORAGE_DURATION - ageInMs) / (1000 * 60 * 60)).toFixed(2)} hours`
        });
        return parsed || [];
      } else if (saved) {
        // Legacy data without timestamp - keep it but add timestamp
        const parsed = JSON.parse(saved);
        console.log("✅ Loaded legacy submissions from localStorage (no timestamp):", parsed.length);
        // Add timestamp for future checks
        localStorage.setItem(STORAGE_TIMESTAMP_KEY, Date.now().toString());
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
        let serializable = await Promise.all(
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

        // Check size before saving - localStorage typically has 5-10MB limit
        const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB limit (increased to accommodate large files)
        let jsonString = JSON.stringify(serializable);
        let dataSize = new Blob([jsonString]).size;
        
        console.log("💾 Attempting to save:", {
          submissions: serializable.length,
          dataSize: `${(dataSize / 1024 / 1024).toFixed(2)} MB`,
          maxSize: `${(MAX_STORAGE_SIZE / 1024 / 1024).toFixed(2)} MB`
        });

        // If data is too large, keep only the most recent submissions
        if (dataSize > MAX_STORAGE_SIZE) {
          console.warn("⚠️ Data size exceeds limit, keeping only most recent submissions");
          
          // Sort by ID (which includes timestamp) descending to get most recent first
          serializable.sort((a, b) => (b.id || 0) - (a.id || 0));
          
          // Try to keep as many as possible while staying under limit
          let kept = [];
          
          for (let sub of serializable) {
            // Check size if we add this submission
            const testArray = [...kept, sub];
            const testJson = JSON.stringify(testArray);
            const testSize = new Blob([testJson]).size;
            
            if (testSize <= MAX_STORAGE_SIZE) {
              kept.push(sub);
            } else {
              // If even a single submission exceeds the limit, we still keep it
              // (better to have 1 submission than 0)
              if (kept.length === 0) {
                console.warn("⚠️ Single submission exceeds limit, but keeping it anyway");
                kept.push(sub);
              }
              break;
            }
          }
          
          // Reverse to maintain chronological order (oldest first)
          kept.reverse();
          
          serializable = kept;
          jsonString = JSON.stringify(serializable);
          dataSize = new Blob([jsonString]).size;
          
          console.warn(`⚠️ Reduced to ${kept.length} most recent submissions (${(dataSize / 1024 / 1024).toFixed(2)} MB)`);
          
          // Update state to match what we're saving (to prevent repeated size issues)
          // Use setTimeout to avoid updating state during render
          setTimeout(() => {
            setForwardedSubmissions(serializable);
          }, 0);
        }

        // Save data with current timestamp
        localStorage.setItem(STORAGE_KEY, jsonString);
        localStorage.setItem(STORAGE_TIMESTAMP_KEY, Date.now().toString());
        
        console.log("✅ Saved submissions to localStorage:", {
          count: serializable.length,
          size: `${(dataSize / 1024 / 1024).toFixed(2)} MB`,
          timestamp: new Date().toLocaleString(),
          expiresAt: new Date(Date.now() + STORAGE_DURATION).toLocaleString()
        });
      } catch (error) {
        if (error.name === 'QuotaExceededError') {
          console.error("❌ localStorage quota exceeded. Attempting to reduce data size...");
          
          // Try to save only the most recent 50 submissions
          try {
            const recentSubmissions = forwardedSubmissions
              .sort((a, b) => (b.id || 0) - (a.id || 0))
              .slice(0, 50)
              .reverse();
            
            // Convert to serializable format
            const serializable = await Promise.all(
              recentSubmissions.map(async (sub) => {
                const copy = { ...sub };
                if (copy.workImage instanceof File) {
                  const reader = new FileReader();
                  copy.workImage = await new Promise((resolve) => {
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = () => resolve(null);
                    reader.readAsDataURL(copy.workImage);
                  });
                }
                if (copy.detailedReport instanceof File) {
                  const reader = new FileReader();
                  copy.detailedReport = await new Promise((resolve) => {
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = () => resolve(null);
                    reader.readAsDataURL(copy.detailedReport);
                  });
                }
                if (copy.committeeReport instanceof File) {
                  const reader = new FileReader();
                  copy.committeeReport = await new Promise((resolve) => {
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = () => resolve(null);
                    reader.readAsDataURL(copy.committeeReport);
                  });
                }
                if (copy.councilResolution instanceof File) {
                  const reader = new FileReader();
                  copy.councilResolution = await new Promise((resolve) => {
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = () => resolve(null);
                    reader.readAsDataURL(copy.councilResolution);
                  });
                }
                return copy;
              })
            );
            
            // Save data with current timestamp
            localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
            localStorage.setItem(STORAGE_TIMESTAMP_KEY, Date.now().toString());
            
            console.warn(`⚠️ Saved only ${serializable.length} most recent submissions due to storage limit`);
            
            // Update state to match what we saved
            setTimeout(() => {
              setForwardedSubmissions(serializable);
            }, 0);
          } catch (retryError) {
            console.error("❌ Failed to save even reduced data:", retryError);
            // Clear old data and try again with even fewer items
            try {
              localStorage.removeItem(STORAGE_KEY);
              localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
              console.warn("🗑️ Cleared localStorage to free up space");
            } catch (clearError) {
              console.error("❌ Failed to clear localStorage:", clearError);
            }
          }
        } else {
          console.error("❌ Error saving submissions to localStorage:", error);
        }
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
