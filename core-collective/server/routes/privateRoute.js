const express = require("express");
const router = express.Router();

const privateController = require("../controller/privateController");

router.post("/createSession", privateController.createChatSession);
router.get("/getUserChatSessions", privateController.getChats);
router.get("/getChatSession/:id", privateController.getChatSessionById);
router.post("/sendMessage", privateController.sendMessage);
router.put("/renameChatSession", privateController.renameChatSession);
router.post("/summarizeMessage", privateController.summarizeMessage);


module.exports = router;
