require("dotenv").config();
const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const fetch = require("node-fetch");
const querystring = require("querystring");

let aiAuthCookie = null;
let loginInProgress = false;

const app = express();
const PORT = process.env.PORT || 3001;
const FILE_PATH = path.join(__dirname, "forumData.json");

// Check if AI service is enabled via environment variable
const isAIServiceEnabled = process.env.AI_SERVICE_ENABLED !== "false";

// AI Service configuration
const AI_SERVICE_URL = "https://api.privatecore.app";

// Function to login to AI service (COMMENTED OUT - using loginAndStoreCookie instead)
/*
async function loginToAIService() {
  if (loginInProgress) {
    console.log('⏳ AI service login already in progress');
    return;
  }

  try {
    loginInProgress = true;
    console.log('🔄 Logging in to AI service...');

    const loginData = querystring.stringify({
      username: "fakej710@gmail.com",
      password: "PointBreak2014!!!!",
    });

    console.log('Trying primary endpoint...');
    let response = await fetch('https://api.privatecore.app/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'CoreCollective/1.0'
      },
      body: loginData,
      timeout: 5000 // 5 second timeout
    }).catch(async (error) => {
      console.log('Primary endpoint failed, trying fallback...');
      // Try fallback endpoint
      return await fetch('https://api.privatecore.app/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'CoreCollective/1.0'
        },
        body: loginData,
        timeout: 5000
      });
    });

    // Log response headers for debugging
    console.log('Response headers:', [...response.headers.entries()]);
    
    // Check for non-200 responses
    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Error response body:', errorBody);
      throw new Error(`AI service login failed with status ${response.status}: ${errorBody}`);
    }

    // Try multiple header variations for the cookie
    const cookies = response.headers.get('set-cookie') || 
                   response.headers.get('Set-Cookie') ||
                   response.headers.get('SET-COOKIE');

    if (cookies) {
      // Extract the session cookie
      const sessionCookie = cookies.split(';')[0];
      console.log('Found cookie:', sessionCookie.split('=')[0]);
      aiAuthCookie = sessionCookie;
      console.log('✅ Successfully logged in to AI service');
    } else {
      // Try to get cookie from response body if not in headers
      try {
        const body = await response.json();
        if (body.token || body.session) {
          aiAuthCookie = body.token || body.session;
          console.log('✅ Successfully logged in to AI service using response body token');
          return;
        }
      } catch (e) {
        console.log('No token in response body');
      }
      throw new Error('No auth cookie or token received from AI service');
    }
  } catch (error) {
    console.error('❌ AI service login error:', error);
    aiAuthCookie = null;
  } finally {
    loginInProgress = false;
  }
}
*/

// Schedule periodic AI service login to keep the session fresh (COMMENTED OUT)
/*
setInterval(() => {
  if (!aiAuthCookie) {
    loginToAIService();
  }
}, 30 * 60 * 1000); // Try every 30 minutes if needed

// Initial login attempt
loginToAIService();
*/

// PostgreSQL connection with better error handling
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "corecollective",
  password: process.env.DB_PASSWORD || "postgress",
  port: process.env.DB_PORT || 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Initialize database tables
async function initDatabase() {
  try {
    // Drop existing tables if they exist to avoid conflicts
    await pool.query(`
      DROP TABLE IF EXISTS chat_messages;
      DROP TABLE IF EXISTS chat_sessions;
    `);

    // Create tables with matching types
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id),
        chat_id VARCHAR(255) UNIQUE,
        title VARCHAR(255) DEFAULT 'New Chat',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        session_id INT REFERENCES chat_sessions(id) ON DELETE CASCADE,
        user_id INT REFERENCES users(id),
        content TEXT NOT NULL,
        is_ai BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
      CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
    `);
    console.log("✅ Database tables initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing database tables:", error);
  }
}

// Call initialization
initDatabase();

// Handle connection errors
pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});

// Export cookie and pool for use in other modules
module.exports.aiAuthCookie = () => aiAuthCookie;
module.exports.pool = pool;

// Routes
const profanityRoute = require("./routes/profanityRoute");
const emailRoute = require("./routes/emailRoute");
const privateRoute = require("./routes/privateRoute");
const verificationRoute = require("./routes/verificationRoute");

// Middleware
app.use(cors());
app.use(express.json());

// JWT Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || "default_jwt_secret",
    (err, user) => {
      if (err) {
        return res.status(403).json({ error: "Invalid or expired token" });
      }
      req.user = user; // { userId, email, fullName }
      next();
    }
  );
};

app.use("/api/profanityRoute", profanityRoute);
app.use("/api/email", emailRoute);
app.use("/api/verify", verificationRoute); // Add verification routes
// Use private routes - registration doesn't need authentication
app.use("/api/private", privateRoute);

async function loginAndStoreCookie() {
  // Add a check to prevent multiple simultaneous login attempts
  if (aiAuthCookie || loginInProgress) {
    console.log("AI Auth Cookie already set or login in progress");
    return;
  }

  // Check if AI service is disabled via environment variable
  if (!isAIServiceEnabled) {
    aiAuthCookie = "DISABLED";
    console.log("AI service disabled via environment variable");
    return;
  }

  loginInProgress = true;
  const loginUrl = "https://api.privatecore.app/auth/login";

  // Use environment variables or fallback to hardcoded values
  const username = process.env.AI_SERVICE_USERNAME || "fakej710@gmail.com";
  const password = process.env.AI_SERVICE_PASSWORD || "PointBreak2014!!!!";

  if (!username || !password) {
    console.error("Missing AI service credentials");
    aiAuthCookie = "DISABLED";
    loginInProgress = false;
    return;
  }

  const loginData = querystring.stringify({
    username: username,
    password: password,
  });

  try {
    console.log("Attempting login to AI service...");
    console.log("Login URL:", loginUrl);

    const response = await fetch(loginUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "CoreCollective/1.0",
      },
      body: loginData,
      timeout: 10000, // 10 second timeout
    });

    console.log("Login response status:", response.status);

    if (response.status === 400) {
      const errorData = await response.json();
      console.error("Login failed - bad credentials:", errorData);

      // Disable AI features permanently for this session
      aiAuthCookie = "DISABLED";
      loginInProgress = false;
      console.log("AI features disabled due to authentication failure");
      return;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Login failed with response:", errorText);
      throw new Error(`Login failed: ${response.status} - ${errorText}`);
    }

    const setCookie = response.headers.get("set-cookie");
    if (setCookie) {
      aiAuthCookie = setCookie.split(";")[0];
      console.log("AI Auth Cookie set successfully");
    } else {
      console.warn("No cookie returned from login, checking response body...");
      const responseBody = await response.text();
      console.log("Response body:", responseBody);
      aiAuthCookie = "DISABLED";
    }
  } catch (error) {
    console.error("Login error details:", error.message);
    // More specific error handling
    if (error.message.includes("400")) {
      console.error(
        "400 Bad Request - likely invalid credentials or missing parameters"
      );
      console.error("Please check: username, password, and login endpoint");
    } else if (
      error.message.includes("network") ||
      error.message.includes("fetch")
    ) {
      console.error(
        "Network error - check internet connection or API availability"
      );
    }
    aiAuthCookie = "DISABLED";
  } finally {
    loginInProgress = false;
  }
}

// Test database connection function
async function testDatabaseConnection() {
  try {
    const client = await pool.connect();
    console.log("Database connected successfully");
    client.release();
    return true;
  } catch (err) {
    console.error("Database connection failed:", err.message);
    console.log("Application will continue but database features may not work");
    return false;
  }
}

// Initialize forumData.json with empty array if it doesn't exist
async function initializeFile() {
  try {
    await fs.access(FILE_PATH);
  } catch {
    await fs.writeFile(FILE_PATH, JSON.stringify([], null, 2));
  }
}

// Database check endpoint
app.get("/api/db-check", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ status: "success", time: result.rows[0].now });
  } catch (err) {
    console.error("Database connection test failed:", err);
    res.status(500).json({ status: "fail", error: err.message });
  }
});

// Database tables endpoint
app.get("/api/db-tables", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      ORDER BY table_name, ordinal_position
    `);
    res.json({ tables: result.rows });
  } catch (err) {
    console.error("Error getting tables:", err);
    res.status(500).json({ error: err.message });
  }
});

// Create necessary tables if they don't exist
app.get("/api/init-db", async (req, res) => {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create user_sessions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        session_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_email, session_id)
      )
    `);

    // Create email_verifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS email_verifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        email VARCHAR(255) NOT NULL,
        verification_code VARCHAR(10) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    res.json({
      message:
        "Database initialized successfully - users, user_sessions, and email_verifications tables created",
    });
  } catch (err) {
    console.error("Error initializing database:", err);
    res.status(500).json({ error: err.message });
  }
});

// Test endpoint for JWT authentication
app.get("/api/test-auth", authenticateToken, (req, res) => {
  res.json({
    message: "Authentication successful",
    user: req.user,
    timestamp: new Date().toISOString(),
  });
});

// Email verification function (placeholder - implement with your email service)
async function sendVerificationEmail(email, verificationCode, fullName) {
  // This is a placeholder - implement with your actual email service
  console.log(`Verification email would be sent to: ${email}`);
  console.log(`Verification code: ${verificationCode}`);
  console.log(`Recipient: ${fullName}`);

  // Example implementation with nodemailer or your email service:
  /*
  const transporter = nodemailer.createTransport({
    // your email config
  });
  
  await transporter.sendMail({
    from: 'your-app@example.com',
    to: email,
    subject: 'Verify your email address',
    html: `Your verification code is: <strong>${verificationCode}</strong>`
  });
  */
}

// --- Existing JSON file-based post and reply endpoints (untouched) ---
app.get("/posts", async (req, res) => {
  try {
    await initializeFile();
    const data = await fs.readFile(FILE_PATH, "utf8");
    res.json(JSON.parse(data));
  } catch (error) {
    console.error("Error reading posts:", error);
    res.status(500).json({ error: "Failed to read posts" });
  }
});

app.post("/posts", async (req, res) => {
  try {
    const newPost = req.body;
    if (!newPost.title || !newPost.description) {
      return res
        .status(400)
        .json({ error: "Title and description are required" });
    }
    await initializeFile();
    const data = await fs.readFile(FILE_PATH, "utf8");
    const posts = JSON.parse(data);
    posts.push(newPost);
    await fs.writeFile(FILE_PATH, JSON.stringify(posts, null, 2));
    res.status(200).json({ message: "Post added successfully", post: newPost });
  } catch (error) {
    console.error("Error saving post:", error);
    res.status(500).json({ error: "Failed to save post" });
  }
});

app.post("/posts/:postId/replies", async (req, res) => {
  const postId = parseInt(req.params.postId);
  const { content, parentReplyId } = req.body;
  const newReply = {
    id: Date.now(),
    user: "Anonymous",
    content,
    timeAgo: new Date(),
    replies: [],
    likes: 0,
    likedBy: [],
  };
  try {
    const data = await fs.readFile(FILE_PATH, "utf8");
    let posts = JSON.parse(data);
    const addNestedReply = (replies) => {
      return replies.map((reply) => {
        if (reply.id === parentReplyId) {
          return { ...reply, replies: [newReply, ...reply.replies] };
        }
        return { ...reply, replies: addNestedReply(reply.replies) };
      });
    };
    posts = posts.map((post) => {
      if (post.id === postId) {
        if (!parentReplyId) {
          post.replies.unshift(newReply);
        } else {
          post.replies = addNestedReply(post.replies);
        }
        post.chatCount++;
      }
      return post;
    });
    await fs.writeFile(FILE_PATH, JSON.stringify(posts, null, 2));
    res.status(201).json({ message: "Reply added successfully" });
  } catch (error) {
    console.error("Error saving reply:", error);
    res.status(500).json({ error: "Failed to save reply" });
  }
});

// Like/Unlike reply endpoints
app.post(
  "/posts/:postId/replies/:replyId/like",
  authenticateToken,
  async (req, res) => {
    const postId = parseInt(req.params.postId);
    const replyId = parseFloat(req.params.replyId);
    const userEmail = req.user.email;

    try {
      const data = await fs.readFile(FILE_PATH, "utf8");
      let posts = JSON.parse(data);

      const updateReplyLikes = (replies) => {
        return replies.map((reply) => {
          if (reply.id === replyId) {
            // Initialize likes fields if they don't exist
            if (!reply.likes) reply.likes = 0;
            if (!reply.likedBy) reply.likedBy = [];

            // Check if user already liked this reply
            const userIndex = reply.likedBy.indexOf(userEmail);
            if (userIndex === -1) {
              // User hasn't liked it, add like
              reply.likes++;
              reply.likedBy.push(userEmail);
            } else {
              // User already liked it, remove like (unlike)
              reply.likes--;
              reply.likedBy.splice(userIndex, 1);
            }
            return reply;
          }
          // Check nested replies
          reply.replies = updateReplyLikes(reply.replies);
          return reply;
        });
      };

      posts = posts.map((post) => {
        if (post.id === postId) {
          post.replies = updateReplyLikes(post.replies);
        }
        return post;
      });

      await fs.writeFile(FILE_PATH, JSON.stringify(posts, null, 2));
      res.status(200).json({ message: "Like status updated successfully" });
    } catch (error) {
      console.error("Error updating like:", error);
      res.status(500).json({ error: "Failed to update like" });
    }
  }
);

// Register endpoint
app.post("/api/private/register", async (req, res) => {
  const { fullName, name, email, password } = req.body;

  // Handle both fullName and name fields
  const finalFullName = fullName || name;

  // Debug logging
  console.log("Registration attempt:", {
    fullName: fullName || "undefined",
    name: name || "undefined",
    finalFullName: finalFullName || "undefined",
    email: email || "undefined",
    password: password ? "[PROVIDED]" : "undefined",
    bodyKeys: Object.keys(req.body),
  });

  if (!finalFullName || !email || !password) {
    return res.status(400).json({
      error: "All fields are required",
      received: {
        fullName: !!finalFullName,
        email: !!email,
        password: !!password,
      },
    });
  }

  // Password complexity requirements - updated to include more special characters
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      error:
        "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#)",
    });
  }

  try {
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user with is_verified set to false
    const result = await pool.query(
      "INSERT INTO users (full_name, email, password_hash, is_verified) VALUES ($1, $2, $3, $4) RETURNING id, email, is_verified",
      [finalFullName, email, passwordHash, false]
    );

    // Generate verification code (6-digit number)
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // Store verification code in database with expiration (e.g., 10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    await pool.query(
      "INSERT INTO email_verifications (user_id, email, verification_code, expires_at) VALUES ($1, $2, $3, $4)",
      [result.rows[0].id, email, verificationCode, expiresAt]
    );

    // Send verification email (you'll need to implement this function)
    try {
      await sendVerificationEmail(email, verificationCode, finalFullName);
      console.log(`Verification email sent to ${email}`);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Don't fail the registration if email fails, just log it
    }

    res.status(201).json({
      message:
        "User registered successfully. Please check your email for verification code.",
      user: {
        id: result.rows[0].id,
        email: result.rows[0].email,
        is_verified: result.rows[0].is_verified,
      },
      requires_verification: true,
    });
  } catch (err) {
    console.error("❌ DETAILED Registration error:", err);
    console.error("❌ Error message:", err.message);
    console.error("❌ Error stack:", err.stack);
    res.status(500).json({ error: "Server error during registration" });
  }
});

// Login endpoint
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  try {
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    const user = userResult.rows[0];
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // ✅ Add fullName to the JWT payload:
    const token = jwt.sign(
      { userId: user.id, email: user.email, fullName: user.full_name },
      process.env.JWT_SECRET || "default_jwt_secret",
      { expiresIn: "24h" } // Increased from 1h to 24h
    );

    res.json({
      message: "Login successful",
      token,
      user: { id: user.id, email: user.email, fullName: user.full_name },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error during login" });
  }
});

// Change Password endpoint
app.post("/api/auth/change-password", authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      error: "Current password and new password are required",
    });
  }

  // Password complexity requirements - same as registration
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({
      error:
        "New password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#)",
    });
  }

  try {
    // Get user from database using userId from JWT token
    const userResult = await pool.query("SELECT * FROM users WHERE id = $1", [
      req.user.userId,
    ]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password_hash
    );
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Check if new password is different from current password
    const isSamePassword = await bcrypt.compare(
      newPassword,
      user.password_hash
    );
    if (isSamePassword) {
      return res.status(400).json({
        error: "New password must be different from current password",
      });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // Update password in database
    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
      newPasswordHash,
      req.user.userId,
    ]);

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ error: "Server error during password change" });
  }
});

// Get user profile endpoint
app.get("/api/auth/profile", authenticateToken, async (req, res) => {
  try {
    const userResult = await pool.query(
      "SELECT id, full_name, email, created_at FROM users WHERE id = $1",
      [req.user.userId]
    );

    const user = userResult.rows[0];
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      createdAt: user.created_at,
    });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ error: "Server error while fetching profile" });
  }
});

//Verification endpoints
// Email verification endpoint
app.post("/api/private/verify-email", async (req, res) => {
  const { userId, code } = req.body;

  if (!userId || !code) {
    return res
      .status(400)
      .json({ error: "User ID and verification code are required" });
  }

  try {
    // Check if verification code is valid and not expired
    const result = await pool.query(
      `SELECT * FROM email_verifications 
       WHERE user_id = $1 AND verification_code = $2 AND expires_at > NOW()`,
      [userId, code]
    );

    if (result.rows.length === 0) {
      return res
        .status(400)
        .json({ error: "Invalid or expired verification code" });
    }

    // Update user as verified
    await pool.query("UPDATE users SET is_verified = true WHERE id = $1", [
      userId,
    ]);

    // Delete the used verification code
    await pool.query("DELETE FROM email_verifications WHERE user_id = $1", [
      userId,
    ]);

    res.json({ message: "Email verified successfully" });
  } catch (err) {
    console.error("Email verification error:", err);
    res.status(500).json({ error: "Server error during email verification" });
  }
});

// Resend verification code endpoint
app.post("/api/private/resend-verification", async (req, res) => {
  const { email, userId } = req.body;

  try {
    // Generate new verification code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Delete any existing verification codes for this user
    await pool.query("DELETE FROM email_verifications WHERE user_id = $1", [
      userId,
    ]);

    // Insert new verification code
    await pool.query(
      "INSERT INTO email_verifications (user_id, email, verification_code, expires_at) VALUES ($1, $2, $3, $4)",
      [userId, email, verificationCode, expiresAt]
    );

    // Send new verification email
    await sendVerificationEmail(email, verificationCode, "User"); // You might want to fetch the actual name

    res.json({ message: "Verification code sent successfully" });
  } catch (err) {
    console.error("Resend verification error:", err);
    res
      .status(500)
      .json({ error: "Server error while resending verification code" });
  }
});

// Start server with proper initialization sequence
app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);

  // Initialize file system
  await initializeFile();
  console.log("Forum data file initialized");

  // Test database connection
  await testDatabaseConnection();

  // Start AI service login immediately
  console.log("Starting AI service initialization...");
  await loginAndStoreCookie();

  // Also set up periodic retry (non-blocking) after a short delay
  setTimeout(() => {
    if (!aiAuthCookie) {
      console.log("Starting background AI service initialization...");
      loginAndStoreCookie()
        .then(() => {
          console.log(
            "AI service initialization completed with status:",
            aiAuthCookie === "DISABLED"
              ? "DISABLED"
              : aiAuthCookie
              ? "SUCCESS"
              : "FAILED"
          );
        })
        .catch((error) => {
          console.error("AI service initialization failed:", error.message);
        });
    }
  }, 2000);
});
