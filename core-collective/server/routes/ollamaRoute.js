const express = require("express");
const router = express.Router();
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const CHAT_HISTORY_DIR = path.join(__dirname, "../chatHistory");

// Save chat history
router.post("/save", async (req, res) => {
  try {
    let { chatId, chatData } = req.body;
    if (!chatId || !chatData)
      return res.status(400).json({ error: "chatId and chatData required" });
    // Set chat name to first user message or fallback
    const firstUserMsg = (chatData.history || []).find(
      (m) => m.sender === "user"
    );
    if (firstUserMsg && firstUserMsg.text) {
      // Use first 40 chars or first sentence as summary
      let summary = firstUserMsg.text.split(/[.!?\n]/)[0];
      if (summary.length > 40) summary = summary.slice(0, 40) + "...";
      chatData.name = summary.trim() || "Chat";
    }
    const filePath = path.join(CHAT_HISTORY_DIR, `${chatId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(chatData, null, 2));
    res.json({ message: "Chat saved" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Load all chat histories (list)
router.get("/list", (req, res) => {
  try {
    const files = fs
      .readdirSync(CHAT_HISTORY_DIR)
      .filter((f) => f.endsWith(".json"));
    const chats = files.map((f) => {
      const data = JSON.parse(
        fs.readFileSync(path.join(CHAT_HISTORY_DIR, f), "utf8")
      );
      return { id: f.replace(".json", ""), name: data.name, date: data.date };
    });
    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Load a specific chat history
router.get("/load/:chatId", (req, res) => {
  try {
    const filePath = path.join(CHAT_HISTORY_DIR, `${req.params.chatId}.json`);
    if (!fs.existsSync(filePath))
      return res.status(404).json({ error: "Chat not found" });
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Change route to root so POST /api/ollama works
router.post("/", async (req, res) => {
  try {
    const { prompt } = req.body;
    const ollamaRes = await axios.post(
      "http://localhost:11434/api/generate",
      {
        prompt,
        model: "deepseek-r1:1.5b",
      },
      {
        responseType: "stream",
      }
    );

    // Stream the Ollama response directly to the client
    ollamaRes.data.pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a chat history file
router.delete("/delete/:chatId", (req, res) => {
  try {
    const filePath = path.join(CHAT_HISTORY_DIR, `${req.params.chatId}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ message: "Chat deleted" });
    } else {
      res.status(404).json({ error: "Chat not found" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
