const express = require("express");
const router = express.Router();
const jwt = require('jsonwebtoken');

const privateController = require("../controller/privateController");

// Add logging middleware
router.use((req, res, next) => {
  console.log(`🚀 Private route called: ${req.method} ${req.path}`);
  // Skip authentication for registration and login routes
  if (req.path === '/register' || req.path === '/login') {
    return next();
  }
  // Check for authentication token for all other routes
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'mydevjwtsecret', (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
});

// Authentication routes (no auth required)
router.post("/register", privateController.register);
router.post("/login", privateController.login);

// Chat session routes
// Chat session routes
router.post("/createSession", privateController.createChatSession);
router.get("/getUserChatSessions", privateController.getChats);
router.get("/getChatSession/:id", privateController.getChatSessionById);
router.post("/sendMessage", privateController.sendMessage);
router.put("/renameChatSession", privateController.renameChatSession);
router.delete("/deleteChatSession/:sessionId", privateController.deleteChatSession);

// Chat history routes
router.get("/chatHistory/:sessionId", privateController.getChatHistory);
router.post("/chatHistory/:sessionId", privateController.setChatHistory);

module.exports = router;