import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const MessagingSystem = ({ currentUser }) => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchJobDetails();
    fetchMessages();
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/jobs/${jobId}`);
      if (response.ok) {
        const data = await response.json();
        setJob(data);
      }
    } catch (err) {
      console.error('Failed to fetch job details:', err);
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/jobs/${jobId}/messages`);
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
        
        // Mark messages as read
        await markMessagesRead();
      } else {
        throw new Error('Failed to fetch messages');
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const markMessagesRead = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/jobs/${jobId}/messages/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (err) {
      console.error('Failed to mark messages as read:', err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setSending(true);
      
      const messageData = {
        company_id: currentUser.company_id,
        job_id: jobId,
        sender_type: currentUser.role,
        sender_id: currentUser.sub,
        sender_name: currentUser.name,
        content: newMessage.trim()
      };

      const response = await fetch(`${BACKEND_URL}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      if (response.ok) {
        const sentMessage = await response.json();
        setMessages(prev => [...prev, sentMessage]);
        setNewMessage('');
      } else {
        throw new Error('Failed to send message');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessageTime = (timestamp) => {
    return new Date(timestamp).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSenderIcon = (senderType) => {
    switch (senderType) {
      case 'owner': return '👑';
      case 'technician': return '🔧';
      case 'dispatcher': return '📋';
      case 'customer': return '👤';
      case 'system': return '🤖';
      default: return '💬';
    }
  };

  if (loading) {
    return (
      <div className="messaging-loading">
        <div className="spinner"></div>
        <p>Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="messaging-system">
      {/* Header */}
      <div className="messaging-header">
        <button onClick={() => navigate('/portal')} className="back-btn">
          ← Back to Dashboard
        </button>
        
        <div className="job-info">
          <h1>💬 Job Communication</h1>
          {job && (
            <div className="job-details">
              <h3>{job.title}</h3>
              <p>{job.description}</p>
              <span className={`status status-${job.status}`}>
                {job.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Messages Container */}
      <div className="messages-container">
        <div className="messages-list">
          {messages.length === 0 ? (
            <div className="no-messages">
              <div className="no-messages-icon">💭</div>
              <h3>No messages yet</h3>
              <p>Start the conversation by sending the first message</p>
            </div>
          ) : (
            messages.map((message) => (
              <div 
                key={message.id} 
                className={`message ${message.sender_type === currentUser.role ? 'own-message' : 'other-message'}`}
              >
                <div className="message-avatar">
                  {getSenderIcon(message.sender_type)}
                </div>
                
                <div className="message-content">
                  <div className="message-header">
                    <span className="sender-name">{message.sender_name}</span>
                    <span className="sender-role">({message.sender_type})</span>
                    <span className="message-time">{formatMessageTime(message.created_at)}</span>
                  </div>
                  
                  <div className="message-text">
                    {message.content}
                  </div>
                  
                  {message.is_sms_bridge && (
                    <div className="sms-indicator">
                      📱 Sent via SMS
                    </div>
                  )}
                  
                  <div className="message-status">
                    <span className={`status-dot ${message.status}`}></span>
                    {message.status}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Message Input */}
      <div className="message-input-container">
        <div className="message-input">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
            rows="3"
            disabled={sending}
          />
          
          <button 
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className="send-btn"
          >
            {sending ? (
              <>
                <span className="mini-spinner"></span>
                Sending...
              </>
            ) : (
              <>📤 Send</>
            )}
          </button>
        </div>
        
        <div className="input-footer">
          <div className="features">
            <span className="feature-tag">📱 SMS Bridge Enabled</span>
            <span className="feature-tag">🔔 Real-time Updates</span>
          </div>
          
          <div className="user-info">
            Messaging as: <strong>{currentUser.name}</strong> ({currentUser.role})
          </div>
        </div>
      </div>

      <style jsx>{`
        .messaging-system {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: #f8fafc;
        }

        .messaging-header {
          background: white;
          padding: 1.5rem 2rem;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .back-btn {
          background: #f1f5f9;
          color: #475569;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 500;
        }

        .back-btn:hover {
          background: #e2e8f0;
        }

        .job-info h1 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 0.5rem;
        }

        .job-details h3 {
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.25rem;
        }

        .job-details p {
          color: #6b7280;
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
        }

        .status {
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .status-pending { background: #fef3c7; color: #92400e; }
        .status-assigned { background: #dbeafe; color: #1d4ed8; }
        .status-in_progress { background: #fed7aa; color: #ea580c; }
        .status-completed { background: #d1fae5; color: #065f46; }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 2rem;
        }

        .messages-list {
          max-width: 800px;
          margin: 0 auto;
          space-y: 1.5rem;
        }

        .no-messages {
          text-align: center;
          padding: 4rem 2rem;
          color: #6b7280;
        }

        .no-messages-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .no-messages h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .message {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .message.own-message {
          flex-direction: row-reverse;
        }

        .message.own-message .message-content {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
        }

        .message.own-message .message-header .sender-name,
        .message.own-message .message-header .sender-role {
          color: rgba(255, 255, 255, 0.9);
        }

        .message.own-message .message-header .message-time {
          color: rgba(255, 255, 255, 0.7);
        }

        .message-avatar {
          width: 40px;
          height: 40px;
          background: #f1f5f9;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        .message-content {
          background: white;
          border-radius: 1rem;
          padding: 1rem 1.5rem;
          box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
          max-width: 500px;
          border: 1px solid #e2e8f0;
        }

        .message-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
          font-size: 0.875rem;
        }

        .sender-name {
          font-weight: 600;
          color: #374151;
        }

        .sender-role {
          color: #6b7280;
          font-style: italic;
        }

        .message-time {
          color: #9ca3af;
          margin-left: auto;
          font-size: 0.75rem;
        }

        .message-text {
          line-height: 1.6;
          color: #374151;
          word-wrap: break-word;
          white-space: pre-wrap;
        }

        .sms-indicator {
          margin-top: 0.5rem;
          font-size: 0.75rem;
          color: #6366f1;
          font-weight: 500;
        }

        .message-status {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          margin-top: 0.5rem;
          font-size: 0.75rem;
          color: #9ca3af;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #d1d5db;
        }

        .status-dot.sent { background: #3b82f6; }
        .status-dot.delivered { background: #10b981; }
        .status-dot.read { background: #059669; }

        .message-input-container {
          background: white;
          border-top: 1px solid #e2e8f0;
          padding: 1.5rem 2rem;
        }

        .message-input {
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          gap: 1rem;
          align-items: flex-end;
        }

        .message-input textarea {
          flex: 1;
          border: 1px solid #d1d5db;
          border-radius: 0.75rem;
          padding: 0.75rem 1rem;
          resize: vertical;
          font-family: inherit;
          font-size: 0.875rem;
          line-height: 1.5;
          transition: border-color 0.2s ease;
        }

        .message-input textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .send-btn {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          white-space: nowrap;
        }

        .send-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #1d4ed8, #1e40af);
          transform: translateY(-1px);
        }

        .send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .mini-spinner {
          width: 14px;
          height: 14px;
          border: 1.5px solid rgba(255, 255, 255, 0.3);
          border-top: 1.5px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .input-footer {
          max-width: 800px;
          margin: 1rem auto 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.75rem;
          color: #6b7280;
        }

        .features {
          display: flex;
          gap: 0.5rem;
        }

        .feature-tag {
          background: #f1f5f9;
          color: #475569;
          padding: 0.25rem 0.5rem;
          border-radius: 0.375rem;
          font-weight: 500;
        }

        .user-info {
          font-weight: 500;
        }

        .messaging-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          padding: 2rem;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e2e8f0;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .messaging-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .messages-container {
            padding: 1rem;
          }

          .message-input-container {
            padding: 1rem;
          }

          .message-input {
            flex-direction: column;
            align-items: stretch;
          }

          .send-btn {
            align-self: flex-end;
          }

          .input-footer {
            flex-direction: column;
            gap: 0.5rem;
            align-items: flex-start;
          }

          .features {
            flex-wrap: wrap;
          }

          .message-content {
            max-width: 280px;
          }
        }
      `}</style>
    </div>
  );
};

export default MessagingSystem;