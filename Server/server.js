import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import pool from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());

// Add user route
app.post("/api/addUser", async (req, res) => {
  const { username, password, role } = req.body;
  console.log("📥 Incoming request:", req.body);

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("🔑 Hashed password generated:", hashedPassword);

    const query = `
      INSERT INTO lgn_fnc (username, password, hashed_password, role)
      VALUES (?, ?, ?, ?)
    `;

    const [result] = await pool.query(query, [username, password, hashedPassword, role]);
    console.log("✅ Insert result:", result);

    res.json({
      message: "✅ User added successfully!",
      userId: result.insertId,
    });
  } catch (err) {
    console.error("❌ Full error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


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
