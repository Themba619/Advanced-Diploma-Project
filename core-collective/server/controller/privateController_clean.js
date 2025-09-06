const fetch = require("node-fetch");
const { aiAuthCookie, pool } = require("../server");

console.log("Loading CLEAN privateController...");

exports.getChats = async (req, res) => {
  console.log("🎯 ENTERED getChats function!");

  try {
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

    // Get all session IDs belonging to this user
    const userSessionsResult = await pool.query(
      "SELECT session_id FROM user_sessions WHERE user_email = $1",
      [userEmail]
    );

    const userSessionIds = userSessionsResult.rows.map((row) => row.session_id);
    console.log(
      `📋 User has ${userSessionIds.length} mapped sessions:`,
      userSessionIds
    );

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
    console.log(`📦 Raw API response:`, JSON.stringify(data, null, 2));

    // Filter sessions to only include the user's sessions
    let userSessions = [];
    if (data && data.sessions) {
      console.log(
        `📊 Total sessions before filtering: ${data.sessions.length}`
      );

      userSessions = data.sessions.filter((session) => {
        const sessionId = session.id || session.sessionId || session.session_id;
        const isUserSession = userSessionIds.includes(sessionId);
        console.log(
          `🔍 Checking session: ${sessionId} - belongs to user: ${isUserSession}`
        );
        return isUserSession;
      });

      console.log(`✅ Filtered sessions count: ${userSessions.length}`);
    }

    // Return filtered data
    const result = {
      ...data,
      sessions: userSessions,
      data: userSessions, // Also provide in 'data' format for compatibility
    };

    console.log(`📤 Returning filtered data:`, JSON.stringify(result, null, 2));
    return res.json(result);
  } catch (err) {
    console.error("❌ Error in getChats:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.createChatSession = async (req, res) => {
  try {
    console.log("🎯 ENTERED createChatSession function!");

    const cookie = aiAuthCookie();
    if (!cookie) {
      return res
        .status(401)
        .json({ error: "AI Auth Cookie not set. Please login first." });
    }

    const userEmail = req.user?.email || "unknown";
    console.log(`👤 User creating chat: ${userEmail}`);

    // Create chat session with PrivateCore API (it will generate its own ID)
    console.log("🌐 Calling PrivateCore API to create session...");
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
    const newSessionId = data.chat_session_id;

    console.log(`🆕 PrivateCore created session: ${newSessionId}`);

    // Now map this session to the user in our database
    try {
      await pool.query(
        "INSERT INTO user_sessions (user_email, session_id) VALUES ($1, $2)",
        [userEmail, newSessionId]
      );
      console.log(`✅ Mapped session ${newSessionId} to user ${userEmail}`);
    } catch (dbError) {
      console.error("❌ Error mapping session to user:", dbError);
      // Don't fail the request if mapping fails, just log it
    }

    console.log("📤 Returning session ID to frontend");
    res.json({ chat_session_id: newSessionId });
  } catch (err) {
    console.error("❌ Failed to create PrivateCore chat session:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.createChatSessionFast = async (req, res) => {
  try {
    console.log("🎯 ENTERED createChatSessionFast function!");

    const cookie = aiAuthCookie();
    if (!cookie) {
      return res
        .status(401)
        .json({ error: "AI Auth Cookie not set. Please login first." });
    }

    const userEmail = req.user?.email || "unknown";
    console.log(`👤 User creating fast chat: ${userEmail}`);

    // Add timeout for faster response
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

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
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ PrivateCore API error:", errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    const newSessionId = data.chat_session_id;

    console.log(`🆕 PrivateCore created fast session: ${newSessionId}`);

    // Now map this session to the user in our database
    try {
      await pool.query(
        "INSERT INTO user_sessions (user_email, session_id) VALUES ($1, $2)",
        [userEmail, newSessionId]
      );
      console.log(
        `✅ Mapped fast session ${newSessionId} to user ${userEmail}`
      );
    } catch (dbError) {
      console.error("❌ Error mapping fast session to user:", dbError);
      // Don't fail the request if mapping fails, just log it
    }

    console.log("📤 Returning fast session ID to frontend");
    res.json({ chat_session_id: newSessionId });
  } catch (err) {
    if (err.name === "AbortError") {
      console.error("❌ Session creation timeout");
      return res
        .status(408)
        .json({ error: "Session creation timeout. Please try again." });
    }
    console.error("❌ Failed to create PrivateCore fast chat session:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getChatSessionById = async (req, res) => {
  try {
    const cookie = aiAuthCookie();
    if (!cookie) {
      return res
        .status(401)
        .json({ error: "AI Auth Cookie not set. Please login first." });
    }

    const sessionId = req.params.id;
    const userEmail = req.user?.email;

    const response = await fetch(
      `https://api.privatecore.app/chat/get-chat-session/${sessionId}`,
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
    console.error("Failed to get chat session:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const cookie = aiAuthCookie();
    if (!cookie) {
      return res
        .status(401)
        .json({ error: "AI Auth Cookie not set. Please login first." });
    }

    const response = await fetch(
      "https://api.privatecore.app/chat/send-message",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookie,
        },
        body: JSON.stringify(req.body),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Failed to send message:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.renameChatSession = async (req, res) => {
  try {
    const cookie = aiAuthCookie();
    if (!cookie) {
      return res
        .status(401)
        .json({ error: "AI Auth Cookie not set. Please login first." });
    }

    const response = await fetch(
      "https://api.privatecore.app/chat/rename-chat-session",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookie,
        },
        body: JSON.stringify(req.body),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Failed to rename chat session:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.summarizeMessage = async (req, res) => {
  try {
    const cookie = aiAuthCookie();
    if (!cookie) {
      return res
        .status(401)
        .json({ error: "AI Auth Cookie not set. Please login first." });
    }

    const response = await fetch(
      "https://api.privatecore.app/chat/summarize-message",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookie,
        },
        body: JSON.stringify(req.body),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Failed to summarize message:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteChatSession = async (req, res) => {
  try {
    const cookie = aiAuthCookie();
    if (!cookie) {
      return res
        .status(401)
        .json({ error: "AI Auth Cookie not set. Please login first." });
    }

    const sessionId = req.params.sessionId;
    const userEmail = req.user?.email;

    if (!sessionId) {
      return res.status(400).json({ error: "Session ID is required." });
    }

    const response = await fetch(
      `https://api.privatecore.app/chat/delete-chat-session/${sessionId}`,
      {
        method: "DELETE",
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

    // Remove from database
    if (pool && userEmail) {
      try {
        await pool.query(
          "DELETE FROM user_sessions WHERE user_email = $1 AND session_id = $2",
          [userEmail, sessionId]
        );
      } catch (dbErr) {
        console.error("Error removing session from database:", dbErr);
      }
    }

    res.json({ message: "Chat session deleted successfully" });
  } catch (err) {
    console.error("Failed to delete chat session:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getSharedContext = async (req, res) => {
  try {
    const cookie = aiAuthCookie();
    if (!cookie) {
      return res
        .status(401)
        .json({ error: "AI Auth Cookie not set. Please login first." });
    }

    const response = await fetch("https://api.privatecore.app/shared-context", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Failed to get shared context:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.setSharedContext = async (req, res) => {
  try {
    const cookie = aiAuthCookie();
    if (!cookie) {
      return res
        .status(401)
        .json({ error: "AI Auth Cookie not set. Please login first." });
    }

    const response = await fetch("https://api.privatecore.app/shared-context", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Failed to set shared context:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getChatHistory = async (req, res) => {
  try {
    const cookie = aiAuthCookie();
    if (!cookie) {
      return res
        .status(401)
        .json({ error: "AI Auth Cookie not set. Please login first." });
    }

    const sessionId = req.params.sessionId;
    const response = await fetch(
      `https://api.privatecore.app/chat/get-chat-history/${sessionId}`,
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
    console.error("Failed to get chat history:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.setChatHistory = async (req, res) => {
  try {
    const cookie = aiAuthCookie();
    if (!cookie) {
      return res
        .status(401)
        .json({ error: "AI Auth Cookie not set. Please login first." });
    }

    const sessionId = req.params.sessionId;
    const response = await fetch(
      `https://api.privatecore.app/chat/set-chat-history/${sessionId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookie,
        },
        body: JSON.stringify(req.body),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Failed to set chat history:", err);
    res.status(500).json({ error: err.message });
  }
};

console.log("CLEAN privateController loaded successfully");
