import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

function calcAge(dob: string) {
  if (!dob) return '—';
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
}

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reportModal, setReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('fake_profile');
  const [reportDesc, setReportDesc] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const toast = useToast();
  const navigate = useNavigate();
  const isOwn = userId === 'me' || userId === user?.user_id;

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const endpoint = isOwn ? '/profile/me' : `/profile/${userId}`;
        const { data } = await api.get(endpoint);
        setProfile(data);
      } catch (err: any) { toast(err.response?.data?.error || 'Profile not found', 'error'); navigate('/discover'); }
      finally { setLoading(false); }
    };
    fetch();
  }, [userId]);

  // Draw watermark on canvas after image loads
  const drawWatermark = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !user) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = img.clientWidth;
    canvas.height = img.clientHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = `bold ${Math.max(12, canvas.width / 18)}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-Math.PI / 6);
    const wm = `VIVAH·${user.user_id.slice(0, 8).toUpperCase()}`;
    for (let y = -canvas.height; y < canvas.height; y += 80) {
      for (let x = -canvas.width; x < canvas.width; x += 200) {
        ctx.fillText(wm, x, y);
      }
    }
    ctx.restore();
  };

  const sendInterest = async () => {
    try { await api.post(`/interests/${userId}`); toast('Interest sent! 💌', 'success'); }
    catch (err: any) { toast(err.response?.data?.error || 'Failed', 'error'); }
  };

  const submitReport = async () => {
    try {
      await api.post(`/reports/${userId}`, { reason: reportReason, description: reportDesc });
      toast('Report submitted. Thank you.', 'success');
      setReportModal(false);
    } catch (err: any) { toast(err.response?.data?.error || 'Report failed', 'error'); }
  };

  if (loading) return <div className="page-wrapper loading-center"><div className="spinner" /></div>;
  if (!profile) return null;

  const age = calcAge(profile.dob);

  return (
    <div className="profile-page">
      <div className="profile-hero">
        {/* Photo */}
        <div className="profile-photo-wrap">
          {profile.photo_url ? (
            <>
              <img ref={imgRef} src={`http://localhost:5000${profile.photo_url}`} alt={profile.full_name} onLoad={drawWatermark} draggable={false} style={{ userSelect:'none' }} />
              <canvas ref={canvasRef} className="watermark-canvas" />
            </>
          ) : (
            <div className="profile-photo-placeholder">{profile.gender === 'female' ? '👩' : '👨'}</div>
          )}
        </div>

        {/* Info */}
        <div className="profile-info">
          <div className="profile-name">{profile.full_name || 'Profile'}</div>
          <div className="profile-tagline">{age} yrs • {profile.occupation || 'Professional'} • {profile.current_city || 'India'}</div>
          <div className="profile-badges">
            {profile.is_verified && <span className="badge badge-verified">✓ Govt ID Verified</span>}
            {profile.trust_score >= 50 && <span className="badge badge-primary">⭐ Trusted</span>}
            <span className="badge badge-success">🤝 Trust Score: {profile.trust_score}</span>
          </div>
          {profile.about_me && <p style={{ fontSize:15, color:'var(--text-muted)', lineHeight:1.7 }}>{profile.about_me}</p>}
          {!isOwn && (
            <div className="profile-cta">
              <button className="btn btn-primary" onClick={sendInterest}>💌 Send Interest</button>
              <button className="btn btn-ghost" onClick={() => navigate(`/chat?partner=${userId}`)}>💬 Chat</button>
              <button className="btn btn-ghost btn-sm" style={{ color:'var(--error)', borderColor:'var(--error)' }} onClick={() => setReportModal(true)}>🚩 Report</button>
            </div>
          )}
          {isOwn && (
            <div className="profile-cta">
              <button className="btn btn-outline" onClick={() => navigate('/onboarding')}>✏️ Edit Profile</button>
              <button className="btn btn-ghost" onClick={() => navigate('/settings')}>⚙️ Settings</button>
            </div>
          )}
        </div>
      </div>

      {/* Detail Cards */}
      <div className="profile-details">
        <div className="detail-card">
          <div className="detail-card-title">👤 Personal</div>
          {[
            ['Date of Birth', profile.dob ? new Date(profile.dob).toLocaleDateString('en-IN') : '—'],
            ['Gender', profile.gender],
            ['Marital Status', profile.marital_status?.replace('_',' ')],
            ['Height', profile.height_cm ? `${profile.height_cm} cm` : '—'],
            ['Blood Group', profile.blood_group || '—'],
            ['Mother Tongue', profile.mother_tongue || '—'],
          ].map(([k, v]) => (
            <div className="detail-row" key={k}><span className="detail-key">{k}</span><span className="detail-value">{v || '—'}</span></div>
          ))}
        </div>
        <div className="detail-card">
          <div className="detail-card-title">💼 Professional</div>
          {[
            ['Occupation', profile.occupation],
            ['Company', profile.company],
            ['Education', profile.education_level?.replace('_',' ')],
            ['Field', profile.education_field],
            ['Annual Income', profile.annual_income ? `₹${Number(profile.annual_income).toLocaleString('en-IN')}` : '—'],
          ].map(([k, v]) => (
            <div className="detail-row" key={k}><span className="detail-key">{k}</span><span className="detail-value">{v || '—'}</span></div>
          ))}
        </div>
        <div className="detail-card">
          <div className="detail-card-title">🙏 Family & Religion</div>
          {[
            ['Religion', profile.religion],
            ['Caste', profile.caste],
            ['Hometown', profile.hometown],
            ['Location', [profile.current_city, profile.current_state].filter(Boolean).join(', ')],
            ['Manglik', profile.manglik],
          ].map(([k, v]) => (
            <div className="detail-row" key={k}><span className="detail-key">{k}</span><span className="detail-value">{v || '—'}</span></div>
          ))}
        </div>
        <div className="detail-card">
          <div className="detail-card-title">✨ Lifestyle</div>
          {[
            ['Diet', profile.lifestyle_diet],
            ['Smoking', profile.lifestyle_smoke],
            ['Drinking', profile.lifestyle_drink],
            ['Physical Status', profile.disability || 'None'],
          ].map(([k, v]) => (
            <div className="detail-row" key={k}><span className="detail-key">{k}</span><span className="detail-value">{v || '—'}</span></div>
          ))}
        </div>
      </div>

      {/* Horoscope */}
      {profile.horoscope_data && Object.keys(profile.horoscope_data).length > 0 && (
        <div className="detail-card" style={{ marginTop:16 }}>
          <div className="detail-card-title">🔮 Horoscope</div>
          {Object.entries(profile.horoscope_data).filter(([,v]) => v).map(([k, v]) => (
            <div className="detail-row" key={k}><span className="detail-key">{k}</span><span className="detail-value">{String(v)}</span></div>
          ))}
        </div>
      )}

      {/* Report Modal */}
      {reportModal && (
        <div className="modal-overlay" onClick={() => setReportModal(false)}>
          <div className="glass modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setReportModal(false)}>✕</button>
            <div className="modal-title">🚩 Report Profile</div>
            <div className="modal-desc">Help us keep the community safe. All reports are reviewed within 24 hours.</div>
            <div className="form-group" style={{ marginBottom:16 }}>
              <label className="form-label">Reason</label>
              <select className="form-input form-select" value={reportReason} onChange={e => setReportReason(e.target.value)}>
                <option value="fake_profile">Fake Profile</option>
                <option value="harassment">Harassment</option>
                <option value="inappropriate_content">Inappropriate Content</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom:20 }}>
              <label className="form-label">Additional Details (optional)</label>
              <textarea className="form-input" rows={3} value={reportDesc} onChange={e => setReportDesc(e.target.value)} />
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button className="btn btn-danger" onClick={submitReport}>Submit Report</button>
              <button className="btn btn-ghost" onClick={() => setReportModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
