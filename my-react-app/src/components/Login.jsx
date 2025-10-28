import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const CREDENTIALS = {
  admin: { username: "admin", password: "admin123", role: "admin" },
  commissioner: { username: "commissioner", password: "comm123", role: "commissioner" },
  eeph: { username: "eeph", password: "eeph123", role: "eeph" },
};

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    if (username === CREDENTIALS.admin.username && password === CREDENTIALS.admin.password) {
      onLogin({ role: "admin", username });
      navigate("/admin");
    } else if (
      username === CREDENTIALS.commissioner.username &&
      password === CREDENTIALS.commissioner.password
    ) {
      onLogin({ role: "commissioner", username });
      navigate("/commissioner");
    } else if (username === CREDENTIALS.eeph.username && password === CREDENTIALS.eeph.password) {
      onLogin({ role: "eeph", username });
      navigate("/eeph");
    } else {
      setErr("Invalid credentials. Try admin/admin123, commissioner/comm123, or eeph/eeph123");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-6 font-sans">
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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow-md transition-all"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}
