import React from 'react';
import { BookOpen, CheckCircle, ShieldAlert, Zap, Clock, HelpCircle } from 'lucide-react';

export default function UCATGuide() {
  const sections = [
    {
      name: 'Verbal Reasoning',
      time: '21 Minutes (44 Questions)',
      overview: 'Assesses critical reading and evaluation of complex written information.',
      criteria: 'Passages are dense (200-350 words). Questions require discerning between explicit facts, warranted inferences, and unsupported conclusions.'
    },
    {
      name: 'Decision Making',
      time: '31 Minutes (29 Questions)',
      overview: 'Evaluates logical deductions, statistical inferences, and evaluating arguments.',
      criteria: 'Involves syllogisms (which conclusion follows), evaluating strongest arguments, probabilistic deductions, and Venn set relationships.'
    },
    {
      name: 'Quantitative Reasoning',
      time: '25 Minutes (36 Questions)',
      overview: 'Assesses problem-solving using numerical data, clinical dosages, and financial metrics.',
      criteria: 'High-speed mental math, calculating percentages, currency exchange, medication volumes, geometry, and extracting data from complex tables.'
    },
    {
      name: 'Abstract Reasoning',
      time: '12 Minutes (50 Questions)',
      overview: 'Tests candidate ability to identify geometric patterns amidst distractor shapes.',
      criteria: 'Set A vs Set B categorization, sequence progression, and 3x3 matrices with shapes, shading, rotation, symmetry, and counting rules.'
    },
    {
      name: 'Situational Judgement (SJT)',
      time: '26 Minutes (66 Questions)',
      overview: 'Measures understanding of real-world clinical and professional dilemmas.',
      criteria: 'Strictly aligned with General Medical Council (GMC) "Good Medical Practice": prioritizing patient safety, informed consent, confidentiality, and honesty.'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
          Official UK UCAT Examination Syllabus &amp; Standards
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          The University Clinical Aptitude Test (UCAT) is required by UK medical and dental universities.
          Our Multi-Agent system reproduces the cognitive rigor and pacing of official test items.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {sections.map((s, idx) => (
          <div key={idx} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--brand-primary)' }}>{s.name}</h3>
              <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                <Clock size={12} /> {s.time}
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{s.overview}</p>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-light)', paddingTop: '10px' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Item Design:</strong> {s.criteria}
            </div>
          </div>
        ))}
      </div>

      <div className="glass-panel" style={{ padding: '24px', background: 'var(--brand-primary-light)', border: '1px solid #bae6fd' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--brand-primary-dark)', marginBottom: '8px' }}>
          How the Multi-Agent System Guarantees 90+ Score Quality
        </h3>
        <p style={{ fontSize: '0.875rem', color: '#1e3a8a', lineHeight: '1.6' }}>
          Writing psychometrically valid UCAT questions requires avoiding trivial options and ambiguous wording. 
          The <strong>Question Reviewer</strong> rigorously audits each generated question across a 100-point rubric. 
          If any distractor is too obvious or an explanation lacks depth (scoring &le; 90), the <strong>Question Re-Generator</strong> 
          acts upon the specific critique to polish the question until it surpasses the 90-point quality benchmark before publication.
        </p>
      </div>
    </div>
  );
}
