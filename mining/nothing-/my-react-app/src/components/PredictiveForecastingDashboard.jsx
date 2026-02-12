import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ComposedChart, Bar } from 'recharts';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/themeUtils';
import { ForecastingEngine } from '../utils/forecastingEngine';
import { getStoredData } from '../utils/storage';

const PredictiveForecastingDashboard = ({ onClose }) => {
  const { isDark } = useTheme();
  const theme = getThemeClasses(isDark);
  const [forecasts, setForecasts] = useState({});
  const [selectedMetric, setSelectedMetric] = useState('scope1Emissions');
  const [periods, setPeriods] = useState(12);
  const [method, setMethod] = useState('holt-winters');
  const [loading, setLoading] = useState(true);
  const [historicalData, setHistoricalData] = useState([]);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonMethods, setComparisonMethods] = useState([]);

  useEffect(() => {
    loadForecasts();
  }, [periods, method]);

  useEffect(() => {
    if (showComparison) {
      loadMethodComparison();
    }
  }, [showComparison, selectedMetric]);

  const loadForecasts = async () => {
    setLoading(true);
    try {
      const data = await getStoredData();
      const grouped = groupDataByMetric(data);
      const forecastResults = {};

      Object.entries(grouped).forEach(([metric, values]) => {
        if (values.length >= 3) {
          forecastResults[metric] = ForecastingEngine.forecast(values, periods, method);
        }
      });

      setForecasts(forecastResults);
      if (grouped[selectedMetric]) {
        setHistoricalData(grouped[selectedMetric]);
      }
    } catch (error) {
      console.error('Forecast error:', error);
    }
    setLoading(false);
  };

  const loadMethodComparison = async () => {
    const methods = ['holt-winters', 'arima', 'prophet', 'exponential'];
    const comparisons = [];
    
    methods.forEach(m => {
      if (historicalData.length >= 3) {
        const result = ForecastingEngine.forecast(historicalData, 6, m);
        comparisons.push({
          method: m,
          accuracy: result.accuracy,
          mape: result.mape,
          rmse: result.rmse
        });
      }
    });
    
    setComparisonMethods(comparisons);
  };

  const groupDataByMetric = (data) => {
    const grouped = {};
    data.forEach(entry => {
      const metric = entry.metric || 'unknown';
      if (!grouped[metric]) grouped[metric] = [];
      grouped[metric].push({ value: entry.value, date: entry.createdAt || new Date() });
    });
    return grouped;
  };

  const prepareChartData = () => {
    const forecast = forecasts[selectedMetric];
    if (!forecast) return [];

    const historical = historicalData.slice(-6).map((d, idx) => ({
      period: `H-${6-idx}`,
      actual: parseFloat(d.value),
      isHistorical: true
    }));

    const future = forecast.forecasts.map((f, idx) => ({
      period: `F+${f.period}`,
      forecast: parseFloat(f.value.toFixed(2)),
      lower: parseFloat(f.lower.toFixed(2)),
      upper: parseFloat(f.upper.toFixed(2)),
      confidence: f.confidence,
      isHistorical: false
    }));

    return [...historical, ...future];
  };

  const exportForecast = () => {
    const forecast = forecasts[selectedMetric];
    if (!forecast) return;

    const csv = [
      ['Period', 'Forecast', 'Lower Bound', 'Upper Bound', 'Confidence'],
      ...forecast.forecasts.map(f => [
        f.period,
        f.value.toFixed(2),
        f.lower.toFixed(2),
        f.upper.toFixed(2),
        (f.confidence * 100).toFixed(1) + '%'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `forecast-${selectedMetric}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const currentForecast = forecasts[selectedMetric];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className={`max-w-7xl w-full max-h-[90vh] overflow-y-auto ${theme.bg.card} rounded-3xl shadow-2xl border ${isDark ? 'border-blue-500/30' : 'border-blue-200'} animate-slideUp`}>
        <div className={`p-6 border-b ${isDark ? 'border-blue-500/30' : 'border-blue-200'} bg-gradient-to-br ${isDark ? 'from-blue-900 via-purple-900 to-indigo-900' : 'from-blue-50 via-purple-50 to-indigo-50'} relative overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
          <div className="flex justify-between items-center relative z-10">
            <div className="animate-fadeIn">
              <h2 className={`text-3xl font-bold ${theme.text.primary} flex items-center gap-3`}>
                <span className="text-4xl animate-bounce-slow">📈</span>
                Predictive Forecasting
                <span className="text-xs px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full font-semibold shadow-lg animate-pulse-slow">INDUSTRY STANDARD</span>
              </h2>
              <p className={`${theme.text.secondary} mt-2 text-sm`}>Advanced time-series forecasting with ARIMA, Holt-Winters & Prophet algorithms</p>
            </div>
            <button onClick={onClose} className={`text-3xl hover:text-red-500 hover:rotate-90 transition-all duration-300 w-12 h-12 flex items-center justify-center rounded-full ${isDark ? 'hover:bg-red-900/30' : 'hover:bg-red-50'}`}>✕</button>
          </div>
        </div>

        <div className="p-6">
          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 animate-fadeIn">
            <div className="transform hover:scale-105 transition-transform duration-200">
              <label className={`block text-sm font-semibold mb-2 ${theme.text.secondary} flex items-center gap-2`}>
                <span>📊</span> Metric
              </label>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className={`w-full px-4 py-2.5 border-2 rounded-xl ${theme.bg.input} ${theme.border.input} font-medium shadow-sm hover:shadow-md transition-all focus:ring-2 focus:ring-blue-500`}
              >
                {Object.keys(forecasts).map(metric => (
                  <option key={metric} value={metric}>{metric}</option>
                ))}
              </select>
            </div>

            <div className="transform hover:scale-105 transition-transform duration-200">
              <label className={`block text-sm font-semibold mb-2 ${theme.text.secondary} flex items-center gap-2`}>
                <span>📅</span> Forecast Periods
              </label>
              <select
                value={periods}
                onChange={(e) => setPeriods(parseInt(e.target.value))}
                className={`w-full px-4 py-2.5 border-2 rounded-xl ${theme.bg.input} ${theme.border.input} font-medium shadow-sm hover:shadow-md transition-all focus:ring-2 focus:ring-blue-500`}
              >
                <option value={6}>6 months</option>
                <option value={12}>12 months</option>
                <option value={24}>24 months</option>
                <option value={36}>36 months</option>
              </select>
            </div>

            <div className="transform hover:scale-105 transition-transform duration-200">
              <label className={`block text-sm font-semibold mb-2 ${theme.text.secondary} flex items-center gap-2`}>
                <span>🤖</span> Algorithm
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className={`w-full px-4 py-2.5 border-2 rounded-xl ${theme.bg.input} border-blue-400 font-semibold shadow-md hover:shadow-lg transition-all focus:ring-2 focus:ring-blue-500`}
              >
                <option value="holt-winters">🏆 Holt-Winters (Best)</option>
                <option value="arima">📊 ARIMA</option>
                <option value="prophet">🔮 Prophet-Style</option>
                <option value="exponential">⚡ Exponential</option>
              </select>
            </div>
            
            <div className="flex items-end transform hover:scale-105 transition-transform duration-200">
              <button
                onClick={() => setShowComparison(!showComparison)}
                className={`w-full px-4 py-2.5 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg ${showComparison ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' : `${isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}`}
              >
                {showComparison ? '✓ Comparing' : '🔄 Compare Methods'}
              </button>
            </div>
          </div>

          {/* Method Comparison */}
          {showComparison && comparisonMethods.length > 0 && (
            <div className={`mb-6 p-5 rounded-2xl ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-blue-50 to-purple-50'} border-2 ${isDark ? 'border-blue-500/30' : 'border-blue-200'} shadow-xl animate-slideDown`}>
              <h3 className={`text-lg font-bold ${theme.text.primary} mb-4 flex items-center gap-2`}>
                <span className="text-2xl">🏁</span> Algorithm Performance Comparison
              </h3>
              <div className="grid grid-cols-4 gap-4">
                {comparisonMethods.map((m, idx) => (
                  <div key={idx} className={`p-4 rounded-xl transform hover:scale-105 transition-all duration-300 ${method === m.method ? `bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg border-2 border-blue-400` : `${isDark ? 'bg-gray-700' : 'bg-white'} shadow-md hover:shadow-lg`}`}>
                    <div className="font-bold capitalize mb-3 text-lg flex items-center gap-2">
                      {m.method === 'holt-winters' && '🏆'}
                      {m.method === 'arima' && '📊'}
                      {m.method === 'prophet' && '🔮'}
                      {m.method === 'exponential' && '⚡'}
                      {m.method.split('-').join(' ')}
                    </div>
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span>Accuracy:</span>
                        <span className="font-bold">{(m.accuracy * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>MAPE:</span>
                        <span className="font-bold">{(m.mape * 100).toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>RMSE:</span>
                        <span className="font-bold">{m.rmse?.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : currentForecast ? (
            <>
              {/* Forecast Stats */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 animate-fadeIn">
                <div className={`p-5 rounded-xl ${isDark ? 'bg-gradient-to-br from-purple-900/50 to-purple-800/50' : 'bg-gradient-to-br from-purple-50 to-purple-100'} shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border ${isDark ? 'border-purple-500/30' : 'border-purple-200'}`}>
                  <div className={`text-xs font-semibold ${theme.text.secondary} mb-1 flex items-center gap-1`}>
                    <span>🤖</span> Method
                  </div>
                  <div className={`text-xl font-bold ${theme.text.primary} capitalize`}>{currentForecast.method}</div>
                </div>
                <div className={`p-5 rounded-xl ${isDark ? 'bg-gradient-to-br from-green-900/50 to-green-800/50' : 'bg-gradient-to-br from-green-50 to-green-100'} shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border ${isDark ? 'border-green-500/30' : 'border-green-200'}`}>
                  <div className={`text-xs font-semibold ${theme.text.secondary} mb-1 flex items-center gap-1`}>
                    <span>✅</span> Accuracy
                  </div>
                  <div className="text-xl font-bold text-green-600">
                    {(currentForecast.accuracy * 100).toFixed(1)}%
                  </div>
                </div>
                <div className={`p-5 rounded-xl ${isDark ? 'bg-gradient-to-br from-blue-900/50 to-blue-800/50' : 'bg-gradient-to-br from-blue-50 to-blue-100'} shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border ${isDark ? 'border-blue-500/30' : 'border-blue-200'}`}>
                  <div className={`text-xs font-semibold ${theme.text.secondary} mb-1 flex items-center gap-1`}>
                    <span>📊</span> MAPE
                  </div>
                  <div className="text-xl font-bold text-blue-600">
                    {(currentForecast.mape * 100).toFixed(2)}%
                  </div>
                </div>
                <div className={`p-5 rounded-xl ${isDark ? 'bg-gradient-to-br from-orange-900/50 to-orange-800/50' : 'bg-gradient-to-br from-orange-50 to-orange-100'} shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border ${isDark ? 'border-orange-500/30' : 'border-orange-200'}`}>
                  <div className={`text-xs font-semibold ${theme.text.secondary} mb-1 flex items-center gap-1`}>
                    <span>📈</span> RMSE
                  </div>
                  <div className="text-xl font-bold text-orange-600">
                    {currentForecast.rmse?.toFixed(2) || 'N/A'}
                  </div>
                </div>
                <div className={`p-5 rounded-xl ${isDark ? 'bg-gradient-to-br from-indigo-900/50 to-indigo-800/50' : 'bg-gradient-to-br from-indigo-50 to-indigo-100'} shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border ${isDark ? 'border-indigo-500/30' : 'border-indigo-200'}`}>
                  <div className={`text-xs font-semibold ${theme.text.secondary} mb-1 flex items-center gap-1`}>
                    <span>📉</span> Trend
                  </div>
                  <div className={`text-xl font-bold capitalize flex items-center gap-1 ${
                    currentForecast.trend === 'increasing' ? 'text-green-600' :
                    currentForecast.trend === 'decreasing' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {currentForecast.trend === 'increasing' && '↗️'}
                    {currentForecast.trend === 'decreasing' && '↘️'}
                    {currentForecast.trend === 'stable' && '→'}
                    {currentForecast.trend}
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className={`p-6 rounded-2xl ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-white to-gray-50'} mb-6 border-2 ${isDark ? 'border-blue-500/30' : 'border-blue-200'} shadow-2xl animate-fadeIn`}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className={`text-xl font-bold ${theme.text.primary} flex items-center gap-2`}>
                    <span className="text-2xl">📊</span> Forecast Visualization
                  </h3>
                  <button
                    onClick={exportForecast}
                    className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  >
                    <span>📥</span> Export CSV
                  </button>
                </div>
                <ResponsiveContainer width="100%" height={450}>
                  <ComposedChart data={prepareChartData()}>
                    <defs>
                      <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                    <XAxis dataKey="period" stroke={isDark ? '#9ca3af' : '#6b7280'} />
                    <YAxis stroke={isDark ? '#9ca3af' : '#6b7280'} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#1f2937' : '#ffffff',
                        border: '2px solid #3b82f6',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="actual" fill="#10b981" stroke="#059669" name="Historical" />
                    <Area type="monotone" dataKey="upper" fill="#dbeafe" stroke="#93c5fd" name="Upper (95%)" />
                    <Area type="monotone" dataKey="forecast" fill="url(#colorForecast)" stroke="#3b82f6" strokeWidth={3} name="Forecast" />
                    <Area type="monotone" dataKey="lower" fill="#dbeafe" stroke="#93c5fd" name="Lower (95%)" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Forecast Table */}
              <div className={`rounded-2xl overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'} border-2 ${isDark ? 'border-blue-500/30' : 'border-blue-200'} shadow-xl animate-fadeIn`}>
                <h3 className={`text-xl font-bold p-5 ${theme.text.primary} bg-gradient-to-r ${isDark ? 'from-blue-900 to-purple-900' : 'from-blue-50 to-purple-50'} flex items-center gap-2`}>
                  <span className="text-2xl">📋</span> Detailed Forecast Data
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className={`${isDark ? 'bg-gradient-to-r from-gray-700 to-gray-800' : 'bg-gradient-to-r from-gray-100 to-gray-200'} border-b-2 ${isDark ? 'border-blue-500/30' : 'border-blue-200'}`}>
                      <tr>
                        <th className={`px-6 py-4 text-left font-bold ${theme.text.primary}`}>Period</th>
                        <th className={`px-6 py-4 text-right font-bold ${theme.text.primary}`}>Forecast</th>
                        <th className={`px-6 py-4 text-right font-bold ${theme.text.primary}`}>Lower (95%)</th>
                        <th className={`px-6 py-4 text-right font-bold ${theme.text.primary}`}>Upper (95%)</th>
                        <th className={`px-6 py-4 text-right font-bold ${theme.text.primary}`}>Range</th>
                        <th className={`px-6 py-4 text-right font-bold ${theme.text.primary}`}>Confidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentForecast.forecasts.map((f, idx) => (
                        <tr key={idx} className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} ${isDark ? 'hover:bg-blue-900/20' : 'hover:bg-blue-50'} transition-all duration-200 hover:shadow-md`}>
                          <td className={`px-6 py-4 font-bold ${theme.text.primary}`}>Period {f.period}</td>
                          <td className="px-6 py-4 text-right font-bold text-blue-600 text-lg">{f.value.toFixed(2)}</td>
                          <td className="px-6 py-4 text-right font-semibold text-orange-600">{f.lower.toFixed(2)}</td>
                          <td className="px-6 py-4 text-right font-semibold text-green-600">{f.upper.toFixed(2)}</td>
                          <td className={`px-6 py-4 text-right font-semibold ${theme.text.primary}`}>{(f.upper - f.lower).toFixed(2)}</td>
                          <td className="px-6 py-4 text-right">
                            <span className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full text-xs font-bold shadow-md">
                              {(f.confidence * 100).toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className={theme.text.secondary}>No forecast data available for selected metric</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PredictiveForecastingDashboard;
