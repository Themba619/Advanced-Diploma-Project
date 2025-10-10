import React, { useState, useEffect, useRef } from "react";

const ChatForum = () => {
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [chatSessionId, setChatSessionId] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState("All Topics");
  const [isTopicDropdownOpen, setIsTopicDropdownOpen] = useState(false);
  const eventSourceRef = useRef(null);

  const topics = [
    "All Topics",
    "Examples",
    "Capabilities", 
    "Limitations",
    "AI Chat",
    "Voice Technology",
    "Community Forums",
    "Smart Navigation",
    "Technical Support",
    "Feature Requests"
  ];

  const quickActions = [
    { 
      title: "Examples", 
      color: "#FFD700", 
      bgColor: "#FFF9C4",
      icon: "😊",
      description: "View sample conversations and use cases"
    },
    { 
      title: "Capabilities", 
      color: "#00C896", 
      bgColor: "#E8F5E8",
      icon: "⚡",
      description: "Discover what our AI can do for you"
    },
    { 
      title: "Limitations", 
      color: "#E91E63", 
      bgColor: "#FCE4EC",
      icon: "⚠️",
      description: "Understand current system boundaries"
    }
  ];

  // Create a chat session on component mount
  useEffect(() => {
    createChatSession();
    return () => {
      // Clean up EventSource on unmount
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const createChatSession = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3001/api/private/createSession", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      });
      
      const data = await response.json();
      if (data.sessionId) {
        setChatSessionId(data.sessionId);
        console.log("✅ Chat session created:", data.sessionId);
      }
    } catch (error) {
      console.error("❌ Failed to create chat session:", error);
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || !chatSessionId || isStreaming) return;

    const userMessage = currentMessage;
    setCurrentMessage("");
    setIsStreaming(true);
    setStreamingText("");

    // Add user message to chat
    setMessages(prev => [...prev, { type: "user", content: userMessage }]);

    try {
      const token = localStorage.getItem("token");
      
      // Use the new streaming endpoint
      const response = await fetch("http://localhost:3001/api/private/sendMessageStream", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_session_id: chatSessionId,
          message: userMessage
        })
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      // Read the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullMessage = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'message_delta') {
                fullMessage += data.content;
                setStreamingText(fullMessage);
                console.log(`[STREAM] Delta: "${data.content}" | Full: "${fullMessage}"`);
              } else if (data.type === 'message_complete' || data.type === 'stream_end') {
                console.log("✅ Stream completed");
                setMessages(prev => [...prev, { type: "assistant", content: fullMessage }]);
                setStreamingText("");
                setIsStreaming(false);
                return;
              } else if (data.type === 'error') {
                console.error("❌ Stream error:", data.error);
                setStreamingText("");
                setIsStreaming(false);
                return;
              }
            } catch (e) {
              // Ignore invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error("❌ Failed to send streaming message:", error);
      setIsStreaming(false);
      setStreamingText("");
    }
  };

  const styles = {
    container: {
      display: 'flex',
      height: '100vh',
      backgroundColor: '#ff0000', // TEMPORARY: Red background to force visibility
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif"
    },
    sidebar: {
      width: '320px',
      backgroundColor: '#1a1a1a',
      color: 'white',
      padding: '20px',
      overflowY: 'auto',
      borderRight: '1px solid #333'
    },
    sidebarHeader: {
      marginBottom: '30px'
    },
    sidebarTitle: {
      fontSize: '20px',
      fontWeight: '600',
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    chatIcon: {
      fontSize: '24px'
    },
    topicSection: {
      marginBottom: '30px'
    },
    topicLabel: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '500',
      marginBottom: '10px',
      color: '#ccc'
    },
    dropdownContainer: {
      position: 'relative'
    },
    dropdownButton: {
      width: '100%',
      padding: '12px 16px',
      backgroundColor: '#2a2a2a',
      border: '1px solid #444',
      borderRadius: '8px',
      color: 'white',
      cursor: 'pointer',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '14px',
      transition: 'all 0.2s'
    },
    dropdownArrow: {
      fontSize: '12px',
      opacity: 0.7
    },
    dropdownMenu: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      backgroundColor: '#2a2a2a',
      border: '1px solid #444',
      borderRadius: '8px',
      marginTop: '4px',
      zIndex: 1000,
      maxHeight: '200px',
      overflowY: 'auto'
    },
    dropdownItem: {
      width: '100%',
      padding: '12px 16px',
      backgroundColor: 'transparent',
      border: 'none',
      color: 'white',
      textAlign: 'left',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'backgroundColor 0.2s'
    },
    dropdownItemActive: {
      backgroundColor: '#6c63ff',
      color: 'white'
    },
    quickActionsSection: {
      marginBottom: '30px'
    },
    sectionTitle: {
      fontSize: '16px',
      fontWeight: '600',
      marginBottom: '15px',
      color: '#fff'
    },
    quickActionBtn: {
      width: '100%',
      padding: '16px',
      marginBottom: '12px',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'transform 0.2s, box-shadow 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    quickActionIcon: {
      fontSize: '20px'
    },
    quickActionContent: {
      flex: 1
    },
    quickActionTitle: {
      fontWeight: '600',
      fontSize: '14px',
      marginBottom: '4px'
    },
    quickActionDesc: {
      fontSize: '12px',
      opacity: 0.8
    },
    sessionInfo: {
      padding: '16px',
      backgroundColor: '#2a2a2a',
      borderRadius: '8px',
      marginTop: 'auto'
    },
    sessionLabel: {
      fontSize: '12px',
      color: '#ccc',
      marginBottom: '4px'
    },
    sessionId: {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#6c63ff'
    },
    mainContent: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'white'
    },
    chatHeader: {
      padding: '30px 40px 20px',
      borderBottom: '1px solid #e0e0e0'
    },
    chatTitle: {
      fontSize: '24px',
      fontWeight: '600',
      color: '#1a1a1a',
      margin: '0 0 10px 0'
    },
    chatSubtitle: {
      fontSize: '16px',
      color: '#666',
      lineHeight: '1.5',
      margin: 0
    },
    messagesContainer: {
      flex: 1,
      padding: '20px 40px',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column'
    },
    welcomeMessage: {
      textAlign: 'center',
      padding: '60px 20px',
      color: '#666'
    },
    welcomeIcon: {
      fontSize: '48px',
      marginBottom: '20px'
    },
    welcomeTitle: {
      fontSize: '20px',
      fontWeight: '600',
      marginBottom: '10px',
      color: '#1a1a1a'
    },
    welcomeText: {
      fontSize: '16px',
      lineHeight: '1.5'
    },
    messageContainer: {
      display: 'flex',
      marginBottom: '24px',
      gap: '12px'
    },
    userMessageContainer: {
      flexDirection: 'row-reverse'
    },
    aiMessageContainer: {
      flexDirection: 'row'
    },
    messageAvatar: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      backgroundColor: '#f0f0f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '18px',
      flexShrink: 0
    },
    messageContent: {
      flex: 1,
      maxWidth: '70%'
    },
    messageHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '6px'
    },
    messageSender: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#333'
    },
    messageTime: {
      fontSize: '12px',
      color: '#999'
    },
    messageText: {
      backgroundColor: '#f8f9fa',
      padding: '16px',
      borderRadius: '16px',
      fontSize: '15px',
      lineHeight: '1.5',
      color: '#1a1a1a'
    },
    streamingIndicator: {
      display: 'flex',
      gap: '4px'
    },
    streamingDot: {
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      backgroundColor: '#6c63ff',
      animation: 'pulse 1.4s ease-in-out infinite both'
    },
    cursor: {
      color: '#6c63ff',
      animation: 'blink 1s infinite'
    },
    inputContainer: {
      padding: '20px 40px 30px',
      borderTop: '1px solid #e0e0e0',
      backgroundColor: 'white'
    },
    inputWrapper: {
      display: 'flex',
      gap: '12px',
      alignItems: 'center'
    },
    messageInput: {
      flex: 1,
      padding: '16px 20px',
      border: '2px solid #e0e0e0',
      borderRadius: '24px',
      fontSize: '15px',
      outline: 'none',
      transition: 'border-color 0.2s',
      backgroundColor: '#f8f9fa'
    },
    sendButton: {
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      backgroundColor: '#6c63ff',
      border: 'none',
      color: 'white',
      fontSize: '18px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s'
    },
    sendButtonDisabled: {
      backgroundColor: '#ccc',
      cursor: 'not-allowed'
    }
  };

  return (
    <div style={styles.container}>
      {/* DEBUG: Force refresh indicator */}
      <div style={{position: 'fixed', top: 0, left: 0, background: 'red', color: 'white', padding: '5px', zIndex: 9999}}>
        NEW DESIGN LOADED ✅
      </div>
      
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h2 style={styles.sidebarTitle}>
            <span style={styles.chatIcon}>💬</span>
            AI Chat Forum
          </h2>
        </div>

        {/* Topic Filter Dropdown */}
        <div style={styles.topicSection}>
          <label style={styles.topicLabel}>Filter by Topic</label>
          <div style={styles.dropdownContainer}>
            <button
              style={styles.dropdownButton}
              onClick={() => setIsTopicDropdownOpen(!isTopicDropdownOpen)}
            >
              <span>{selectedTopic}</span>
              <span style={styles.dropdownArrow}>
                {isTopicDropdownOpen ? "▲" : "▼"}
              </span>
            </button>
            
            {isTopicDropdownOpen && (
              <div style={styles.dropdownMenu}>
                {topics.map((topic, index) => (
                  <button
                    key={index}
                    style={{
                      ...styles.dropdownItem,
                      ...(selectedTopic === topic ? styles.dropdownItemActive : {})
                    }}
                    onClick={() => {
                      setSelectedTopic(topic);
                      setIsTopicDropdownOpen(false);
                    }}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={styles.quickActionsSection}>
          <h3 style={styles.sectionTitle}>Quick Actions</h3>
          {quickActions.map((action, index) => (
            <button
              key={index}
              style={{
                ...styles.quickActionBtn,
                backgroundColor: action.bgColor,
                color: action.color
              }}
              onClick={() => setCurrentMessage(`Tell me about ${action.title.toLowerCase()}`)}
            >
              <span style={styles.quickActionIcon}>{action.icon}</span>
              <div style={styles.quickActionContent}>
                <div style={styles.quickActionTitle}>{action.title}</div>
                <div style={styles.quickActionDesc}>{action.description}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Session Info */}
        {chatSessionId && (
          <div style={styles.sessionInfo}>
            <div style={styles.sessionLabel}>Session ID</div>
            <div style={styles.sessionId}>{chatSessionId.slice(0, 8)}...</div>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div style={styles.mainContent}>
        {/* Header */}
        <div style={styles.chatHeader}>
          <h1 style={styles.chatTitle}>
            Want to get the most out of your AI assistant?
          </h1>
          <p style={styles.chatSubtitle}>
            Start with a clear and specific prompt. Be as detailed as possible about your desired outcome.
          </p>
        </div>

        {/* Messages Container */}
        <div style={styles.messagesContainer}>
          {messages.length === 0 && !isStreaming && (
            <div style={styles.welcomeMessage}>
              <div style={styles.welcomeIcon}>🤖</div>
              <h3 style={styles.welcomeTitle}>Welcome to AI Chat Forum!</h3>
              <p style={styles.welcomeText}>
                Ask me anything about our platform, get help with features, or start a conversation.
              </p>
            </div>
          )}

          {messages.map((msg, index) => (
            <div 
              key={index} 
              style={{
                ...styles.messageContainer,
                ...(msg.type === "user" ? styles.userMessageContainer : styles.aiMessageContainer)
              }}
            >
              <div style={styles.messageAvatar}>
                {msg.type === "user" ? "👤" : "🤖"}
              </div>
              <div style={styles.messageContent}>
                <div style={styles.messageHeader}>
                  <span style={styles.messageSender}>
                    {msg.type === "user" ? "You" : "AI Assistant"}
                  </span>
                  <span style={styles.messageTime}>
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={styles.messageText}>{msg.content}</div>
              </div>
            </div>
          ))}
          
          {/* Streaming Message */}
          {isStreaming && (
            <div style={{...styles.messageContainer, ...styles.aiMessageContainer}}>
              <div style={styles.messageAvatar}>🤖</div>
              <div style={styles.messageContent}>
                <div style={styles.messageHeader}>
                  <span style={styles.messageSender}>AI Assistant</span>
                  <span style={styles.streamingIndicator}>
                    <span style={styles.streamingDot}></span>
                    <span style={styles.streamingDot}></span>
                    <span style={styles.streamingDot}></span>
                  </span>
                </div>
                <div style={styles.messageText}>
                  {streamingText}
                  <span style={styles.cursor}>▋</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div style={styles.inputContainer}>
          <div style={styles.inputWrapper}>
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask me anything about our AI platform..."
              disabled={isStreaming || !chatSessionId}
              style={styles.messageInput}
            />
            <button
              onClick={sendMessage}
              disabled={isStreaming || !chatSessionId || !currentMessage.trim()}
              style={{
                ...styles.sendButton,
                ...(isStreaming || !currentMessage.trim() ? styles.sendButtonDisabled : {})
              }}
            >
              {isStreaming ? "●●●" : "→"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatForum;