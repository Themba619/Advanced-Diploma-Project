import React, { useState } from 'react';
import PerformanceMonitor from '../components/PerformanceMonitor';

const ChatPerformanceTest = () => {
  const [chatResponse, setChatResponse] = useState('');
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chatSessionId, setChatSessionId] = useState('');
  const [testMessage, setTestMessage] = useState('Tell me about UJ sports');

  const createChatSession = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in first');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/private/createSessionFast', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.chat_session_id) {
        setChatSessionId(data.chat_session_id);
        console.log('Created chat session:', data.chat_session_id);
      }
    } catch (error) {
      console.error('Error creating chat session:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendTestMessage = async () => {
    if (!chatSessionId) {
      alert('Please create a chat session first');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in first');
      return;
    }

    setLoading(true);
    const startTime = Date.now();

    try {
      // Use the regular sendMessage endpoint for JSON response
      const response = await fetch('http://localhost:3001/api/private/sendMessage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_session_id: chatSessionId,
          message: testMessage
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const endTime = Date.now();

      setChatResponse(data.message || 'No response received');
      
      // Use backend performance data if available, otherwise calculate frontend time
      setPerformance(data.performance || {
        total_duration: endTime - startTime,
        frontend_only: true
      });

    } catch (error) {
      console.error('Error sending message:', error);
      const endTime = Date.now();
      setChatResponse('Error: ' + error.message);
      setPerformance({
        total_duration: endTime - startTime,
        error: true,
        frontend_only: true
      });
    } finally {
      setLoading(false);
    }
  };

  const testChatSessions = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in first');
      return;
    }

    setLoading(true);
    const startTime = Date.now();

    try {
      const response = await fetch('http://localhost:3001/api/private/getUserChatSessions', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      const endTime = Date.now();

      console.log('Chat sessions data:', data);
      
      setPerformance(data.performance || {
        total_duration: endTime - startTime,
        sessions_count: data.sessions?.length || 0,
        frontend_only: true
      });

    } catch (error) {
      console.error('Error fetching chat sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🚀 Chat Performance Test</h1>
      <p>Test the optimized AI chat performance. Target: &lt;2 seconds for responses.</p>

      {/* Message Input Field */}
      <div style={{ 
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '5px',
        border: '1px solid #dee2e6'
      }}>
        <label htmlFor="testMessage" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Test Message:
        </label>
        <input
          id="testMessage"
          type="text"
          value={testMessage}
          onChange={(e) => setTestMessage(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '14px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            boxSizing: 'border-box'
          }}
          placeholder="Enter your test message here..."
        />
      </div>

      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <button 
          onClick={createChatSession}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Creating...' : '1. Create Chat Session'}
        </button>

        <button 
          onClick={sendTestMessage}
          disabled={loading || !chatSessionId}
          style={{
            padding: '10px 20px',
            backgroundColor: chatSessionId ? '#007bff' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: (loading || !chatSessionId) ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Sending...' : '2. Send Test Message'}
        </button>

        <button 
          onClick={testChatSessions}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ffc107',
            color: 'black',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Loading...' : '3. Test Get Sessions'}
        </button>
      </div>

      {chatSessionId && (
        <div style={{ 
          marginBottom: '20px',
          padding: '10px',
          backgroundColor: '#d4edda',
          borderRadius: '5px'
        }}>
          <strong>Chat Session ID:</strong> {chatSessionId}
        </div>
      )}

      {chatResponse && (
        <div style={{ 
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#f8f9fa',
          borderRadius: '5px',
          border: '1px solid #dee2e6'
        }}>
          <h3>AI Response:</h3>
          <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{chatResponse}</p>
        </div>
      )}

      <PerformanceMonitor performance={performance} />

      <div style={{ 
        marginTop: '40px',
        padding: '15px',
        backgroundColor: '#fff3cd',
        borderRadius: '5px',
        border: '1px solid #ffeaa7'
      }}>
        <h3>Performance Optimizations Applied:</h3>
        <ul>
          <li>✅ User caching (5min TTL) - Reduces DB queries</li>
          <li>✅ Reduced timeout: 30s → 8s - Faster failure detection</li>
          <li>✅ Batch database queries - Fewer round trips</li>
          <li>✅ Optimized JSON parsing - Early exits and reduced logging</li>
          <li>✅ Performance monitoring - Track improvements</li>
          <li>✅ Set-based filtering - O(1) instead of O(n) lookups</li>
        </ul>
      </div>
    </div>
  );
};

export default ChatPerformanceTest;