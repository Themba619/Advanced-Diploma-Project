const express = require("express");
const router = express.Router();

const privateController = require("../controller/privateController_final");

// Add logging middleware
router.use((req, res, next) => {
  console.log(`🚀 Private route called: ${req.method} ${req.path}`);
  console.log(`👤 User:`, req.user ? req.user.email : "Not authenticated");
  next();
});

router.post("/createSession", privateController.createChatSession);
router.post("/createSessionFast", privateController.createChatSessionFast); // Fast session creation
router.get("/getUserChatSessions", async (req, res) => {
  try {
    console.log("🎯 About to call privateController.getChats");
    await privateController.getChats(req, res);
  } catch (error) {
    console.error("❌ Error in getUserChatSessions route:", error);
    res
      .status(500)
      .json({ error: "Internal server error in getUserChatSessions" });
  }
});
router.get("/getChatSession/:id", privateController.getChatSessionById);
router.post("/sendMessage", privateController.sendMessage);
router.post("/sendMessageStream", privateController.sendMessageStream); // New streaming endpoint
router.put("/renameChatSession", privateController.renameChatSession);
router.post("/summarizeMessage", privateController.summarizeMessage);
router.delete(
  "/deleteChatSession/:sessionId",
  privateController.deleteChatSession
);

// Shared context routes
router.get("/shared_context", privateController.getSharedContext);
router.post("/shared_context", privateController.setSharedContext);

// Chat history routes
router.get("/chatHistory/:sessionId", privateController.getChatHistory);
router.post("/chatHistory/:sessionId", privateController.setChatHistory);

module.exports = router;
