exports.getChatSessionById = async (req, res) => {
  try {
    const cookie = aiAuthCookie();
    if (!cookie) {
      return res
        .status(401)
        .json({ error: "AI Auth Cookie not set. Please login first." });
    }
    const sessionId = req.params.id;
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
    console.error("Failed to fetch PrivateCore chat session by id:", err);
    res.status(500).json({ error: err.message });
  }
};
const fetch = require("node-fetch");
const { aiAuthCookie } = require("../server");

exports.getChats = async (req, res) => {
  try {
    const cookie = aiAuthCookie();
    if (!cookie) {
      return res
        .status(401)
        .json({ error: "AI Auth Cookie not set. Please login first." });
    }
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
      return res.status(response.status).json({ error: errorText });
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Failed to fetch PrivateCore chat sessions:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.createChatSession = async (req, res) => {
  try {
    const cookie = aiAuthCookie();
    if (!cookie) {
      return res
        .status(401)
        .json({ error: "AI Auth Cookie not set. Please login first." });
    }
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
      return res.status(response.status).json({ error: errorText });
    }
    const data = await response.json();
    console.log("PrivateCore chat session created! ID:", data.chat_session_id);
    res.json({ chat_session_id: data.chat_session_id });
  } catch (err) {
    console.error("Failed to create PrivateCore chat session:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const cookie = aiAuthCookie();

    if (!cookie) {
      return res.status(401).json({ error: "Cookie not set." });
    }

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
      is_new_session = false, // Flag to indicate if this is a new session
    } = req.body;

    console.log("User message received:", message);

    // Summarize the user message
    if (is_new_session) {
      try {
        const summarizedMessage = await exports.summarizeMessage(message);
        console.log("Summarized message:", summarizedMessage);
      } catch (err) {
        console.error("Error summarizing message:", err);
      }
    }

    if (!chat_session_id || !message) {
      return res
        .status(400)
        .json({ error: "chat_session_id and message are required." });
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

    // If this is the first message in a new session, summarize and rename the session
    if (is_new_session) {
      try {
        // Use the summarized message to rename the chat session
        const summary = await exports.summarizeMessage(message);
        console.log("Renaming chat session with summary:", summary);

        const renameResponse = await fetch(
          "https://api.privatecore.app/chat/renameChatSession",
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ chat_session_id, name: summary }),
          }
        );

        if (!renameResponse.ok) {
          const errorText = await renameResponse.text();
          console.error("Failed to rename chat session:", errorText);
        } else {
          console.log("Chat session renamed successfully.");
        }
      } catch (err) {
        console.error("Error during renaming:", err);
      }
    } else {
      console.log(
        "Not the first message, skipping summarization and renaming."
      );
    }

    const response = await fetch(
      "https://api.privatecore.app/chat/send-message",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookie,
        },
        body: JSON.stringify(body),
      }
    );

    let rawText = await response.text();
    if (!response.ok) {
      // Try to parse as JSON
      let errorJson;
      try {
        errorJson = JSON.parse(rawText);
      } catch (e) {
        errorJson = { error: rawText };
      }
      return res.status(response.status).json(errorJson);
    }

    // Parse streaming JSON lines
    const lines = rawText.split(/\r?\n/).filter(Boolean);
    let assistantMessage = null;
    for (const line of lines) {
      try {
        const obj = JSON.parse(line);
        if (obj.message_type === "assistant" && obj.message) {
          assistantMessage = obj.message;
        }
      } catch (e) {
        // Ignore lines that aren't valid JSON
      }
    }
    res.json({ message: assistantMessage || null });
  } catch (err) {
    console.error("Failed to send message to model: ", err);
    return res
      .status(500)
      .json({ error: err.message || "Internal server error" });
  }
};

exports.renameChatSession = async (req, res) => {
  try {
    console.log("renameChatSession function called");
    console.log("Request body:", JSON.stringify(req.body, null, 2)); // Log request body

    const cookie = aiAuthCookie();
    if (!cookie) {
      return res
        .status(401)
        .json({ error: "AI Auth Cookie not set. Please login first." });
    }

    const { chat_session_id, name } = req.body;

    if (!chat_session_id || !name) {
      return res
        .status(400)
        .json({ error: "chat_session_id and name are required." });
    }

    // Use the summary as the name for renaming
    const summary = name; // Assuming the name passed is already the summary

    const response = await fetch(
      "https://api.privatecore.app/chat/rename-chat-session",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookie,
        },
        body: JSON.stringify({
          chat_session_id: chat_session_id,
          name: summary,
        }),
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

exports.summarizeMessage = async (message) => {
  try {
    const safeStringify = (obj) => {
      const seen = new WeakSet();
      return JSON.stringify(obj, (key, value) => {
        if (typeof value === "object" && value !== null) {
          if (seen.has(value)) {
            return "[Circular]";
          }
          seen.add(value);
        }
        return value;
      });
    };

    console.log("summarizeMessage function called"); // Log entry point
    console.log("Request body:", safeStringify(message)); // Safely log request body

    if (!message) {
      console.log("Message is missing in the request body"); // Log missing message
      throw new Error("Message is required for summarization.");
    }

    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MINSTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: "mistral-large-latest",
        messages: [
          {
            role: "system",
            content:
              "Create a concise three-word summary for the given message to serve as a header.",
          },
          {
            role: "user",
            content: message,
          },
        ],
        temperature: 0.7,
        max_tokens: 100,
        top_p: 0.9,
        stream: false,
      }),
    });

    console.log("API request sent"); // Log after sending API request

    const rawResponse = await response.text();
    console.log("Raw API Response:", rawResponse); // Log raw API response

    if (!response.ok) {
      console.log("API response not OK, status:", response.status); // Log API error status
      throw new Error(rawResponse);
    }

    const data = JSON.parse(rawResponse);
    console.log("Parsed API response:", data); // Log parsed API response

    // Extract the summary from the content field of the first choice
    const summary = data.choices?.[0]?.message?.content?.trim() || "New Chat";
    console.log("Extracted summary:", summary);

    return summary;
  } catch (err) {
    console.error("Error in summarizeMessage function:", err); // Log error
    throw err;
  }
};
