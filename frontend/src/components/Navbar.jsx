import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, PhoneCall, Bot, LogOut, UserCheck } from 'lucide-react';

export const Navbar = ({ onOpenChatbot, onOpenSymptomChecker }) => {
  const { user, role, logout } = useAuth();

  const getRoleBadgeClass = (r) => {
    switch (r) {
      case 'admin': return 'badge-danger';
      case 'doctor': return 'badge-info';
      case 'patient': return 'badge-success';
      default: return 'badge-secondary';
    }
  };

  return (
    <header style={{
      height: '70px',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: 'var(--shadow-sm)'
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #0284c7, #0ea5e9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white'
        }}>
          <Activity size={22} />
        </div>
        <div>
          <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#0f172a', letterSpacing: '-0.02em' }}>
            MediPulse <span style={{ color: 'var(--primary)', fontWeight: 600 }}>AI</span>
          </span>
          <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '-2px' }}>
            Hospital Management System
          </span>
        </div>
      </div>

      {/* Center / Quick actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          padding: '0.35rem 0.75rem',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.78rem',
          fontWeight: 700
        }}>
          <PhoneCall size={14} />
          Emergency: +1-555-0911
        </div>

        <button
          onClick={onOpenChatbot}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary-dark)',
            border: 'none',
            padding: '0.4rem 0.85rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Open AI Hospital FAQ Assistant"
        >
          <Bot size={16} />
          Hospital FAQ Bot
        </button>
      </div>

      {/* User profile & Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                {user.full_name}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px' }}>
                <span className={`badge ${getRoleBadgeClass(role)}`}>
                  <UserCheck size={11} />
                  {role?.toUpperCase()}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              title="Sign Out"
            >
              <LogOut size={15} />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
