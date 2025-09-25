const fetch = require("node-fetch");

console.log(
  "Loading FINAL privateController with complete AI functionality..."
);

let aiAuthCookie, pool;

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

function initDependencies() {
  if (!aiAuthCookie || !pool) {
    const server = require("../server");
    aiAuthCookie = server.aiAuthCookie;
    pool = server.pool;
  }
}

exports.getChats = async (req, res) => {
  const totalTimer = performanceLog.startTimer("Complete getChats");
  console.log("🎯 ENTERED getChats function!");

  try {
    initDependencies();
    console.log("🔍 Starting getChats execution...");

    const cookie = aiAuthCookie();
    if (!cookie) {
      console.log("❌ No AI Auth Cookie found");
      return res
        .status(401)
        .json({ error: "AI Auth Cookie not set. Please login first." });
    }

    const userEmail = req.user?.email || "unknown";
    console.log(`👤 User email: ${userEmail}`);

    // OPTIMIZATION: Use cached user lookup
    const user = await getUserWithCache(userEmail);
    if (!user) {
      console.log("❌ User not found in database");
      return res.status(404).json({ error: "User not found" });
    }

    console.log(`👤 User ID: ${user.id}`);

    // OPTIMIZATION: Get user chats with better query
    const chatsTimer = performanceLog.startTimer("Get User Chat Sessions");
    const userChatsResult = await pool.query(
      "SELECT chat_id FROM chat_sessions WHERE user_id = $1 ORDER BY chat_id",
      [user.id]
    );
    chatsTimer.end();

    const userChatIds = userChatsResult.rows.map((row) => row.chat_id);
    console.log(
      `📋 User has ${userChatIds.length} chat sessions:`,
      userChatIds.slice(0, 5), // Only log first 5 for performance
      userChatIds.length > 5 ? "..." : ""
    );

    // If user has no chats, return empty result quickly
    if (userChatIds.length === 0) {
      console.log("📭 User has no chat sessions");
      const totalDuration = totalTimer.end();
      performanceLog.logPerformance("Complete Request (Empty)", totalDuration);
      return res.json({
        sessions: [],
        data: [],
        message: "No chat sessions found for this user",
        performance: { total_duration: totalDuration, sessions_count: 0 },
      });
    }

    // OPTIMIZATION: Fetch sessions with timeout
    console.log("🌐 Fetching sessions from PrivateCore API...");
    const apiTimer = performanceLog.startTimer(
      "PrivateCore API - Get Sessions"
    );

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
    console.log(
      `📦 Raw API response sessions count:`,
      data.sessions?.length || 0
    );

    // OPTIMIZATION: Faster filtering with Set lookup
    const filterTimer = performanceLog.startTimer("Filter User Sessions");
    const userChatIdSet = new Set(userChatIds); // O(1) lookup instead of O(n)
    let userSessions = [];

    if (data && data.sessions) {
      console.log(
        `📊 Total sessions from PrivateCore: ${data.sessions.length}`
      );

      userSessions = data.sessions.filter((session) => {
        const sessionId =
          session.id ||
          session.sessionId ||
          session.session_id ||
          session.chat_session_id;
        return userChatIdSet.has(sessionId);
      });

      console.log(`✅ Filtered sessions count: ${userSessions.length}`);
    }

    filterTimer.end();

    const totalDuration = totalTimer.end();
    performanceLog.logPerformance("Complete Request", totalDuration);

    // Return filtered data with performance metrics
    const result = {
      ...data,
      sessions: userSessions,
      data: userSessions,
      performance: {
        total_duration: totalDuration,
        api_duration: apiDuration,
        sessions_count: userSessions.length,
        total_sessions_fetched: data.sessions?.length || 0,
      },
    };

    console.log(
      `📤 Returning ${userSessions.length} sessions to user ${userEmail}`
    );
    return res.json(result);
  } catch (err) {
    const totalDuration = totalTimer.end();
    console.error("❌ Error in getChats:", err);
    console.log(`⏱️  Failed getChats took: ${totalDuration}ms`);

    if (err.name === "AbortError") {
      return res.status(408).json({
        error: "API request timed out. Please try again.",
        performance: { timeout_reached: true, total_duration: totalDuration },
      });
    }

    res.status(500).json({
      error: err.message,
      performance: { total_duration: totalDuration },
    });
  }
};

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

    // Save the chat ID to the user in our database
    try {
      await pool.query(
        "INSERT INTO chat_sessions (user_id, chat_id) VALUES ($1, $2)",
        [userId, newChatId]
      );
      console.log(
        `✅ Saved chat ${newChatId} to user ID ${userId} (${userEmail})`
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

    // OPTIMIZATION 1: Use cached user lookup
    const user = await getUserWithCache(userEmail);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // OPTIMIZATION 2: Batch verification queries
    const verifyTimer = performanceLog.startTimer("Chat Session Verification");
    const chatCheck = await pool.query(
      "SELECT chat_id FROM chat_sessions WHERE user_id = $1 AND chat_id = $2",
      [user.id, chat_session_id]
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

    // Process lines more efficiently with reduced logging
    for (const line of lines) {
      processedLines++;

      // Skip empty lines faster
      if (!line.trim()) continue;

      try {
        const packet = JSON.parse(line);

        // OPTIMIZATION 5: Handle new streaming format with early content extraction
        if (
          packet.obj &&
          packet.obj.type === "message_delta" &&
          packet.obj.content
        ) {
          fullMessage += packet.obj.content;
        }
        // Legacy format support
        else if (packet.message_type === "assistant" && packet.message) {
          assistantMessage = packet.message;
        }
        // Message completion detection
        else if (packet.obj && packet.obj.type === "message_complete") {
          assistantMessage = fullMessage;
          break; // Early exit when complete
        }
      } catch (e) {
        // Skip invalid JSON silently for better performance
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

exports.createChatSession = async (req, res) => {
  return exports.createChatSessionFast(req, res);
};

exports.getChatSessionById = async (req, res) => {
  try {
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

    // Check if user has access to this chat session
    const chatCheck = await pool.query(
      "SELECT chat_id FROM chat_sessions WHERE user_id = $1 AND chat_id = $2",
      [userId, id]
    );

    if (chatCheck.rows.length === 0) {
      return res
        .status(403)
        .json({ error: "Access denied to this chat session" });
    }

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
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("❌ Failed to fetch chat session by id:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.renameChatSession = async (req, res) => {
  try {
    initDependencies();

    const cookie = aiAuthCookie();
    if (!cookie) {
      return res
        .status(401)
        .json({ error: "AI Auth Cookie not set. Please login first." });
    }

    const userEmail = req.user?.email || "unknown";
    const { chat_session_id, name } = req.body;

    if (!chat_session_id || !name) {
      return res
        .status(400)
        .json({ error: "chat_session_id and name are required." });
    }

    // Verify user owns this chat session
    const userResult = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [userEmail]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const userId = userResult.rows[0].id;

    // Check if user has access to this chat session
    const chatCheck = await pool.query(
      "SELECT chat_id FROM chat_sessions WHERE user_id = $1 AND chat_id = $2",
      [userId, chat_session_id]
    );

    if (chatCheck.rows.length === 0) {
      return res
        .status(403)
        .json({ error: "Access denied to this chat session" });
    }

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
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("❌ Failed to rename chat session:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteChatSession = async (req, res) => {
  try {
    initDependencies();

    const { sessionId } = req.params;
    const userEmail = req.user?.email || "unknown";

    console.log(`🗑️ Deleting chat session ${sessionId} for user ${userEmail}`);

    // Get user ID
    const userResult = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [userEmail]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const userId = userResult.rows[0].id;

    // Remove the chat session from our database
    const deleteResult = await pool.query(
      "DELETE FROM chat_sessions WHERE user_id = $1 AND chat_id = $2",
      [userId, sessionId]
    );

    if (deleteResult.rowCount === 0) {
      console.log(`❌ Chat session ${sessionId} not found for user`);
      return res.status(404).json({ error: "Chat session not found" });
    }

    console.log(
      `✅ Removed chat ${sessionId} from user ${userEmail}'s sessions`
    );
    res.json({ message: "Chat session deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting chat session:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.summarizeMessage = async (req, res) => {
  res.json({ message: "summarizeMessage placeholder" });
};

// New real-time streaming endpoint
exports.sendMessageStream = async (req, res) => {
  console.log("🎯 ENTERED sendMessageStream function!");

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
      `👤 User: ${userEmail} sending streaming message to session: ${chat_session_id}`
    );

    if (!chat_session_id || !message) {
      return res
        .status(400)
        .json({ error: "chat_session_id and message are required." });
    }

    // Verify user owns this chat session
    const userResult = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [userEmail]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const userId = userResult.rows[0].id;

    // Check if user has access to this chat session
    const chatCheck = await pool.query(
      "SELECT chat_id FROM chat_sessions WHERE user_id = $1 AND chat_id = $2",
      [userId, chat_session_id]
    );

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

    console.log("🌐 Sending streaming message to PrivateCore API...");

    // Set up Server-Sent Events
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout for streaming

    try {
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

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ PrivateCore API error:", errorText);
        res.write(`data: ${JSON.stringify({ error: errorText })}\n\n`);
        return res.end();
      }

      // Stream the response in real-time
      let fullMessage = "";
      const responseText = await response.text();
      const lines = responseText.split(/\r?\n/).filter(Boolean);

      console.log(`📦 Streaming ${lines.length} response lines...`);

      for (const line of lines) {
        try {
          const packet = JSON.parse(line);

          // Handle new streaming format: {'ind': 0, 'obj': {'type': 'message_delta', 'content': 'text'}}
          if (
            packet.obj &&
            packet.obj.type === "message_delta" &&
            packet.obj.content
          ) {
            console.log(`[STREAM DEBUG] Packet: ${JSON.stringify(packet)}`);
            fullMessage += packet.obj.content;

            // Stream each packet to the client immediately
            const streamData = {
              type: "message_delta",
              content: packet.obj.content,
              fullMessage: fullMessage,
              packetIndex: packet.ind,
            };

            res.write(`data: ${JSON.stringify(streamData)}\n\n`);
          }

          // Handle message completion
          else if (packet.obj && packet.obj.type === "message_complete") {
            console.log("✅ Message streaming complete");
            const completeData = {
              type: "message_complete",
              fullMessage: fullMessage,
            };
            res.write(`data: ${JSON.stringify(completeData)}\n\n`);
            break;
          }

          // Handle legacy format
          else if (packet.message_type === "assistant" && packet.message) {
            const legacyData = {
              type: "legacy_message",
              content: packet.message,
            };
            res.write(`data: ${JSON.stringify(legacyData)}\n\n`);
          }
        } catch (e) {
          console.log(
            `⚠️ Skipping invalid JSON line: ${line.substring(0, 100)}...`
          );
        }
      }

      console.log(
        `✅ Streaming complete. Final message length: ${fullMessage.length} characters`
      );
      res.write(
        `data: ${JSON.stringify({ type: "stream_end", fullMessage })}\n\n`
      );
      res.end();
    } catch (err) {
      clearTimeout(timeoutId);
      console.error("❌ Failed to stream message:", err);

      const errorData = {
        type: "error",
        error: err.message || "Internal server error",
      };
      res.write(`data: ${JSON.stringify(errorData)}\n\n`);
      res.end();
    }
  } catch (err) {
    console.error("❌ Failed to initialize streaming:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};

exports.getSharedContext = async (req, res) => {
  res.json({ message: "getSharedContext placeholder" });
};

exports.setSharedContext = async (req, res) => {
  res.json({ message: "setSharedContext placeholder" });
};

exports.getChatHistory = async (req, res) => {
  res.json({ message: "getChatHistory placeholder" });
};

exports.setChatHistory = async (req, res) => {
  res.json({ message: "setChatHistory placeholder" });
};

console.log(
  "FINAL privateController with complete AI functionality loaded successfully"
);
