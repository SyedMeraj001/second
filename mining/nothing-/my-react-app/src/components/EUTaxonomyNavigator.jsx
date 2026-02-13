import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/themeUtils';
import { EUTaxonomyEngine } from '../utils/euTaxonomyEngine';
import { getStoredData } from '../utils/storage';

const EUTaxonomyNavigator = ({ onClose }) => {
  const { isDark } = useTheme();
  const theme = getThemeClasses(isDark);
  const [step, setStep] = useState(1);
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [assessments, setAssessments] = useState([]);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [criteriaData, setCriteriaData] = useState({});
  const [dnshData, setDnshData] = useState({});
  const [safeguardsData, setSafeguardsData] = useState({});
  const [financialData, setFinancialData] = useState({ totalRevenue: 0, totalCapex: 0, totalOpex: 0 });
  const [alignment, setAlignment] = useState(null);
  const [esgData, setEsgData] = useState([]);

  useEffect(() => {
    loadESGData();
  }, []);

  const loadESGData = async () => {
    const data = await getStoredData();
    setEsgData(data);
    autoPopulateFromESGData(data);
  };

  const autoPopulateFromESGData = (data) => {
    if (data.length === 0) return;
    
    // Auto-calculate financial totals from ESG data
    let totalRev = 0, totalCap = 0, totalOp = 0;
    
    data.forEach(entry => {
      if (entry.environmental?.revenue) totalRev += parseFloat(entry.environmental.revenue);
      if (entry.environmental?.capex) totalCap += parseFloat(entry.environmental.capex);
      if (entry.environmental?.opex) totalOp += parseFloat(entry.environmental.opex);
    });
    
    setFinancialData({
      totalRevenue: totalRev || 1000000,
      totalCapex: totalCap || 500000,
      totalOpex: totalOp || 200000
    });
  };

  const steps = [
    { id: 1, name: 'Select Activities', icon: '🏢' },
    { id: 2, name: 'Technical Criteria', icon: '✅' },
    { id: 3, name: 'DNSH Assessment', icon: '🛡️' },
    { id: 4, name: 'Minimum Safeguards', icon: '⚖️' },
    { id: 5, name: 'Results & Report', icon: '📊' }
  ];

  const handleActivitySelect = (activity) => {
    if (!selectedActivities.find(a => a.naceCode === activity.naceCode)) {
      setSelectedActivities([...selectedActivities, { ...activity, revenue: 0, capex: 0, opex: 0 }]);
    }
  };

  const handleActivityRemove = (naceCode) => {
    setSelectedActivities(selectedActivities.filter(a => a.naceCode !== naceCode));
  };

  const handleFinancialUpdate = (naceCode, field, value) => {
    setSelectedActivities(selectedActivities.map(a => 
      a.naceCode === naceCode ? { ...a, [field]: parseFloat(value) || 0 } : a
    ));
  };

  const handleCriteriaChange = (criteriaId, value) => {
    setCriteriaData({ ...criteriaData, [criteriaId]: value });
  };

  const handleDnshChange = (objectiveId, value) => {
    setDnshData({ ...dnshData, [objectiveId]: value });
  };

  const handleSafeguardChange = (safeguardId, value) => {
    setSafeguardsData({ ...safeguardsData, [safeguardId]: value });
  };

  const assessCurrentActivity = () => {
    const assessment = EUTaxonomyEngine.assessActivity(currentActivity, {
      criteria: criteriaData,
      dnsh: dnshData,
      safeguards: safeguardsData
    });
    
    setAssessments([...assessments, { ...assessment, ...currentActivity }]);
    setCriteriaData({});
    setDnshData({});
    setSafeguardsData({});
    
    const nextActivity = selectedActivities.find(a => !assessments.find(ass => ass.activity === a.naceCode));
    if (nextActivity) {
      setCurrentActivity(nextActivity);
      setStep(2);
    } else {
      calculateAlignment();
      setStep(5);
    }
  };

  const calculateAlignment = () => {
    const result = EUTaxonomyEngine.calculateAlignment(assessments, financialData);
    setAlignment(result);
  };

  const searchResults = searchQuery.length > 0 ? EUTaxonomyEngine.searchActivities(searchQuery) : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className={`max-w-7xl w-full max-h-[90vh] overflow-y-auto ${theme.bg.card} rounded-3xl shadow-2xl border ${isDark ? 'border-blue-500/30' : 'border-blue-200'}`}>
        
        {/* Header */}
        <div className={`p-6 border-b ${isDark ? 'border-blue-500/30' : 'border-blue-200'} bg-gradient-to-br ${isDark ? 'from-blue-900 via-green-900 to-teal-900' : 'from-blue-50 via-green-50 to-teal-50'} relative overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
          <div className="flex justify-between items-center relative z-10">
            <div>
              <h2 className={`text-3xl font-bold ${theme.text.primary} flex items-center gap-3`}>
                <span className="text-4xl">🇪🇺</span>
                EU Taxonomy Navigator
                <span className="text-xs px-3 py-1 bg-gradient-to-r from-blue-500 to-green-600 text-white rounded-full font-semibold shadow-lg">REGULATION 2020/852</span>
              </h2>
              <p className={`${theme.text.secondary} mt-2 text-sm`}>Assess taxonomy alignment for sustainable activities</p>
            </div>
            <button onClick={onClose} className={`text-3xl hover:text-red-500 hover:rotate-90 transition-all duration-300 w-12 h-12 flex items-center justify-center rounded-full ${isDark ? 'hover:bg-red-900/30' : 'hover:bg-red-50'}`}>✕</button>
          </div>
        </div>

        {/* Stepper */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            {steps.map((s, idx) => (
              <div key={s.id} className="flex items-center">
                <div className={`flex flex-col items-center ${step >= s.id ? 'opacity-100' : 'opacity-40'}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${step >= s.id ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white' : 'bg-gray-200'}`}>
                    {s.icon}
                  </div>
                  <span className="text-xs mt-2 font-semibold">{s.name}</span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`w-16 h-1 mx-2 ${step > s.id ? 'bg-gradient-to-r from-blue-500 to-green-500' : 'bg-gray-200'}`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Step 1: Activity Selection */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Show ESG Data Summary */}
              {esgData.length > 0 && (
                <div className={`p-4 rounded-xl ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'} border-2 border-blue-500`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">📊</span>
                    <span className="font-bold">ESG Data Detected</span>
                  </div>
                  <p className="text-sm">Found {esgData.length} ESG entries. Financial data auto-populated.</p>
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div className="text-sm">
                      <span className="font-semibold">Total Revenue:</span> €{financialData.totalRevenue.toLocaleString()}
                    </div>
                    <div className="text-sm">
                      <span className="font-semibold">Total CapEx:</span> €{financialData.totalCapex.toLocaleString()}
                    </div>
                    <div className="text-sm">
                      <span className="font-semibold">Total OpEx:</span> €{financialData.totalOpex.toLocaleString()}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold mb-2">Search Economic Activities (NACE Codes)</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by NACE code or activity name..."
                  className={`w-full px-4 py-3 border-2 rounded-xl ${theme.bg.input} ${theme.border.input} focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              {searchResults.length > 0 && (
                <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
                  {searchResults.map(activity => (
                    <div key={activity.naceCode} className={`p-4 rounded-xl border-2 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} hover:border-blue-500 transition-all`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-blue-600">{activity.naceCode}</div>
                          <div className={theme.text.primary}>{activity.name}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {EUTaxonomyEngine.getObjectiveById(activity.objective)?.name}
                          </div>
                        </div>
                        <button
                          onClick={() => handleActivitySelect(activity)}
                          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg hover:shadow-lg transition-all"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <h3 className="text-lg font-bold mb-3">Selected Activities ({selectedActivities.length})</h3>
                {selectedActivities.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No activities selected. Search and add activities above.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedActivities.map(activity => (
                      <div key={activity.naceCode} className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <span className="font-bold text-blue-600">{activity.naceCode}</span>
                            <span className="ml-2">{activity.name}</span>
                          </div>
                          <button onClick={() => handleActivityRemove(activity.naceCode)} className="text-red-500 hover:text-red-700">✕</button>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-xs">Revenue (€)</label>
                            <input
                              type="number"
                              value={activity.revenue}
                              onChange={(e) => handleFinancialUpdate(activity.naceCode, 'revenue', e.target.value)}
                              className={`w-full px-3 py-2 border rounded-lg ${theme.bg.input}`}
                            />
                          </div>
                          <div>
                            <label className="text-xs">CapEx (€)</label>
                            <input
                              type="number"
                              value={activity.capex}
                              onChange={(e) => handleFinancialUpdate(activity.naceCode, 'capex', e.target.value)}
                              className={`w-full px-3 py-2 border rounded-lg ${theme.bg.input}`}
                            />
                          </div>
                          <div>
                            <label className="text-xs">OpEx (€)</label>
                            <input
                              type="number"
                              value={activity.opex}
                              onChange={(e) => handleFinancialUpdate(activity.naceCode, 'opex', e.target.value)}
                              className={`w-full px-3 py-2 border rounded-lg ${theme.bg.input}`}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    if (selectedActivities.length > 0) {
                      setCurrentActivity(selectedActivities[0]);
                      setStep(2);
                    }
                  }}
                  disabled={selectedActivities.length === 0}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
                >
                  Next: Technical Criteria →
                </button>
              </div>
            </div>
          )}

          {/* Step 2-4: Assessment Steps */}
          {step === 2 && currentActivity && (
            <div className="space-y-6">
              <div className={`p-5 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <h3 className="text-xl font-bold mb-2">Assessing: {currentActivity.name}</h3>
                <p className="text-sm text-gray-500">NACE Code: {currentActivity.naceCode}</p>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold">Technical Criteria</h4>
                {EUTaxonomyEngine.technicalCriteria[currentActivity.objective]?.map(criteria => (
                  <div key={criteria.id} className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} border`}>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={criteriaData[criteria.id] || false}
                        onChange={(e) => handleCriteriaChange(criteria.id, e.target.checked)}
                        className="w-5 h-5"
                      />
                      <span>{criteria.name}</span>
                    </label>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="px-6 py-3 bg-gray-500 text-white rounded-xl">
                  ← Back
                </button>
                <button onClick={() => setStep(3)} className="px-6 py-3 bg-blue-600 text-white rounded-xl">
                  Next: DNSH →
                </button>
              </div>
            </div>
          )}

          {step === 3 && currentActivity && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold">Do No Significant Harm (DNSH) Assessment</h3>
              <div className="space-y-4">
                {EUTaxonomyEngine.objectives
                  .filter(obj => obj.id !== currentActivity.objective)
                  .map(obj => (
                    <div key={obj.id} className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} border`}>
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={dnshData[obj.id] || false}
                          onChange={(e) => handleDnshChange(obj.id, e.target.checked)}
                          className="w-5 h-5"
                        />
                        <span>{obj.icon} {obj.name}</span>
                      </label>
                    </div>
                  ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="px-6 py-3 bg-gray-500 text-white rounded-xl">
                  ← Back
                </button>
                <button onClick={() => setStep(4)} className="px-6 py-3 bg-blue-600 text-white rounded-xl">
                  Next: Safeguards →
                </button>
              </div>
            </div>
          )}

          {step === 4 && currentActivity && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold">Minimum Safeguards</h3>
              <div className="space-y-4">
                {EUTaxonomyEngine.minimumSafeguards.map(safeguard => (
                  <div key={safeguard.id} className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} border`}>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={safeguardsData[safeguard.id] || false}
                        onChange={(e) => handleSafeguardChange(safeguard.id, e.target.checked)}
                        className="w-5 h-5"
                      />
                      <span>{safeguard.name}</span>
                    </label>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(3)} className="px-6 py-3 bg-gray-500 text-white rounded-xl">
                  ← Back
                </button>
                <button onClick={assessCurrentActivity} className="px-6 py-3 bg-green-600 text-white rounded-xl">
                  Complete Assessment ✓
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Results */}
          {step === 5 && alignment && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <div className="text-sm mb-2">Revenue Alignment</div>
                  <div className="text-4xl font-bold">{alignment.revenue.percentage}%</div>
                  <div className="text-sm mt-2">€{alignment.revenue.aligned.toLocaleString()} / €{alignment.revenue.total.toLocaleString()}</div>
                </div>
                <div className="p-6 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white">
                  <div className="text-sm mb-2">CapEx Alignment</div>
                  <div className="text-4xl font-bold">{alignment.capex.percentage}%</div>
                  <div className="text-sm mt-2">€{alignment.capex.aligned.toLocaleString()} / €{alignment.capex.total.toLocaleString()}</div>
                </div>
                <div className="p-6 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 text-white">
                  <div className="text-sm mb-2">OpEx Alignment</div>
                  <div className="text-4xl font-bold">{alignment.opex.percentage}%</div>
                  <div className="text-sm mt-2">€{alignment.opex.aligned.toLocaleString()} / €{alignment.opex.total.toLocaleString()}</div>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg">
                  📥 Download Report (PDF)
                </button>
                <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg">
                  📊 Export Data (Excel)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EUTaxonomyNavigator;
