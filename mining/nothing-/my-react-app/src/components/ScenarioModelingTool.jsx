import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/themeUtils';
import { ScenarioEngine } from '../utils/scenarioEngine';
import { getStoredData } from '../utils/storage';

const ScenarioModelingTool = ({ onClose }) => {
  const { isDark } = useTheme();
  const theme = getThemeClasses(isDark);
  const [scenarios, setScenarios] = useState([]);
  const [baselineData, setBaselineData] = useState({});
  const [selectedPreset, setSelectedPreset] = useState('');
  const [customAdjustments, setCustomAdjustments] = useState({});
  const [scenarioName, setScenarioName] = useState('');
  const [compareMode, setCompareMode] = useState(false);

  useEffect(() => {
    loadBaselineData();
  }, []);

  const loadBaselineData = async () => {
    try {
      const data = await getStoredData();
      const baseline = {};
      
      data.forEach(entry => {
        const metric = entry.metric || 'unknown';
        if (!baseline[metric]) {
          baseline[metric] = parseFloat(entry.value) || 0;
        }
      });
      
      setBaselineData(baseline);
    } catch (error) {
      console.error('Baseline load error:', error);
    }
  };

  const presets = ScenarioEngine.getPresetScenarios();

  const handlePresetSelect = (presetId) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      setSelectedPreset(presetId);
      setCustomAdjustments(preset.adjustments);
      setScenarioName(preset.name);
    }
  };

  const handleCreateScenario = () => {
    if (!scenarioName.trim()) {
      alert('Please enter a scenario name');
      return;
    }

    const scenario = ScenarioEngine.createScenario(
      scenarioName,
      baselineData,
      customAdjustments
    );

    setScenarios([...scenarios, scenario]);
    setScenarioName('');
    setCustomAdjustments({});
    setSelectedPreset('');
  };

  const handleAdjustmentChange = (metric, field, value) => {
    setCustomAdjustments(prev => ({
      ...prev,
      [metric]: {
        ...prev[metric],
        [field]: field === 'type' ? value : parseFloat(value)
      }
    }));
  };

  const prepareComparisonData = () => {
    if (scenarios.length === 0) return [];

    const metrics = Object.keys(baselineData);
    return metrics.map(metric => {
      const data = { metric };
      data.baseline = baselineData[metric];
      scenarios.forEach(s => {
        data[s.name] = s.results[metric] || 0;
      });
      return data;
    });
  };

  const handleExport = (scenario) => {
    const csv = ScenarioEngine.exportScenario(scenario, 'csv');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scenario-${scenario.name.replace(/\s+/g, '-')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`max-w-7xl w-full max-h-[90vh] overflow-y-auto ${theme.bg.card} rounded-xl shadow-2xl`}>
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h2 className={`text-2xl font-bold ${theme.text.primary}`}>🎯 Scenario Modeling</h2>
              <p className={theme.text.secondary}>Create and compare what-if scenarios</p>
            </div>
            <button onClick={onClose} className="text-2xl hover:text-red-500">✕</button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Scenario Builder */}
            <div className={`p-4 rounded-lg ${theme.bg.subtle}`}>
              <h3 className={`text-lg font-semibold mb-4 ${theme.text.primary}`}>Create Scenario</h3>

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme.text.secondary}`}>
                    Scenario Name
                  </label>
                  <input
                    type="text"
                    value={scenarioName}
                    onChange={(e) => setScenarioName(e.target.value)}
                    placeholder="Enter scenario name"
                    className={`w-full px-3 py-2 border rounded-lg ${theme.bg.input} ${theme.border.input}`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme.text.secondary}`}>
                    Preset Scenarios
                  </label>
                  <select
                    value={selectedPreset}
                    onChange={(e) => handlePresetSelect(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg ${theme.bg.input} ${theme.border.input}`}
                  >
                    <option value="">Custom Scenario</option>
                    {presets.map(preset => (
                      <option key={preset.id} value={preset.id}>{preset.name}</option>
                    ))}
                  </select>
                  {selectedPreset && (
                    <p className={`text-xs mt-1 ${theme.text.secondary}`}>
                      {presets.find(p => p.id === selectedPreset)?.description}
                    </p>
                  )}
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme.text.secondary}`}>
                    Adjustments
                  </label>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {Object.keys(baselineData).slice(0, 8).map(metric => (
                      <div key={metric} className="flex gap-2 items-center">
                        <span className={`text-xs ${theme.text.secondary} w-32 truncate`}>
                          {metric}
                        </span>
                        <select
                          value={customAdjustments[metric]?.type || 'percentage'}
                          onChange={(e) => handleAdjustmentChange(metric, 'type', e.target.value)}
                          className="px-2 py-1 border rounded text-xs"
                        >
                          <option value="percentage">%</option>
                          <option value="absolute">±</option>
                          <option value="target">Target</option>
                        </select>
                        <input
                          type="number"
                          value={customAdjustments[metric]?.value || 0}
                          onChange={(e) => handleAdjustmentChange(metric, 'value', e.target.value)}
                          className="px-2 py-1 border rounded text-xs w-20"
                          step="0.1"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleCreateScenario}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Scenario
                </button>
              </div>
            </div>

            {/* Scenarios List */}
            <div className={`p-4 rounded-lg ${theme.bg.subtle}`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-lg font-semibold ${theme.text.primary}`}>
                  Scenarios ({scenarios.length})
                </h3>
                <button
                  onClick={() => setCompareMode(!compareMode)}
                  className={`px-3 py-1 rounded text-sm ${
                    compareMode ? 'bg-blue-600 text-white' : 'bg-gray-200'
                  }`}
                >
                  Compare Mode
                </button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {scenarios.map((scenario, idx) => (
                  <div key={idx} className={`p-3 rounded-lg border ${theme.border.primary}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className={`font-semibold ${theme.text.primary}`}>{scenario.name}</h4>
                      <button
                        onClick={() => handleExport(scenario)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Export
                      </button>
                    </div>
                    <div className={`text-xs ${theme.text.secondary}`}>
                      Created: {new Date(scenario.createdAt).toLocaleString()}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => setScenarios(scenarios.filter((_, i) => i !== idx))}
                        className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {scenarios.length === 0 && (
                  <p className={`text-center py-8 ${theme.text.secondary}`}>
                    No scenarios created yet
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Comparison Chart */}
          {compareMode && scenarios.length > 0 && (
            <div className={`mt-6 p-4 rounded-lg ${theme.bg.subtle}`}>
              <h3 className={`text-lg font-semibold mb-4 ${theme.text.primary}`}>
                Scenario Comparison
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={prepareComparisonData().slice(0, 6)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="metric" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="baseline" fill="#94a3b8" name="Baseline" />
                  {scenarios.map((s, idx) => (
                    <Bar
                      key={idx}
                      dataKey={s.name}
                      fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][idx % 4]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScenarioModelingTool;
