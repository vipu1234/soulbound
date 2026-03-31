import React from 'react';
import { useNavigate } from 'react-router-dom';

interface Profile {
  user_id: string;
  full_name: string;
  dob: string;
  gender: string;
  religion: string;
  occupation: string;
  current_city: string;
  current_state?: string;
  photo_url?: string;
  is_verified: boolean;
  trust_score: number;
  marital_status?: string;
  education_level?: string;
  height_cm?: number;
}

interface Props {
  profile: Profile;
  onInterest?: (userId: string) => void;
  onClick?: () => void;
  showActions?: boolean;
}

function calcAge(dob: string) {
  if (!dob) return '—';
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
}

export default function MatchCard({ profile, onInterest, onClick, showActions = true }: Props) {
  const navigate = useNavigate();
  const age = calcAge(profile.dob);

  return (
    <div className="match-card" onClick={() => { onClick ? onClick() : navigate(`/profile/${profile.user_id}`); }}>
      <div className="match-photo">
        {profile.photo_url
          ? <img src={`http://localhost:5000${profile.photo_url}`} alt={profile.full_name} />
          : <div className="match-photo-placeholder">{profile.gender === 'female' ? '👩' : '👨'}</div>
        }
        <div className="match-photo-badge">
          {profile.is_verified && <span className="badge badge-verified">✓ Verified</span>}
          {profile.trust_score >= 50 && <span className="badge badge-primary">⭐ Trusted</span>}
        </div>
      </div>
      <div className="match-body">
        <div className="match-name">
          {profile.full_name || 'Anonymous'}
          {profile.is_verified && <span style={{ fontSize:14 }}>✅</span>}
        </div>
        <div className="match-meta">
          <span className="match-meta-item">🎂 {age} yrs</span>
          {profile.height_cm && <span className="match-meta-item">📏 {profile.height_cm} cm</span>}
          {profile.religion && <span className="match-meta-item">🙏 {profile.religion}</span>}
          {profile.occupation && <span className="match-meta-item">💼 {profile.occupation}</span>}
          {profile.current_city && <span className="match-meta-item">📍 {profile.current_city}{profile.current_state ? `, ${profile.current_state}` : ''}</span>}
        </div>
        {showActions && (
          <div className="match-actions" onClick={e => e.stopPropagation()}>
            <button className="btn btn-primary btn-sm" onClick={() => onInterest?.(profile.user_id)}>💌 Interest</button>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/profile/${profile.user_id}`)}>View Profile</button>
          </div>
        )}
      </div>
    </div>
  );
}
