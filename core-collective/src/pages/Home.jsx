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
import TextType from "../react_bits/src/blocks/TextAnimations/TextType/TextType";

// Animated 3-dot waiting indicator
const VirtualAssistWaiting = () => (
  <div className="virtualassist-waiting">
    <span className="dot dot1"></span>
    <span className="dot dot2"></span>
    <span className="dot dot3"></span>
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
  const [sessionCreated, setSessionCreated] = useState(false);

  const chatEndRef = useRef(null);
  const userInputRef = useRef(null);
  const { toast } = useToast();

  // Fetch chat sessions on initial load
  useEffect(() => {
    async function fetchChats() {
      try {
        const res = await fetch("http://localhost:3001/api/private/getUserChatSessions");
        if (!res.ok) throw new Error("Failed to fetch chat sessions");
        const data = await res.json();
        const sessions = data.sessions || [];
        setChats(sessions);
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

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, displayedBotMsg]);

  const handleNewChat = async () => {
    try {
      window.location.reload();
      return;
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
      setChatSessionId(newSessionId);
      setActiveChat(newSessionId);
      setSessionCreated(false);
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
    } catch (err) {
      console.error("Failed to create new chat:", err);
      setSessionCreated(false);
    }
  };

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

    let sessionId = chatSessionId;
    let newSessionCreated = false;

    if (!sessionId) {
      newSessionCreated = true;
      try {
        const response = await fetch("http://localhost:3001/api/private/createSession", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ persona_id: 0, description: "Convo" }),
        });
        if (!response.ok) throw new Error("Failed to create chat session");
        const data = await response.json();
        sessionId = data.chat_session_id;
        setChatSessionId(sessionId);
        setSessionCreated(true);
        setActiveChat(sessionId);
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
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            text: "Failed to create chat session.",
            sender: "bot",
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
        setWaitingForBot(false);
        setIsTyping(false);
        return;
      }
    }

    setMessages((prev) => [...prev, userMsg]);
    setChats((prevChats) => {
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

    if (newSessionCreated) {
      try {
        const response = await fetch("http://localhost:3001/api/private/renameChatSession", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_session_id: sessionId, name: userMsg.text }),
        });
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.id === sessionId ? { ...chat, name: userMsg.text } : chat
          )
        );
        if (!response.ok) throw new Error("Failed to rename chat session");
      } catch (err) {
        console.error("Error in rename process:", err);
      }
    }

    try {
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
      });

      let data;
      let botReply = "";
      if (!response.ok) {
        try {
          data = await response.json();
          botReply = data.error || data.message || `API error: ${response.status}`;
        } catch (e) {
          botReply = `API error: ${response.status}`;
        }
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

      if (newSessionCreated) {
        try {
          const renameResponse = await fetch("http://localhost:3001/api/private/renameChatSession", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_session_id: sessionId,
              name: userMsg.text,
            }),
          });
          if (renameResponse.ok) {
            setChats((prevChats) =>
              prevChats.map((chat) =>
                chat.id === sessionId ? { ...chat, name: userMsg.text } : chat
              )
            );
          }
        } catch (err) {
          console.error("Error in rename process:", err);
        }
      }

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

      setDisplayedBotMsg("");
      setIsTyping(true);
      let index = 0;
      const typeBotMessage = () => {
        if (index < botReply.length) {
          setDisplayedBotMsg((prev) => prev + botReply[index]);
          index++;
          requestAnimationFrame(typeBotMessage);
        } else {
          setMessages((prev) => [...prev, botMsg]);
          setDisplayedBotMsg("");
          setIsTyping(false);
        }
      };
      requestAnimationFrame(typeBotMessage);
    } catch (error) {
      let errorMsg = "Sorry, there was an error.";
      if (error.response) {
        errorMsg = error.response.status === 500 ? "Server error, please try again later." : "Unexpected error occurred.";
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

  const handleShowHistory = () => {
    setShowHistory(true);
  };

  const handleSelectChat = async (id) => {
    if (id === activeChat) return;
    setActiveChat(id);
    setShowHistory(false);
    try {
      const res = await fetch(`http://localhost:3001/api/private/getChatSession/${id}`);
      if (!res.ok) throw new Error("Failed to fetch chat session");
      const data = await res.json();
      const chatMessages = (data.messages || [])
        .filter((msg) => msg.message_type === "user" || msg.message_type === "assistant")
        .map((msg) => ({
          text: msg.message,
          sender: msg.message_type === "user" ? "user" : "bot",
          time: new Date(msg.time_sent).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }));
      setMessages(chatMessages.length > 0 ? chatMessages : [{
        text: "No conversation yet.",
        sender: "bot",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }]);
      setChatSessionId(id);
    } catch (err) {
      setMessages([{ text: "Failed to load conversation.", sender: "bot", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    }
  };

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);

  const handleDeleteChat = (id) => {
    setChatToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteChat = async () => {
    if (!chatToDelete) return;
    try {
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
        setChatSessionId(null);
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
        <TextType
          text={["VirtualAssist", "I'm here to help!!"]}
          typingSpeed={75}
          pauseDuration={1500}
          showCursor={true}
          cursorCharacter="_"
          className="virtualassist-title"
        />
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            className="virtualassist-newchat-btn"
            onClick={handleNewChat}
            aria-label="Start new chat"
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

      <ChatHistoryPopup
        isOpen={showHistory}
        chats={chats}
        activeChat={activeChat}
        onSelectChat={(id) => { handleSelectChat(id); setShowHistory(false); }}
        onDeleteChat={handleDeleteChat}
        onClose={() => setShowHistory(false)}
      />

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