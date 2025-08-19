const express = require("express");
const router = express.Router();

const privateController = require("../controller/privateController");

router.post("/createSession", privateController.createChatSession);
router.post("/createSessionFast", privateController.createChatSessionFast); // Fast session creation
router.get("/getUserChatSessions", privateController.getChats);
router.get("/getChatSession/:id", privateController.getChatSessionById);
router.post("/sendMessage", privateController.sendMessage);
router.put("/renameChatSession", privateController.renameChatSession);
router.post("/summarizeMessage", privateController.summarizeMessage);
router.delete(
  "/deleteChatSession/:sessionId",
  privateController.deleteChatSession
);

module.exports = router;
