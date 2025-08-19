import React, { useState, useRef, useEffect, useCallback } from "react";
import ChatHistoryPopup from "../components/ChatHistoryPopup";
import { AlertDialog } from "../components/ui/alert-dialog";
import { useToast } from "../hooks/use-toast";
import "../styles/HomeStyles/Home.css";
import { FaHistory, FaUserCircle, FaRobot, FaTrash } from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

// Animated 3-dot waiting indicator
const VirtualAssistWaiting = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-end",
      gap: "8px",
      padding: "10px",
      width: "80px",
      margin: "0 auto",
    }}
  >
    {[0, 0.2, 0.4].map((delay, i) => (
      <div
        key={i}
        style={{
          width: "14px",
          height: "14px",
          borderRadius: "50%",
          backgroundColor: "#555",
          animation: `bounce 1.2s infinite ease-in-out`,
          animationDelay: `${delay}s`,
        }}
      />
    ))}
  </div>
);

const Home = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      text: "Hello! I'm VirtualAssist, your AI assistant. How can I help you today?",
      sender: "bot",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [showHistory, setShowHistory] = useState(false);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [waitingForBot, setWaitingForBot] = useState(false);
  const [displayedBotMsg, setDisplayedBotMsg] = useState("");
  const [chatSessionId, setChatSessionId] = useState(null);

  const chatEndRef = useRef(null);
  const userInputRef = useRef(null);

  // Track if a session has already been created to prevent duplicate creation
  const [sessionCreated, setSessionCreated] = useState(false);

  // On initial load, fetch existing PrivateCore chat sessions and use the latest if available
  useEffect(() => {
    async function fetchChats() {
      try {
        const res = await fetch("http://localhost:3001/api/private/getUserChatSessions");
        if (!res.ok) throw new Error("Failed to fetch chat sessions");
        const data = await res.json();
        const sessions = data.sessions || [];
        console.log("Retrieved sessions:", sessions);
        setChats(sessions);
        // Do not set any session as active on initial load
        setChatSessionId(null);
        setSessionCreated(false);
        setActiveChat(null);
        setMessages([
          {
            text: "Hello! I'm VirtualAssist, your AI assistant. How can I help you today?",
            sender: "bot",
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      } catch (err) {
        console.error("Failed to fetch chat sessions:", err);
      }
    }
    fetchChats();
  }, []);

  // Create a new chat session using the new controller
  // const handleNewChat = async () => {
  //   // Only create a new session if there is no active session
  //   if (chatSessionId) {
  //     // Optionally, you can show a message or just return
  //     return;
  //   }
  //   // Clear session and chat state before creating a new session
  //   setChatSessionId(null);
  //   setActiveChat(null);
  //   setMessages([
  //     {
  //       text: "Hello! I'm VirtualAssist, your AI assistant. How can I help you today?",
  //       sender: "bot",
  //       time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  //     },
  //   ]);
  //   try {
  //     const response = await fetch("http://localhost:3001/api/private/createSession", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         persona_id: 0,
  //         description: "Convo",
  //       }),
  //     });
  //     if (!response.ok) throw new Error("Failed to create chat session");
  //     const data = await response.json();
  //     setChatSessionId(data.chat_session_id);
  //     setSessionCreated(true);
  //     const newSessionId = data.chat_session_id;
  //     const today = new Date().toISOString().slice(0, 10);
  //     const newChat = {
  //       id: newSessionId,
  //       name: "New Chat",
  //       date: today,
  //       history: [],
  //       last_message: "",
  //       time_updated: new Date().toISOString(),
  //       current_alternate_model: null,
  //     };
  //     setChats((prev) => [newChat, ...prev]);
  //     setActiveChat(newSessionId);
  //     setShowHistory(false);
  //   } catch (err) {
  //     console.error("Failed to create chat session:", err);
  //   }
  // };

  

  const handleNewChat = async () => {
    try {
      // Reload the page to reset all states
      window.location.reload();
      return;

      // Create new session
      const response = await fetch("http://localhost:3001/api/private/createSession", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona_id: 0,
          description: "Convo",
        }),
      });

      if (!response.ok) throw new Error("Failed to create chat session");
      const data = await response.json();
      const newSessionId = data.chat_session_id;

      // Update states with new session
      setChatSessionId(newSessionId);
      setActiveChat(newSessionId);
      setSessionCreated(false); // Reset session created flag
      
      // Add new chat to list
      const today = new Date().toISOString().slice(0, 10);
      const newChat = {
        id: newSessionId,
        name: "New Chat",
        date: today,
        history: [],
        last_message: "",
        time_updated: new Date().toISOString(),
        current_alternate_model: null,
      };
      setChats((prev) => [newChat, ...prev]);
      setShowHistory(false);
      console.log("New chat session created with new ID");
    } catch (err) {
      console.error("Failed to create new chat:", err);
      setSessionCreated(false); // Reset sessionCreated if creation fails
    }
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, displayedBotMsg]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = {
      text: input,
      sender: "user",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setInput("");
    setIsTyping(true);
    setWaitingForBot(true);
    setDisplayedBotMsg("");

    // Add a processing message for longer requests
    setTimeout(() => {
      if (waitingForBot) {
        setDisplayedBotMsg("Processing your request... This may take a moment for complex queries.");
      }
    }, 5000); // Show message after 5 seconds

    let sessionId = chatSessionId;
    let newSessionCreated = false;

    // Only create a new session if there is no session id for the current view
    if (!sessionId) {
      newSessionCreated = true; // Set this before creating the session
      try {
        // Use fast session creation with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout for session creation

        const response = await fetch("http://localhost:3001/api/private/createSessionFast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ persona_id: 0, description: "Convo" }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) throw new Error("Failed to create chat session");
        const data = await response.json();
        sessionId = data.chat_session_id;
        console.log("Fast session was created with new Id");
        setChatSessionId(sessionId);
        setSessionCreated(true);
        setActiveChat(sessionId);
        // Add new chat to chats list
        const today = new Date().toISOString().slice(0, 10);
        const newChat = {
          id: sessionId,
          name: "Undefined",
          date: today,
          history: [],
          last_message: "",
          time_updated: new Date().toISOString(),
          current_alternate_model: null,
        };
        setChats((prev) => [newChat, ...prev]);
        newSessionCreated = true;
      } catch (err) {
        if (err.name === 'AbortError') {
          setMessages((prev) => [
            ...prev,
            {
              text: "Session creation timed out. Please try again.",
              sender: "bot",
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              text: "Failed to create chat session.",
              sender: "bot",
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          ]);
        }
        setWaitingForBot(false);
        setIsTyping(false);
        return;
      }
    } else {
      // If sessionId already exists, use it and do NOT create a new session
      // sessionId is already set
    }

    // Add user message to chat
    setMessages((prev) => [...prev, userMsg]);
    // Update chat history for this session
    setChats((prevChats) => {
      // If chat exists, update its history and last_message
      const chatExists = prevChats.some((chat) => chat.id === sessionId);
      if (chatExists) {
        return prevChats.map((chat) =>
          chat.id === sessionId
            ? {
                ...chat,
                history: chat.history ? [...chat.history, userMsg] : [userMsg],
                last_message: userMsg.text,
                time_updated: new Date().toISOString(),
              }
            : chat
        );
      } else {
        // If not, add new chat
        const today = new Date().toISOString().slice(0, 10);
        return [
          {
            id: sessionId,
            name: "New Chat",
            date: today,
            history: [userMsg],
            last_message: userMsg.text,
            time_updated: new Date().toISOString(),
            current_alternate_model: null,
          },
          ...prevChats,
        ];
      }
    });

    // If this is the first message in a new chat, handle renaming asynchronously
    if (newSessionCreated) {
      console.log("New Session has been created")
      // Don't await this - let it run in background for better performance
      fetch("http://localhost:3001/api/private/renameChatSession", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_session_id: sessionId, name: userMsg.text }),
      }).then(response => {
        if (response.ok) {
          setChats((prevChats) =>
            prevChats.map((chat) =>
              chat.id === sessionId ? { ...chat, name: userMsg.text } : chat
            )
          );
          console.log("Chat renamed successfully");
        }
      }).catch(err => {
        console.log(`Rename Error: ${err}`);
      });
    }

    // After sending a message, allow starting a new chat again
    // setChatSessionId(null);

    try {
      // Send message to PrivateCore AI with timeout for better performance
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout

      const messageBody = {
        alternate_assistant_id: 0,
        chat_session_id: sessionId,
        parent_message_id: null,
        message: input,
        prompt_id: null,
        search_doc_ids: null,
        file_descriptors: [],
        user_file_ids: [],
        user_folder_ids: [],
        regenerate: false,
        retrieval_options: {
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
        prompt_override: null,
        use_agentic_search: false,
        is_new_session: newSessionCreated,
      };

      const response = await fetch("http://localhost:3001/api/private/sendMessage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messageBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let data;
      let botReply = "";
      if (!response.ok) {
        // Try to get error message from backend
        try {
          data = await response.json();
          botReply = data.error || data.message || `API error: ${response.status}`;
        } catch (e) {
          botReply = `API error: ${response.status}`;
        }
        // Log backend error for debugging
        console.error("Backend error:", botReply);
        setMessages((prev) => [
          ...prev,
          {
            text: botReply,
            sender: "bot",
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
        setWaitingForBot(false);
        setIsTyping(false);
        return;
      }
      data = await response.json();
      botReply = data.message || "Sorry, I didn't get a response.";

      setWaitingForBot(false);

      // After getting bot response, handle any remaining async operations
      if (newSessionCreated) {
        // Update UI immediately with user message as chat name
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.id === sessionId ? { ...chat, name: userMsg.text } : chat
          )
        );
      }

      // Save bot message to chat history
      const botMsg = {
        text: botReply,
        sender: "bot",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setChats((prevChats) => {
        return prevChats.map((chat) =>
          chat.id === sessionId
            ? {
                ...chat,
                history: chat.history ? [...chat.history, botMsg] : [botMsg],
                last_message: botMsg.text,
                time_updated: new Date().toISOString(),
              }
            : chat
        );
      });

      // Typing effect with optimized performance (faster typing for better UX)
      setDisplayedBotMsg("");
      setIsTyping(true);
      let index = 0;
      const typingSpeed = Math.max(1, Math.floor(botReply.length / 100)); // Adaptive typing speed
      
      const typeBotMessage = () => {
        if (index < botReply.length) {
          const nextChunk = botReply.slice(index, index + typingSpeed);
          setDisplayedBotMsg((prev) => prev + nextChunk);
          index += typingSpeed;
          setTimeout(typeBotMessage, 20); // Faster typing at 20ms intervals
        } else {
          setMessages((prev) => [...prev, botMsg]);
          setDisplayedBotMsg("");
          setIsTyping(false);
        }
      };
      typeBotMessage();
    } catch (error) {
      let errorMsg = "Sorry, there was an error.";
      if (error.name === 'AbortError') {
        errorMsg = "The request is taking longer than expected. The AI might be processing a complex query. Please try again.";
      } else if (error.response) {
        if (error.response.status === 500) {
          errorMsg = "Server error, please try again later.";
        } else if (error.response.status === 408) {
          errorMsg = "Request timed out. The AI service might be busy. Please try again.";
        } else {
          errorMsg = "Unexpected error occurred.";
        }
      } else if (error.request) {
        errorMsg = "Network error, please check your connection.";
      } else {
        errorMsg = "Error: " + error.message;
      }
      setMessages((prev) => [
        ...prev,
        {
          text: errorMsg,
          sender: "bot",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      setWaitingForBot(false);
      setIsTyping(false);
    }
  };

  // Show chat history sidebar
  const handleShowHistory = () => {
    setShowHistory(true);
  };

  // Select chat session
  const handleSelectChat = async (id) => {
    if (id === activeChat) return;
    setActiveChat(id);
    setShowHistory(false);
    try {
      const res = await fetch(`http://localhost:3001/api/private/getChatSession/${id}`);
      if (!res.ok) throw new Error("Failed to fetch chat session");
      const data = await res.json();
      // Only show user and assistant messages
      const chatMessages = (data.messages || [])
        .filter((msg) => msg.message_type === "user" || msg.message_type === "assistant")
        .map((msg) => ({
          text: msg.message,
          sender: msg.message_type === "user" ? "user" : "bot",
          time: new Date(msg.time_sent).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }));
      setMessages(chatMessages.length > 0 ? chatMessages : [{
        text: "No conversation yet.",
        sender: "bot",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }]);
    } catch (err) {
      setMessages([{ text: "Failed to load conversation.", sender: "bot", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    }
  };

  // Delete chat with confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);
  const { toast } = useToast();

  const handleDeleteChat = (id) => {
    setChatToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteChat = async () => {
    if (!chatToDelete) return;
    try {
      // Backend delete
      const res = await fetch(`http://localhost:3001/api/private/deleteChatSession/${chatToDelete}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete chat session");
      setChats((prev) => prev.filter((c) => c.id !== chatToDelete));
      if (activeChat === chatToDelete) {
        setActiveChat(null);
        setMessages([
          {
            text: "Hello! I'm VirtualAssist, your AI assistant. How can I help you today?",
            sender: "bot",
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }
      toast({ title: "Chat deleted", description: "The chat session was deleted successfully." });
    } catch (err) {
      toast({ title: "Delete failed", description: err.message || "Could not delete chat." });
    } finally {
      setDeleteDialogOpen(false);
      setChatToDelete(null);
    }
  };

  return (
    <div className="virtualassist-bg">
      <div className="virtualassist-header">
        <span className="virtualassist-title">VirtualAssist</span>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            className="virtualassist-newchat-btn"
            onClick={handleNewChat}
            aria-label="Start new chat"
            style={{ padding: "6px 14px", borderRadius: "6px", background: "#f5f5f5", border: "1px solid #ccc", cursor: "pointer" }}
          >
            New Chat
          </button>
          <button
            className="virtualassist-history-btn"
            onClick={handleShowHistory}
            aria-label="Show chat history"
            disabled={showHistory}
          >
            <FaHistory size={22} />
          </button>
        </div>
      </div>

      <div className={`virtualassist-main${showHistory ? " virtualassist-blur" : ""}`}>
        <div className="virtualassist-messages" aria-live="polite">
          {/* ...existing code for messages... */}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`virtualassist-msg-row ${
                msg.sender === "user" ? "virtualassist-msg-user" : "virtualassist-msg-bot"
              }`}
            >
              <span className={`virtualassist-${msg.sender}-icon`}>
                {msg.sender === "bot" ? <FaRobot /> : <FaUserCircle />}
              </span>
              <div
                className={`virtualassist-msg-bubble${
                  msg.sender === "user" ? " virtualassist-msg-bubble-user" : ""
                }`}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      return inline ? (
                        <code {...props} className={className}>
                          {children}
                        </code>
                      ) : (
                        <pre {...props} className={className}>
                          <code>{children}</code>
                        </pre>
                      );
                    },
                  }}
                >
                  {msg.text}
                </ReactMarkdown>
                <div className="virtualassist-msg-time">{msg.time}</div>
              </div>
            </div>
          ))}

          {isTyping && waitingForBot && (
            <div className="virtualassist-msg-row virtualassist-msg-bot">
              <span className="virtualassist-bot-icon">
                <FaRobot />
              </span>
              <div className="virtualassist-msg-bubble">
                <VirtualAssistWaiting />
              </div>
            </div>
          )}

          {isTyping && displayedBotMsg && !waitingForBot && (
            <div className="virtualassist-msg-row virtualassist-msg-bot">
              <span className="virtualassist-bot-icon">
                <FaRobot />
              </span>
              <div className="virtualassist-msg-bubble">
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      return inline ? (
                        <code {...props} className={className}>
                          {children}
                        </code>
                      ) : (
                        <pre {...props} className={className}>
                          <code>{children}</code>
                        </pre>
                      );
                    },
                  }}
                >
                  {displayedBotMsg}
                </ReactMarkdown>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        <form className="virtualassist-input-row" onSubmit={handleSend}>
          <input
            ref={userInputRef}
            className="virtualassist-input"
            type="text"
            placeholder="Type your message here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={waitingForBot}
            aria-label="Chat input"
            autoFocus
          />
          <button className="virtualassist-send-btn" type="submit" disabled={waitingForBot} aria-label="Send message">
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="feather feather-send"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </div>

      {/* Chat history popup */}
      <ChatHistoryPopup
        isOpen={showHistory}
        chats={chats}
        activeChat={activeChat}
        onSelectChat={(id) => { handleSelectChat(id); setShowHistory(false); }}
        onDeleteChat={handleDeleteChat}
        onClose={() => setShowHistory(false)}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Chat?"
        description="Are you sure you want to delete this chat session? This action cannot be undone."
        onConfirm={confirmDeleteChat}
        onCancel={() => { setDeleteDialogOpen(false); setChatToDelete(null); }}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default Home;
