import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/api";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!username || !password) {
      setErr("Please enter both username and password");
      console.log("⚠️ LOGIN: Validation failed - missing credentials");
      return;
    }

    setErr("");
    setLoading(true);

    try {
      // Call backend API for authentication
      const response = await login(username, password);

      if (response.success && response.user) {
        const { role, username: user } = response.user;
        
        console.log("🔄 LOGIN COMPONENT: Updating app state and redirecting...");
        console.log("   - Redirecting to:", role === "engineer" ? "/admin" : `/${role}`);
        
        onLogin({ role, username: user }); // ✅ Update app state

        // ✅ Redirect based on user role
        switch (role) {
          case "engineer":
            navigate("/admin");
            break;
          case "Commissioner":
            navigate("/commissioner");
            break;
          case "eeph":
            navigate("/eeph");
            break;
          case "seph":
            navigate("/seph");
            break;
          case "encph":
            navigate("/encph");
            break;
          case "cdma":
            navigate("/cdma");
            break;
          default:
            navigate("/");
            break;
        }
      }
    } catch (error) {
      setErr(error.message || "Invalid username or password");
      console.log("❌ LOGIN COMPONENT: Failed to complete login");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-100 via-amber-100 to-yellow-100 p-6 font-sans">
      <div className="bg-white shadow-2xl rounded-2xl w-full max-w-md p-8 transition-all hover:-translate-y-1">
        {/* Government Seal */}
        <div className="flex justify-center mb-4">
         <img
  src="/ap-logo.jpeg"
  alt="Government Seal"
  className="w-20 h-20 object-contain"
/>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 leading-tight">
            15th Finance Commission
          </h1>
          <p className="text-gray-500 text-sm">Government of Andhra Pradesh</p>
        </div>

        {/* Error message */}
        {err && (
          <div className="bg-red-100 text-red-600 px-4 py-2 rounded-md mb-4 text-sm text-center">
            {err}
          </div>
        )}

        {/* Login Form */}
        <div className="space-y-5">
          <div>
            <label className="text-gray-700 text-sm font-medium">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Enter username"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="text-gray-700 text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) {
                  handleLogin();
                }
              }}
              className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </div>

          {/* Remember / Forgot */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="accent-blue-600" />
              <span>Remember me</span>
            </label>
            <a href="#" className="text-blue-600 hover:underline">
              Forgot password?
            </a>
          </div>

          {/* Login Button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg shadow-md transition-all"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>
      </div>
    </div>
  );
}
