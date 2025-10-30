// src/services/api.js
import CONFIG from "../config";

// Function to log in a user
export async function loginUser(username, password) {
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data; // Expected: { success: true/false, message, role, username }
  } catch (error) {
    console.error("Login API error:", error);
    return { success: false, message: "Server error. Please try again later." };
  }
}