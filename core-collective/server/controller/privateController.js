const fetch = require("node-fetch");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const querystring = require('querystring');
const { generateVerificationCode, getVerificationExpiry } = require('../utils/verificationUtilis');
const { sendVerificationEmail } = require('./verificationController');

console.log("Loading unified privateController with complete AI functionality...");

let aiAuthCookie, pool;

// Initialize AI service
async function initAI() {
  if (!aiAuthCookie) {
    const loginData = querystring.stringify({
      username: "fakej710@gmail.com",
      password: "PointBreak2014!!!!",
    });
    
    try {
      const response = await fetch("https://api.privatecore.app/login", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: loginData
      });
      
      if (!response.ok) {
        throw new Error(`AI login failed: ${response.status}`);
      }
      
      aiAuthCookie = response.headers.get('set-cookie');
      console.log('✅ AI service login successful');
    } catch (error) {
      console.error('❌ AI service login error:', error);
      aiAuthCookie = null;
    }
  }
}

// Performance monitoring utilities
const performanceLog = {
  startTimer: (operation) => {
    const start = Date.now();
    return {
      end: () => {
        const duration = Date.now() - start;
        console.log(`⏱️  ${operation}: ${duration}ms`);
        return duration;
      },
    };
  },
  logPerformance: (operation, duration) => {
    const status = duration < 1000 ? "🟢" : duration < 2000 ? "🟡" : "🔴";
    console.log(`${status} PERFORMANCE: ${operation} took ${duration}ms`);
    if (duration > 2000) {
      console.log(`⚠️  WARNING: ${operation} exceeded 2 second target!`);
    }
  },
};

async function initDependencies() {
  if (!pool) {
    console.log('🔄 Initializing dependencies...');
    const server = require("../server");
    pool = server.pool;
  }
  
  if (!aiAuthCookie) {
    await initAI();
  }
  
  console.log('🔑 AI Cookie Status:', aiAuthCookie ? 'Present' : 'Missing');
}

// REGISTRATION FUNCTION
exports.register = async (req, res) => {
  const timer = performanceLog.startTimer('User Registration');
  try {
    console.log("🎯 ENTERED register function!");
    
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ error: "Full name, email, and password are required" });
    }

    initDependencies();

    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      console.log(`❌ User already exists with email: ${email}`);
      return res.status(400).json({ error: "User already exists with this email" });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const verificationExpiry = getVerificationExpiry();

    // Insert user with verification data
    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, verification_code, verification_code_expires, created_at, is_verified) 
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, false) 
       RETURNING id, full_name, email, is_verified`,
      [fullName, email, hashedPassword, verificationCode, verificationExpiry]
    );

    const newUser = result.rows[0];
    console.log(`✅ New user registered: ${email} with ID: ${newUser.id}`);

    // Send verification email
    await sendVerificationEmail(email, verificationCode, fullName);

    const duration = timer.end();
    performanceLog.logPerformance('User Registration', duration);

    res.status(201).json({ 
      message: "Registration successful. Please check your email for verification code.",
      user: {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
        is_verified: newUser.is_verified
      }
    });

  } catch (error) {
    console.error("❌ Registration error:", error);
    const duration = timer.end();
    performanceLog.logPerformance('User Registration (Failed)', duration);
    res.status(500).json({ error: "Registration failed" });
  }
};

// LOGIN FUNCTION
exports.login = async (req, res) => {
  const timer = performanceLog.startTimer('User Login');
  try {
    console.log("🎯 ENTERED login function!");
    
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    initDependencies();

    // Find user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      console.log(`❌ Login failed: User not found for email: ${email}`);
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = result.rows[0];

    // Compare password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      console.log(`❌ Login failed: Invalid password for email: ${email}`);
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check if email is verified
    if (!user.is_verified) {
      console.log(`❌ Login failed: Email not verified for: ${email}`);
      return res.status(403).json({ 
        error: "Email not verified",
        message: "Please verify your email before logging in"
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, fullName: user.full_name },
      process.env.JWT_SECRET || "mydevjwtsecret",
      { expiresIn: "24h" }
    );

    const duration = timer.end();
    performanceLog.logPerformance('User Login', duration);

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        is_verified: user.is_verified
      },
      token
    });

  } catch (error) {
    console.error("❌ Login error:", error);
    const duration = timer.end();
    performanceLog.logPerformance('User Login (Failed)', duration);
    res.status(500).json({ error: "Login failed" });
  }
};

// Chat session functions
exports.createChatSession = async (req, res) => {
  const timer = performanceLog.startTimer('Create Chat Session');
  try {
    console.log("🎯 Creating new chat session...");
    
    initDependencies();
    const userId = req.user.userId;
    
    // Create chat session record
    const result = await pool.query(
      'INSERT INTO chat_sessions (user_id, title) VALUES ($1, $2) RETURNING id, title',
      [userId, 'New Chat']
    );
    
    const session = result.rows[0];
    const duration = timer.end();
    performanceLog.logPerformance('Create Chat Session', duration);

    res.json({
      message: "Chat session created successfully",
      sessionId: session.id,
      title: session.title
    });

  } catch (error) {
    console.error("❌ Error creating chat session:", error);
    const duration = timer.end();
    performanceLog.logPerformance('Create Chat Session (Failed)', duration);
    res.status(500).json({ error: "Failed to create chat session" });
  }
};

exports.getChats = async (req, res) => {
  const timer = performanceLog.startTimer('Get User Chats');
  try {
    console.log("🎯 Getting user chat sessions...");
    
    initDependencies();
    const userId = req.user.userId;

    const result = await pool.query(
      'SELECT * FROM chat_sessions WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    const duration = timer.end();
    performanceLog.logPerformance('Get User Chats', duration);

    res.json({
      message: "Chat sessions retrieved successfully",
      sessions: result.rows
    });

  } catch (error) {
    console.error("❌ Error getting chat sessions:", error);
    const duration = timer.end();
    performanceLog.logPerformance('Get User Chats (Failed)', duration);
    res.status(500).json({ error: "Failed to get chat sessions" });
  }
};

exports.getChatSessionById = async (req, res) => {
  const timer = performanceLog.startTimer('Get Chat Session By ID');
  try {
    console.log("🎯 Getting chat session by ID...");
    
    initDependencies();
    const userId = req.user.userId;
    const sessionId = req.params.id;

    const result = await pool.query(
      'SELECT * FROM chat_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Chat session not found" });
    }

    const duration = timer.end();
    performanceLog.logPerformance('Get Chat Session By ID', duration);

    res.json({
      message: "Chat session retrieved successfully",
      session: result.rows[0]
    });

  } catch (error) {
    console.error("❌ Error getting chat session:", error);
    const duration = timer.end();
    performanceLog.logPerformance('Get Chat Session By ID (Failed)', duration);
    res.status(500).json({ error: "Failed to get chat session" });
  }
};

exports.renameChatSession = async (req, res) => {
  const timer = performanceLog.startTimer('Rename Chat Session');
  try {
    console.log("🎯 Renaming chat session...");
    
    initDependencies();
    const userId = req.user.userId;
    const { sessionId, newTitle } = req.body;

    if (!newTitle) {
      return res.status(400).json({ error: "New title is required" });
    }

    const result = await pool.query(
      'UPDATE chat_sessions SET title = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [newTitle, sessionId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Chat session not found" });
    }

    const duration = timer.end();
    performanceLog.logPerformance('Rename Chat Session', duration);

    res.json({
      message: "Chat session renamed successfully",
      session: result.rows[0]
    });

  } catch (error) {
    console.error("❌ Error renaming chat session:", error);
    const duration = timer.end();
    performanceLog.logPerformance('Rename Chat Session (Failed)', duration);
    res.status(500).json({ error: "Failed to rename chat session" });
  }
};

exports.deleteChatSession = async (req, res) => {
  const timer = performanceLog.startTimer('Delete Chat Session');
  try {
    console.log("🎯 Deleting chat session...");
    
    initDependencies();
    const userId = req.user.userId;
    const sessionId = req.params.sessionId;

    // First delete messages
    await pool.query('DELETE FROM chat_messages WHERE session_id = $1', [sessionId]);

    // Then delete session
    const result = await pool.query(
      'DELETE FROM chat_sessions WHERE id = $1 AND user_id = $2 RETURNING *',
      [sessionId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Chat session not found" });
    }

    const duration = timer.end();
    performanceLog.logPerformance('Delete Chat Session', duration);

    res.json({
      message: "Chat session deleted successfully",
      session: result.rows[0]
    });

  } catch (error) {
    console.error("❌ Error deleting chat session:", error);
    const duration = timer.end();
    performanceLog.logPerformance('Delete Chat Session (Failed)', duration);
    res.status(500).json({ error: "Failed to delete chat session" });
  }
};

exports.getChatHistory = async (req, res) => {
  const timer = performanceLog.startTimer('Get Chat History');
  try {
    console.log("🎯 Getting chat history...");
    
    initDependencies();
    const userId = req.user.userId;
    const sessionId = req.params.sessionId;

    // Verify session belongs to user
    const sessionCheck = await pool.query(
      'SELECT id FROM chat_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, userId]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ error: "Chat session not found" });
    }

    const messages = await pool.query(
      'SELECT * FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC',
      [sessionId]
    );

    const duration = timer.end();
    performanceLog.logPerformance('Get Chat History', duration);

    res.json({
      message: "Chat history retrieved successfully",
      messages: messages.rows
    });

  } catch (error) {
    console.error("❌ Error getting chat history:", error);
    const duration = timer.end();
    performanceLog.logPerformance('Get Chat History (Failed)', duration);
    res.status(500).json({ error: "Failed to get chat history" });
  }
};

exports.setChatHistory = async (req, res) => {
  const timer = performanceLog.startTimer('Set Chat History');
  try {
    console.log("🎯 Setting chat history...");
    
    initDependencies();
    const userId = req.user.userId;
    const sessionId = req.params.sessionId;
    const { messages } = req.body;

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages must be an array" });
    }

    // Verify session belongs to user
    const sessionCheck = await pool.query(
      'SELECT id FROM chat_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, userId]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ error: "Chat session not found" });
    }

    // Delete existing messages
    await pool.query('DELETE FROM chat_messages WHERE session_id = $1', [sessionId]);

    // Insert new messages
    for (const message of messages) {
      await pool.query(
        'INSERT INTO chat_messages (session_id, user_id, content, is_ai) VALUES ($1, $2, $3, $4)',
        [sessionId, userId, message.content, message.isAi || false]
      );
    }

    const duration = timer.end();
    performanceLog.logPerformance('Set Chat History', duration);

    res.json({
      message: "Chat history updated successfully"
    });

  } catch (error) {
    console.error("❌ Error setting chat history:", error);
    const duration = timer.end();
    performanceLog.logPerformance('Set Chat History (Failed)', duration);
    res.status(500).json({ error: "Failed to set chat history" });
  }
};

exports.sendMessage = async (req, res) => {
  const timer = performanceLog.startTimer('Send Message');
  try {
    console.log("🎯 Sending message...");
    
    await initDependencies();
    const { sessionId, message } = req.body;
    const userId = req.user.userId;

    // Verify session belongs to user
    const sessionCheck = await pool.query(
      'SELECT id FROM chat_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, userId]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ error: "Chat session not found" });
    }

    // Store message
    await pool.query(
      'INSERT INTO chat_messages (session_id, user_id, content) VALUES ($1, $2, $3)',
      [sessionId, userId, message]
    );

    // Get AI response using private core API
    let aiResponse;
    try {
      console.log("🔍 Attempting AI request with auth cookie:", aiAuthCookie ? "Present" : "Missing");
      console.log("📝 Message being sent:", message);
      
      const endpoint = 'https://api.privatecore.app/v1/chat';
      console.log('🔗 Using AI endpoint:', endpoint);
      
      const aiResult = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cookie": aiAuthCookie,
          "User-Agent": "CoreCollective/1.0"
        },
        body: JSON.stringify({ message }),
        timeout: 10000 // 10 second timeout
      });
      
      console.log("🔄 AI service status:", aiResult.status);
      const responseText = await aiResult.text();
      console.log("📬 Raw AI response:", responseText);
      
      if (!aiResult.ok) {
        throw new Error(`AI service responded with status: ${aiResult.status}, body: ${responseText}`);
      }
      
      const aiData = JSON.parse(responseText);
      console.log("✨ Parsed AI response:", aiData);
      aiResponse = aiData.response;
      
    } catch (aiError) {
      console.error("❌ Error getting AI response:", aiError);
      aiResponse = "I apologize, but I'm having trouble processing your request right now. Please try again.";
    }

    // Store AI response
    await pool.query(
      'INSERT INTO chat_messages (session_id, user_id, content, is_ai) VALUES ($1, $2, $3, true)',
      [sessionId, userId, aiResponse]
    );

    const duration = timer.end();
    performanceLog.logPerformance('Send Message', duration);

    res.json({
      message: "Message sent successfully",
      response: aiResponse
    });

  } catch (error) {
    console.error("❌ Error sending message:", error);
    const duration = timer.end();
    performanceLog.logPerformance('Send Message (Failed)', duration);
    res.status(500).json({ error: "Failed to send message" });
  }
};