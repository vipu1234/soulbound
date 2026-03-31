import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import MatchCard from '../components/MatchCard';

export default function DiscoveryPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/search/daily-matches');
      setMatches(data);
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to load matches', 'error');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchMatches(); }, []);

  const sendInterest = async (userId: string) => {
    try {
      await api.post(`/interests/${userId}`);
      toast('Interest sent! 💌', 'success');
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to send interest', 'error');
    }
  };

  return (
    <div className="discovery-page">
      <div className="discovery-header">
        <div>
          <h1 style={{ fontSize:'clamp(24px,4vw,36px)', fontWeight:800, marginBottom:4 }}>
            Daily Matches 💍
          </h1>
          <p style={{ color:'var(--text-muted)', fontSize:15 }}>
            {user?.full_name ? `Hey ${user.full_name}! ` : ''}Curated for you based on your preferences
          </p>
        </div>
        <div style={{ display:'flex', gap:12 }}>
          <button className="btn btn-ghost btn-sm" onClick={fetchMatches}>🔄 Refresh</button>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/search')}>🔍 Advanced Search</button>
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : matches.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <div className="empty-state-title">No matches found yet</div>
          <p>Complete your profile and set preferences to get better matches.</p>
          <button className="btn btn-primary" style={{ marginTop:16 }} onClick={() => navigate('/onboarding')}>Complete Profile</button>
        </div>
      ) : (
        <div className="matches-grid">
          {matches.map(m => (
            <MatchCard key={m.user_id} profile={m} onInterest={sendInterest} onClick={() => navigate(`/profile/${m.user_id}`)} />
          ))}
        </div>
      )}

      {/* Incomplete profile banner */}
      {user && (user.wizard_step || 0) < 3 && (
        <div className="glass" style={{ marginTop:32, padding:'20px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', borderColor:'rgba(255,215,0,0.3)', gap:16, flexWrap:'wrap' }}>
          <div>
            <div style={{ fontWeight:700, color:'var(--gold)' }}>⚠️ Your profile is incomplete</div>
            <div style={{ color:'var(--text-muted)', fontSize:14 }}>Complete your profile to get more relevant matches</div>
          </div>
          <button className="btn btn-gold btn-sm" onClick={() => navigate('/onboarding')}>Complete Profile</button>
        </div>
      )}
    </div>
  );
}
