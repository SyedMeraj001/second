import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/themeUtils';
import { Button, Card, Badge, ProgressBar, Alert, Tabs, Input, Select } from './ProfessionalUX';

const CDPClimateQuestionnaire = () => {
  const { isDark } = useTheme();
  const theme = getThemeClasses(isDark);
  const [activeSection, setActiveSection] = useState('C0');
  const [responses, setResponses] = useState({});
  const [completionStatus, setCompletionStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [submissionData, setSubmissionData] = useState(null);

  const cdpSections = [
    { id: 'C0', name: 'Introduction', icon: '📋', required: true },
    { id: 'C1', name: 'Governance', icon: '⚖️', required: true },
    { id: 'C2', name: 'Risks & Opportunities', icon: '⚠️', required: true },
    { id: 'C3', name: 'Business Strategy', icon: '🎯', required: true },
    { id: 'C4', name: 'Targets & Performance', icon: '📊', required: true },
    { id: 'C5', name: 'Emissions Methodology', icon: '🔬', required: true },
    { id: 'C6', name: 'Emissions Data', icon: '📈', required: true },
    { id: 'C7', name: 'Emissions Breakdown', icon: '📉', required: true },
    { id: 'C8', name: 'Energy', icon: '⚡', required: true },
    { id: 'C11', name: 'Carbon Pricing', icon: '💰', required: false },
    { id: 'C12', name: 'Engagement', icon: '🤝', required: true }
  ];

  const sectionFields = {
    C0: [
      { id: 'companyName', label: 'Company Name', type: 'text', required: true },
      { id: 'reportingYear', label: 'Reporting Year', type: 'select', options: ['2024', '2023', '2022'], required: true },
      { id: 'reportingBoundary', label: 'Reporting Boundary', type: 'select', options: ['Financial control', 'Operational control', 'Equity share'], required: true }
    ],
    C1: [
      { id: 'boardOversight', label: 'Board-level oversight of climate issues', type: 'select', options: ['Yes', 'No'], required: true },
      { id: 'managementResponsibility', label: 'Management-level responsibility', type: 'text', required: true },
      { id: 'climateGovernance', label: 'Climate governance processes', type: 'textarea', required: true }
    ],
    C2: [
      { id: 'physicalRisks', label: 'Physical climate risks identified', type: 'number', required: true },
      { id: 'transitionRisks', label: 'Transition risks identified', type: 'number', required: true },
      { id: 'opportunities', label: 'Climate opportunities identified', type: 'number', required: true }
    ],
    C3: [
      { id: 'strategyIntegration', label: 'Climate integration in business strategy', type: 'select', options: ['Fully integrated', 'Partially integrated', 'Not integrated'], required: true },
      { id: 'scenarioAnalysis', label: 'Climate scenario analysis conducted', type: 'select', options: ['Yes', 'No'], required: true },
      { id: 'resilience', label: 'Climate resilience assessment', type: 'textarea', required: true }
    ],
    C4: [
      { id: 'emissionTargets', label: 'Emission reduction targets set', type: 'select', options: ['Yes', 'No'], required: true },
      { id: 'targetYear', label: 'Target year', type: 'number', required: true },
      { id: 'progress', label: 'Progress towards targets (%)', type: 'number', required: true }
    ],
    C5: [
      { id: 'calculationMethods', label: 'GHG calculation methodology', type: 'select', options: ['GHG Protocol', 'ISO 14064', 'Other'], required: true },
      { id: 'consolidationApproach', label: 'Consolidation approach', type: 'select', options: ['Financial control', 'Operational control', 'Equity share'], required: true }
    ],
    C6: [
      { id: 'scope1', label: 'Scope 1 emissions (tCO2e)', type: 'number', required: true },
      { id: 'scope2', label: 'Scope 2 emissions (tCO2e)', type: 'number', required: true },
      { id: 'scope3', label: 'Scope 3 emissions (tCO2e)', type: 'number', required: false }
    ],
    C7: [
      { id: 'byActivity', label: 'Emissions by business activity', type: 'textarea', required: true },
      { id: 'byGeography', label: 'Emissions by geography', type: 'textarea', required: true },
      { id: 'byFacility', label: 'Emissions by facility', type: 'textarea', required: false }
    ],
    C8: [
      { id: 'totalEnergy', label: 'Total energy consumption (MWh)', type: 'number', required: true },
      { id: 'renewableEnergy', label: 'Renewable energy (%)', type: 'number', required: true },
      { id: 'energyIntensity', label: 'Energy intensity (MWh/revenue)', type: 'number', required: false }
    ],
    C11: [
      { id: 'internalPricing', label: 'Internal carbon pricing used', type: 'select', options: ['Yes', 'No'], required: false },
      { id: 'carbonPrice', label: 'Carbon price ($/tCO2e)', type: 'number', required: false }
    ],
    C12: [
      { id: 'supplyChain', label: 'Supply chain engagement', type: 'select', options: ['Yes', 'No'], required: true },
      { id: 'policyEngagement', label: 'Climate policy engagement', type: 'select', options: ['Yes', 'No'], required: true }
    ]
  };

  useEffect(() => {
    calculateCompletionStatus();
    loadExistingData();
  }, [responses]);

  const loadExistingData = async () => {
    try {
      const currentUser = localStorage.getItem('currentUser') || '1';
      const response = await fetch(`/api/reporting/cdp/prefill/${currentUser}`);
      const result = await response.json();
      
      if (result.success && Object.keys(result.data).length > 0) {
        setResponses(prev => ({ ...prev, ...result.data }));
      }
      
      // Also load saved progress from localStorage
      const savedResponses = localStorage.getItem('cdpResponses');
      if (savedResponses) {
        const parsed = JSON.parse(savedResponses);
        setResponses(prev => ({ ...prev, ...parsed }));
      }
    } catch (error) {
      console.log('Could not load existing data, starting fresh');
    }
  };

  const calculateCompletionStatus = () => {
    const status = {};
    cdpSections.forEach(section => {
      const fields = sectionFields[section.id] || [];
      const requiredFields = fields.filter(field => field.required);
      const completedFields = requiredFields.filter(field => responses[field.id]);
      status[section.id] = {
        completed: completedFields.length,
        total: requiredFields.length,
        percentage: requiredFields.length > 0 ? (completedFields.length / requiredFields.length) * 100 : 0
      };
    });
    setCompletionStatus(status);
  };

  const handleInputChange = (fieldId, value) => {
    setResponses(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const getOverallCompletion = () => {
    const totalSections = cdpSections.filter(s => s.required).length;
    const completedSections = Object.values(completionStatus).filter(s => s.percentage === 100).length;
    return totalSections > 0 ? (completedSections / totalSections) * 100 : 0;
  };

  const submitQuestionnaire = async () => {
    setLoading(true);
    try {
      const currentUser = localStorage.getItem('currentUser') || '1';
      
      // Submit to backend API
      const response = await fetch('/api/reporting/cdp/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          companyId: currentUser,
          reportingYear: responses.reportingYear || '2024',
          sections: responses
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setSubmissionData(result);
        // Clear saved progress after successful submission
        localStorage.removeItem('cdpResponses');
      } else {
        throw new Error(result.error || 'Submission failed');
      }
    } catch (error) {
      console.error('Submission failed:', error);
      alert('Submission failed. Please try again.');
    }
    setLoading(false);
  };

  const renderSectionContent = (sectionId) => {
    const fields = sectionFields[sectionId] || [];
    
    return (
      <div className="space-y-6">
        {fields.map(field => (
          <div key={field.id}>
            {field.type === 'select' ? (
              <Select
                label={field.label}
                value={responses[field.id] || ''}
                onChange={(e) => handleInputChange(field.id, e.target.value)}
                options={[
                  { value: '', label: 'Select...' },
                  ...field.options.map(opt => ({ value: opt, label: opt }))
                ]}
                className={field.required ? 'border-l-4 border-l-blue-500' : ''}
              />
            ) : field.type === 'textarea' ? (
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme.text.primary}`}>
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={responses[field.id] || ''}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg ${theme.bg.input} ${theme.border.input} ${theme.text.primary} ${field.required ? 'border-l-4 border-l-blue-500' : ''}`}
                  placeholder={`Enter ${field.label.toLowerCase()}...`}
                />
              </div>
            ) : (
              <Input
                label={field.label}
                type={field.type}
                value={responses[field.id] || ''}
                onChange={(e) => handleInputChange(field.id, e.target.value)}
                className={field.required ? 'border-l-4 border-l-blue-500' : ''}
                isDark={isDark}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreGrade = (scores) => {
    const avg = (scores.disclosure + scores.awareness + scores.management + scores.leadership) / 4;
    if (avg >= 80) return 'A';
    if (avg >= 70) return 'B';
    if (avg >= 60) return 'C';
    return 'D';
  };

  if (submissionData) {
    return (
      <div className={`min-h-screen p-6 ${theme.bg.gradient}`}>
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center" isDark={isDark}>
            <div className="mb-6">
              <div className="text-6xl mb-4">🎉</div>
              <h1 className={`text-3xl font-bold mb-2 ${theme.text.primary}`}>
                CDP Questionnaire Submitted Successfully!
              </h1>
              <p className={`text-lg ${theme.text.secondary}`}>
                Submission ID: {submissionData.submissionId}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {Object.entries(submissionData.score).map(([category, score]) => (
                <div key={category} className={`p-4 rounded-lg ${theme.bg.subtle}`}>
                  <h3 className={`font-semibold capitalize ${theme.text.primary}`}>{category}</h3>
                  <div className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}%</div>
                </div>
              ))}
            </div>

            <div className="mb-6">
              <h2 className={`text-xl font-semibold mb-2 ${theme.text.primary}`}>
                Preliminary CDP Score: {getScoreGrade(submissionData.score)}
              </h2>
              <p className={`${theme.text.secondary}`}>
                Final scoring will be completed by CDP within 6-8 weeks
              </p>
            </div>

            <Button
              variant="primary"
              onClick={() => {
                setSubmissionData(null);
                setResponses({});
                setActiveSection('C0');
              }}
            >
              Start New Questionnaire
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 ${theme.bg.gradient}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className={`text-3xl font-bold ${theme.text.primary}`}>
                CDP Climate Change Questionnaire 2024
              </h1>
              <p className={`text-lg ${theme.text.secondary}`}>
                Complete your climate disclosure for investor and stakeholder transparency
              </p>
            </div>
            <button
              onClick={() => window.history.back()}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 ${
                isDark 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600' 
                  : 'bg-white/70 hover:bg-white/90 text-gray-700 border border-white/30 shadow-lg'
              }`}
              style={{
                backdropFilter: 'blur(10px)',
                boxShadow: isDark ? '' : '0 8px 32px rgba(0, 0, 0, 0.1)'
              }}
            >
              ← Back
            </button>
          </div>
        </div>

        {/* Progress Overview */}
        <Card className="p-6 mb-6" isDark={isDark}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-xl font-semibold ${theme.text.primary}`}>
              Overall Progress
            </h2>
            <Badge variant={getOverallCompletion() === 100 ? 'success' : 'warning'}>
              {Math.round(getOverallCompletion())}% Complete
            </Badge>
          </div>
          <ProgressBar progress={getOverallCompletion()} />
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Section Navigation */}
          <div className="lg:col-span-1">
            <Card className="p-4" isDark={isDark}>
              <h3 className={`font-semibold mb-4 ${theme.text.primary}`}>Sections</h3>
              <div className="space-y-2">
                {cdpSections.map(section => {
                  const status = completionStatus[section.id] || { percentage: 0 };
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        activeSection === section.id
                          ? 'bg-blue-100 border-l-4 border-l-blue-500'
                          : theme.hover.bg
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span>{section.icon}</span>
                          <div>
                            <div className={`font-medium ${theme.text.primary}`}>
                              {section.id}
                            </div>
                            <div className={`text-sm ${theme.text.secondary}`}>
                              {section.name}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xs ${
                            status.percentage === 100 ? 'text-green-600' : 'text-gray-500'
                          }`}>
                            {Math.round(status.percentage)}%
                          </div>
                          {section.required && (
                            <div className="text-xs text-red-500">Required</div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Section Content */}
          <div className="lg:col-span-3">
            <Card className="p-6" isDark={isDark}>
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">
                    {cdpSections.find(s => s.id === activeSection)?.icon}
                  </span>
                  <h2 className={`text-2xl font-bold ${theme.text.primary}`}>
                    {activeSection}: {cdpSections.find(s => s.id === activeSection)?.name}
                  </h2>
                </div>
                <div className="flex items-center gap-4">
                  <ProgressBar 
                    progress={completionStatus[activeSection]?.percentage || 0}
                    label="Section Progress"
                    showPercentage={true}
                  />
                </div>
              </div>

              {renderSectionContent(activeSection)}

              <div className="flex justify-between mt-8">
                <Button
                  variant="secondary"
                  onClick={() => {
                    const currentIndex = cdpSections.findIndex(s => s.id === activeSection);
                    if (currentIndex > 0) {
                      setActiveSection(cdpSections[currentIndex - 1].id);
                    }
                  }}
                  disabled={cdpSections.findIndex(s => s.id === activeSection) === 0}
                >
                  Previous Section
                </Button>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      localStorage.setItem('cdpResponses', JSON.stringify(responses));
                      alert('Progress saved!');
                    }}
                  >
                    Save Progress
                  </Button>

                  {activeSection === 'C12' ? (
                    <Button
                      variant="success"
                      onClick={submitQuestionnaire}
                      loading={loading}
                      disabled={getOverallCompletion() < 80}
                    >
                      Submit Questionnaire
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={() => {
                        const currentIndex = cdpSections.findIndex(s => s.id === activeSection);
                        if (currentIndex < cdpSections.length - 1) {
                          setActiveSection(cdpSections[currentIndex + 1].id);
                        }
                      }}
                    >
                      Next Section
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Help Section */}
        <Card className="p-6 mt-6" isDark={isDark}>
          <Alert type="info" isDark={isDark}>
            <strong>CDP Scoring:</strong> Your responses will be scored on Disclosure (completeness), 
            Awareness (understanding), Management (actions taken), and Leadership (best practices). 
            Aim for at least 80% completion for a meaningful score.
          </Alert>
        </Card>
      </div>
    </div>
  );
};

export default CDPClimateQuestionnaire;