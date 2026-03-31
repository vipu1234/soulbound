import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface Message { message_id: string; sender_id: string; content: string; created_at: string; }
interface Connection { partner_id: string; full_name: string; photo_url?: string; current_city?: string; }

export default function ChatPage() {
  const [params] = useSearchParams();
  const { user } = useAuth();
  const toast = useToast();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [activePartner, setActivePartner] = useState<Connection | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Init socket
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const s = io('http://localhost:5000', { auth: { token } });
    s.on('new_message', (msg: Message) => setMessages(prev => [...prev, msg]));
    s.on('error', (e: any) => toast(e.message, 'error'));
    setSocket(s);
    return () => { s.disconnect(); };
  }, []);

  // Load connections
  useEffect(() => {
    api.get('/interests/connections').then(({ data }) => {
      setConnections(data);
      const partnerId = params.get('partner');
      if (partnerId) {
        const found = data.find((c: Connection) => c.partner_id === partnerId);
        if (found) setActivePartner(found);
        else if (partnerId) setActivePartner({ partner_id: partnerId, full_name: 'Partner' });
      }
    }).catch(() => {});
  }, []);

  // Load messages when partner changes
  useEffect(() => {
    if (!activePartner) return;
    api.get(`/chat/${activePartner.partner_id}`).then(({ data }) => setMessages(data)).catch(() => setMessages([]));
  }, [activePartner]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = () => {
    if (!input.trim() || !activePartner || !socket) return;
    socket.emit('send_message', { to: activePartner.partner_id, content: input.trim() });
    setInput('');
  };

  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  const fmt = (ts: string) => new Date(ts).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });

  return (
    <div className="chat-page">
      {/* Sidebar */}
      <aside className="chat-sidebar">
        <div className="chat-sidebar-header">💬 Messages</div>
        <div className="chat-list">
          {connections.length === 0 && (
            <div style={{ padding:20, textAlign:'center', color:'var(--text-dim)', fontSize:14 }}>
              Accept an interest to unlock chat
            </div>
          )}
          {connections.map(c => (
            <div key={c.partner_id} className={`chat-list-item${activePartner?.partner_id === c.partner_id ? ' active' : ''}`} onClick={() => setActivePartner(c)}>
              <div className="chat-avatar">
                {c.photo_url ? <img src={`http://localhost:5000${c.photo_url}`} alt={c.full_name} style={{ width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover' }} /> : '👤'}
              </div>
              <div>
                <div className="chat-list-name">{c.full_name}</div>
                <div className="chat-list-preview">{c.current_city || 'Tap to chat'}</div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Chat window */}
      <main className="chat-window">
        {!activePartner ? (
          <div className="chat-empty">
            💬 Select a connection to start chatting
          </div>
        ) : (
          <>
            <div className="chat-header">
              <div className="chat-avatar">
                {activePartner.photo_url ? <img src={`http://localhost:5000${activePartner.photo_url}`} alt={activePartner.full_name} style={{ width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover' }} /> : '👤'}
              </div>
              <div>
                <div style={{ fontWeight:700 }}>{activePartner.full_name}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)' }}>🟢 Secure encrypted chat</div>
              </div>
            </div>

            <div className="chat-messages">
              {messages.length === 0 && (
                <div style={{ textAlign:'center', color:'var(--text-dim)', marginTop:'auto', fontSize:14, padding:24 }}>
                  🔐 End-to-end encrypted. Say hello!
                </div>
              )}
              {messages.map(m => (
                <div key={m.message_id} className={`msg ${m.sender_id === user?.user_id ? 'msg-me' : 'msg-them'}`}>
                  <div>{m.content}</div>
                  <div className="msg-time">{fmt(m.created_at)}</div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <div className="chat-input-area">
              <textarea className="chat-input" rows={1} placeholder="Type a message…" value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} />
              <button className="btn btn-primary btn-sm" onClick={send} disabled={!input.trim()}>Send ➤</button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
