import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useToast } from '../contexts/ToastContext';

function calcAge(dob: string) {
  if (!dob) return '';
  return `${Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000))} yrs`;
}

export default function InterestsPage() {
  const [tab, setTab] = useState<'received' | 'sent' | 'connections'>('received');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/interests/${tab}`);
      setItems(data);
    } catch (err: any) { toast('Failed to load', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [tab]);

  const respond = async (interestId: string, action: 'accepted' | 'rejected') => {
    try {
      await api.put(`/interests/${interestId}`, { action });
      toast(action === 'accepted' ? '🎉 Interest accepted! Chat unlocked.' : 'Interest declined.', action === 'accepted' ? 'success' : 'info');
      load();
    } catch (err: any) { toast(err.response?.data?.error || 'Failed', 'error'); }
  };

  const tabs: { key: typeof tab; label: string }[] = [
    { key: 'received',    label: '📥 Received' },
    { key: 'sent',        label: '📤 Sent' },
    { key: 'connections', label: '🤝 Connections' },
  ];

  return (
    <div className="interests-page">
      <h1 style={{ fontSize:'clamp(24px,4vw,36px)', fontWeight:800, marginBottom:24 }}>Interests & Connections</h1>

      <div className="interests-tabs">
        {tabs.map(t => (
          <button key={t.key} className={`interests-tab${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">{tab === 'received' ? '📥' : tab === 'sent' ? '📤' : '🤝'}</div>
          <div className="empty-state-title">No {tab} yet</div>
          <p>{tab === 'received' ? 'Interests from others will appear here.' : tab === 'sent' ? 'People you\'ve shown interest in.' : 'Accept interests to unlock chat.'}</p>
          {tab !== 'received' && <button className="btn btn-primary" style={{ marginTop:16 }} onClick={() => navigate('/discover')}>Discover Profiles</button>}
        </div>
      ) : (
        <div className="interest-list">
          {items.map(item => {
            const otherId = item.sender_id || item.receiver_id || item.partner_id;
            const name = item.full_name || 'Unknown';
            const meta = [calcAge(item.dob), item.occupation, item.current_city].filter(Boolean).join(' • ');

            return (
              <div key={item.interest_id} className="interest-item">
                <div className="interest-avatar">
                  {item.photo_url
                    ? <img src={`http://localhost:5000${item.photo_url}`} alt={name} style={{ width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover' }} />
                    : '👤'}
                </div>
                <div className="interest-info" onClick={() => navigate(`/profile/${otherId}`)} style={{ cursor:'pointer' }}>
                  <div className="interest-name">
                    {name}
                    {item.is_verified && <span style={{ fontSize:12 }}>✅</span>}
                  </div>
                  <div className="interest-meta">{meta}</div>
                </div>
                <div className="interest-actions">
                  {tab === 'received' && item.status === 'pending' && (
                    <>
                      <button className="btn btn-primary btn-sm" onClick={() => respond(item.interest_id, 'accepted')}>Accept</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => respond(item.interest_id, 'rejected')}>Decline</button>
                    </>
                  )}
                  {tab === 'sent' && (
                    <span className={`interest-status ${item.status}`}>{item.status}</span>
                  )}
                  {tab === 'connections' && (
                    <button className="btn btn-primary btn-sm" onClick={() => navigate(`/chat?partner=${otherId}`)}>💬 Chat</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
