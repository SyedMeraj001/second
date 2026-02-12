import React, { useState, useEffect } from 'react';

const EnterpriseRiskHeatmap = ({ onClose }) => {
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
    <div className="bg-white p-6 rounded-lg">
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
                  className="h-16 border border-gray-300 flex items-center justify-center cursor-pointer relative"
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
      
      <div className="flex justify-between items-center text-sm">
        <span>Probability →</span>
        <span>← Impact</span>
      </div>
    </div>
  );

  const ListView = () => (
    <div className="bg-white rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Risk</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Category</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Impact</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Probability</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Risk Score</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Owner</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {filteredRisks.sort((a, b) => b.riskScore - a.riskScore).map(risk => (
            <tr key={risk.id} className="hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedRisk(risk)}>
              <td className="px-4 py-3 text-sm font-medium text-gray-900">{risk.name}</td>
              <td className="px-4 py-3 text-sm">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                      style={{ 
                        backgroundColor: riskCategories[risk.category]?.color + '20',
                        color: riskCategories[risk.category]?.color 
                      }}>
                  {riskCategories[risk.category]?.name}
                </span>
              </td>
              <td className="px-4 py-3 text-sm">{impactLevels[risk.impact - 1]}</td>
              <td className="px-4 py-3 text-sm">{probabilityLevels[risk.probability - 1]}</td>
              <td className="px-4 py-3 text-sm">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: getRiskColor(risk.riskScore) }}>
                  {risk.riskScore}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">{risk.owner}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-100 rounded-lg p-6 max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Enterprise ESG Risk Heatmap</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-6">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="all">All Categories</option>
            {Object.entries(riskCategories).map(([key, category]) => (
              <option key={key} value={key}>{category.name}</option>
            ))}
          </select>
          
          <div className="flex bg-white rounded-lg border">
            <button
              onClick={() => setViewMode('heatmap')}
              className={`px-4 py-2 rounded-l-lg ${viewMode === 'heatmap' ? 'bg-blue-600 text-white' : 'text-gray-600'}`}
            >
              Heatmap
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-r-lg ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600'}`}
            >
              List View
            </button>
          </div>
        </div>

        {/* Risk Legend */}
        <div className="bg-white p-4 rounded-lg mb-6">
          <h3 className="font-semibold mb-3">Risk Level Legend</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#16a34a' }}></div>
              <span className="text-sm">Very Low (1-3)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#65a30d' }}></div>
              <span className="text-sm">Low (4-7)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#d97706' }}></div>
              <span className="text-sm">Medium (8-11)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ea580c' }}></div>
              <span className="text-sm">High (12-15)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#dc2626' }}></div>
              <span className="text-sm">Very High (16-25)</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {viewMode === 'heatmap' ? <HeatmapView /> : <ListView />}
          </div>

          {/* Risk Details Panel */}
          <div className="bg-white p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Risk Details</h3>
            {selectedRisk ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-lg">{selectedRisk.name}</h4>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1"
                        style={{ 
                          backgroundColor: riskCategories[selectedRisk.category]?.color + '20',
                          color: riskCategories[selectedRisk.category]?.color 
                        }}>
                    {riskCategories[selectedRisk.category]?.name}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="text-sm text-gray-600">{selectedRisk.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Impact</label>
                    <p className="text-sm">{impactLevels[selectedRisk.impact - 1]}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Probability</label>
                    <p className="text-sm">{probabilityLevels[selectedRisk.probability - 1]}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Risk Score</label>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                        style={{ backgroundColor: getRiskColor(selectedRisk.riskScore) }}>
                    {selectedRisk.riskScore}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mitigation Strategy</label>
                  <p className="text-sm text-gray-600">{selectedRisk.mitigation}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Risk Owner</label>
                  <p className="text-sm">{selectedRisk.owner}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Reviewed</label>
                  <p className="text-sm">{selectedRisk.lastReviewed}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Click on a risk in the heatmap or list to view details</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnterpriseRiskHeatmap;