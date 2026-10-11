import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Calendar,
  FileText,
  BedDouble,
  CreditCard,
  Sparkles,
  Bot
} from 'lucide-react';

export const Sidebar = ({ activeTab, onSelectTab }) => {
  const { role } = useAuth();

  const getNavItems = () => {
    switch (role) {
      case 'admin':
        return [
          { id: 'dashboard', label: 'Hospital Dashboard', icon: LayoutDashboard },
          { id: 'patients', label: 'Patient Directory', icon: Users },
          { id: 'doctors', label: 'Doctor Management', icon: UserCheck },
          { id: 'appointments', label: 'Appointments', icon: Calendar },
          { id: 'beds', label: 'Bed Management', icon: BedDouble },
          { id: 'billing', label: 'Billing & Invoices', icon: CreditCard },
          { id: 'symptom-checker', label: 'AI Symptom Assistant', icon: Sparkles, badge: 'AI' },
          { id: 'faq-bot', label: 'Hospital FAQ Bot', icon: Bot, badge: 'AI' }
        ];
      case 'doctor':
        return [
          { id: 'dashboard', label: 'Doctor Dashboard', icon: LayoutDashboard },
          { id: 'appointments', label: 'My Schedule', icon: Calendar },
          { id: 'patients', label: 'Patient Records', icon: Users },
          { id: 'medical-records', label: 'Prescriptions & Notes', icon: FileText },
          { id: 'beds', label: 'Bed Occupancy', icon: BedDouble },
          { id: 'symptom-checker', label: 'AI Symptom Assistant', icon: Sparkles, badge: 'AI' },
          { id: 'faq-bot', label: 'Hospital FAQ Bot', icon: Bot, badge: 'AI' }
        ];
      case 'patient':
        return [
          { id: 'dashboard', label: 'My Health Dashboard', icon: LayoutDashboard },
          { id: 'appointments', label: 'Book Appointment', icon: Calendar },
          { id: 'medical-records', label: 'My Medical Records', icon: FileText },
          { id: 'billing', label: 'Bills & Payments', icon: CreditCard },
          { id: 'beds', label: 'Hospital Beds', icon: BedDouble },
          { id: 'symptom-checker', label: 'AI Symptom Checker', icon: Sparkles, badge: 'AI' },
          { id: 'faq-bot', label: 'Hospital FAQ Bot', icon: Bot, badge: 'AI' }
        ];
      default:
        return [
          { id: 'dashboard', label: 'Overview', icon: LayoutDashboard }
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <aside style={{
      width: '260px',
      backgroundColor: '#ffffff',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.25rem 0.85rem',
      flexShrink: 0
    }}>
      <div style={{
        padding: '0.5rem 0.75rem 1rem',
        fontSize: '0.75rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: 'var(--text-muted)'
      }}>
        Navigation Menu
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.7rem 0.9rem',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                color: isActive ? 'var(--primary-dark)' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Icon size={19} color={isActive ? 'var(--primary)' : 'currentColor'} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  backgroundColor: 'linear-gradient(135deg, #0284c7, #4f46e5)',
                  background: '#e0e7ff',
                  color: '#4338ca',
                  padding: '0.15rem 0.45rem',
                  borderRadius: 'var(--radius-full)'
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Hospital contact info footer */}
      <div style={{
        marginTop: 'auto',
        padding: '1rem',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--bg-subtle)',
        border: '1px solid var(--border)'
      }}>
        <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)' }}>
          MediPulse Hospital
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
          Open 24/7 • OPD: 8AM-8PM
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--primary)', marginTop: '0.35rem', fontWeight: 600 }}>
          Helpline: +1-555-0100
        </div>
      </div>
    </aside>
  );
};
