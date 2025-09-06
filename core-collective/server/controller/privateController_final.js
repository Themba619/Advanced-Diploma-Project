const fetch = require("node-fetch");

console.log(
  "Loading FINAL privateController with complete AI functionality..."
);

let aiAuthCookie, pool;

function initDependencies() {
  if (!aiAuthCookie || !pool) {
    const server = require("../server");
    aiAuthCookie = server.aiAuthCookie;
    pool = server.pool;
  }
}

exports.getChats = async (req, res) => {
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

    // Get all chat IDs belonging to this user
    const userChatsResult = await pool.query(
      "SELECT chat_id FROM chat_sessions WHERE user_id = $1",
      [userId]
    );

    const userChatIds = userChatsResult.rows.map((row) => row.chat_id);
    console.log(
      `📋 User has ${userChatIds.length} chat sessions:`,
      userChatIds
    );

    // If user has no chats, return empty result
    if (userChatIds.length === 0) {
      console.log("📭 User has no chat sessions");
      return res.json({
        sessions: [],
        data: [],
        message: "No chat sessions found for this user",
      });
    }

    // Fetch all sessions from PrivateCore API
    console.log("🌐 Fetching sessions from PrivateCore API...");
    const response = await fetch(
      "https://api.privatecore.app/chat/get-user-chat-sessions",
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
      console.error("❌ PrivateCore API error:", errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    console.log(
      `📦 Raw API response sessions count:`,
      data.sessions?.length || 0
    );

    // Filter sessions to only include the user's chat IDs
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
        const isUserSession = userChatIds.includes(sessionId);
        if (isUserSession) {
          console.log(`✅ Found user session: ${sessionId}`);
        }
        return isUserSession;
      });

      console.log(`✅ Filtered sessions count: ${userSessions.length}`);
    }

    // Return filtered data
    const result = {
      ...data,
      sessions: userSessions,
      data: userSessions,
    };

    console.log(
      `📤 Returning ${userSessions.length} sessions to user ${userEmail}`
    );
    return res.json(result);
  } catch (err) {
    console.error("❌ Error in getChats:", err);
    res.status(500).json({ error: err.message });
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
  console.log("🎯 ENTERED sendMessage function!");

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

    console.log("🌐 Sending message to PrivateCore API...");

    // Send message to PrivateCore with timeout for better performance
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

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

    let rawText = await response.text();
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

    // Parse streaming JSON lines
    const lines = rawText.split(/\r?\n/).filter(Boolean);
    let assistantMessage = null;

    console.log(`📦 Processing ${lines.length} response lines...`);

    for (const line of lines) {
      try {
        const obj = JSON.parse(line);
        if (obj.message_type === "assistant" && obj.message) {
          assistantMessage = obj.message;
          console.log("✅ Found assistant message");
        }
      } catch (e) {
        // Ignore lines that aren't valid JSON
      }
    }

    console.log("📤 Returning AI response to frontend");
    res.json({ message: assistantMessage || null });
  } catch (err) {
    console.error("❌ Failed to send message to model:", err);

    if (err.name === "AbortError") {
      return res.status(408).json({
        error:
          "The AI service is taking longer than expected. Please try your request again.",
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
