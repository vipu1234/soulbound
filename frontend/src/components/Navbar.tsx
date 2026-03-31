import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="navbar-logo">💍 SoulBound</NavLink>
        <div className="navbar-links">
          {user ? (
            <>
              <NavLink to="/discover" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Discover</NavLink>
              <NavLink to="/search"   className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Search</NavLink>
              <NavLink to="/interests" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Interests</NavLink>
              <NavLink to="/chat"     className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Chat</NavLink>
              <NavLink to="/settings" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Settings</NavLink>
              <NavLink to="/profile/me" style={{ marginLeft: 8 }}>
                {user.photo_url
                  ? <img className="nav-avatar" src={`http://localhost:5000${user.photo_url}`} alt={user.full_name || ''} />
                  : <div className="nav-avatar" style={{ background: 'linear-gradient(135deg,#e91e8c,#7c3aed)', display:'flex',alignItems:'center',justifyContent:'center',fontSize:18 }}>👤</div>
                }
              </NavLink>
              <button onClick={handleLogout} className="btn btn-ghost btn-sm" style={{ marginLeft: 8 }}>Logout</button>
            </>
          ) : (
            <>
              <NavLink to="/auth" className="btn btn-outline btn-sm">Login</NavLink>
              <NavLink to="/auth?mode=register" className="btn btn-primary btn-sm">Sign Up Free</NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
