import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import '../premium.css';

const TICKER_ITEMS = [
  'Govt ID Verified Profiles', 'AES-256 Encrypted', 'Secure Chat', 
  'Ghost Mode Privacy', 'Photo Watermarking', '15 Smart Filters',
  'Govt ID Verified Profiles', 'AES-256 Encrypted', 'Secure Chat', 
  'Ghost Mode Privacy', 'Photo Watermarking', '15 Smart Filters',
];

const FEATURES = [
  { icon: '🛡️', title: 'Sovereign Identity Verification', desc: 'Every profile is authenticated via Aadhaar or Passport. A Verified Badge is issued only after our team confirms the document — eliminating fakes entirely.' },
  { icon: '🔐', title: 'AES-256 Encryption at Rest', desc: 'All personally identifiable information — Aadhaar numbers, phone numbers — is encrypted with military-grade AES-256-GCM before it ever touches our database.' },
  { icon: '🔍', title: '15-Dimension Smart Filters', desc: 'Filter by age, height, religion, caste, education, profession, income, lifestyle, manglik status, mother tongue, location, and more — with millisecond precision.' },
  { icon: '💬', title: 'Consent-Gated Secure Chat', desc: 'Communication is only unlocked after both parties express mutual interest and one accepts. No phone numbers are ever exposed without your explicit permission.' },
  { icon: '🫥', title: 'Instant Ghost Mode', desc: 'Feel unsafe? One tap makes you invisible to every search, every browse, every suggestion — instantly. Re-appear at will, no questions asked.' },
  { icon: '🖼️', title: 'Dynamic Photo Watermarking', desc: 'Every photo displayed is stamped in real-time with the viewer\'s unique ID using canvas rendering — making misuse fully traceable and legally deterrable.' },
];

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const parallax = Math.min(scrollY * 0.3, 120);

  return (
    <div className="aethel-page">
      {/* ─── Navbar ───────────────────────────────────── */}
      <nav className="ae-nav">
        <div className="ae-logo">SoulBound</div>
        <div className="ae-nav-links">
          <a href="#features" className="ae-nav-link">Features</a>
          <a href="#trust" className="ae-nav-link">Security</a>
          <a href="#process" className="ae-nav-link">How It Works</a>
          <Link to="/auth" className="ae-btn-outline">Sign In</Link>
          <Link to="/auth?mode=register" className="ae-btn-fill">Begin Your Journey</Link>
        </div>
      </nav>

      {/* ─── HERO ─────────────────────────────────────── */}
      <section className="ae-hero" ref={heroRef}>
        {/* Left */}
        <div className="ae-hero-left">
          <div className="ae-eyebrow">The Premier Matrimonial Platform</div>
          <h1 className="ae-hero-h1">
            Find Your<br />
            <em>Absolute.</em><br />
            Verified, Meaningful<br />Connections.
          </h1>
          <p className="ae-hero-sub">
            SoulBound combines the gravity of tradition with the precision of technology — 
            creating a space where verified identities meet genuine intent.
          </p>
          <div className="ae-hero-cta">
            <Link to="/auth?mode=register" className="ae-btn-fill">Create Your Profile</Link>
            <Link to="/auth" className="ae-btn-outline">Sign In</Link>
          </div>
        </div>

        {/* Center divider */}
        <div className="ae-hero-divider" />

        {/* Right — cinematic photo panel */}
        <div className="ae-hero-right">
          <div className="ae-hero-img-wrap" style={{ transform: `translateY(${parallax}px)` }}>
            {/* Rendered purely from CSS gradients + pattern — no external image needed */}
            <div style={{
              width: '100%', height: '110%',
              background: `
                radial-gradient(ellipse 70% 80% at 60% 40%, rgba(153,0,0,0.35), transparent 60%),
                radial-gradient(ellipse 50% 60% at 30% 70%, rgba(212,175,55,0.15), transparent 55%),
                linear-gradient(160deg, #0a0a0a 0%, #1a0505 40%, #0e0a00 70%, #0a0a0a 100%)
              `,
            }} />
            {/* Silhouette art — couple */}
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '180px', opacity: 0.08, userSelect: 'none', pointerEvents: 'none',
            }}>💑</div>
            {/* Scan lines effect */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px)',
            }} />
          </div>
          <div className="ae-hero-glass" />

          {/* Floating info badge */}
          <div className="ae-hero-right-badge">
            <div className="ae-badge-label">Profile Strength</div>
            <div className="ae-badge-title">Arjun & Meera — Matched</div>
            <div className="ae-trust-row">
              <span className="ae-trust-pill">✓ Aadhaar Verified</span>
              <span className="ae-trust-pill">✓ Trust Score 98</span>
              <span className="ae-trust-pill">💍 Engaged</span>
            </div>
          </div>

          {/* Corner badge */}
          <div style={{
            position: 'absolute', top: 40, right: 40,
            padding: '10px 18px',
            border: '1px solid rgba(212,175,55,0.3)',
            background: 'rgba(14,14,14,0.7)',
            backdropFilter: 'blur(16px)',
            borderRadius: 8,
            fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase',
            color: 'var(--p-gold)',
          }}>
            🔴 Live — 1,240 Active
          </div>
        </div>

        {/* Ticker */}
        <div className="ae-ticker-wrap">
          <div className="ae-ticker">
            {TICKER_ITEMS.map((t, i) => (
              <span className="ae-ticker-item" key={i}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Trust Strip ──────────────────────────────── */}
      <div className="ae-trust-strip">
        {[['2,00,000+','Verified Profiles'],['98%','Match Satisfaction'],['50,000+','Couples United'],['< 48h','Avg. First Response']].map(([n,l]) => (
          <div className="ae-trust-stat" key={l}>
            <div className="ae-trust-num">{n}</div>
            <div className="ae-trust-label">{l}</div>
          </div>
        ))}
      </div>

      {/* ─── Features ─────────────────────────────────── */}
      <section className="ae-features" id="features">
        <div className="ae-section-eyebrow">Why SoulBound</div>
        <h2 className="ae-section-title">Six Pillars of <em>Absolute Trust</em></h2>
        <div className="ae-features-grid">
          {FEATURES.map((f, i) => (
            <div className="ae-feature-card" key={f.title}>
              <span className="ae-feature-num">0{i + 1}</span>
              <div className="ae-feature-icon">{f.icon}</div>
              <div className="ae-feature-title">{f.title}</div>
              <p className="ae-feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Trust Icon Section ────────────────────────── */}
      <section className="ae-trust-icons" id="trust">
        <div className="ae-section-eyebrow">Security Architecture</div>
        <h2 className="ae-section-title">Your Identity,<br /><em>Sovereignly Protected</em></h2>
        <p style={{ color: 'var(--p-muted)', fontSize: 15, maxWidth: 520, margin: '0 auto', lineHeight: 1.8, fontWeight: 300 }}>
          As you build trust on the platform, your verified credentials orbit your profile — 
          mathematically secured, visibly signalling genuine intent to potential matches.
        </p>

        <div className="ae-floating-icons">
          {/* Orbit rings */}
          <div className="ae-orbit ae-orbit-1" />
          <div className="ae-orbit ae-orbit-2" />

          {/* Center badge */}
          <div className="ae-center-badge">
            <span className="ae-center-badge-icon">👤</span>
            <span className="ae-center-badge-text">Verified</span>
          </div>

          {/* Floating icons */}
          <div className="ae-fi" style={{ left: '12%', top: '50%', transform: 'translateY(-50%)' }}>
            <div className="ae-fi-box">🪪</div>
            <span className="ae-fi-label">Aadhaar</span>
          </div>
          <div className="ae-fi" style={{ right: '12%', top: '50%', transform: 'translateY(-50%)' }}>
            <div className="ae-fi-box">💼</div>
            <span className="ae-fi-label">LinkedIn</span>
          </div>
          <div className="ae-fi" style={{ top: '8%', left: '50%', transform: 'translateX(-50%)' }}>
            <div className="ae-fi-box">📱</div>
            <span className="ae-fi-label">Phone OTP</span>
          </div>
          <div className="ae-fi" style={{ bottom: '8%', left: '50%', transform: 'translateX(-50%)' }}>
            <div className="ae-fi-box">🔐</div>
            <span className="ae-fi-label">AES-256</span>
          </div>
        </div>

        {/* Encryption note */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 12,
          padding: '14px 28px', border: '1px solid var(--p-line)',
          background: 'var(--p-glass)', borderRadius: 8,
          fontSize: 13, color: 'var(--p-muted)', backdropFilter: 'blur(8px)',
        }}>
          <span style={{ color: 'var(--p-gold)', fontWeight: 700 }}>AES-256-GCM</span>
          All PII encrypted at rest. No plaintext ever stored.
        </div>
      </section>

      {/* ─── Process ──────────────────────────────────── */}
      <section className="ae-process" id="process">
        <div className="ae-section-eyebrow">The Journey</div>
        <h2 className="ae-section-title">Four Steps to Your<br /><em>Lifelong Companion</em></h2>
        <div className="ae-process-grid">
          {[
            { n:'I', title:'Create & Verify', desc:'Register with email OTP. Upload a Govt ID to earn the Verified Badge — your first signal of genuine intent.' },
            { n:'II', title:'Build Your Profile', desc:'Complete the 3-step profile wizard covering personal, professional, and family details including horoscope data.' },
            { n:'III', title:'Search & Discover', desc:'Set your partner preferences. Browse daily AI-suggested matches or search precisely with 15 smart filters.' },
            { n:'IV', title:'Connect in Privacy', desc:'Send an Interest. Once accepted, secure encrypted chat unlocks. No data is ever shared without consent.' },
          ].map(s => (
            <div className="ae-process-step" key={s.n}>
              <div className="ae-step-num">{s.n}</div>
              <div className="ae-step-title">{s.title}</div>
              <p className="ae-step-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────── */}
      <section className="ae-cta">
        {/* decorative rings */}
        <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none' }}>
          {[400,600,800].map(s=>(
            <div key={s} style={{
              position:'absolute', left:'50%', top:'50%',
              transform:'translate(-50%,-50%)',
              width:s,height:s,borderRadius:'50%',
              border:'1px solid rgba(212,175,55,0.06)',
            }}/>
          ))}
        </div>
        <div className="ae-section-eyebrow">Begin Today</div>
        <h2 className="ae-cta-title">Your <em>Absolute</em><br />Awaits You</h2>
        <p className="ae-cta-sub">
          Join verified families who chose trust over chance. 
          Create your profile in minutes. It's completely free to start.
        </p>
        <div className="ae-cta-actions">
          <Link to="/auth?mode=register" className="ae-btn-fill">Create Free Profile</Link>
          <Link to="/auth" className="ae-btn-outline">Sign In</Link>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────── */}
      <footer className="ae-footer">
        <div className="ae-footer-logo">SoulBound</div>
        <div className="ae-footer-links">
          <a href="#features" className="ae-footer-link">Features</a>
          <a href="#trust" className="ae-footer-link">Security</a>
          <a href="#process" className="ae-footer-link">How It Works</a>
        </div>
        <div className="ae-footer-copy">© 2026 SoulBound · All rights reserved</div>
      </footer>
    </div>
  );
}
