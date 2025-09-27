import React from "react";
import Modal from "react-modal";
import { FaTrash } from "react-icons/fa";

const ChatHistoryPopup = ({ isOpen, chats, activeChat, onSelectChat, onDeleteChat, onClose }) => {
  const [sessionMessages, setSessionMessages] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="virtualassist-history-modal-right"
      overlayClassName="virtualassist-history-overlay-right"
      ariaHideApp={false}
      style={{
        overlay: {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.2)',
          zIndex: 1000,
        },
        content: {
          position: 'fixed',
          top: 0,
          right: 0,
          width: '350px',
          height: '100vh',
          background: '#fff',
          boxShadow: '-2px 0 12px rgba(0,0,0,0.12)',
          borderRadius: '0 0 0 8px',
          zIndex: 1001,
          padding: 0,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <div className="virtualassist-history-popup">
        <div className="virtualassist-history-header">
          <span>Chat History</span>
          <button onClick={onClose} className="virtualassist-close-btn" aria-label="Close history">&times;</button>
        </div>
        <ul className="virtualassist-history-list">
          {chats.length === 0 ? (
            <li className="virtualassist-history-empty">No chat sessions found.</li>
          ) : (
            chats.map((chat) => (
              <li
                key={chat.id}
                className={`virtualassist-history-item${chat.id === activeChat ? " active" : ""}`}
                onClick={() => onSelectChat(chat.id)}
              >
                <span className="virtualassist-history-name">{chat.title || chat.name || `Chat ${chat.id}`}</span>
                <span className="virtualassist-history-date">
                  {chat.date || 
                   (chat.created_at && new Date(chat.created_at).toLocaleDateString()) || 
                   (chat.time_created && chat.time_created.slice(0, 10)) || 
                   new Date().toLocaleDateString()}
                </span>
                <button
                  className="virtualassist-delete-btn"
                  onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id); }}
                  aria-label="Delete chat"
                >
                  <FaTrash size={16} />
                </button>
              </li>
            ))
          )}
        </ul>
        <div className="virtualassist-session-messages">
          {loading ? (
            <div className="virtualassist-history-empty">Loading chat...</div>
          ) : error ? (
            <div className="virtualassist-history-empty">{error}</div>
          ) : sessionMessages.length === 0 ? (
            <div className="virtualassist-history-empty"></div>
          ) : (
            <ul className="virtualassist-messages-list">
              {sessionMessages.map((msg) => (
                (msg.message_type === "user" || msg.message_type === "assistant") && (
                  <li key={msg.message_id} className={`virtualassist-msg-${msg.message_type}`}>
                    <span className="virtualassist-msg-type">{msg.message_type === "user" ? "User" : "Bot"}:</span>
                    <span className="virtualassist-msg-text">{msg.message}</span>
                  </li>
                )
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
};


export default ChatHistoryPopup;
