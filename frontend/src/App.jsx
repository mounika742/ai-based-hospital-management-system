import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Patients } from './pages/Patients';
import { Doctors } from './pages/Doctors';
import { Appointments } from './pages/Appointments';
import { MedicalRecords } from './pages/MedicalRecords';
import { BedManagement } from './pages/BedManagement';
import { Billing } from './pages/Billing';
import { SymptomChecker } from './pages/SymptomChecker';
import { HospitalChatbot } from './pages/HospitalChatbot';
import { Bot, X } from 'lucide-react';

export const App = () => {
  const { isAuthenticated, loading } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [preselectedDoctorId, setPreselectedDoctorId] = useState(null);
  const [floatingChatOpen, setFloatingChatOpen] = useState(false);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        fontFamily: 'var(--font-sans)',
        color: 'var(--primary)',
        fontWeight: 700
      }}>
        Initializing MediPulse Hospital System...
      </div>
    );
  }

  // Unauthenticated screen
  if (!isAuthenticated) {
    if (authView === 'register') {
      return <Register onSwitchToLogin={() => setAuthView('login')} />;
    }
    return <Login onSwitchToRegister={() => setAuthView('register')} />;
  }

  // Handlers for cross-page navigation
  const handleBookDoctor = (doctorId) => {
    setPreselectedDoctorId(doctorId);
    setActiveTab('appointments');
  };

  const handleBookDepartment = (department) => {
    setActiveTab('appointments');
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={(tab) => setActiveTab(tab)} />;
      case 'patients':
        return <Patients />;
      case 'doctors':
        return <Doctors onBookDoctor={handleBookDoctor} />;
      case 'appointments':
        return <Appointments preselectedDoctorId={preselectedDoctorId} />;
      case 'medical-records':
        return <MedicalRecords />;
      case 'beds':
        return <BedManagement />;
      case 'billing':
        return <Billing />;
      case 'symptom-checker':
        return <SymptomChecker onBookDepartment={handleBookDepartment} />;
      case 'faq-bot':
        return <HospitalChatbot />;
      default:
        return <Dashboard onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <div className="app-container">
      {/* Role-based Dynamic Sidebar */}
      <Sidebar activeTab={activeTab} onSelectTab={(tab) => setActiveTab(tab)} />

      {/* Main Content Area */}
      <div className="main-content">
        <Navbar
          onOpenChatbot={() => setActiveTab('faq-bot')}
          onOpenSymptomChecker={() => setActiveTab('symptom-checker')}
        />

        <main style={{ flex: 1 }}>
          {renderActiveView()}
        </main>
      </div>

      {/* Floating Chatbot Button (Quick Accessibility from any page) */}
      {activeTab !== 'faq-bot' && (
        <button
          onClick={() => setActiveTab('faq-bot')}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary)',
            color: 'white',
            border: 'none',
            boxShadow: 'var(--shadow-xl)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 900,
            transition: 'transform 0.2s ease'
          }}
          title="Ask Hospital FAQ Bot"
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Bot size={28} />
        </button>
      )}
    </div>
  );
};
