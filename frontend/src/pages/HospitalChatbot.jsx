import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { Bot, User, Send, Sparkles, PhoneCall, Clock, ShieldCheck, Pill, MapPin } from 'lucide-react';

export const HospitalChatbot = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: (
        "Hello! I am your MediPulse Hospital Assistant 🏥\n\n" +
        "I can answer your questions regarding:\n" +
        "• Visiting hours for ICU and General wards\n" +
        "• 24/7 Emergency & Ambulance helpline\n" +
        "• Health insurance cashless claims desk\n" +
        "• OPD appointments & specialist doctors\n" +
        "• In-house 24/7 pharmacy & pathology lab tests\n\n" +
        "How may I assist you today?"
      ),
      time: 'Just now'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const data = await api.get('/ai/faq-suggestions');
        setSuggestions(data.suggestions || []);
      } catch (err) {
        setSuggestions([
          "What are the visiting hours for ICU?",
          "How do I book an appointment?",
          "What is the emergency helpline number?",
          "Which health insurance plans do you accept?",
          "Tell me about the hospital pharmacy"
        ]);
      }
    };
    loadSuggestions();
  }, []);

  const handleSend = async (queryText = null) => {
    const query = (queryText || input).trim();
    if (!query) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput('');
    setLoading(true);

    try {
      const data = await api.post('/ai/faq-chat', { query });
      const botResponse = data.response;

      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: botResponse.answer,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        followUps: botResponse.suggested_prompts || []
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: "I am having trouble connecting to the hospital information desk right now. Please call our 24/7 hotline at +1-555-0100.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: '960px' }}>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Bot size={13} /> 24/7 Information Desk
            </span>
          </div>
          <h1 className="page-title">Hospital FAQ Chatbot</h1>
          <p className="page-subtitle">Instant answers about hospital policies, timings, insurance, and medical facilities.</p>
        </div>
      </div>

      {/* Chat Container */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '620px' }}>
        {/* Chat Header */}
        <div style={{
          padding: '1rem 1.5rem',
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Bot size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>MediPulse AI Help Desk</div>
            <div style={{ fontSize: '0.75rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#16a34a' }}></span>
              Online & Ready to Assist
            </div>
          </div>
        </div>

        {/* Message stream */}
        <div style={{
          flex: 1,
          padding: '1.5rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          backgroundColor: '#fcfdfd'
        }}>
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: m.sender === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              <div style={{
                display: 'flex',
                gap: '0.65rem',
                maxWidth: '85%',
                flexDirection: m.sender === 'user' ? 'row-reverse' : 'row'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: m.sender === 'user' ? 'var(--primary)' : '#e2e8f0',
                  color: m.sender === 'user' ? 'white' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {m.sender === 'user' ? <User size={16} /> : <Bot size={18} />}
                </div>

                <div style={{
                  backgroundColor: m.sender === 'user' ? 'var(--primary)' : '#ffffff',
                  color: m.sender === 'user' ? '#ffffff' : 'var(--text-primary)',
                  padding: '0.85rem 1.15rem',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: m.sender === 'user' ? 'none' : 'var(--shadow-sm)',
                  border: m.sender === 'user' ? 'none' : '1px solid var(--border)',
                  fontSize: '0.9rem',
                  lineHeight: 1.55,
                  whiteSpace: 'pre-line'
                }}>
                  {m.text}
                </div>
              </div>

              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem', paddingLeft: m.sender === 'user' ? 0 : '42px', paddingRight: m.sender === 'user' ? '42px' : 0 }}>
                {m.time}
              </div>

              {/* Follow-up question pills */}
              {m.followUps && m.followUps.length > 0 && (
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.5rem', paddingLeft: '42px' }}>
                  {m.followUps.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(prompt)}
                      style={{
                        backgroundColor: 'var(--bg-subtle)',
                        border: '1px solid var(--border)',
                        color: 'var(--primary)',
                        padding: '0.35rem 0.75rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0f2fe'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
                    >
                      {prompt} →
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={18} color="var(--text-secondary)" />
              </div>
              <div style={{ backgroundColor: 'white', border: '1px solid var(--border)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Consulting hospital services directory...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompt suggestions strip */}
        <div style={{
          padding: '0.65rem 1.25rem',
          backgroundColor: '#f8fafc',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          gap: '0.45rem',
          overflowX: 'auto',
          whiteSpace: 'nowrap'
        }}>
          {suggestions.slice(0, 4).map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(s)}
              disabled={loading}
              style={{
                backgroundColor: 'white',
                border: '1px solid var(--border)',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: 'white',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            gap: '0.75rem'
          }}
        >
          <input
            type="text"
            className="form-input"
            placeholder="Ask about visiting hours, insurance, pharmacy, ambulance..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !input.trim()}
            style={{ padding: '0.65rem 1.25rem' }}
          >
            <Send size={16} /> Send
          </button>
        </form>
      </div>
    </div>
  );
};
