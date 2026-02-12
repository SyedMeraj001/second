import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/themeUtils';
import { AIInsightsEngine } from '../utils/aiInsightsEngine';
import { getStoredData } from '../utils/storage';

const AIInsightsPanel = ({ onClose }) => {
  const { isDark } = useTheme();
  const theme = getThemeClasses(isDark);
  const [insights, setInsights] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    setLoading(true);
    try {
      const data = await getStoredData();
      const generated = AIInsightsEngine.generateInsights(data);
      setInsights(generated);
    } catch (error) {
      console.error('Insights error:', error);
    }
    setLoading(false);
  };

  const filteredInsights = filter === 'all' 
    ? insights 
    : insights.filter(i => i.type === filter || i.category === filter);

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-300',
      high: 'bg-orange-100 text-orange-800 border-orange-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-blue-100 text-blue-800 border-blue-300',
      info: 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return colors[severity] || colors.info;
  };

  const getTypeIcon = (type) => {
    const icons = {
      anomaly: '⚠️',
      recommendation: '💡',
      trend: '📊',
      risk: '🚨'
    };
    return icons[type] || '📌';
  };

  const stats = {
    total: insights.length,
    critical: insights.filter(i => i.severity === 'critical').length,
    high: insights.filter(i => i.severity === 'high').length,
    anomalies: insights.filter(i => i.type === 'anomaly').length,
    recommendations: insights.filter(i => i.type === 'recommendation').length
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className={`max-w-6xl w-full max-h-[90vh] overflow-y-auto ${theme.bg.card} rounded-3xl shadow-2xl border ${isDark ? 'border-purple-500/30' : 'border-purple-200'} animate-slideUp`}>
        <div className={`p-6 border-b ${isDark ? 'border-purple-500/30' : 'border-purple-200'} bg-gradient-to-br ${isDark ? 'from-purple-900 via-indigo-900 to-blue-900' : 'from-purple-50 via-indigo-50 to-blue-50'} relative overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
          <div className="flex justify-between items-center relative z-10">
            <div className="animate-fadeIn">
              <h2 className={`text-3xl font-bold ${theme.text.primary} flex items-center gap-3`}>
                <span className="text-4xl animate-bounce-slow">🤖</span>
                AI-Powered Insights
                <span className="text-xs px-3 py-1 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-full font-semibold shadow-lg animate-pulse-slow">REAL-TIME</span>
              </h2>
              <p className={`${theme.text.secondary} mt-2 text-sm`}>Automated anomaly detection, trend analysis & intelligent recommendations</p>
            </div>
            <button onClick={onClose} className={`text-3xl hover:text-red-500 hover:rotate-90 transition-all duration-300 w-12 h-12 flex items-center justify-center rounded-full ${isDark ? 'hover:bg-red-900/30' : 'hover:bg-red-50'}`}>✕</button>
          </div>
        </div>

        <div className="p-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 animate-fadeIn">
            <div className={`p-5 rounded-xl ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'} text-center shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className={`text-3xl font-bold ${theme.text.primary} mb-1`}>{stats.total}</div>
              <div className={`text-xs font-semibold ${theme.text.secondary} uppercase tracking-wide`}>Total Insights</div>
            </div>
            <div className="p-5 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-center shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
              <div className="text-3xl font-bold text-white mb-1">{stats.critical}</div>
              <div className="text-xs font-semibold text-red-100 uppercase tracking-wide">Critical</div>
            </div>
            <div className="p-5 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-center shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
              <div className="text-3xl font-bold text-white mb-1">{stats.high}</div>
              <div className="text-xs font-semibold text-orange-100 uppercase tracking-wide">High Priority</div>
            </div>
            <div className="p-5 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 text-center shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
              <div className="text-3xl font-bold text-white mb-1">{stats.anomalies}</div>
              <div className="text-xs font-semibold text-yellow-100 uppercase tracking-wide">Anomalies</div>
            </div>
            <div className="p-5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-center shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
              <div className="text-3xl font-bold text-white mb-1">{stats.recommendations}</div>
              <div className="text-xs font-semibold text-blue-100 uppercase tracking-wide">Recommendations</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-6 animate-fadeIn">
            {['all', 'anomaly', 'recommendation', 'trend', 'risk', 'environmental', 'social', 'governance'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2.5 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg transform hover:scale-105 duration-200 ${
                  filter === f
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                    : `${isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Insights List */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredInsights.length > 0 ? (
            <div className="space-y-4">
              {filteredInsights.map((insight, idx) => (
                <div
                  key={idx}
                  className={`p-5 rounded-xl border-l-4 ${getSeverityColor(insight.severity)} shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 animate-slideIn`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getTypeIcon(insight.type)}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${getSeverityColor(insight.severity)}`}>
                            {insight.severity}
                          </span>
                          <span className={`text-xs ${theme.text.secondary} capitalize`}>
                            {insight.type}
                          </span>
                          {insight.category && (
                            <span className={`text-xs ${theme.text.secondary} capitalize`}>
                              • {insight.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className={`text-xs ${theme.text.secondary}`}>
                      Priority: {insight.priority}
                    </div>
                  </div>

                  <h4 className={`font-semibold ${theme.text.primary} mb-2`}>
                    {insight.message}
                  </h4>

                  {insight.action && (
                    <div className={`text-sm ${theme.text.secondary} mb-2`}>
                      <strong>Action:</strong> {insight.action}
                    </div>
                  )}

                  {insight.expectedImpact && (
                    <div className={`text-sm ${theme.text.secondary} mb-2`}>
                      <strong>Expected Impact:</strong> {insight.expectedImpact}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs mt-3">
                    {insight.timeline && (
                      <span className={theme.text.secondary}>
                        ⏱️ Timeline: {insight.timeline}
                      </span>
                    )}
                    {insight.cost && (
                      <span className={theme.text.secondary}>
                        💰 Cost: {insight.cost}
                      </span>
                    )}
                    {insight.likelihood && (
                      <span className={theme.text.secondary}>
                        📊 Likelihood: {insight.likelihood}
                      </span>
                    )}
                    {insight.impact && (
                      <span className={theme.text.secondary}>
                        🎯 Impact: {insight.impact}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2 mt-3">
                    <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200">
                      ✅ Take Action
                    </button>
                    <button className={`px-4 py-2 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 ${isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                      ❌ Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className={theme.text.secondary}>No insights found for selected filter</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIInsightsPanel;
