import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, ShieldCheck, Stethoscope, User, ArrowRight, Lock, Mail, AlertCircle } from 'lucide-react';

export const Login = ({ onSwitchToRegister }) => {
  const { login, quickDemoLogin } = useAuth();
  const [selectedRole, setSelectedRole] = useState('admin');
  const [email, setEmail] = useState('admin@hospital.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const roleConfigs = {
    admin: {
      title: 'Administrator',
      defaultEmail: 'admin@hospital.com',
      defaultPassword: 'admin123',
      icon: ShieldCheck,
      color: '#ef4444',
      desc: 'Hospital analytics, bed inventory, staff & billing governance'
    },
    doctor: {
      title: 'Doctor / Specialist',
      defaultEmail: 'dr.sarah.patel@hospital.com',
      defaultPassword: 'doctor123',
      icon: Stethoscope,
      color: '#0284c7',
      desc: 'Patient consultations, clinical notes & prescriptions'
    },
    patient: {
      title: 'Patient',
      defaultEmail: 'john.doe@hospital.com',
      defaultPassword: 'patient123',
      icon: User,
      color: '#10b981',
      desc: 'Appointment booking, personal medical records & bills'
    }
  };

  const handleRoleSelect = (roleKey) => {
    setSelectedRole(roleKey);
    setEmail(roleConfigs[roleKey].defaultEmail);
    setPassword(roleConfigs[roleKey].defaultPassword);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password, selectedRole);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleInstantDemo = async (roleKey) => {
    setError('');
    setLoading(true);
    try {
      await quickDemoLogin(roleKey);
    } catch (err) {
      setError(err.message || 'Quick demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f1f5f9',
      padding: '2rem 1rem'
    }}>
      <div style={{
        maxWidth: '520px',
        width: '100%',
        backgroundColor: '#ffffff',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-xl)',
        border: '1px solid var(--border)',
        overflow: 'hidden'
      }}>
        {/* Brand Header */}
        <div style={{
          padding: '2.25rem 2rem 1.5rem',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #075985, #0284c7)',
          color: 'white'
        }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '14px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            backdropFilter: 'blur(6px)'
          }}>
            <Activity size={32} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
            MediPulse AI Hospital
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#e0f2fe', marginTop: '0.35rem' }}>
            Comprehensive AI-Based Healthcare Management System
          </p>
        </div>

        <div style={{ padding: '2rem' }}>
          {/* 1-Click Quick Demo Switcher */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.75rem',
              textAlign: 'center'
            }}>
              1-Click Demo Login (Instant Evaluation)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {Object.keys(roleConfigs).map((rKey) => {
                const conf = roleConfigs[rKey];
                const Icon = conf.icon;
                return (
                  <button
                    key={rKey}
                    type="button"
                    onClick={() => handleInstantDemo(rKey)}
                    disabled={loading}
                    style={{
                      padding: '0.65rem 0.5rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--bg-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.3rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = conf.color;
                      e.currentTarget.style.backgroundColor = '#ffffff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
                    }}
                  >
                    <Icon size={18} color={conf.color} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {conf.title.split(' ')[0]}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      Click to Test
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            margin: '1.5rem 0',
            color: 'var(--text-muted)',
            fontSize: '0.8rem'
          }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }}></div>
            <span>or sign in manually</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }}></div>
          </div>

          {/* Role selector tabs */}
          <div style={{
            display: 'flex',
            backgroundColor: 'var(--bg-subtle)',
            padding: '4px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem'
          }}>
            {Object.keys(roleConfigs).map((rKey) => {
              const conf = roleConfigs[rKey];
              const isSelected = selectedRole === rKey;
              return (
                <button
                  key={rKey}
                  type="button"
                  onClick={() => handleRoleSelect(rKey)}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.825rem',
                    fontWeight: isSelected ? 700 : 500,
                    backgroundColor: isSelected ? '#ffffff' : 'transparent',
                    color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                    boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {conf.title.split(' ')[0]}
                </button>
              );
            })}
          </div>

          {error && (
            <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <div>{error}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@hospital.com"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
            >
              {loading ? 'Authenticating...' : `Sign In as ${roleConfigs[selectedRole].title.split(' ')[0]}`}
              {!loading && <ArrowRight size={17} />}
            </button>
          </form>

          {/* Patient registration prompt */}
          <div style={{
            marginTop: '1.75rem',
            textAlign: 'center',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)'
          }}>
            New patient without an account?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                fontWeight: 700,
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Register Patient Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
