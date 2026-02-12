import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import enhancedScenarioModelling from '../services/enhancedScenarioModelling';

const EnhancedScenarioModelling = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('create');
  const [scenarios, setScenarios] = useState([]);
  const [baseline, setBaseline] = useState(null);
  const [selectedScenarios, setSelectedScenarios] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [whatIfResult, setWhatIfResult] = useState(null);
  const [sensitivityResult, setSensitivityResult] = useState(null);

  useEffect(() => {
    loadScenarios();
  }, []);

  const loadScenarios = () => {
    const all = enhancedScenarioModelling.getAllScenarios();
    setBaseline(all.find(s => s.type === 'baseline'));
    setScenarios(all.filter(s => s.type === 'scenario'));
  };

  const handleSetBaseline = () => {
    const baselineData = {
      carbonEmissions: 50000,
      energyConsumption: 100000,
      waterUsage: 75000,
      wasteRecycling: 45,
      renewableEnergy: 20,
      employeeSafety: 85,
      diversityRatio: 35
    };
    enhancedScenarioModelling.setBaseline(baselineData);
    loadScenarios();
  };

  const handleApplyTemplate = (templateName) => {
    enhancedScenarioModelling.applyTemplate(templateName);
    loadScenarios();
  };

  const handleWhatIf = () => {
    const changes = {
      carbonEmissions: { type: 'percentage', value: -30 },
      renewableEnergy: { type: 'percentage', value: 50 }
    };
    const result = enhancedScenarioModelling.whatIfAnalysis(changes);
    setWhatIfResult(result);
  };

  const handleCompare = () => {
    if (selectedScenarios.length < 2) {
      alert('Select at least 2 scenarios to compare');
      return;
    }
    const result = enhancedScenarioModelling.compareScenarios(selectedScenarios);
    setComparison(result);
  };

  const handleSensitivity = () => {
    const result = enhancedScenarioModelling.sensitivityAnalysis('carbonEmissions', {
      min: 25000,
      max: 75000,
      steps: 10
    });
    setSensitivityResult(result);
  };

  const templates = enhancedScenarioModelling.getScenarioTemplates();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-screen overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh' }}
      >
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold mb-2">🎯 Enhanced Scenario Modelling</h2>
              <p className="text-purple-100">What-if analysis, comparison & sensitivity testing</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-all"
            >
              ✕
            </button>
          </div>

          <div className="flex gap-2 mt-6">
            {['create', 'whatif', 'compare', 'sensitivity'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  activeTab === tab
                    ? 'bg-white text-purple-600'
                    : 'bg-purple-500 bg-opacity-30 text-white hover:bg-opacity-50'
                }`}
              >
                {tab === 'create' && '📝 Create Scenarios'}
                {tab === 'whatif' && '🔮 What-If Analysis'}
                {tab === 'compare' && '⚖️ Compare Scenarios'}
                {tab === 'sensitivity' && '📊 Sensitivity Analysis'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'create' && (
            <div className="space-y-6">
              {!baseline && (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
                  <h3 className="text-xl font-bold mb-2">⚠️ Set Baseline First</h3>
                  <p className="text-gray-700 mb-4">Create a baseline scenario to compare against</p>
                  <button
                    onClick={handleSetBaseline}
                    className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold"
                  >
                    Set Baseline Data
                  </button>
                </div>
              )}

              {baseline && (
                <>
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                    <h3 className="text-xl font-bold mb-2">✅ Baseline Set</h3>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      {Object.entries(baseline.metrics).slice(0, 6).map(([key, value]) => (
                        <div key={key} className="bg-white p-3 rounded-lg">
                          <div className="text-sm text-gray-600">{key}</div>
                          <div className="text-lg font-bold">{typeof value === 'number' ? value.toFixed(0) : value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold mb-4">📚 Scenario Templates</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(templates).map(([key, template]) => (
                        <div key={key} className="border-2 border-gray-200 rounded-xl p-6 hover:border-purple-500 transition-all">
                          <h4 className="text-lg font-bold mb-2">{template.name}</h4>
                          <p className="text-gray-600 text-sm mb-3">{template.description}</p>
                          <div className="text-xs text-gray-500 mb-3">
                            Timeframe: {template.timeframe}
                          </div>
                          <button
                            onClick={() => handleApplyTemplate(key)}
                            className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
                          >
                            Apply Template
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {scenarios.length > 0 && (
                    <div>
                      <h3 className="text-2xl font-bold mb-4">📋 Your Scenarios ({scenarios.length})</h3>
                      <div className="space-y-3">
                        {scenarios.map(scenario => (
                          <div key={scenario.id} className="bg-white border-2 border-gray-200 rounded-xl p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-lg">{scenario.name}</h4>
                                <p className="text-sm text-gray-600">{scenario.description}</p>
                              </div>
                              <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                                {scenario.timeframe}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'whatif' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                <h3 className="text-2xl font-bold mb-4">🔮 What-If Analysis</h3>
                <p className="text-gray-700 mb-4">Test the impact of specific changes on your ESG metrics</p>
                <button
                  onClick={handleWhatIf}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                  disabled={!baseline}
                >
                  Run What-If Analysis
                </button>
              </div>

              {whatIfResult && (
                <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                  <h4 className="text-xl font-bold mb-4">📊 Results</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(whatIfResult.impact).map(([metric, impact]) => (
                      <div key={metric} className="bg-gray-50 p-4 rounded-lg">
                        <div className="font-semibold mb-2">{metric}</div>
                        <div className="flex items-center gap-2">
                          <span className={`text-2xl ${impact.direction === 'increase' ? 'text-red-500' : 'text-green-500'}`}>
                            {impact.direction === 'increase' ? '↑' : '↓'}
                          </span>
                          <span className="text-xl font-bold">{Math.abs(impact.percentage).toFixed(1)}%</span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {impact.absolute > 0 ? '+' : ''}{impact.absolute.toFixed(0)} units
                        </div>
                      </div>
                    ))}
                  </div>

                  {whatIfResult.recommendations.length > 0 && (
                    <div className="mt-6">
                      <h5 className="font-bold mb-3">💡 Recommendations</h5>
                      <div className="space-y-2">
                        {whatIfResult.recommendations.map((rec, idx) => (
                          <div key={idx} className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded">
                            <div className="font-semibold">{rec.message}</div>
                            <div className="text-sm text-gray-600">{rec.action}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'compare' && (
            <div className="space-y-6">
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                <h3 className="text-2xl font-bold mb-4">⚖️ Compare Scenarios</h3>
                <p className="text-gray-700 mb-4">Select scenarios to compare side-by-side</p>
                
                <div className="space-y-2 mb-4">
                  {baseline && (
                    <label className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={selectedScenarios.includes('baseline')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedScenarios([...selectedScenarios, 'baseline']);
                          } else {
                            setSelectedScenarios(selectedScenarios.filter(id => id !== 'baseline'));
                          }
                        }}
                        className="w-5 h-5"
                      />
                      <span className="font-semibold">Baseline (Current State)</span>
                    </label>
                  )}
                  {scenarios.map(scenario => (
                    <label key={scenario.id} className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={selectedScenarios.includes(scenario.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedScenarios([...selectedScenarios, scenario.id]);
                          } else {
                            setSelectedScenarios(selectedScenarios.filter(id => id !== scenario.id));
                          }
                        }}
                        className="w-5 h-5"
                      />
                      <span className="font-semibold">{scenario.name}</span>
                    </label>
                  ))}
                </div>

                <button
                  onClick={handleCompare}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold"
                  disabled={selectedScenarios.length < 2}
                >
                  Compare Selected ({selectedScenarios.length})
                </button>
              </div>

              {comparison && (
                <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                  <h4 className="text-xl font-bold mb-4">📊 Comparison Results</h4>
                  
                  <div className="bg-blue-50 p-4 rounded-lg mb-6">
                    <h5 className="font-bold mb-2">🏆 Best Overall</h5>
                    <div className="text-lg">{comparison.summary.bestOverall.name}</div>
                    <div className="text-sm text-gray-600">
                      Wins in {comparison.summary.bestOverall.winsCount} out of {comparison.summary.totalMetrics} metrics
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2">
                          <th className="text-left p-3">Metric</th>
                          {comparison.scenarios.map(s => (
                            <th key={s.id} className="text-center p-3">{s.name}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(comparison.metrics).slice(0, 8).map(([metric, data]) => (
                          <tr key={metric} className="border-b">
                            <td className="p-3 font-medium">{metric}</td>
                            {data.values.map(v => (
                              <td key={v.scenarioId} className="text-center p-3">
                                <span className={v.scenarioId === data.best.scenarioId ? 'font-bold text-green-600' : ''}>
                                  {v.value.toFixed(0)}
                                </span>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'sensitivity' && (
            <div className="space-y-6">
              <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
                <h3 className="text-2xl font-bold mb-4">📊 Sensitivity Analysis</h3>
                <p className="text-gray-700 mb-4">Test how sensitive your outcomes are to variable changes</p>
                <button
                  onClick={handleSensitivity}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold"
                  disabled={!baseline}
                >
                  Run Sensitivity Analysis
                </button>
              </div>

              {sensitivityResult && (
                <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                  <h4 className="text-xl font-bold mb-4">📈 Sensitivity Results</h4>
                  
                  <div className="bg-purple-50 p-4 rounded-lg mb-6">
                    <h5 className="font-bold mb-2">Variable: {sensitivityResult.variable}</h5>
                    <div className="text-sm text-gray-700">
                      Base Value: {sensitivityResult.baseValue.toFixed(0)}
                    </div>
                    <div className="text-sm text-gray-700">
                      Range: {sensitivityResult.range.min.toFixed(0)} - {sensitivityResult.range.max.toFixed(0)}
                    </div>
                    <div className="mt-2 font-semibold text-purple-700">
                      {sensitivityResult.insights.recommendation}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {sensitivityResult.results.slice(0, 6).map((result, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className="w-32">
                          <div className="text-xs text-gray-600">Value</div>
                          <div className="font-bold">{result.value.toFixed(0)}</div>
                        </div>
                        <div className="w-32">
                          <div className="text-xs text-gray-600">Change</div>
                          <div className="font-bold">{result.changePercent > 0 ? '+' : ''}{result.changePercent.toFixed(1)}%</div>
                        </div>
                        <div className="flex-1">
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-purple-600"
                              style={{ width: `${Math.abs(result.changePercent)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default EnhancedScenarioModelling;
