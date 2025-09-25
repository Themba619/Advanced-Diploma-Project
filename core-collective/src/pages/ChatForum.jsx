import React, { useState, useEffect, useRef } from "react";

const ChatForum = () => {
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [chatSessionId, setChatSessionId] = useState(null);
  const eventSourceRef = useRef(null);

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

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h2 className="text-2xl font-bold mb-4">AI Chat Forum (New Streaming Format)</h2>
      
      {chatSessionId && (
        <p className="text-sm text-gray-600 mb-4">
          Chat Session: {chatSessionId}
        </p>
      )}

      {/* Chat Messages */}
      <div style={{ 
        height: "400px", 
        overflowY: "auto", 
        border: "1px solid #ccc", 
        padding: "10px", 
        marginBottom: "20px",
        borderRadius: "8px"
      }}>
        {messages.map((msg, index) => (
          <div key={index} style={{ 
            marginBottom: "10px",
            padding: "10px",
            backgroundColor: msg.type === "user" ? "#e3f2fd" : "#f5f5f5",
            borderRadius: "8px"
          }}>
            <strong>{msg.type === "user" ? "You" : "AI"}:</strong> {msg.content}
          </div>
        ))}
        
        {/* Show streaming text in real-time */}
        {isStreaming && (
          <div style={{ 
            marginBottom: "10px",
            padding: "10px",
            backgroundColor: "#fff3e0",
            borderRadius: "8px",
            border: "1px dashed #ff9800"
          }}>
            <strong>AI (streaming):</strong> {streamingText}
            <span className="animate-pulse">▋</span>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div style={{ display: "flex", gap: "10px" }}>
        <input
          type="text"
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type your message..."
          disabled={isStreaming || !chatSessionId}
          style={{
            flex: 1,
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontSize: "16px"
          }}
        />
        <button
          onClick={sendMessage}
          disabled={isStreaming || !chatSessionId || !currentMessage.trim()}
          style={{
            padding: "10px 20px",
            backgroundColor: isStreaming ? "#ccc" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isStreaming ? "not-allowed" : "pointer"
          }}
        >
          {isStreaming ? "Sending..." : "Send"}
        </button>
      </div>

      {/* Debug Info */}
      <div style={{ marginTop: "20px", fontSize: "12px", color: "#666" }}>
        <p><strong>Status:</strong> {isStreaming ? "Streaming..." : "Ready"}</p>
        <p><strong>Current Stream:</strong> "{streamingText}"</p>
        <p><strong>Messages:</strong> {messages.length}</p>
      </div>
    </div>
  );
};

export default ChatForum;