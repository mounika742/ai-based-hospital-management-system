import React, { useState } from 'react';
import { api } from '../api/client';
import {
  Sparkles,
  AlertTriangle,
  Stethoscope,
  Building2,
  HelpCircle,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Calendar,
  HeartPulse
} from 'lucide-react';

export const SymptomChecker = ({ onBookDepartment }) => {
  const [symptoms, setSymptoms] = useState('');
  const [duration, setDuration] = useState('2-3 days');
  const [severity, setSeverity] = useState('moderate');
  const [ageGroup, setAgeGroup] = useState('adult');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const samplePresets = [
    { label: 'Chest Palpitations', text: 'Experiencing heart flutter, palpitations, and mild breathlessness when climbing stairs.' },
    { label: 'Throbbing Headache', text: 'Persistent throbbing headache on right side with sensitivity to bright lights and nausea.' },
    { label: 'Knee Joint Pain', text: 'Severe pain and swelling in left knee joint after running, difficulty bearing weight.' },
    { label: 'Skin Allergic Rash', text: 'Intensely itchy red rash and hives spreading on both forearms.' },
    { label: 'Cough & Fever', text: 'Dry hacking cough, mild fever 99.8F, and sore throat for 3 days.' }
  ];

  const handleAnalyze = async (e) => {
    e?.preventDefault();
    if (!symptoms.trim()) {
      setError('Please enter symptoms before requesting clinical guidance.');
      return;
    }

    setError('');
    setLoading(true);
    setResult(null);

    try {
      const data = await api.post('/ai/symptom-check', {
        symptoms,
        duration,
        severity,
        age_group: ageGroup
      });
      setResult(data.result);
    } catch (err) {
      setError(err.message || 'Failed to analyze symptoms. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectPreset = (presetText) => {
    setSymptoms(presetText);
    setError('');
  };

  const getTriageBadge = (level, isEmergency) => {
    if (isEmergency) {
      return (
        <div style={{
          backgroundColor: '#fee2e2',
          border: '1.5px solid #ef4444',
          color: '#991b1b',
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontWeight: 700
        }}>
          <ShieldAlert size={26} color="#dc2626" />
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>CRITICAL TRIAGE: EMERGENCY CARE REQUIRED</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 500, marginTop: '2px' }}>
              Potential acute condition detected. Proceed immediately to emergency care or call +1-555-0911.
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={{
        backgroundColor: '#f0fdf4',
        border: '1.5px solid #86efac',
        color: '#166534',
        padding: '0.85rem 1.25rem',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <HeartPulse size={24} color="#15803d" />
        <div>
          <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
            Triage Priority Recommendation
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{level}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Sparkles size={12} /> AI Clinical Triage
            </span>
          </div>
          <h1 className="page-title">AI Symptom Information Assistant</h1>
          <p className="page-subtitle">
            Educational guidance to help you navigate symptoms and find the appropriate medical department.
          </p>
        </div>
      </div>

      {/* Mandatory Clinical Disclaimer Banner */}
      <div style={{
        backgroundColor: '#fffbeb',
        border: '1px solid #fde68a',
        borderRadius: 'var(--radius-md)',
        padding: '1rem 1.25rem',
        marginBottom: '1.75rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.85rem'
      }}>
        <AlertTriangle size={20} color="#b45309" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.825rem', color: '#92400e', lineHeight: 1.5 }}>
          <strong>MANDATORY MEDICAL SAFETY NOTICE:</strong> This AI assistant provides general educational information and preliminary hospital department referrals only. <strong>It DOES NOT diagnose medical conditions, prescribe medication, or replace a licensed physician.</strong> If you experience crushing chest pain, sudden facial numbness, or severe difficulty breathing, immediately dial emergency services (+1-555-0911) or visit the nearest emergency room.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.75rem', alignItems: 'start' }}>
        {/* Intake Form Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Stethoscope size={20} color="var(--primary)" /> Describe Your Symptoms
            </h3>
          </div>

          {/* Quick preset buttons */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              Quick Preset Examples
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {samplePresets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => selectPreset(p.text)}
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border)',
                    padding: '0.35rem 0.65rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: 'var(--text-secondary)'
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleAnalyze}>
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="form-group">
              <label className="form-label">What symptoms are you experiencing? *</label>
              <textarea
                className="form-textarea"
                rows={4}
                placeholder="Describe what you are feeling, where it is located, and any sensations (e.g. sharp, dull, throbbing, stiffness)..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div>
                <label className="form-label">Duration</label>
                <select
                  className="form-select"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                >
                  <option value="Just today">Started Today</option>
                  <option value="2-3 days">2 - 3 Days</option>
                  <option value="Over a week">Over a Week</option>
                  <option value="Chronic / Months">Chronic / Ongoing</option>
                </select>
              </div>

              <div>
                <label className="form-label">Severity</label>
                <select
                  className="form-select"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                >
                  <option value="mild">Mild (Discomfort)</option>
                  <option value="moderate">Moderate (Noticeable)</option>
                  <option value="severe">Severe (Intense)</option>
                </select>
              </div>

              <div>
                <label className="form-label">Age Group</label>
                <select
                  className="form-select"
                  value={ageGroup}
                  onChange={(e) => setAgeGroup(e.target.value)}
                >
                  <option value="adult">Adult (18 - 64)</option>
                  <option value="pediatric">Child / Pediatric</option>
                  <option value="elderly">Senior (65+)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '0.8rem', fontSize: '0.95rem' }}
            >
              {loading ? (
                <>Analyzing Clinical Ontology...</>
              ) : (
                <>
                  <Sparkles size={18} /> Get AI Guidance & Recommended Department
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Building2 size={20} color="var(--secondary)" /> Clinical Guidance & Referral
            </h3>
          </div>

          {!result && !loading && (
            <div style={{
              textAlign: 'center',
              padding: '3.5rem 1rem',
              color: 'var(--text-muted)'
            }}>
              <Stethoscope size={42} color="#cbd5e1" style={{ margin: '0 auto 0.75rem' }} />
              <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Awaiting Symptom Input</div>
              <div style={{ fontSize: '0.85rem', marginTop: '0.35rem' }}>
                Fill in the details on the left to receive AI triage prioritization and hospital department matching.
              </div>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--primary)' }}>
              <Sparkles size={36} style={{ animation: 'spin 2s linear infinite', margin: '0 auto 1rem' }} />
              <div style={{ fontWeight: 700 }}>Evaluating symptoms against clinical guidelines...</div>
            </div>
          )}

          {result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Triage Urgency */}
              {getTriageBadge(result.triage_level, result.is_emergency)}

              {/* Department recommendation card */}
              <div style={{
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Recommended Hospital Department & Specialist
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                  {result.recommended_department}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600, marginTop: '0.1rem' }}>
                  Consult: {result.recommended_specialist}
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.65rem', lineHeight: 1.5 }}>
                  {result.guidance_summary}
                </p>

                <div style={{ marginTop: '1rem' }}>
                  <button
                    onClick={() => onBookDepartment && onBookDepartment(result.recommended_department)}
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%', padding: '0.65rem' }}
                  >
                    <Calendar size={15} /> Book Appointment in {result.recommended_department}
                  </button>
                </div>
              </div>

              {/* Questions for the Doctor */}
              {result.questions_for_doctor?.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <HelpCircle size={16} color="var(--primary)" /> Questions to Ask Your Doctor
                  </div>
                  <ul style={{ paddingLeft: '1.25rem', fontSize: '0.825rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {result.questions_for_doctor.map((q, idx) => (
                      <li key={idx}>{q}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* General Care Tips */}
              {result.general_care_tips?.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <CheckCircle2 size={16} color="var(--success)" /> Comfort & Supportive Care Measures
                  </div>
                  <ul style={{ paddingLeft: '1.25rem', fontSize: '0.825rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {result.general_care_tips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
