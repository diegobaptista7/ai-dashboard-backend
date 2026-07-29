import { useState, useEffect, useRef } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function AiAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Hi there! 👋 I\'m your AI assistant. I\'m connected to the document and ready to answer your questions.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [serverStatus, setServerStatus] = useState('checking'); // 'online' | 'offline' | 'checking'
  const messagesEndRef = useRef(null);
  const chatCardRef = useRef(null);

  const sampleQuestions = [
    "What is this document about?",
    "What are the final beneficiaries of Casper?",
    "Give me a summary of all projects",
  ];

  // Check backend server status when widget is opened
  useEffect(() => {
    if (isOpen && serverStatus === 'checking') {
      checkServerHealth();
    }
  }, [isOpen]);

  // Close chat when clicking outside the card
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e) {
      if (chatCardRef.current && !chatCardRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  async function checkServerHealth() {
    try {
      const res = await fetch(`${API_BASE_URL}/`, { method: 'GET' });
      if (res.ok) {
        setServerStatus('online');
      } else {
        setServerStatus('offline');
      }
    } catch {
      setServerStatus('offline');
    }
  }

  async function handleReloadDocs() {
    setIsReloading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/recargar-documentos`, { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        setServerStatus('online');
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            sender: 'bot',
            text: `🔄 Documentation synced successfully (${data.total} document(s), ${data.chunks_indexados} fragments indexed).`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            systemMsg: true,
          },
        ]);
      }
    } catch {
      setServerStatus('offline');
    } finally {
      setIsReloading(false);
    }
  }

  async function sendMessage(textToSend) {
    const query = textToSend || input.trim();
    if (!query || isLoading) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/preguntar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: query }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Error communicating with server.');
      }

      const data = await res.json();
      setServerStatus('online');

      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: data.respuesta || 'No response received from server.',
        desdeMemoria: data.desde_memoria,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setServerStatus('offline');
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          isError: true,
          text: `⚠️ Could not connect to backend server at http://localhost:8000.\n\nMake sure to start it by running: python main.py`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Overlay Backdrop to close chat when clicking anywhere outside */}
      {isOpen && (
        <div
          className="ai-chat-backdrop"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="ai-assistant-wrapper">
        {/* Floating Toggle Button (Bottom-Left) */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`ai-toggle-btn ${isOpen ? 'active' : ''}`}
          aria-label="Open AI Assistant"
          title="AI Assistant (Google Docs RAG)"
        >
          <div className="ai-btn-icon">
            {isOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12A10 10 0 0 1 12 2z"/>
                <path d="M8 10h.01M16 10h.01M9 15c1.5 1 4.5 1 6 0"/>
              </svg>
            )}
          </div>
          {!isOpen && <span className="ai-btn-badge">AI</span>}
          <span className="ai-btn-status-dot"></span>
        </button>

        {/* Floating Chat Modal Panel */}
        {isOpen && (
          <div className="ai-chat-card animate-slide-up" ref={chatCardRef}>
            {/* Header */}
            <div className="ai-chat-header">
              <div className="ai-chat-header-info">
                <div className="ai-avatar">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                </div>
                <div>
                  <h4 className="ai-chat-title">AI Assistant</h4>
                  <div className="ai-chat-subtitle">
                    <span className={`status-indicator ${serverStatus}`}></span>
                    {serverStatus === 'online'
                      ? 'Connected to Google Doc'
                      : serverStatus === 'offline'
                      ? 'Offline — run python main.py'
                      : 'Checking...'}
                  </div>
                </div>
              </div>

              <div className="ai-header-actions">
                <button
                  onClick={handleReloadDocs}
                  disabled={isReloading}
                  className="ai-icon-btn"
                  title="Sync Google Docs"
                >
                  <svg
                    className={isReloading ? 'spin' : ''}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                  </svg>
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="ai-icon-btn"
                  title="Close chat"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages Body */}
            <div className="ai-chat-body">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`ai-message-row ${msg.sender === 'user' ? 'user-row' : 'bot-row'}`}
                >
                  <div
                    className={`ai-bubble ${
                      msg.sender === 'user'
                        ? 'user-bubble'
                        : msg.isError
                        ? 'error-bubble'
                        : msg.systemMsg
                        ? 'system-bubble'
                        : 'bot-bubble'
                    }`}
                  >
                    <div className="ai-bubble-content">
                      {msg.text.split('\n').map((line, idx) => (
                        <p key={idx}>{line}</p>
                      ))}
                    </div>
                    <div className="ai-bubble-footer">
                      <span className="ai-time">{msg.time}</span>
                      {msg.desdeMemoria && (
                        <span className="ai-memory-tag" title="Retrieved quickly from memory cache">
                          ⚡ Memory
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="ai-message-row bot-row">
                  <div className="ai-bubble bot-bubble loading-bubble">
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Sample Suggestion Chips */}
            <div className="ai-suggestions-bar">
              {sampleQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  disabled={isLoading}
                  className="ai-chip"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input Footer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="ai-chat-footer"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question about the document..."
                className="ai-input"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="ai-send-btn"
                title="Send question"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}

