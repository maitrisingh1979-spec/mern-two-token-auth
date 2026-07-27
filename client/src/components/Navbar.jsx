import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, LogOut, LayoutDashboard, UserPlus, LogIn } from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="glass-nav">
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Brand */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            padding: '8px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
          }}>
            <ShieldCheck size={22} color="#ffffff" />
          </div>
          <div>
            <span className="gradient-text" style={{ fontSize: '1.25rem', fontWeight: '800', fontFamily: 'var(--font-display)' }}>
              DualToken Auth
            </span>
            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-dim)', letterSpacing: '0.05em' }}>
              MERN ASSESSMENT ARCHITECTURE
            </span>
          </div>
        </Link>

        {/* Navigation Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.875rem' }}>
                <LayoutDashboard size={16} />
                Dashboard
              </Link>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-color)',
                borderRadius: '20px',
                fontSize: '0.85rem'
              }}>
                <span className="status-dot"></span>
                <span style={{ color: 'var(--text-muted)' }}>{user?.email}</span>
              </div>

              <button onClick={handleLogout} className="btn btn-danger" style={{ padding: '8px 16px', fontSize: '0.875rem' }}>
                <LogOut size={16} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.875rem' }}>
                <LogIn size={16} />
                Sign In
              </Link>
              <Link to="/signup" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.875rem' }}>
                <UserPlus size={16} />
                Create Account
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
