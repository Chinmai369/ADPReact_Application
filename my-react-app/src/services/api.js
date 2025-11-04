import CONFIG from "../config.js";

// Token management
const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

// Get stored token
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

// Get stored user
export const getUser = () => {
  const userStr = localStorage.getItem(USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};

// Save token and user to localStorage
export const setAuth = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

// Clear auth data (logout)
export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!getToken();
};

// API request wrapper with automatic token attachment
export const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      // If token is invalid or expired, clear auth
      if (response.status === 401 || response.status === 403) {
        clearAuth();
        throw new Error(data.message || "Authentication failed");
      }
      // Include detailed error information if available
      const errorMessage = data.error 
        ? `${data.message || "Request failed"}: ${data.error}`
        : data.message || "Request failed";
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error("API Request Error:", error);
    throw error;
  }
};

// Login API call
export const login = async (username, password) => {
  console.log("\n");
  console.log("═══════════════════════════════════════════════════");
  console.log("🔐 FRONTEND: LOGIN REQUEST INITIATED");
  console.log("📝 Username:", username);
  console.log("🔑 Password:", "***");
  console.log("⏰ Request Time:", new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
  
  try {
    const response = await apiRequest("/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    if (response.success && response.token) {
      setAuth(response.token, response.user);
      
      console.log("✅ FRONTEND: LOGIN SUCCESSFUL");
      console.log("   - User:", response.user.username);
      console.log("   - Role:", response.user.role);
      console.log("   - Token received:", response.token.substring(0, 50) + "...");
      console.log("   - Token stored in localStorage");
      console.log("⏰ Login Time:", new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
      console.log("═══════════════════════════════════════════════════");
      console.log("\n");
      
      return response;
    }

    throw new Error(response.message || "Login failed");
  } catch (error) {
    console.log("❌ FRONTEND: LOGIN FAILED");
    console.log("   - Error:", error.message);
    console.log("═══════════════════════════════════════════════════");
    console.log("\n");
    throw error;
  }
};

// Verify token API call
export const verifyToken = async () => {
  try {
    const response = await apiRequest("/verify", {
      method: "GET",
    });
    return response;
  } catch (error) {
    clearAuth();
    throw error;
  }
};

// Logout API call (with server-side logging)
export const logout = async () => {
  const token = getToken();
  const user = getUser();
  
  console.log("\n");
  console.log("═══════════════════════════════════════════════════");
  console.log("🚪 FRONTEND: LOGOUT REQUEST INITIATED");
  
  if (user) {
    console.log("👤 User:", user.username);
    console.log("🎭 Role:", user.role);
  }
  
  console.log("⏰ Request Time:", new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
  
  // Call logout endpoint if token exists
  if (token) {
    try {
      const response = await apiRequest("/logout", {
        method: "POST",
      });
      
      console.log("✅ FRONTEND: LOGOUT SUCCESSFUL");
      console.log("   - Server confirmed logout");
      if (response.logoutTime) {
        console.log("   - Logout Time:", response.logoutTime);
      }
    } catch (error) {
      // Even if server call fails, clear local auth
      console.log("⚠️ FRONTEND: Logout API error (clearing local auth anyway)");
      console.log("   - Error:", error.message);
    }
  } else {
    console.log("ℹ️  FRONTEND: No token found, clearing local auth");
  }
  
  // Clear auth data from localStorage
  clearAuth();
  
  console.log("   - Local storage cleared");
  console.log("   - Session terminated");
  console.log("⏰ Client Logout Time:", new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
  console.log("═══════════════════════════════════════════════════");
  console.log("\n");
};

