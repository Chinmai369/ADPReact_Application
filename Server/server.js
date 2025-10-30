import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import pool from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());

// LOGIN API
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await pool.query("SELECT * FROM lgn_fnc WHERE username = ?", [username]);

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid username or password" });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.hashed_password);

    if (isMatch) {
      return res.json({
        success: true,
        message: "Login successful",
        username: user.username,
        role: user.role, // ✅ Include role
      });
    } else {
      return res.status(401).json({ success: false, message: "Invalid username or password" });
    }
  } catch (error) {
    console.error("Database Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


app.listen(5000, () => console.log("✅ Server running on port 5000"));
