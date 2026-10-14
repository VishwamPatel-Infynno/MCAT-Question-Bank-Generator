import React, { useState, useEffect } from 'react';
import {
  Navbar,
  GeneratorPanel,
  AgentVisualizer,
  QuestionCard,
  MatrixRunner,
  QuestionBank,
  ReviewAuditView,
  SettingsModal,
  UCATGuide,
  RejectionCard
} from './components';
import { useQuestionGenerator } from './hooks/useQuestionGenerator';
import { UCAT_SECTIONS_FALLBACK } from './constants/ucat';
import { fetchSections, fetchHealth } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('generator');
  const [sectionsData, setSectionsData] = useState([]);
  const [selectedSection, setSelectedSection] = useState('verbal_reasoning');
  const [selectedSubtopic, setSelectedSubtopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [requireImage, setRequireImage] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');

  // Manager Combination Matrix Parameters
  const [combinationId, setCombinationId] = useState('');
  const [contentDomain, setContentDomain] = useState('');
  const [questionType, setQuestionType] = useState('');
  const [primaryTrap, setPrimaryTrap] = useState('');
  const [passageRequired, setPassageRequired] = useState('');
  const [visualType, setVisualType] = useState('');


  // Modals & Status
  const [auditQuestion, setAuditQuestion] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [backendStatus, setBackendStatus] = useState(false);

  // Multi-Agent Generation Hook
  const {
    isGenerating,
    activeAgent,
    iterationCount,
    events,
    activeQuestion,
    setActiveQuestion,
    rejectedData,
    latestReview,
    startGeneration
  } = useQuestionGenerator({
    onNeedsApiKey: () => setShowSettings(true)
  });

  // Initialize backend health & sections data
  useEffect(() => {
    fetchHealth()
      .then(() => setBackendStatus(true))
      .catch(() => setBackendStatus(false));

    fetchSections()
      .then((data) => {
        if (data.sections && data.sections.length > 0) {
          setSectionsData(data.sections);
          setSelectedSection(data.sections[0].id);
          if (data.sections[0].subtopics?.length > 0) {
            setSelectedSubtopic(data.sections[0].subtopics[0]);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to fetch sections:', err);
        setSectionsData(UCAT_SECTIONS_FALLBACK);
        setSelectedSection(UCAT_SECTIONS_FALLBACK[0].id);
        setSelectedSubtopic(UCAT_SECTIONS_FALLBACK[0].subtopics[0]);
      });
  }, []);

  const handleGenerate = () => {
    const payload = {
      section: selectedSection,
      subtopic: selectedSubtopic,
      difficulty,
      require_image: requireImage || selectedSection === 'abstract_reasoning',
      custom_prompt: customPrompt.trim() || undefined,
      combination_id: combinationId?.trim() || undefined,
      content_domain: contentDomain || undefined,
      question_type: questionType || undefined,
      primary_trap: primaryTrap || undefined,
      passage_required: passageRequired || undefined,
      visual_type: visualType || undefined
    };
    startGeneration(payload);
  };

  const handleSelectFromBank = (q) => {
    setActiveQuestion(q);
    if (q.section) setSelectedSection(q.section);
    if (q.subtopic) setSelectedSubtopic(q.subtopic);
    if (q.difficulty) setDifficulty(q.difficulty);
    if (q.combination_id) setCombinationId(q.combination_id);
    if (q.content_domain) setContentDomain(q.content_domain);
    if (q.question_type) setQuestionType(q.question_type);
    if (q.primary_trap) setPrimaryTrap(q.primary_trap);
    if (q.passage_required) setPassageRequired(q.passage_required);
    if (q.visual_type) setVisualType(q.visual_type);
    setActiveTab('generator');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setShowSettings(true)}
        backendStatus={backendStatus}
      />

      <main style={{ flex: 1, maxWidth: '1360px', width: '100%', margin: '0 auto', padding: '24px' }}>
        {activeTab === 'generator' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 420px) 1fr', gap: '24px', alignItems: 'start' }}>
            {/* Left Column: Generator Form Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <GeneratorPanel
                sectionsData={sectionsData}
                selectedSection={selectedSection}
                setSelectedSection={setSelectedSection}
                selectedSubtopic={selectedSubtopic}
                setSelectedSubtopic={setSelectedSubtopic}
                difficulty={difficulty}
                setDifficulty={setDifficulty}
                requireImage={requireImage}
                setRequireImage={setRequireImage}
                customPrompt={customPrompt}
                setCustomPrompt={setCustomPrompt}
                combinationId={combinationId}
                setCombinationId={setCombinationId}
                contentDomain={contentDomain}
                setContentDomain={setContentDomain}
                questionType={questionType}
                setQuestionType={setQuestionType}
                primaryTrap={primaryTrap}
                setPrimaryTrap={setPrimaryTrap}
                passageRequired={passageRequired}
                setPassageRequired={setPassageRequired}
                visualType={visualType}
                setVisualType={setVisualType}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
              />
            </div>

            {/* Right Column: Multi-Agent Workflow State & Question/Rejection Preview */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* State Machine Trace */}
              <AgentVisualizer
                activeAgent={activeAgent}
                iterationCount={iterationCount}
                events={events}
                latestReview={latestReview}
                isGenerating={isGenerating}
              />

              {/* Output: Rejection Card, Active Question Card, or Placeholder */}
              {rejectedData ? (
                <RejectionCard
                  rejectionData={rejectedData}
                  onRetry={handleGenerate}
                />
              ) : activeQuestion ? (
                <QuestionCard
                  question={activeQuestion}
                  onOpenAudit={(q) => setAuditQuestion(q)}
                  onNextQuestion={handleGenerate}
                />
              ) : (
                <div
                  className="glass-panel"
                  style={{
                    padding: '60px 24px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '14px',
                    color: 'var(--text-secondary)'
                  }}
                >
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: 'var(--brand-primary-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      boxShadow: '0 4px 12px rgba(2, 132, 199, 0.15)'
                    }}
                  >
                    ✨
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Candidate Question Preview
                  </h3>
                  <p style={{ maxWidth: '440px', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    Select your UCAT subtest on the left and click <strong>'Generate UK UCAT Question'</strong>.
                    Watch the 4 agents collaborate, review against the 100-pt rubric, and polish the question in real time.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'matrix' && (
          <MatrixRunner
            onOpenSettings={() => setShowSettings(true)}
            onSelectQuestion={(q) => {
              setActiveQuestion(q);
              setActiveTab('generator');
            }}
          />
        )}

        {activeTab === 'bank' && (
          <QuestionBank onSelectQuestion={handleSelectFromBank} />
        )}

        {activeTab === 'guide' && (
          <UCATGuide />
        )}
      </main>

      {/* Audit Modal */}
      {auditQuestion && (
        <ReviewAuditView
          question={auditQuestion}
          onClose={() => setAuditQuestion(null)}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
