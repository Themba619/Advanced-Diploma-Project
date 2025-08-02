import React, { useState, useRef } from "react";
import "../styles/HomeStyles/Home.css";
import { FaHistory, FaUserCircle, FaRobot } from "react-icons/fa";
import TextType from "../react_bits/src/blocks/TextAnimations/TextType/TextType";

const dummyResponse = (msg) =>
  msg.toLowerCase().includes("hello")
    ? "Hello! I'm VirtualAssist, your AI assistant. How can I help you today?"
    : "I understand your message. This is a demo response from the VirtualAssist UI. In a real implementation, this would connect to an AI service to generate meaningful responses.";

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
  const chatEndRef = useRef(null);

  const handleSend = (e) => {
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
    setTimeout(() => {
      const botMsg = {
        text: dummyResponse(userMsg.text),
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
      setIsTyping(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }, 1200);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleNewChat = () => {
    const newId = chats.length + 1;
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

  const handleSelectChat = (id) => {
    const chat = chats.find((c) => c.id === id);
    if (chat) {
      setActiveChat(id);
      setMessages(chat.history);
      setShowHistory(false);
    }
  };

  return (
    <div className="virtualassist-bg">
      {/* Chat header */}
      <div className="virtualassist-header">

        <TextType 
          text={["VirtualAssist", "I'm here to help!!"]}
          typingSpeed={75}
          pauseDuration={1500}
          showCursor={true}
          cursorCharacter="_"
          className="virtualassist-title"
        />

        <button className="virtualassist-history-btn" onClick={() => setShowHistory(true)}>
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
                <div>{msg.text}</div>
                <div className="virtualassist-msg-time">{msg.time}</div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="virtualassist-msg-row virtualassist-msg-bot">
              <span className="virtualassist-bot-icon">
                <FaRobot />
              </span>
              <div className="virtualassist-msg-bubble">
                <div className="virtualassist-typing">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
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
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`virtualassist-history-item${activeChat === chat.id ? " active" : ""}`}
                onClick={() => handleSelectChat(chat.id)}
              >
                <div className="virtualassist-history-name">{chat.name}</div>
                <div className="virtualassist-history-date">{chat.date}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;