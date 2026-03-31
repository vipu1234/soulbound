import React, { useEffect, useRef, useState } from 'react';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button className={`toggle${on ? ' on' : ''}`} onClick={onToggle} type="button">
      <div className="toggle-dot" />
    </button>
  );
}

export default function SettingsPage() {
  const { user, logout, refreshUser } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [privacy, setPrivacy] = useState<any>({ photo_visibility:'registered_only', contact_visibility:'accepted_only', show_online_status:true, is_hidden:false });
  const [govtId, setGovtId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/privacy').then(({ data }) => setPrivacy(data)).catch(() => {});
  }, []);

  const savePrivacy = async (patch: any) => {
    const next = { ...privacy, ...patch };
    setPrivacy(next);
    try { await api.put('/privacy', patch); toast('Privacy updated', 'success'); }
    catch { toast('Failed to update', 'error'); }
  };

  const toggleGhost = async () => {
    try {
      const { data } = await api.post('/privacy/ghost');
      setPrivacy((p: any) => ({ ...p, is_hidden: data.is_hidden }));
      toast(data.message, 'info');
    } catch { toast('Failed', 'error'); }
  };

  const uploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const form = new FormData();
    form.append('photo', e.target.files[0]);
    setLoading(true);
    try {
      await api.post('/profile/photo', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      await refreshUser();
      toast('Photo updated! 📷', 'success');
    } catch (err: any) { toast(err.response?.data?.error || 'Upload failed', 'error'); }
    finally { setLoading(false); }
  };

  const submitGovtId = async () => {
    if (!govtId.trim()) return;
    try {
      await api.post('/profile/govt-id', { govtId: govtId.trim() });
      await refreshUser();
      toast('✅ Govt ID verified! Verified badge earned.', 'success');
      setGovtId('');
    } catch (err: any) { toast(err.response?.data?.error || 'Verification failed', 'error'); }
  };

  const accountAction = async (action: 'paused' | 'deleted') => {
    const confirm = window.confirm(action === 'deleted' ? 'Are you sure? Account deletion is permanent.' : 'Pause your profile? You can resume anytime.');
    if (!confirm) return;
    try {
      await api.post('/privacy/account-status', { action });
      toast(action === 'deleted' ? 'Account deleted' : 'Profile paused', 'info');
      logout();
      nav('/');
    } catch { toast('Failed', 'error'); }
  };

  return (
    <div className="settings-page">
      <h1 style={{ fontSize:'clamp(24px,4vw,36px)', fontWeight:800, marginBottom:32 }}>⚙️ Settings</h1>

      {/* Profile Photo */}
      <div className="settings-section">
        <div className="settings-title">📷 Profile Photo</div>
        <div style={{ display:'flex', alignItems:'center', gap:20, padding:16, background:'var(--bg-card)', borderRadius:'var(--radius)', border:'1px solid var(--border)' }}>
          <div style={{ width:72, height:72, borderRadius:'50%', overflow:'hidden', border:'2px solid var(--primary)', background:'var(--bg-dark)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, flexShrink:0 }}>
            {user?.photo_url ? <img src={`http://localhost:5000${user.photo_url}`} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : '👤'}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:600, marginBottom:4 }}>Your profile photo</div>
            <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:12 }}>Photos are automatically watermarked for security</div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={uploadPhoto} />
            <button className="btn btn-outline btn-sm" onClick={() => fileRef.current?.click()} disabled={loading}>
              {loading ? 'Uploading...' : '📤 Change Photo'}
            </button>
          </div>
        </div>
      </div>

      {/* Verification */}
      <div className="settings-section">
        <div className="settings-title">🛡️ Identity Verification</div>
        {user?.is_verified ? (
          <div style={{ padding:'16px 20px', background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.25)', borderRadius:'var(--radius)', display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:28 }}>✅</span>
            <div>
              <div style={{ fontWeight:700, color:'var(--success)' }}>Verified</div>
              <div style={{ fontSize:13, color:'var(--text-muted)' }}>Your Govt ID has been verified. Badge displayed on profile.</div>
            </div>
          </div>
        ) : (
          <div style={{ padding:20, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius)' }}>
            <div style={{ fontWeight:600, marginBottom:4 }}>Earn the Verified Badge</div>
            <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:16 }}>Enter your Aadhaar/Passport number. It's stored AES-256 encrypted and never shared.</div>
            <div style={{ display:'flex', gap:10 }}>
              <input className="form-input" type="text" placeholder="XXXX-XXXX-XXXX (Aadhaar) or A1234567 (Passport)" value={govtId} onChange={e => setGovtId(e.target.value)} style={{ flex:1 }} />
              <button className="btn btn-gold btn-sm" onClick={submitGovtId} disabled={!govtId.trim()}>Verify</button>
            </div>
          </div>
        )}
      </div>

      {/* Privacy */}
      <div className="settings-section">
        <div className="settings-title">🔒 Privacy Controls</div>
        {[
          { label:'Show Online Status', desc:'Let others see when you\'re active', key:'show_online_status', type:'toggle' },
        ].map(s => (
          <div className="settings-row" key={s.key}>
            <div className="settings-row-info">
              <div className="settings-row-label">{s.label}</div>
              <div className="settings-row-desc">{s.desc}</div>
            </div>
            <Toggle on={privacy[s.key]} onToggle={() => savePrivacy({ [s.key]: !privacy[s.key] })} />
          </div>
        ))}

        <div className="settings-row">
          <div className="settings-row-info">
            <div className="settings-row-label">Photo Visibility</div>
            <div className="settings-row-desc">Who can see your profile photos</div>
          </div>
          <select className="form-input form-select" style={{ width:'auto' }} value={privacy.photo_visibility} onChange={e => savePrivacy({ photo_visibility: e.target.value })}>
            <option value="public">Everyone</option>
            <option value="registered_only">Registered Users</option>
            <option value="accepted_only">Connections Only</option>
          </select>
        </div>
      </div>

      {/* Ghost Mode */}
      <div className="settings-section">
        <div className="settings-title">🫥 Ghost Mode</div>
        <div className="settings-row" style={{ borderColor: privacy.is_hidden ? 'rgba(233,30,140,0.4)' : undefined }}>
          <div className="settings-row-info">
            <div className="settings-row-label">Hide My Profile</div>
            <div className="settings-row-desc">{privacy.is_hidden ? '🫥 You are invisible to other users' : 'Instantly disappear from all search results'}</div>
          </div>
          <Toggle on={privacy.is_hidden} onToggle={toggleGhost} />
        </div>
      </div>

      {/* Danger Zone */}
      <div className="settings-section">
        <div className="settings-title" style={{ color:'var(--error)' }}>⚠️ Account</div>
        <div className="danger-zone">
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => accountAction('paused')}>⏸ Pause Profile</button>
            <button className="btn btn-danger btn-sm" onClick={() => accountAction('deleted')}>🗑️ Delete Account</button>
          </div>
          <p style={{ fontSize:12, color:'var(--text-dim)', marginTop:12 }}>Pausing hides your profile temporarily. Deletion is permanent.</p>
        </div>
      </div>
    </div>
  );
}
