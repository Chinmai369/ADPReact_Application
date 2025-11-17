import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";

const app = express();

const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'];
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log("⚠️ CORS: Request with no origin (allowed)");
      return callback(null, true);
    }
    
    console.log(`🌐 CORS: Checking origin: ${origin}`);
    console.log(`   - Allowed origins: ${allowedOrigins.join(', ')}`);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}. Allowed origins: ${allowedOrigins.join(', ')}`;
      console.error(`❌ CORS: Origin rejected - ${origin}`);
      return callback(new Error(msg), false);
    }
    
    console.log(`✅ CORS: Origin allowed - ${origin}`);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
}));
// app.use(cors({
//   origin: 'http://localhost:3001',
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
// }));
app.use(express.json());

// Health check endpoint (before authentication middleware)
app.get("/api/health", (req, res) => {
  res.json({ 
    success: true, 
    message: "Server is running",
    timestamp: new Date().toISOString()
  });
});

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  if (req.method === "POST" && req.path === "/api/login") {
    console.log("⚠️ LOGIN REQUEST DETECTED - Detailed logs will follow!");
  }
  // Log CORS origin for debugging
  if (req.headers.origin) {
    console.log(`   - Origin: ${req.headers.origin}`);
  }
  next();
});

// JWT Secret Key - In production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// JWT Token expiration time (7 days)
const JWT_EXPIRATION = "7d";

// Hardcoded credentials
const CREDENTIALS = {
  admin: { username: "Venkatesh", password: "admin123", role: "engineer", id: 1 },
  commissioner: { username: "Ramesh", password: "comm123", role: "Commissioner", id: 2 },
  eeph: { username: "Priya", password: "eeph123", role: "eeph", id: 3 },
  seph: { username: "Suresh", password: "seph123", role: "seph", id: 4 },
  encph: { username: "Karthik", password: "encph123", role: "encph", id: 5 },
  cdma: { username: "Srinivas", password: "cdma123", role: "cdma", id: 6 },
};

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  console.log("🔒 TOKEN VERIFICATION REQUEST");
  console.log("   - Endpoint:", req.path);
  console.log("   - Method:", req.method);
  
  const authHeader = req.headers["authorization"];
  console.log("   - Authorization header:", authHeader ? "present" : "missing");

  if (!authHeader) {
    console.log("❌ TOKEN VERIFICATION FAILED: No authorization header");
    console.log("═══════════════════════════════════════════════════");
    return res.status(401).json({ success: false, message: "Access token required" });
  }

  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN
  console.log("   - Token extracted:", token ? "yes" : "no");
  console.log("   - Token length:", token ? token.length : 0);

  if (!token) {
    console.log("❌ TOKEN VERIFICATION FAILED: Token not found in header");
    console.log("═══════════════════════════════════════════════════");
    return res.status(401).json({ success: false, message: "Access token required" });
  }

  console.log("🔍 VERIFYING JWT TOKEN...");
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log("❌ TOKEN VERIFICATION FAILED");
      console.log("   - Error:", err.name);
      console.log("   - Message:", err.message);
      console.log("═══════════════════════════════════════════════════");
      return res.status(403).json({ success: false, message: "Invalid or expired token" });
    }
    
    console.log("✅ TOKEN VERIFICATION SUCCESSFUL");
    console.log("   - User ID:", user.id);
    console.log("   - Username:", user.username);
    console.log("   - Role:", user.role);
    console.log("   - Issued at:", new Date(user.iat * 1000).toISOString());
    if (user.exp) {
      console.log("   - Expires at:", new Date(user.exp * 1000).toISOString());
    }
    console.log("═══════════════════════════════════════════════════");
    
    req.user = user;
    next();
  });
};

// Helper function to format time for display (Indian Standard Time - IST)
const formatTime = () => {
  const now = new Date();
  
  // Get UTC components
  const utcDate = now.getUTCDate();
  const utcMonth = now.getUTCMonth();
  const utcYear = now.getUTCFullYear();
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const utcSeconds = now.getUTCSeconds();
  
  // Convert to IST by adding 5 hours 30 minutes
  let istHours = utcHours + 5;
  let istMinutes = utcMinutes + 30;
  let istDate = utcDate;
  let istMonth = utcMonth;
  let istYear = utcYear;
  
  // Handle minute overflow (>= 60)
  if (istMinutes >= 60) {
    istMinutes -= 60;
    istHours += 1;
  }
  
  // Handle hour overflow (>= 24)
  if (istHours >= 24) {
    istHours -= 24;
    istDate += 1;
    
    // Handle date overflow based on month
    const daysInMonth = new Date(istYear, istMonth + 1, 0).getDate();
    if (istDate > daysInMonth) {
      istDate = 1;
      istMonth += 1;
      
      // Handle month overflow
      if (istMonth >= 12) {
        istMonth = 0;
        istYear += 1;
      }
    }
  }
  
  // Format: DD/MM/YYYY HH:MM:SS IST
  const day = String(istDate).padStart(2, '0');
  const month = String(istMonth + 1).padStart(2, '0');
  const year = String(istYear);
  const hours = String(istHours).padStart(2, '0');
  const minutes = String(istMinutes).padStart(2, '0');
  const seconds = String(utcSeconds).padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds} IST`;
};

// LOGIN API with JWT (no database)
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const timestamp = formatTime();
  const isoTime = new Date().toISOString();
  
  // Force output immediately
  process.stdout.write("\n");
  console.log("═══════════════════════════════════════════════════");
  console.log("🔐 JWT LOGIN REQUEST RECEIVED");
  console.log("📝 Username:", username || "not provided");
  console.log("🔑 Password:", password ? "***" : "not provided");
  console.log("⏰ Login Time:", timestamp);
  console.log("🌐 ISO Timestamp:", isoTime);
  process.stdout.write("\n");

  try {
    if (!username || !password) {
      console.log("❌ VALIDATION FAILED: Missing username or password");
      console.log("═══════════════════════════════════════════════════");
      return res.status(400).json({ 
        success: false, 
        message: "Username and password are required" 
      });
    }

    console.log("🔍 Searching for user in credentials...");
    console.log("   - Available credentials:", Object.keys(CREDENTIALS).join(", "));
    console.log("   - Looking for username:", username);
    
    // Find user in hardcoded credentials
    const userCredential = Object.values(CREDENTIALS).find(
      (cred) => cred.username === username && cred.password === password
    );

    if (!userCredential) {
      console.log("❌ AUTHENTICATION FAILED");
      console.log("   - Username not found or password incorrect");
      console.log("   - Attempted username:", username);
      console.log("   - Available usernames:", Object.values(CREDENTIALS).map(c => c.username).join(", "));
      console.log("═══════════════════════════════════════════════════");
      return res.status(401).json({ success: false, message: "Invalid username or password" });
    }

    console.log("✅ USER FOUND");
    console.log("   - User ID:", userCredential.id);
    console.log("   - Username:", userCredential.username);
    console.log("   - Role:", userCredential.role);
    
    console.log("🔨 GENERATING JWT TOKEN...");
    const tokenPayload = { 
      id: userCredential.id,
      username: userCredential.username, 
      role: userCredential.role 
    };
    console.log("   - Token payload:", JSON.stringify(tokenPayload, null, 2));
    console.log("   - Token expiration:", JWT_EXPIRATION);

    // Generate JWT token
    const token = jwt.sign(
      tokenPayload,
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    console.log("✅ JWT TOKEN GENERATED SUCCESSFULLY");
    console.log("   - Token length:", token.length, "characters");
    console.log("   - Token preview:", token.substring(0, 50) + "...");
    console.log("🎉 LOGIN SUCCESSFUL");
    console.log("   - User:", userCredential.username);
    console.log("   - Role:", userCredential.role);
    console.log("   - Login Time:", timestamp);
    console.log("═══════════════════════════════════════════════════");
    
      return res.json({
        success: true,
        message: "Login successful",
      token, // JWT token
      user: {
        username: userCredential.username,
        role: userCredential.role,
      },
    });
  } catch (error) {
    console.error("❌ LOGIN ERROR OCCURRED");
    console.error("   - Error type:", error.constructor.name);
    console.error("   - Error message:", error.message);
    console.error("   - Stack trace:", error.stack);
    console.log("═══════════════════════════════════════════════════");
    res.status(500).json({ 
      success: false, 
      message: "Server error",
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

// Verify Token Endpoint (for checking if token is valid)
app.get("/api/verify", authenticateToken, (req, res) => {
  console.log("✅ TOKEN VERIFY ENDPOINT CALLED");
  console.log("   - User authenticated:", req.user.username);
  console.log("   - Role:", req.user.role);
  console.log("═══════════════════════════════════════════════════");
  
  res.json({
    success: true,
    user: req.user,
  });
});


// Logout Endpoint - Allow logout even without valid token (for edge cases)
app.post("/api/logout", (req, res, next) => {
  // Try to authenticate, but don't fail if token is invalid
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  
  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err && user) {
        req.user = user;
      }
      // Continue even if verification fails
      next();
    });
  } else {
    next();
  }
}, (req, res) => {
  const timestamp = formatTime();
  const isoTime = new Date().toISOString();
  
  process.stdout.write("\n");
  console.log("═══════════════════════════════════════════════════");
  console.log("🚪 JWT LOGOUT REQUEST RECEIVED");
  
  if (req.user) {
    const user = req.user;
    console.log("👤 User:", user.username);
    console.log("🎭 Role:", user.role);
    console.log("🆔 User ID:", user.id);
    console.log("📝 Session Duration: Calculating...");
    
    // Calculate session duration if we have issued at time
    if (user.iat) {
      const sessionStart = new Date(user.iat * 1000);
      const sessionEnd = new Date();
      const duration = Math.floor((sessionEnd - sessionStart) / 1000); // seconds
      const hours = Math.floor(duration / 3600);
      const minutes = Math.floor((duration % 3600) / 60);
      const seconds = duration % 60;
      
      // Format session start and end times in IST
      const formatIST = (date) => {
        const utcDate = date.getUTCDate();
        const utcMonth = date.getUTCMonth();
        const utcYear = date.getUTCFullYear();
        const utcHours = date.getUTCHours();
        const utcMinutes = date.getUTCMinutes();
        const utcSeconds = date.getUTCSeconds();
        
        // Convert to IST by adding 5 hours 30 minutes
        let istHours = utcHours + 5;
        let istMinutes = utcMinutes + 30;
        let istDate = utcDate;
        let istMonth = utcMonth;
        let istYear = utcYear;
        
        // Handle minute overflow
        if (istMinutes >= 60) {
          istMinutes -= 60;
          istHours += 1;
        }
        
        // Handle hour overflow
        if (istHours >= 24) {
          istHours -= 24;
          istDate += 1;
          
          const daysInMonth = new Date(istYear, istMonth + 1, 0).getDate();
          if (istDate > daysInMonth) {
            istDate = 1;
            istMonth += 1;
            if (istMonth >= 12) {
              istMonth = 0;
              istYear += 1;
            }
          }
        }
        
        const day = String(istDate).padStart(2, '0');
        const month = String(istMonth + 1).padStart(2, '0');
        const year = String(istYear);
        const hours = String(istHours).padStart(2, '0');
        const mins = String(istMinutes).padStart(2, '0');
        const secs = String(utcSeconds).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${mins}:${secs} IST`;
      };
      
      console.log("   - Session started:", formatIST(sessionStart));
      console.log("   - Session ended:", formatIST(sessionEnd));
      console.log(`   - Duration: ${hours}h ${minutes}m ${seconds}s`);
    }
  } else {
    console.log("ℹ️  No valid token found (logout without session)");
  }
  
  console.log("⏰ Logout Time:", timestamp);
  console.log("🌐 ISO Timestamp:", isoTime);
  console.log("✅ LOGOUT SUCCESSFUL");
  console.log("   - Token invalidated on client side");
  console.log("   - User session cleared");
  console.log("═══════════════════════════════════════════════════");
  process.stdout.write("\n");
  
  res.json({
    success: true,
    message: "Logout successful",
    logoutTime: timestamp,
    isoTime: isoTime
  });
});

app.listen(5000, () => {
  console.log("\n");
  console.log("═══════════════════════════════════════════════════");
  console.log("✅ Server running on port 5000");
  console.log("📊 Detailed JWT logging enabled");
  console.log("🔐 Login endpoint: POST /api/login");
  console.log("🔒 Verify endpoint: GET /api/verify");
  console.log("🚪 Logout endpoint: POST /api/logout");
  console.log("═══════════════════════════════════════════════════");
  console.log("💡 All login/logout events will be logged with timestamps!");
  console.log("\n");
});
