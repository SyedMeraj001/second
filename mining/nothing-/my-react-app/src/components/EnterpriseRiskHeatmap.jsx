import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/themeUtils';
import { useNavigate } from 'react-router-dom';

const EnterpriseRiskHeatmap = ({ onClose }) => {
  const { isDark } = useTheme();
  const theme = getThemeClasses(isDark);
  const navigate = useNavigate();
  const [riskData, setRiskData] = useState([]);
  const [selectedRisk, setSelectedRisk] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [viewMode, setViewMode] = useState('heatmap');

  const riskCategories = {
    environmental: { name: 'Environmental', color: '#10b981' },
    social: { name: 'Social', color: '#3b82f6' },
    governance: { name: 'Governance', color: '#8b5cf6' },
    operational: { name: 'Operational', color: '#f59e0b' },
    financial: { name: 'Financial', color: '#ef4444' },
    regulatory: { name: 'Regulatory', color: '#6b7280' }
  };

  const impactLevels = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];
  const probabilityLevels = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];

  const handleBack = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/dashboard');
    }
  };

  const exportData = () => {
    const exportData = {
      riskMatrix: filteredRisks,
      summary: {
        totalRisks: filteredRisks.length,
        highRisks: filteredRisks.filter(r => r.riskScore >= 12).length,
        categories: Object.keys(riskCategories).length
      },
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `esg-risk-heatmap-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    loadRiskData();
  }, []);

  const loadRiskData = async () => {
    try {
      const response = await fetch('/api/esg/risk-assessment');
      const data = await response.json();
      setRiskData(data || generateSampleRiskData());
    } catch (error) {
      console.error('Failed to load risk data:', error);
      setRiskData(generateSampleRiskData());
    }
  };

  const generateSampleRiskData = () => [
    {
      id: 1,
      name: 'Climate Change Impact',
      category: 'environmental',
      impact: 5,
      probability: 4,
      riskScore: 20,
      description: 'Physical and transition risks from climate change',
      mitigation: 'Carbon reduction strategy, renewable energy adoption',
      owner: 'Sustainability Team',
      lastReviewed: '2024-01-15'
    },
    {
      id: 2,
      name: 'Water Scarcity',
      category: 'environmental',
      impact: 4,
      probability: 3,
      riskScore: 12,
      description: 'Limited water availability affecting operations',
      mitigation: 'Water recycling systems, alternative sources',
      owner: 'Operations Team',
      lastReviewed: '2024-01-10'
    },
    {
      id: 3,
      name: 'Community Relations',
      category: 'social',
      impact: 4,
      probability: 2,
      riskScore: 8,
      description: 'Potential conflicts with local communities',
      mitigation: 'Community engagement programs, local hiring',
      owner: 'Community Relations',
      lastReviewed: '2024-01-20'
    },
    {
      id: 4,
      name: 'Workplace Safety',
      category: 'social',
      impact: 5,
      probability: 2,
      riskScore: 10,
      description: 'Risk of workplace accidents and injuries',
      mitigation: 'Safety training, equipment upgrades, protocols',
      owner: 'Safety Team',
      lastReviewed: '2024-01-18'
    },
    {
      id: 5,
      name: 'Regulatory Compliance',
      category: 'governance',
      impact: 4,
      probability: 3,
      riskScore: 12,
      description: 'Non-compliance with ESG regulations',
      mitigation: 'Regular audits, compliance monitoring system',
      owner: 'Legal Team',
      lastReviewed: '2024-01-12'
    },
    {
      id: 6,
      name: 'Data Privacy Breach',
      category: 'governance',
      impact: 3,
      probability: 2,
      riskScore: 6,
      description: 'Risk of data security incidents',
      mitigation: 'Cybersecurity measures, staff training',
      owner: 'IT Security',
      lastReviewed: '2024-01-25'
    },
    {
      id: 7,
      name: 'Supply Chain Disruption',
      category: 'operational',
      impact: 4,
      probability: 3,
      riskScore: 12,
      description: 'ESG-related supply chain risks',
      mitigation: 'Supplier audits, diversification strategy',
      owner: 'Procurement',
      lastReviewed: '2024-01-08'
    },
    {
      id: 8,
      name: 'ESG Investment Risk',
      category: 'financial',
      impact: 3,
      probability: 3,
      riskScore: 9,
      description: 'Risk of reduced access to ESG-focused capital',
      mitigation: 'ESG performance improvement, transparent reporting',
      owner: 'Finance Team',
      lastReviewed: '2024-01-22'
    }
  ];

  const getRiskColor = (riskScore) => {
    if (riskScore >= 16) return '#dc2626'; // Very High - Red
    if (riskScore >= 12) return '#ea580c'; // High - Orange
    if (riskScore >= 8) return '#d97706';  // Medium - Amber
    if (riskScore >= 4) return '#65a30d';  // Low - Yellow-Green
    return '#16a34a'; // Very Low - Green
  };

  const filteredRisks = filterCategory === 'all' 
    ? riskData 
    : riskData.filter(risk => risk.category === filterCategory);

  const HeatmapView = () => (
    <div className={`${theme.bg.card} p-6 rounded-xl backdrop-blur-sm border-0`}>
      <div className="grid grid-cols-6 gap-1 mb-4">
        <div></div>
        {probabilityLevels.map((level, index) => (
          <div key={index} className="text-center text-sm font-medium p-2">
            {level}
          </div>
        ))}
        
        {impactLevels.reverse().map((impactLevel, impactIndex) => (
          <React.Fragment key={impactIndex}>
            <div className="text-sm font-medium p-2 flex items-center">
              {impactLevel}
            </div>
            {probabilityLevels.map((probLevel, probIndex) => {
              const cellRisks = filteredRisks.filter(risk => 
                risk.impact === (5 - impactIndex) && risk.probability === (probIndex + 1)
              );
              const cellScore = (5 - impactIndex) * (probIndex + 1);
              
              return (
                <div
                  key={probIndex}
                  className="h-16 border border-white/20 flex items-center justify-center cursor-pointer relative"
                  style={{ backgroundColor: getRiskColor(cellScore) + '40' }}
                  onClick={() => cellRisks.length > 0 && setSelectedRisk(cellRisks[0])}
                >
                  {cellRisks.length > 0 && (
                    <div className="text-xs text-center">
                      <div className="font-bold text-white bg-black bg-opacity-50 px-1 rounded">
                        {cellRisks.length}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      
      <div className={`flex justify-between items-center text-sm ${theme.text.secondary}`}>
        <span>Probability →</span>
        <span>← Impact</span>
      </div>
    </div>
  );

  const ListView = () => (
    <div className={`${theme.bg.card} rounded-xl overflow-hidden backdrop-blur-sm border-0`}>
      <table className="w-full">
        <thead className={theme.bg.subtle}>
          <tr>
            <th className={`px-4 py-3 text-left text-sm font-medium ${theme.text.primary}`}>Risk</th>
            <th className={`px-4 py-3 text-left text-sm font-medium ${theme.text.primary}`}>Category</th>
            <th className={`px-4 py-3 text-left text-sm font-medium ${theme.text.primary}`}>Impact</th>
            <th className={`px-4 py-3 text-left text-sm font-medium ${theme.text.primary}`}>Probability</th>
            <th className={`px-4 py-3 text-left text-sm font-medium ${theme.text.primary}`}>Risk Score</th>
            <th className={`px-4 py-3 text-left text-sm font-medium ${theme.text.primary}`}>Owner</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {filteredRisks.sort((a, b) => b.riskScore - a.riskScore).map(risk => (
            <tr key={risk.id} className={`hover:bg-white/5 cursor-pointer`}
                onClick={() => setSelectedRisk(risk)}>
              <td className={`px-4 py-3 text-sm font-medium ${theme.text.primary}`}>{risk.name}</td>
              <td className="px-4 py-3 text-sm">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                      style={{ 
                        backgroundColor: riskCategories[risk.category]?.color + '20',
                        color: riskCategories[risk.category]?.color 
                      }}>
                  {riskCategories[risk.category]?.name}
                </span>
              </td>
              <td className={`px-4 py-3 text-sm ${theme.text.secondary}`}>{impactLevels[risk.impact - 1]}</td>
              <td className={`px-4 py-3 text-sm ${theme.text.secondary}`}>{probabilityLevels[risk.probability - 1]}</td>
              <td className="px-4 py-3 text-sm">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: getRiskColor(risk.riskScore) }}>
                  {risk.riskScore}
                </span>
              </td>
              <td className={`px-4 py-3 text-sm ${theme.text.secondary}`}>{risk.owner}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`rounded-xl p-6 max-w-7xl w-full max-h-[90vh] overflow-y-auto ${theme.bg.card} backdrop-blur-sm border-0 shadow-2xl`}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className={`text-2xl font-bold ${theme.text.primary}`}>Enterprise ESG Risk Heatmap</h2>
            <p className={`text-sm ${theme.text.secondary} mt-1`}>Comprehensive risk assessment and mitigation planning</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={exportData}
              className={`px-4 py-2 ${theme.bg.subtle} ${theme.text.primary} rounded-xl hover:bg-white/20 transition-all backdrop-blur-sm border-0`}
            >
              📊 Export Data
            </button>
            <button
              onClick={handleBack}
              className={`px-4 py-2 ${theme.bg.subtle} ${theme.text.primary} rounded-xl hover:bg-white/20 transition-all backdrop-blur-sm border-0`}
            >
              ← Back
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-6">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className={`px-3 py-2 rounded-xl ${theme.bg.subtle} ${theme.text.primary} border-0 backdrop-blur-sm`}
          >
            <option value="all">All Categories</option>
            {Object.entries(riskCategories).map(([key, category]) => (
              <option key={key} value={key}>{category.name}</option>
            ))}
          </select>
          
          <div className={`flex ${theme.bg.subtle} rounded-xl border-0 backdrop-blur-sm`}>
            <button
              onClick={() => setViewMode('heatmap')}
              className={`px-4 py-2 rounded-l-xl ${viewMode === 'heatmap' ? `${theme.bg.card} ${theme.text.primary}` : theme.text.secondary}`}
            >
              Heatmap
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-r-xl ${viewMode === 'list' ? `${theme.bg.card} ${theme.text.primary}` : theme.text.secondary}`}
            >
              List View
            </button>
          </div>
        </div>

        {/* Risk Legend */}
        <div className={`${theme.bg.subtle} p-4 rounded-xl mb-6 backdrop-blur-sm`}>
          <h3 className={`font-semibold mb-3 ${theme.text.primary}`}>Risk Level Legend</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#16a34a' }}></div>
              <span className={`text-sm ${theme.text.secondary}`}>Very Low (1-3)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#65a30d' }}></div>
              <span className={`text-sm ${theme.text.secondary}`}>Low (4-7)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#d97706' }}></div>
              <span className={`text-sm ${theme.text.secondary}`}>Medium (8-11)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ea580c' }}></div>
              <span className={`text-sm ${theme.text.secondary}`}>High (12-15)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#dc2626' }}></div>
              <span className={`text-sm ${theme.text.secondary}`}>Very High (16-25)</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {viewMode === 'heatmap' ? <HeatmapView /> : <ListView />}
          </div>

          {/* Risk Details Panel */}
          <div className={`${theme.bg.card} p-4 rounded-xl backdrop-blur-sm border-0`}>
            <h3 className={`font-semibold mb-3 ${theme.text.primary}`}>Risk Details</h3>
            {selectedRisk ? (
              <div className="space-y-4">
                <div>
                  <h4 className={`font-medium text-lg ${theme.text.primary}`}>{selectedRisk.name}</h4>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1"
                        style={{ 
                          backgroundColor: riskCategories[selectedRisk.category]?.color + '20',
                          color: riskCategories[selectedRisk.category]?.color 
                        }}>
                    {riskCategories[selectedRisk.category]?.name}
                  </span>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${theme.text.primary}`}>Description</label>
                  <p className={`text-sm ${theme.text.secondary}`}>{selectedRisk.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${theme.text.primary}`}>Impact</label>
                    <p className={`text-sm ${theme.text.secondary}`}>{impactLevels[selectedRisk.impact - 1]}</p>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${theme.text.primary}`}>Probability</label>
                    <p className={`text-sm ${theme.text.secondary}`}>{probabilityLevels[selectedRisk.probability - 1]}</p>
                  </div>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${theme.text.primary}`}>Risk Score</label>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                        style={{ backgroundColor: getRiskColor(selectedRisk.riskScore) }}>
                    {selectedRisk.riskScore}
                  </span>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${theme.text.primary}`}>Mitigation Strategy</label>
                  <p className={`text-sm ${theme.text.secondary}`}>{selectedRisk.mitigation}</p>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${theme.text.primary}`}>Risk Owner</label>
                  <p className={`text-sm ${theme.text.secondary}`}>{selectedRisk.owner}</p>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${theme.text.primary}`}>Last Reviewed</label>
                  <p className={`text-sm ${theme.text.secondary}`}>{selectedRisk.lastReviewed}</p>
                </div>
              </div>
            ) : (
              <p className={`${theme.text.secondary} text-sm`}>Click on a risk in the heatmap or list to view details</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnterpriseRiskHeatmap;