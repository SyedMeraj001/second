import React, { useState } from 'react';
import { useTheme } from './contexts/ThemeContext';
import { getThemeClasses } from './utils/themeUtils';
import ProfessionalHeader from './components/ProfessionalHeader';
import { useNavigate } from 'react-router-dom';

const Regulatory = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const theme = getThemeClasses(isDark);
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showModal, setShowModal] = useState(false);
  
  const [regulations] = useState([
    { 
      id: 1, 
      name: 'EU Taxonomy', 
      icon: 'EU',
      bgColor: 'bg-green-500',
      status: 'Compliant', 
      statusColor: 'green',
      deadline: '12/31/2024', 
      progress: 85,
      description: 'EU Sustainable Finance Taxonomy',
      requirements: [
        'Environmental objectives alignment',
        'Technical screening criteria',
        'Do no significant harm assessment'
      ]
    },
    { 
      id: 2, 
      name: 'CSRD', 
      icon: '📊',
      bgColor: 'bg-blue-500',
      status: 'In Progress', 
      statusColor: 'blue',
      deadline: '6/30/2024', 
      progress: 60,
      description: 'Corporate Sustainability Reporting Directive',
      requirements: [
        'Double materiality assessment',
        'ESRS compliance',
        'Assurance requirements'
      ]
    },
    { 
      id: 3, 
      name: 'SFDR', 
      icon: '🏦',
      bgColor: 'bg-purple-500',
      status: 'Review Required', 
      statusColor: 'yellow',
      deadline: '9/15/2024', 
      progress: 40,
      description: 'Sustainable Finance Disclosure Regulation',
      requirements: [
        'Principal adverse impacts',
        'Sustainability indicators',
        'Product disclosures'
      ]
    },
    { 
      id: 4, 
      name: 'SEC Climate', 
      icon: '🇺🇸',
      bgColor: 'bg-red-500',
      status: 'Pending', 
      statusColor: 'red',
      deadline: '11/30/2024', 
      progress: 20,
      description: 'SEC Climate Disclosure Rules',
      requirements: [
        'Scope 1 & 2 emissions',
        'Climate risk governance',
        'Financial impact disclosure'
      ]
    }
  ]);

  const [frameworkScores] = useState({
    overall: 74,
    gri: 71,
    sasb: 62,
    tcfd: 89,
    brsr: 77
  });

  const [risks] = useState([
    { id: 1, title: 'Missing GHG Scope 3 Data', impact: 'Compliance Gap', severity: 'High' },
    { id: 2, title: 'Incomplete Diversity Metrics', impact: 'Reporting Risk', severity: 'Medium' },
    { id: 3, title: 'Outdated Governance Policies', impact: 'Minor Gap', severity: 'Low' }
  ]);

  const stats = {
    compliant: regulations.filter(r => r.status === 'Compliant').length,
    inProgress: regulations.filter(r => r.status === 'In Progress').length,
    reviewRequired: regulations.filter(r => r.status === 'Review Required').length,
    pending: regulations.filter(r => r.status === 'Pending').length,
    overallCompliance: Math.round(regulations.reduce((acc, r) => acc + r.progress, 0) / regulations.length)
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    navigate("/login");
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Framework Scores */}
      <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-white/60'}`}>
        <div className="flex items-center gap-2 mb-6">
          <span className="text-2xl">📊</span>
          <h3 className={`text-xl font-bold ${theme.text.primary}`}>Overall Score</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div className="text-4xl font-bold text-green-600 mb-2">{frameworkScores.overall}%</div>
            <div className={`text-sm ${theme.text.secondary}`}>Overall Score</div>
          </div>
          
          <div>
            <div className="text-3xl font-bold text-orange-600 mb-2">{frameworkScores.gri}%</div>
            <div className={`text-sm ${theme.text.secondary}`}>GRI</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${frameworkScores.gri}%` }} />
            </div>
          </div>
          
          <div>
            <div className="text-3xl font-bold text-orange-600 mb-2">{frameworkScores.sasb}%</div>
            <div className={`text-sm ${theme.text.secondary}`}>SASB</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${frameworkScores.sasb}%` }} />
            </div>
          </div>
          
          <div>
            <div className="text-3xl font-bold text-green-600 mb-2">{frameworkScores.tcfd}%</div>
            <div className={`text-sm ${theme.text.secondary}`}>TCFD</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${frameworkScores.tcfd}%` }} />
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <div className="text-2xl font-bold text-orange-600 mb-2">{frameworkScores.brsr}%</div>
          <div className={`text-sm ${theme.text.secondary}`}>BRSR</div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${frameworkScores.brsr}%` }} />
          </div>
        </div>
      </div>
    </div>
  );



  const renderRiskAssessment = () => (
    <div className="space-y-4">
      {risks.map(risk => (
        <div key={risk.id} className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-white/60'}`}>
          <div className="flex justify-between items-start">
            <div>
              <h4 className={`font-bold ${theme.text.primary}`}>{risk.title}</h4>
              <p className={`text-sm ${theme.text.secondary}`}>Impact: {risk.impact}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              risk.severity === 'High' ? 'bg-red-100 text-red-700' :
              risk.severity === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-green-100 text-green-700'
            }`}>
              {risk.severity}
            </span>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50/40 to-purple-50/30'
    }`}>
      <ProfessionalHeader onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto p-6">
        {/* Header Section */}
        <div className={`rounded-2xl p-6 mb-6 border ${
          isDark 
            ? 'bg-gray-800/90 border-gray-700 shadow-xl' 
            : 'bg-white/70 backdrop-blur-2xl border-white/30 shadow-lg'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-500 rounded-xl flex items-center justify-center text-3xl">
                ⚖️
              </div>
              <div>
                <h1 className={`text-3xl font-bold ${theme.text.primary}`}>Regulatory Compliance</h1>
                <p className={`text-sm ${theme.text.secondary}`}>Monitor and manage ESG regulatory requirements across global frameworks</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-blue-600">{stats.overallCompliance}%</div>
              <div className={`text-sm ${theme.text.secondary}`}>Overall Compliance</div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-white/60'}`}>
              <div className="text-3xl font-bold text-gray-700">{stats.compliant}</div>
              <div className={`text-sm ${theme.text.secondary}`}>Compliant</div>
            </div>
            <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-white/60'}`}>
              <div className="text-3xl font-bold text-blue-600">{stats.inProgress}</div>
              <div className={`text-sm ${theme.text.secondary}`}>In Progress</div>
            </div>
            <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-white/60'}`}>
              <div className="text-3xl font-bold text-gray-700">{stats.reviewRequired}</div>
              <div className={`text-sm ${theme.text.secondary}`}>Review Required</div>
            </div>
            <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-white/60'}`}>
              <div className="text-3xl font-bold text-red-600">{stats.pending}</div>
              <div className={`text-sm ${theme.text.secondary}`}>Pending</div>
            </div>
          </div>
        </div>

        {/* Regulation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {regulations.map((reg) => (
            <div key={reg.id} className={`rounded-2xl p-6 border relative ${
              isDark 
                ? 'bg-gray-800/90 border-gray-700' 
                : 'bg-white/70 backdrop-blur-2xl border-white/30 shadow-lg'
            }`}>
              {/* Status Indicator */}
              <div className={`absolute top-4 right-4 w-3 h-3 rounded-full ${
                reg.statusColor === 'green' ? 'bg-orange-500' : 'bg-red-500'
              }`} />
              
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 ${reg.bgColor} rounded-xl flex items-center justify-center text-white font-bold`}>
                  {reg.icon}
                </div>
                <div>
                  <h3 className={`font-bold text-lg ${theme.text.primary}`}>{reg.name}</h3>
                  <p className={`text-sm ${theme.text.secondary}`}>{reg.description}</p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  reg.status === 'Compliant' ? 'bg-green-100 text-green-700' :
                  reg.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                  reg.status === 'Review Required' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {reg.status}
                </span>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <span className={`text-sm ${theme.text.secondary}`}>Progress</span>
                  <span className={`text-sm font-bold ${
                    reg.progress >= 80 ? 'text-green-600' :
                    reg.progress >= 50 ? 'text-orange-600' : 'text-blue-600'
                  }`}>{reg.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      reg.progress >= 80 ? 'bg-green-500' :
                      reg.progress >= 50 ? 'bg-orange-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${reg.progress}%` }}
                  />
                </div>
              </div>

              {/* Deadline */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-blue-500">📅</span>
                <span className={`text-sm ${theme.text.secondary}`}>Deadline</span>
                <span className={`text-sm font-semibold ${theme.text.primary}`}>{reg.deadline}</span>
                <button className="ml-auto text-blue-500 hover:bg-blue-50 p-2 rounded">
                  📥
                </button>
              </div>

              {/* Requirements */}
              <div className={`text-sm ${theme.text.secondary} mb-4`}>
                <p className="mb-2">{reg.description === 'EU Sustainable Finance Taxonomy' ? 'Classification system for environmentally sustainable economic activities' : ''}</p>
                <div className="font-semibold mb-2">Key Requirements:</div>
                {reg.requirements.map((req, idx) => (
                  <div key={idx} className="flex items-start gap-2 mb-1">
                    <span className="text-green-500">✓</span>
                    <span>{req}</span>
                  </div>
                ))}
              </div>

              {/* View Details Button */}
              <button 
                onClick={() => setShowModal(true)}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                📋 View Details
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl">⚖️</span>
                <h2 className={`text-2xl font-bold ${theme.text.primary}`}>Regulatory Compliance</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="text-2xl">&times;</button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 font-semibold rounded-t-lg ${
                  activeTab === 'dashboard' 
                    ? 'bg-blue-600 text-white' 
                    : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📊 Dashboard
              </button>

              <button
                onClick={() => setActiveTab('risk')}
                className={`px-4 py-2 font-semibold rounded-t-lg ${
                  activeTab === 'risk' 
                    ? 'bg-blue-600 text-white' 
                    : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                ⚠️ Risk Assessment
              </button>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
              {activeTab === 'dashboard' && renderDashboard()}
              {activeTab === 'risk' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className={`text-xl font-bold ${theme.text.primary}`}>Risk Assessment</h3>
                    <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                      ⚠️ Assess Risks
                    </button>
                  </div>
                  {renderRiskAssessment()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Regulatory;
