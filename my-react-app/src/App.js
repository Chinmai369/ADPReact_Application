import AdminDashboard from "./components/AdminDashboard";
import CommissionerDashboard from "./components/CommissionerDashboard";
import EEPHDashboard from "./components/EEPHDashboard";
import Login from "./components/Login";
import React, { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

function App() {
  // Submissions forwarded by admin and stored for commissioner review
  const [forwardedSubmissions, setForwardedSubmissions] = useState([]);

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
            user?.role === "admin" ? (
              <AdminDashboard
                user={user}
                logout={logout}
                forwardedSubmissions={forwardedSubmissions}
                setForwardedSubmissions={setForwardedSubmissions}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/commissioner"
          element={
            user?.role === "commissioner" ? (
              <CommissionerDashboard
                user={user}
                logout={logout}
                forwardedSubmissions={forwardedSubmissions}
                setForwardedSubmissions={setForwardedSubmissions}
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
                        setForwardedSubmissions={setForwardedSubmissions}
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
