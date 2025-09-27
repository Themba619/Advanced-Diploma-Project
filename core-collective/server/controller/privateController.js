const fetch = require("node-fetch");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { generateVerificationCode, getVerificationExpiry } = require('../utils/verificationUtilis');
const { sendVerificationEmail } = require('./verificationController');

console.log("Loading unified privateController with complete AI functionality...");

let aiAuthCookie, pool;

// Cache for user verification to reduce DB calls
const userCache = new Map();
const USER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function clearExpiredCache() {
  const now = Date.now();
  for (const [key, value] of userCache.entries()) {
    if (now - value.timestamp > USER_CACHE_TTL) {
      userCache.delete(key);
    }
  }
}

// Optimized user verification with caching
async function getUserWithCache(email) {
  const timer = performanceLog.startTimer(`Get User (${email})`);

  // Check cache first
  const cached = userCache.get(email);
  if (cached && Date.now() - cached.timestamp < USER_CACHE_TTL) {
    timer.end();
    return cached.user;
  }

  // Query database
  const userResult = await pool.query("SELECT id FROM users WHERE email = $1", [
    email,
  ]);

  const user = userResult.rows[0] || null;

  // Cache the result
  if (user) {
    userCache.set(email, {
      user,
      timestamp: Date.now(),
    });
  }

  const duration = timer.end();
  performanceLog.logPerformance("User Lookup", duration);

  return user;
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

function initDependencies() {
  if (!aiAuthCookie || !pool) {
    const server = require("../server");
    aiAuthCookie = server.aiAuthCookie;
    pool = server.pool;
  }
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
  const totalTimer = performanceLog.startTimer('Complete Get User Chats');
  try {
    console.log("🎯 Getting user chat sessions...");
    
    initDependencies();

    const cookie = aiAuthCookie();
    if (!cookie) {
      return res
        .status(401)
        .json({ error: "AI Auth Cookie not set. Please login first." });
    }
    
    // Debug user info
    console.log("🔍 Debug user info:", req.user);
    const userEmail = req.user.email;
    console.log("👤 Looking for chats for user email:", userEmail);

    // Get user's session IDs from user_sessions table
    const result = await pool.query(
      'SELECT session_id FROM user_sessions WHERE user_email = $1 ORDER BY created_at DESC',
      [userEmail]
    );

    const userSessionIds = result.rows.map(row => row.session_id);
    console.log("📊 Found", userSessionIds.length, "session IDs in user_sessions table");
    console.log("🆔 Session IDs:", userSessionIds);

    // If user has no sessions, return empty result
    if (userSessionIds.length === 0) {
      console.log("📭 User has no chat sessions");
      const totalDuration = totalTimer.end();
      performanceLog.logPerformance("Complete Request (Empty)", totalDuration);
      return res.json({
        message: "Chat sessions retrieved successfully",
        sessions: []
      });
    }

    // Fetch sessions with actual titles from PrivateCore API
    console.log("🌐 Fetching sessions from PrivateCore API...");
    const apiTimer = performanceLog.startTimer("PrivateCore API - Get Sessions");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(
      "https://api.privatecore.app/chat/get-user-chat-sessions",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookie,
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);
    const apiDuration = apiTimer.end();

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ PrivateCore API error:", errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    console.log("📦 Raw API response sessions count:", data.sessions?.length || 0);

    // Filter to only include user's sessions with actual titles
    const filterTimer = performanceLog.startTimer("Filter User Sessions");
    const userSessionIdSet = new Set(userSessionIds); // O(1) lookup
    let userSessions = [];

    if (data && data.sessions) {
      console.log(`📊 Total sessions from PrivateCore: ${data.sessions.length}`);

      userSessions = data.sessions.filter((session) => {
        const sessionId =
          session.id ||
          session.sessionId ||
          session.session_id ||
          session.chat_session_id;
        return userSessionIdSet.has(sessionId);
      });

      console.log(`✅ Filtered sessions count: ${userSessions.length}`);
    }

    filterTimer.end();

    // Map sessions to the format expected by frontend
    const sessions = userSessions.map(session => ({
      id: session.id || session.session_id || session.chat_session_id,
      chat_id: session.id || session.session_id || session.chat_session_id,
      title: session.name || session.title || "Chat Session", // Use actual title from PrivateCore
      created_at: session.created_at || session.time_created,
      updated_at: session.updated_at || session.time_updated || session.created_at
    }));

    console.log("📤 Sending", sessions.length, "sessions to frontend");
    console.log("📋 Mapped sessions with titles:", sessions.map(s => ({ id: s.id, title: s.title })));

    const totalDuration = totalTimer.end();
    performanceLog.logPerformance('Complete Get User Chats', totalDuration);

    res.json({
      message: "Chat sessions retrieved successfully",
      sessions: sessions
    });
  } catch (error) {
    console.error("❌ Error getting chat sessions:", error);
    const duration = timer.end();
    performanceLog.logPerformance('Get User Chats (Failed)', duration);
    res.status(500).json({ error: "Failed to get chat sessions" });
  }
};

exports.getChatSessionById = async (req, res) => {
  try {
    console.log("🎯 Getting chat session by ID...");
    
    initDependencies();

    const cookie = aiAuthCookie();
    if (!cookie) {
      return res
        .status(401)
        .json({ error: "AI Auth Cookie not set. Please login first." });
    }

    const { id } = req.params;
    const userEmail = req.user?.email || "unknown";

    console.log(`👤 User: ${userEmail} requesting session: ${id}`);

    // Verify user owns this chat session
    const userResult = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [userEmail]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const userId = userResult.rows[0].id;

    // Check if user has access to this chat session using user_sessions table
    const chatCheck = await pool.query(
      "SELECT session_id FROM user_sessions WHERE user_email = $1 AND session_id = $2",
      [userEmail, id]
    );

    if (chatCheck.rows.length === 0) {
      return res
        .status(403)
        .json({ error: "Access denied to this chat session" });
    }

    console.log(`🌐 Fetching chat session ${id} from PrivateCore API...`);
    const response = await fetch(
      `https://api.privatecore.app/chat/get-chat-session/${id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookie,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ PrivateCore API error for session ${id}:`, errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    console.log(`✅ Successfully fetched session ${id} with ${data.messages ? data.messages.length : 0} messages`);
    res.json(data);
  } catch (err) {
    console.error("❌ Failed to fetch chat session by id:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.renameChatSession = async (req, res) => {
  try {
    console.log("🎯 Renaming chat session...");
    
    initDependencies();

    const cookie = aiAuthCookie();
    if (!cookie) {
      return res
        .status(401)
        .json({ error: "AI Auth Cookie not set. Please login first." });
    }

    const userEmail = req.user?.email || "unknown";
    const { chat_session_id, name } = req.body;

    console.log(`🏷️ User: ${userEmail} renaming session: ${chat_session_id} to "${name}"`);

    if (!chat_session_id || !name) {
      return res
        .status(400)
        .json({ error: "chat_session_id and name are required." });
    }

    // Check if user has access to this chat session using user_sessions table
    const chatCheck = await pool.query(
      "SELECT session_id FROM user_sessions WHERE user_email = $1 AND session_id = $2",
      [userEmail, chat_session_id]
    );

    if (chatCheck.rows.length === 0) {
      return res
        .status(403)
        .json({ error: "Access denied to this chat session" });
    }

    console.log("🌐 Calling PrivateCore API to rename session...");
    const response = await fetch(
      "https://api.privatecore.app/chat/rename-chat-session",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookie,
        },
        body: JSON.stringify({ chat_session_id, name }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ PrivateCore API error renaming session ${chat_session_id}:`, errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    console.log(`✅ Successfully renamed session ${chat_session_id} to "${name}"`);
    res.json(data);
  } catch (err) {
    console.error("❌ Failed to rename chat session:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteChatSession = async (req, res) => {
  const timer = performanceLog.startTimer('Delete Chat Session');
  try {
    console.log("🎯 Deleting chat session...");
    
    initDependencies();
    const userEmail = req.user.email;
    const sessionId = req.params.sessionId;

    console.log("🗑️ Deleting chat session:", { userEmail, sessionId });

    // Delete from user_sessions table using user_email and session_id
    const result = await pool.query(
      'DELETE FROM user_sessions WHERE session_id = $1 AND user_email = $2 RETURNING *',
      [sessionId, userEmail]
    );

    if (result.rows.length === 0) {
      console.log("❌ Chat session not found:", { sessionId, userEmail });
      return res.status(404).json({ error: "Chat session not found" });
    }

    console.log("✅ Chat session deleted successfully:", result.rows[0]);

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
  const totalTimer = performanceLog.startTimer("Complete sendMessage");
  console.log("🎯 ENTERED sendMessage function!");

  // Clear expired cache entries periodically
  clearExpiredCache();

  try {
    initDependencies();

    const cookie = aiAuthCookie();
    if (!cookie) {
      console.log("❌ No AI Auth Cookie found");
      return res
        .status(401)
        .json({ error: "AI Auth Cookie not set. Please login first." });
    }

    const userEmail = req.user?.email || "unknown";
    const {
      chat_session_id,
      message,
      parent_message_id = null,
      alternate_assistant_id = 0,
      prompt_id = null,
      search_doc_ids = null,
      file_descriptors = [],
      user_file_ids = [],
      user_folder_ids = [],
      regenerate = false,
      retrieval_options = {
        run_search: "auto",
        real_time: true,
        filters: {
          source_type: null,
          document_set: null,
          time_cutoff: null,
          tags: [],
          user_file_ids: null,
        },
      },
      prompt_override = null,
      use_agentic_search = false,
      is_new_session = false,
    } = req.body;

    console.log(
      `👤 User: ${userEmail} sending message to session: ${chat_session_id}`
    );
    console.log(`💬 Message: ${message}`);

    if (!chat_session_id || !message) {
      return res
        .status(400)
        .json({ error: "chat_session_id and message are required." });
    }

    // OPTIMIZATION 2: Batch verification queries using user_sessions table
    const verifyTimer = performanceLog.startTimer("Chat Session Verification");
    const chatCheck = await pool.query(
      "SELECT session_id FROM user_sessions WHERE user_email = $1 AND session_id = $2",
      [userEmail, chat_session_id]
    );
    verifyTimer.end();

    if (chatCheck.rows.length === 0) {
      return res
        .status(403)
        .json({ error: "Access denied to this chat session" });
    }

    const body = {
      alternate_assistant_id,
      chat_session_id,
      parent_message_id,
      message,
      prompt_id,
      search_doc_ids,
      file_descriptors,
      user_file_ids,
      user_folder_ids,
      regenerate,
      retrieval_options,
      prompt_override,
      use_agentic_search,
    };

    console.log("🌐 Sending message to PrivateCore API...");

    // OPTIMIZATION 3: More generous timeout for AI processing
    const apiTimer = performanceLog.startTimer("PrivateCore API Call");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout - more reasonable for AI processing

    const response = await fetch(
      "https://api.privatecore.app/chat/send-message",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookie,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      }
    );

    // Time the response reading separately to identify bottlenecks
    const responseTimer = performanceLog.startTimer("Response Reading");
    let rawText = await response.text();
    const responseDuration = responseTimer.end();
    performanceLog.logPerformance("Response Reading", responseDuration);

    clearTimeout(timeoutId);
    const apiDuration = apiTimer.end();

    if (!response.ok) {
      let errorJson;
      try {
        errorJson = JSON.parse(rawText);
      } catch (e) {
        errorJson = { error: rawText };
      }
      console.error("❌ PrivateCore API error:", errorJson);
      return res.status(response.status).json(errorJson);
    }

    // OPTIMIZATION 4: Faster JSON processing with minimal logging
    const parseTimer = performanceLog.startTimer("Response Parsing");
    const lines = rawText.split(/\r?\n/).filter(Boolean);
    let fullMessage = "";
    let assistantMessage = null;
    let processedLines = 0;

    console.log(`📦 Processing ${lines.length} response lines...`);

    // Process lines more efficiently with detailed debugging
    for (const line of lines) {
      processedLines++;

      // Skip empty lines faster
      if (!line.trim()) continue;

      try {
        const packet = JSON.parse(line);

        // Debug: Log first few packets to understand structure
        if (processedLines <= 5) {
          console.log(`🔍 Packet ${processedLines}:`, JSON.stringify(packet, null, 2));
        }

        // OPTIMIZATION 5: Handle new streaming format with early content extraction
        if (
          packet.obj &&
          packet.obj.type === "reasoning_delta" &&
          packet.obj.reasoning
        ) {
          console.log(`📝 Adding content (${packet.obj.reasoning.length} chars): "${packet.obj.reasoning}"`);
          fullMessage += packet.obj.reasoning;
        }
        // Legacy format support
        else if (packet.message_type === "assistant" && packet.message) {
          assistantMessage = packet.message;
        }
        // Message completion detection
        else if (packet.obj && packet.obj.type === "message_complete") {
          assistantMessage = fullMessage;
          console.log(`🏁 Message complete! Final length: ${fullMessage.length} chars`);
          break; // Early exit when complete
        }
      } catch (e) {
        console.log(`⚠️ Failed to parse line ${processedLines}: ${line.substring(0, 100)}...`);
      }
    }

    console.log(`✅ Processed ${processedLines} lines successfully`);

    const parseDuration = parseTimer.end();
    performanceLog.logPerformance("Response Parsing", parseDuration);

    // Use accumulated message from streaming packets, fallback to legacy format
    const finalMessage = fullMessage || assistantMessage;

    const totalDuration = totalTimer.end();
    performanceLog.logPerformance("Complete Request", totalDuration);

    console.log(
      `✅ Final assembled message length: ${
        finalMessage ? finalMessage.length : 0
      } characters`
    );
    console.log("📤 Returning AI response to frontend");

    // OPTIMIZATION 6: Return response with performance metadata
    res.json({
      message: finalMessage || null,
      performance: {
        total_duration: totalDuration,
        api_duration: apiDuration,
        parse_duration: parseDuration,
        lines_processed: processedLines,
      },
    });
  } catch (err) {
    const totalDuration = totalTimer.end();
    console.error("❌ Failed to send message to model:", err);
    console.log(`⏱️  Failed request took: ${totalDuration}ms`);

    if (err.name === "AbortError") {
      return res.status(408).json({
        error:
          "The AI service is taking longer than expected (25s timeout). This might be due to high server load. Please try your request again.",
        performance: { timeout_reached: true },
      });
    }

    return res
      .status(500)
      .json({ error: err.message || "Internal server error" });
  }
};

// CREATE CHAT SESSION FAST
exports.createChatSessionFast = async (req, res) => {
  try {
    console.log("🎯 ENTERED createChatSessionFast function!");

    initDependencies();

    const cookie = aiAuthCookie();
    if (!cookie) {
      return res
        .status(401)
        .json({ error: "AI Auth Cookie not set. Please login first." });
    }

    const userEmail = req.user?.email || "unknown";
    console.log(`👤 User creating fast chat: ${userEmail}`);

    // Get user ID first
    const userResult = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [userEmail]
    );

    if (userResult.rows.length === 0) {
      console.log("❌ User not found in database");
      return res.status(404).json({ error: "User not found" });
    }

    const userId = userResult.rows[0].id;
    console.log(`👤 User ID: ${userId}`);

    console.log("🌐 Calling PrivateCore API to create fast session...");
    const response = await fetch(
      "https://api.privatecore.app/chat/create-chat-session",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookie,
        },
        body: JSON.stringify({
          persona_id: 0,
          description: "Convo",
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ PrivateCore API error:", errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    const newChatId = data.chat_session_id;

    console.log(`🆕 PrivateCore created chat session: ${newChatId}`);

    // Save the chat ID to the user in our database using user_sessions table
    try {
      await pool.query(
        "INSERT INTO user_sessions (user_email, session_id) VALUES ($1, $2)",
        [userEmail, newChatId]
      );
      console.log(
        `✅ Saved chat ${newChatId} to user ${userEmail} in user_sessions table`
      );
    } catch (dbError) {
      console.error("❌ Error saving chat to database:", dbError);
    }

    console.log("📤 Returning chat session ID to frontend");
    res.json({ chat_session_id: newChatId });
  } catch (err) {
    console.error("❌ Failed to create PrivateCore fast chat session:", err);
    res.status(500).json({ error: err.message });
  }
};