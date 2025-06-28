import React, { useState, useRef } from "react";
import "../styles/HomeStyles/Home.css";
import { FaHistory, FaUserCircle, FaRobot, FaTrash } from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

// Animated 3-dot waiting indicator (bigger, growing dots)
const VirtualAssistWaiting = () => (
  <div className="dots">
    <div style={{ animation: "dotGrowing 1s infinite ease-in-out" }}></div>
    <div style={{ animation: "dotGrowing 1s infinite ease-in-out 0.2s" }}></div>
    <div style={{ animation: "dotGrowing 1s infinite ease-in-out 0.4s" }}></div>
  </div>
);

const Home = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      text: "Hello! I'm VirtualAssist, your AI assistant. How can I help you today?",
      sender: "bot",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [showHistory, setShowHistory] = useState(false);
  const [chats, setChats] = useState([
    {
      id: 1,
      name: "Welcome Chat",
      date: new Date().toISOString().slice(0, 10),
      history: [
        {
          text: "Hello! I'm VirtualAssist, your AI assistant. How can I help you today?",
          sender: "bot",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    }
  ]);
  const [activeChat, setActiveChat] = useState(1);
  const [isTyping, setIsTyping] = useState(false);
  const [waitingForBot, setWaitingForBot] = useState(false);
  const [displayedBotMsg, setDisplayedBotMsg] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);
  const chatEndRef = useRef(null);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = {
      text: input,
      sender: "user",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === activeChat
          ? { ...chat, history: [...chat.history, userMsg] }
          : chat
      )
    );
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    setWaitingForBot(true);
    setDisplayedBotMsg("");

    try {
      const response = await fetch('http://localhost:3001/api/ollama', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input })
      });
      let data = '';
      if (response.body && response.body.getReader) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let done = false;
        let buffer = '';
        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          if (value) {
            buffer += decoder.decode(value, { stream: !done });
            let lines = buffer.split('\n');
            buffer = lines.pop(); // last line may be incomplete
            for (let line of lines) {
              line = line.trim();
              if (!line) continue;
              try {
                const json = JSON.parse(line);
                if (json.response) data += json.response;
              } catch {}
            }
          }
        }
        // handle any remaining buffer
        if (buffer) {
          try {
            const json = JSON.parse(buffer);
            if (json.response) data += json.response;
          } catch {}
        }
      } else {
        // fallback for non-streaming
        const text = await response.text();
        try {
          const json = JSON.parse(text);
          if (json.response) data = json.response;
          else data = text;
        } catch {
          data = text;
        }
      }
      setWaitingForBot(false); // Hide waiting indicator, start typing
      // Remove <think>...</think> tags from response
      data = data.replace(/<think>(.|\n|\r)*?<\/think>/gi, "");
      // Typing effect for bot message
      let i = 0;
      setDisplayedBotMsg("");
      const typeInterval = setInterval(() => {
        setDisplayedBotMsg((prev) => prev + data[i]);
        i++;
        if (i >= data.length) {
          clearInterval(typeInterval);
          const botMsg = {
            text: data,
            sender: "bot",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setChats((prev) =>
            prev.map((chat) =>
              chat.id === activeChat
                ? { ...chat, history: [...chat.history, botMsg] }
                : chat
            )
          );
          setMessages((prev) => [...prev, botMsg]);
          setDisplayedBotMsg("");
          setIsTyping(false);
        }
      }, 25); // Adjust speed as desired
    } catch (err) {
      setWaitingForBot(false);
      setMessages((prev) => [...prev, {
        text: "Sorry, there was an error connecting to the AI.",
        sender: "bot",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setIsTyping(false);
    }
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleNewChat = () => {
    // Save current messages to the current chat before creating a new one
    setChats(prev =>
      prev.map(chat =>
        chat.id === activeChat ? { ...chat, history: messages } : chat
      )
    );

    const maxId = chats.length > 0 ? Math.max(...chats.map(c => c.id)) : 0;
    const newId = maxId + 1;
    const today = new Date().toISOString().slice(0, 10);
    const newChat = {
      id: newId,
      name: "New Chat",
      date: today,
      history: [
        {
          text: "Hello! I'm VirtualAssist, your AI assistant. How can I help you today?",
          sender: "bot",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };
    setChats((prev) => [newChat, ...prev]);
    setActiveChat(newId);
    setMessages(newChat.history);
    setShowHistory(false);
  };

  // Save chat to backend after each message
  React.useEffect(() => {
  // Save the active chat's history whenever messages or activeChat changes
  const active = chats.find(c => c.id === activeChat);
  if (active) {
    fetch('http://localhost:3001/api/ollama/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId: active.id, chatData: { ...active, history: messages } })
    });
  }
}, [messages, activeChat]);

  // Load chat list from backend when opening history
  const handleShowHistory = async () => {
    setShowHistory(true);
    try {
      const res = await fetch('http://localhost:3001/api/ollama/list');
      const data = await res.json();
      setChats((prev) => {
        // Only update if backend has more/different chats
        const prevIds = prev.map(c => c.id.toString());
        const backendIds = data.map(c => c.id.toString());
        if (JSON.stringify(prevIds) !== JSON.stringify(backendIds)) {
          // Sort by date descending (latest first)
          return data.sort((a, b) => new Date(b.date) - new Date(a.date)).map(c => ({ ...c, history: [] }));
        }
        return prev;
      });
    } catch {}
  };

  // Load chat history from backend when selecting a chat
  const handleSelectChat = async (id) => {
    // Save current messages to the current chat before switching
    setChats(prev =>
      prev.map(chat =>
        chat.id === activeChat ? { ...chat, history: messages } : chat
      )
    );

    try {
      const res = await fetch(`http://localhost:3001/api/ollama/load/${id}`);
      const data = await res.json();
      setActiveChat(id);
      setMessages(data.history);
      setChats(prev => prev.map(c => c.id === id ? data : c));
      setShowHistory(false);
    } catch {
      // fallback to local if error
      const chat = chats.find((c) => c.id === id);
      if (chat) {
        setActiveChat(id);
        setMessages(chat.history);
        setShowHistory(false);
      }
    }
  };

  // Delete chat handler
  const handleDeleteChat = (id) => {
    setChatToDelete(id);
    setShowDeleteConfirm(true);
  };

  // Confirm delete
  const confirmDeleteChat = async () => {
    if (!chatToDelete) return;
    try {
      await fetch(`http://localhost:3001/api/ollama/delete/${chatToDelete}`, { method: 'DELETE' });
      setChats((prev) => prev.filter(c => c.id !== chatToDelete));
      if (activeChat === chatToDelete && chats.length > 1) {
        // Switch to the next available chat
        const nextChat = chats.find(c => c.id !== chatToDelete);
        setActiveChat(nextChat.id);
        setMessages(nextChat.history);
      }
      setShowDeleteConfirm(false);
      setChatToDelete(null);
    } catch {
      setShowDeleteConfirm(false);
      setChatToDelete(null);
    }
  };

  // Cancel delete
  const cancelDeleteChat = () => {
    setShowDeleteConfirm(false);
    setChatToDelete(null);
  };

  return (
    <div className="virtualassist-bg">
      {/* Chat header */}
      <div className="virtualassist-header">
        <span className="virtualassist-title">VirtualAssist</span>
        <button className="virtualassist-history-btn" onClick={handleShowHistory}>
          <FaHistory size={22} />
        </button>
      </div>

      {/* Chat area */}
      <div className={`virtualassist-main${showHistory ? ' virtualassist-blur' : ''}`}>
        <div className="virtualassist-messages">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`virtualassist-msg-row ${msg.sender === "user" ? "virtualassist-msg-user" : "virtualassist-msg-bot"}`}
            >
              {msg.sender === "bot" && (
                <span className="virtualassist-bot-icon">
                  <FaRobot />
                </span>
              )}
              {msg.sender === "user" && (
                <span className="virtualassist-user-icon">
                  <FaUserCircle/>
                </span>
              )}
              <div className={`virtualassist-msg-bubble${msg.sender === "user" ? " virtualassist-msg-bubble-user" : ""}`}>
                <ReactMarkdown
                  children={msg.text}
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                />
                <div className="virtualassist-msg-time">{msg.time}</div>
              </div>
            </div>
          ))}
          {/* Waiting indicator: show when isTyping is true and displayedBotMsg is empty */}
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
          {/* Typing effect for bot message */}
          {isTyping && displayedBotMsg && !waitingForBot && (
            <div className="virtualassist-msg-row virtualassist-msg-bot">
              <span className="virtualassist-bot-icon">
                <FaRobot />
              </span>
              <div className="virtualassist-msg-bubble">
                <ReactMarkdown
                  children={displayedBotMsg}
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        {/* Input */}
        <form className="virtualassist-input-row" onSubmit={handleSend}>
          <input
            className="virtualassist-input"
            type="text"
            placeholder="Type your message here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button className="virtualassist-send-btn" type="submit">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-send"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </form>
      </div>

      {/* Chat history sidebar */}
      {showHistory && (
        <div className="virtualassist-history-sidebar">
          <div className="virtualassist-history-header">
            <span>Chat History</span>
            <button className="virtualassist-history-close" onClick={() => setShowHistory(false)}>
              ×
            </button>
          </div>
          <button className="virtualassist-new-chat-btn" onClick={handleNewChat}>+ New Chat</button>
          <div className="virtualassist-history-list">
            {[...chats]
              .sort((a, b) => b.id - a.id) // Sort by id descending: highest id (latest chat) at the top
              .map((chat) => (
                <div
                  key={chat.id}
                  className={`virtualassist-history-item${activeChat === chat.id ? " active" : ""}`}
                  onClick={() => handleSelectChat(chat.id)}
                >
                  <div className="virtualassist-history-name">{chat.name}</div>
                  <div className="virtualassist-history-date">{chat.date}</div>
                  <button
                    className="virtualassist-history-delete"
                    onClick={e => { e.stopPropagation(); handleDeleteChat(chat.id); }}
                    title="Delete chat"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="virtualassist-delete-modal-bg">
          <div className="virtualassist-delete-modal">
            <div>Are you sure you want to delete this chat?</div>
            <div className="virtualassist-delete-modal-actions">
              <button onClick={confirmDeleteChat} className="virtualassist-delete-confirm">Yes, delete</button>
              <button onClick={cancelDeleteChat} className="virtualassist-delete-cancel">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;