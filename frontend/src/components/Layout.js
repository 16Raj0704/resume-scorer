import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '▦' },
  { to: '/scan', label: 'New Scan', icon: '◈' },
  { to: '/history', label: 'History', icon: '◷' },
  { to: '/compare', label: 'Compare JDs', icon: '⊞' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0f', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 64 : 220,
        background: '#0f0f1a',
        borderRight: '1px solid #1e1e2e',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid #1e1e2e', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>⚡</div>
          {!collapsed && <span style={{ color: '#f1f0ff', fontWeight: 700, fontSize: 15, letterSpacing: '-0.3px' }}>ResumeMatch</span>}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px' }}>
          {navItems.map(({ to, label, icon }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
              borderRadius: 8, marginBottom: 2, textDecoration: 'none', fontSize: 14,
              color: isActive ? '#a78bfa' : '#6b7280',
              background: isActive ? '#1e1e35' : 'transparent',
              fontWeight: isActive ? 600 : 400,
              transition: 'all 0.15s',
            })}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid #1e1e2e' }}>
          {!collapsed && (
            <div style={{ padding: '8px 12px', marginBottom: 4 }}>
              <div style={{ fontSize: 13, color: '#d1d5db', fontWeight: 500 }}>{user?.name || user?.email}</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>{user?.email}</div>
            </div>
          )}
          <button onClick={handleLogout} style={{
            width: '100%', padding: '8px 12px', background: 'transparent', border: 'none',
            color: '#6b7280', cursor: 'pointer', borderRadius: 8, fontSize: 13, textAlign: 'left',
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            <span>⎋</span>{!collapsed && 'Sign out'}
          </button>
          <button onClick={() => setCollapsed(!collapsed)} style={{
            width: '100%', padding: '6px 12px', background: 'transparent', border: 'none',
            color: '#4b5563', cursor: 'pointer', borderRadius: 8, fontSize: 12, textAlign: 'left'
          }}>
            {collapsed ? '→' : '← Collapse'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '32px', maxWidth: 1100 }}>
        <Outlet />
      </main>
    </div>
  );
}
