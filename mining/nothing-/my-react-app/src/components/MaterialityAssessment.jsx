import { useState, useEffect } from 'react';
import { MATERIALITY_TOPICS } from '../utils/esgFrameworks';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/themeUtils';
import { useNavigate } from 'react-router-dom';
import AuditSystem from '../utils/auditSystem';

const MaterialityAssessment = ({ onSave, onClose }) => {
  const { isDark } = useTheme();
  const theme = getThemeClasses(isDark);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('assessment');
  const [materialityData, setMaterialityData] = useState(
    MATERIALITY_TOPICS.reduce((acc, topic) => ({
      ...acc,
      [topic.id]: { 
        impactMateriality: 3, 
        financialMateriality: 3, 
        stakeholderPriority: 3,
        justification: '',
        valueChain: 'own_operations',
        timeHorizon: 'medium_term'
      }
    }), {})
  );
  const [stakeholderWeights, setStakeholderWeights] = useState({
    investors: 25,
    employees: 20,
    customers: 20,
    communities: 15,
    regulators: 10,
    suppliers: 10
  });
  const [assessmentMetadata, setAssessmentMetadata] = useState({
    assessmentDate: new Date().toISOString().split('T')[0],
    assessor: '',
    reviewedBy: '',
    approvedBy: '',
    nextReviewDate: '',
    sector: 'general',
    methodology: 'ESRS'
  });

  useEffect(() => {
    // Load saved assessment data
    const saved = localStorage.getItem('materialityAssessment');
    if (saved) {
      const parsed = JSON.parse(saved);
      setMaterialityData(parsed.data || materialityData);
      setStakeholderWeights(parsed.stakeholderWeights || stakeholderWeights);
      setAssessmentMetadata(parsed.metadata || assessmentMetadata);
    }
  }, []);

  const handleScoreChange = (topicId, dimension, value) => {
    setMaterialityData(prev => ({
      ...prev,
      [topicId]: {
        ...prev[topicId],
        [dimension]: parseInt(value)
      }
    }));
  };

  const handleJustificationChange = (topicId, justification) => {
    setMaterialityData(prev => ({
      ...prev,
      [topicId]: {
        ...prev[topicId],
        justification
      }
    }));
  };

  const calculateDoubleMaterialityScore = (topic) => {
    const scores = materialityData[topic.id];
    if (!scores) {
      return {
        impactScore: 3,
        financialScore: 3,
        isMaterial: true,
        isHighlyMaterial: false,
        quadrant: 'high-high'
      };
    }
    
    const impactScore = scores.impactMateriality || 3;
    const financialScore = scores.financialMateriality || 3;
    
    // CSRD threshold: typically 3+ on either dimension
    const isMaterial = impactScore >= 3 || financialScore >= 3;
    const isHighlyMaterial = impactScore >= 4 && financialScore >= 4;
    
    return {
      impactScore,
      financialScore,
      isMaterial,
      isHighlyMaterial,
      quadrant: getMatrixQuadrant(impactScore, financialScore)
    };
  };

  const getMatrixQuadrant = (impact, financial) => {
    if (impact >= 3 && financial >= 3) return 'high-high';
    if (impact >= 3 && financial < 3) return 'high-low';
    if (impact < 3 && financial >= 3) return 'low-high';
    return 'low-low';
  };

  const getMaterialityLevel = (score) => {
    if (score.isHighlyMaterial) return { level: 'Highly Material', color: 'bg-red-100 text-red-800', priority: 1 };
    if (score.isMaterial) return { level: 'Material', color: 'bg-orange-100 text-orange-800', priority: 2 };
    return { level: 'Not Material', color: 'bg-gray-100 text-gray-800', priority: 3 };
  };

  const saveAssessment = () => {
    const assessmentData = {
      data: materialityData,
      stakeholderWeights,
      metadata: {
        ...assessmentMetadata,
        lastUpdated: new Date().toISOString()
      },
      results: MATERIALITY_TOPICS.map(topic => ({
        ...topic,
        ...calculateDoubleMaterialityScore(topic),
        scores: materialityData[topic.id]
      }))
    };
    
    localStorage.setItem('materialityAssessment', JSON.stringify(assessmentData));
    
    // Audit trail
    const currentUser = localStorage.getItem('currentUser') || 'admin@esgenius.com';
    const materialCount = assessmentData.results.filter(r => r.isMaterial).length;
    AuditSystem.recordAudit('UPDATE', 'Materiality Assessment', 'materiality_assessment', currentUser, { materialTopics: materialCount, sector: assessmentMetadata.sector });
    
    if (onSave) onSave(assessmentData);
  };

  const renderAssessmentTab = () => (
    <div className="space-y-6">
      {/* Assessment Metadata */}
      <div className={`p-4 rounded-lg ${theme.bg.card} border`}>
        <h3 className={`font-semibold mb-4 ${theme.text.primary}`}>Assessment Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={`block text-sm mb-1 ${theme.text.secondary}`}>Assessor</label>
            <input
              type="text"
              value={assessmentMetadata.assessor}
              onChange={(e) => setAssessmentMetadata(prev => ({ ...prev, assessor: e.target.value }))}
              className={`w-full border rounded px-3 py-2 ${theme.bg.input} ${theme.border.input}`}
            />
          </div>
          <div>
            <label className={`block text-sm mb-1 ${theme.text.secondary}`}>Sector</label>
            <select
              value={assessmentMetadata.sector}
              onChange={(e) => setAssessmentMetadata(prev => ({ ...prev, sector: e.target.value }))}
              className={`w-full border rounded px-3 py-2 ${theme.bg.input} ${theme.border.input}`}
            >
              <option value="general">General</option>
              <option value="mining">Mining & Metals</option>
              <option value="energy">Energy</option>
              <option value="technology">Technology</option>
              <option value="financial">Financial Services</option>
            </select>
          </div>
          <div>
            <label className={`block text-sm mb-1 ${theme.text.secondary}`}>Next Review Date</label>
            <input
              type="date"
              value={assessmentMetadata.nextReviewDate}
              onChange={(e) => setAssessmentMetadata(prev => ({ ...prev, nextReviewDate: e.target.value }))}
              className={`w-full border rounded px-3 py-2 ${theme.bg.input} ${theme.border.input}`}
            />
          </div>
        </div>
      </div>

      {/* Topics Assessment */}
      <div className="space-y-4">
        {MATERIALITY_TOPICS.map(topic => {
          const score = calculateDoubleMaterialityScore(topic);
          const { level, color } = getMaterialityLevel(score);
          
          return (
            <div key={topic.id} className={`border rounded-lg p-4 ${theme.bg.card}`}>
              <div className="flex justify-between items-center mb-3">
                <h3 className={`font-medium ${theme.text.primary}`}>{topic.name}</h3>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${color}`}>
                    {level}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    topic.category === 'environmental' ? 'bg-green-100 text-green-800' :
                    topic.category === 'social' ? 'bg-blue-100 text-blue-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {topic.category.charAt(0).toUpperCase() + topic.category.slice(1)}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className={`block text-sm mb-1 ${theme.text.secondary}`}>Impact Materiality</label>
                  <select
                    value={materialityData[topic.id]?.impactMateriality || 3}
                    onChange={(e) => handleScoreChange(topic.id, 'impactMateriality', e.target.value)}
                    className={`w-full border rounded px-3 py-1 text-sm ${theme.bg.input} ${theme.border.input}`}
                  >
                    {[1,2,3,4,5].map(num => (
                      <option key={num} value={num}>
                        {num} - {num === 1 ? 'Very Low' : num === 5 ? 'Very High' : num === 3 ? 'Medium' : num < 3 ? 'Low' : 'High'}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className={`block text-sm mb-1 ${theme.text.secondary}`}>Financial Materiality</label>
                  <select
                    value={materialityData[topic.id]?.financialMateriality || 3}
                    onChange={(e) => handleScoreChange(topic.id, 'financialMateriality', e.target.value)}
                    className={`w-full border rounded px-3 py-1 text-sm ${theme.bg.input} ${theme.border.input}`}
                  >
                    {[1,2,3,4,5].map(num => (
                      <option key={num} value={num}>
                        {num} - {num === 1 ? 'Very Low' : num === 5 ? 'Very High' : num === 3 ? 'Medium' : num < 3 ? 'Low' : 'High'}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className={`block text-sm mb-1 ${theme.text.secondary}`}>Value Chain</label>
                  <select
                    value={materialityData[topic.id]?.valueChain || 'own_operations'}
                    onChange={(e) => handleScoreChange(topic.id, 'valueChain', e.target.value)}
                    className={`w-full border rounded px-3 py-1 text-sm ${theme.bg.input} ${theme.border.input}`}
                  >
                    <option value="upstream">Upstream</option>
                    <option value="own_operations">Own Operations</option>
                    <option value="downstream">Downstream</option>
                    <option value="all">Entire Value Chain</option>
                  </select>
                </div>
                
                <div>
                  <label className={`block text-sm mb-1 ${theme.text.secondary}`}>Time Horizon</label>
                  <select
                    value={materialityData[topic.id]?.timeHorizon || 'medium_term'}
                    onChange={(e) => handleScoreChange(topic.id, 'timeHorizon', e.target.value)}
                    className={`w-full border rounded px-3 py-1 text-sm ${theme.bg.input} ${theme.border.input}`}
                  >
                    <option value="short_term">Short-term (0-2 years)</option>
                    <option value="medium_term">Medium-term (2-5 years)</option>
                    <option value="long_term">Long-term (5+ years)</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className={`block text-sm mb-1 ${theme.text.secondary}`}>Justification & Evidence</label>
                <textarea
                  value={materialityData[topic.id]?.justification || ''}
                  onChange={(e) => handleJustificationChange(topic.id, e.target.value)}
                  rows={2}
                  className={`w-full border rounded px-3 py-2 text-sm ${theme.bg.input} ${theme.border.input}`}
                  placeholder="Provide justification for materiality assessment..."
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderMatrixTab = () => {
    const materialTopics = MATERIALITY_TOPICS.map(topic => ({
      ...topic,
      ...calculateDoubleMaterialityScore(topic),
      scores: materialityData[topic.id]
    }));

    return (
      <div className="space-y-6">
        <div className={`p-6 rounded-lg ${theme.bg.card} border`}>
          <h3 className={`font-semibold mb-4 ${theme.text.primary}`}>Double Materiality Matrix</h3>
          
          {/* Matrix */}
          <div className="relative w-full h-96 border-2 border-gray-300 rounded-lg bg-gradient-to-tr from-green-50 via-yellow-50 to-red-50">
            {/* Axis Labels */}
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-sm font-medium text-gray-600">
              Financial Materiality →
            </div>
            <div className="absolute -left-16 top-1/2 transform -translate-y-1/2 -rotate-90 text-sm font-medium text-gray-600">
              Impact Materiality ↑
            </div>
            
            {/* Grid Lines */}
            <div className="absolute inset-0">
              {[1,2,3,4].map(i => (
                <div key={`v-${i}`} className="absolute border-l border-gray-200" style={{left: `${i * 20}%`, height: '100%'}} />
              ))}
              {[1,2,3,4].map(i => (
                <div key={`h-${i}`} className="absolute border-t border-gray-200" style={{bottom: `${i * 20}%`, width: '100%'}} />
              ))}
            </div>
            
            {/* Materiality Threshold Line */}
            <div className="absolute border-2 border-dashed border-red-400" style={{left: '60%', height: '100%'}} />
            <div className="absolute border-2 border-dashed border-red-400" style={{bottom: '60%', width: '100%'}} />
            
            {/* Plot Topics */}
            {materialTopics.map(topic => {
              const scores = topic.scores || { impactMateriality: 3, financialMateriality: 3 };
              const x = (scores.financialMateriality / 5) * 100;
              const y = (scores.impactMateriality / 5) * 100;
              
              return (
                <div
                  key={topic.id}
                  className={`absolute w-3 h-3 rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-pointer ${
                    topic.isHighlyMaterial ? 'bg-red-500' : topic.isMaterial ? 'bg-orange-500' : 'bg-gray-400'
                  }`}
                  style={{left: `${x}%`, bottom: `${y}%`}}
                  title={`${topic.name}: Impact ${scores.impactMateriality}, Financial ${scores.financialMateriality}`}
                />
              );
            })}}
          </div>
          
          {/* Legend */}
          <div className="mt-6 flex justify-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm">Highly Material</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-sm">Material</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span className="text-sm">Not Material</span>
            </div>
          </div>
        </div>
        
        {/* Material Topics Summary */}
        <div className={`p-4 rounded-lg ${theme.bg.card} border`}>
          <h4 className={`font-semibold mb-3 ${theme.text.primary}`}>Material Topics Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['Highly Material', 'Material', 'Not Material'].map(level => {
              const topics = materialTopics.filter(t => getMaterialityLevel(t).level === level);
              return (
                <div key={level}>
                  <h5 className={`font-medium mb-2 ${theme.text.secondary}`}>{level} ({topics.length})</h5>
                  <ul className="space-y-1">
                    {topics.map(topic => (
                      <li key={topic.id} className={`text-sm ${theme.text.muted}`}>
                        {topic.name}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderStakeholderTab = () => (
    <div className="space-y-6">
      <div className={`p-4 rounded-lg ${theme.bg.card} border`}>
        <h3 className={`font-semibold mb-4 ${theme.text.primary}`}>Stakeholder Weighting</h3>
        <p className={`text-sm mb-4 ${theme.text.secondary}`}>
          Adjust the relative importance of different stakeholder groups in materiality assessment.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(stakeholderWeights).map(([stakeholder, weight]) => (
            <div key={stakeholder}>
              <label className={`block text-sm mb-1 ${theme.text.secondary} capitalize`}>
                {stakeholder} ({weight}%)
              </label>
              <input
                type="range"
                min="0"
                max="50"
                value={weight}
                onChange={(e) => setStakeholderWeights(prev => ({
                  ...prev,
                  [stakeholder]: parseInt(e.target.value)
                }))}
                className="w-full"
              />
            </div>
          ))}
        </div>
        
        <div className={`mt-4 p-3 rounded ${theme.bg.subtle}`}>
          <p className={`text-sm ${theme.text.secondary}`}>
            Total Weight: {Object.values(stakeholderWeights).reduce((sum, w) => sum + w, 0)}%
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50/40 to-purple-50/30'
    }`} style={{
      backgroundImage: isDark ? '' : 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.12) 0%, transparent 50%), radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.1) 0%, transparent 50%)'
    }}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header with Back Button */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className={`text-3xl font-bold ${theme.text.primary}`}>Enhanced Double Materiality Assessment</h2>
            <p className={`text-lg ${theme.text.secondary} mt-2`}>
              CSRD/ESRS compliant double materiality assessment with impact and financial materiality evaluation.
            </p>
          </div>
          {(onClose || navigate) && (
            <button
              onClick={onClose || (() => navigate('/'))} 
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
              ← Back to Dashboard
            </button>
          )}
        </div>

        {/* Main Content Card */}
        <div className={`rounded-2xl p-6 border transition-all duration-300 ${
          isDark 
            ? 'bg-gray-800/90 border-gray-700 shadow-xl backdrop-blur-sm' 
            : 'bg-white/70 backdrop-blur-2xl border-white/30 shadow-lg shadow-slate-200/30'
        }`} style={{
          boxShadow: isDark ? '' : '0 25px 50px -12px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.3)'
        }}>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex space-x-1 p-1 rounded-xl bg-gray-100/50">
          {[
            { id: 'assessment', label: 'Assessment', icon: '📊' },
            { id: 'matrix', label: 'Materiality Matrix', icon: '📈' },
            { id: 'stakeholders', label: 'Stakeholders', icon: '👥' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-6 py-3 font-medium text-sm rounded-lg transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-md'
                  : `${theme.text.secondary} hover:${theme.text.primary} hover:bg-white/50`
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'assessment' && renderAssessmentTab()}
      {activeTab === 'matrix' && renderMatrixTab()}
      {activeTab === 'stakeholders' && renderStakeholderTab()}

        {/* Save Button */}
        <div className="mt-8 flex justify-end space-x-4">
          <button
            onClick={() => {
              const saved = localStorage.getItem('materialityAssessment');
              if (saved) {
                const parsed = JSON.parse(saved);
                setMaterialityData(parsed.data || {});
                setStakeholderWeights(parsed.stakeholderWeights || {});
                setAssessmentMetadata(parsed.metadata || {});
              }
            }}
            className={`px-6 py-3 border rounded-xl transition-all duration-200 hover:scale-105 ${
              isDark 
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Reset to Saved
          </button>
          <button
            onClick={saveAssessment}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 hover:scale-105 shadow-lg"
          >
            Save Assessment
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialityAssessment;