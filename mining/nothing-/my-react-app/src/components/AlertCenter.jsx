import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/themeUtils';
import { AlertEngine } from '../utils/alertEngine';

const AlertCenter = ({ onClose }) => {
  const { isDark } = useTheme();
  const theme = getThemeClasses(isDark);
  const [view, setView] = useState('inbox');
  const [alerts, setAlerts] = useState([]);
  const [rules, setRules] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showRuleBuilder, setShowRuleBuilder] = useState(false);

  useEffect(() => {
    loadMockData();
  }, []);

  const loadMockData = () => {
    const mockAlerts = [
      {
        id: '1',
        severity: 'critical',
        title: 'Scope 1 emissions exceeded threshold',
        message: 'Current emissions: 15,000 tCO2e (Threshold: 12,000 tCO2e)',
        status: 'new',
        createdAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: '2',
        severity: 'high',
        title: 'CDP questionnaire deadline approaching',
        message: 'Submission due in 7 days',
        status: 'new',
        createdAt: new Date(Date.now() - 7200000).toISOString()
      },
      {
        id: '3',
        severity: 'medium',
        title: 'Missing water consumption data',
        message: 'Q4 water data not reported',
        status: 'read',
        createdAt: new Date(Date.now() - 86400000).toISOString()
      }
    ];
    setAlerts(mockAlerts);
  };

  const handleAlertAction = (alertId, action) => {
    setAlerts(alerts.map(a => 
      a.id === alertId ? { ...a, status: action, acknowledgedAt: new Date().toISOString() } : a
    ));
  };

  const filteredAlerts = filter === 'all' 
    ? alerts 
    : alerts.filter(a => a.severity === filter || a.status === filter);

  const stats = AlertEngine.getAlertStats(alerts);

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'from-red-500 to-red-600',
      high: 'from-orange-500 to-orange-600',
      medium: 'from-yellow-500 to-yellow-600',
      low: 'from-blue-500 to-blue-600'
    };
    return colors[severity] || colors.low;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className={`max-w-7xl w-full max-h-[90vh] overflow-y-auto ${theme.bg.card} rounded-3xl shadow-2xl border ${isDark ? 'border-red-500/30' : 'border-red-200'}`}>
        
        {/* Header */}
        <div className={`p-6 border-b ${isDark ? 'border-red-500/30' : 'border-red-200'} bg-gradient-to-br ${isDark ? 'from-red-900 via-orange-900 to-yellow-900' : 'from-red-50 via-orange-50 to-yellow-50'} relative overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
          <div className="flex justify-between items-center relative z-10">
            <div>
              <h2 className={`text-3xl font-bold ${theme.text.primary} flex items-center gap-3`}>
                <span className="text-4xl">🔔</span>
                Alert Center
                <span className="text-xs px-3 py-1 bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-full font-semibold shadow-lg">{stats.new} NEW</span>
              </h2>
              <p className={`${theme.text.secondary} mt-2 text-sm`}>Smart notifications with multi-channel delivery and escalation</p>
            </div>
            <button onClick={onClose} className={`text-3xl hover:text-red-500 hover:rotate-90 transition-all duration-300 w-12 h-12 flex items-center justify-center rounded-full ${isDark ? 'hover:bg-red-900/30' : 'hover:bg-red-50'}`}>✕</button>
          </div>
        </div>

        {/* Stats */}
        <div className="p-6 border-b grid grid-cols-5 gap-4">
          <div className="p-4 rounded-xl bg-gradient-to-br from-gray-500 to-gray-600 text-white text-center">
            <div className="text-3xl font-bold">{stats.total}</div>
            <div className="text-xs mt-1">Total Alerts</div>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white text-center">
            <div className="text-3xl font-bold">{stats.bySeverity.critical}</div>
            <div className="text-xs mt-1">Critical</div>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white text-center">
            <div className="text-3xl font-bold">{stats.bySeverity.high}</div>
            <div className="text-xs mt-1">High</div>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 text-white text-center">
            <div className="text-3xl font-bold">{stats.bySeverity.medium}</div>
            <div className="text-xs mt-1">Medium</div>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white text-center">
            <div className="text-3xl font-bold">{stats.avgResponseTime}</div>
            <div className="text-xs mt-1">Avg Response (min)</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="p-6 border-b flex gap-2">
          <button
            onClick={() => setView('inbox')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${view === 'inbox' ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white' : `${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}`}
          >
            📥 Inbox
          </button>
          <button
            onClick={() => setView('rules')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${view === 'rules' ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white' : `${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}`}
          >
            ⚙️ Rules
          </button>
          <button
            onClick={() => setView('analytics')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${view === 'analytics' ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white' : `${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}`}
          >
            📊 Analytics
          </button>
        </div>

        <div className="p-6">
          {/* Inbox View */}
          {view === 'inbox' && (
            <div>
              {/* Filters */}
              <div className="flex gap-2 mb-6">
                {['all', 'new', 'critical', 'high', 'medium', 'low'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-xl font-semibold transition-all ${filter === f ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white' : `${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>

              {/* Alert List */}
              <div className="space-y-3">
                {filteredAlerts.map(alert => (
                  <div key={alert.id} className={`p-5 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} border-l-4 border-${alert.severity === 'critical' ? 'red' : alert.severity === 'high' ? 'orange' : alert.severity === 'medium' ? 'yellow' : 'blue'}-500 shadow-lg`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getSeverityColor(alert.severity)}`}>
                            {alert.severity.toUpperCase()}
                          </span>
                          {alert.status === 'new' && <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-bold">NEW</span>}
                        </div>
                        <h4 className={`font-bold ${theme.text.primary} text-lg mb-2`}>{alert.title}</h4>
                        <p className={`${theme.text.secondary} text-sm`}>{alert.message}</p>
                        <div className="text-xs text-gray-500 mt-2">
                          {new Date(alert.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {alert.status === 'new' && (
                        <>
                          <button
                            onClick={() => handleAlertAction(alert.id, 'read')}
                            className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm font-semibold hover:shadow-lg"
                          >
                            ✓ Acknowledge
                          </button>
                          <button
                            onClick={() => handleAlertAction(alert.id, 'snoozed')}
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-semibold hover:shadow-lg"
                          >
                            ⏰ Snooze
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleAlertAction(alert.id, 'dismissed')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-700'} hover:bg-gray-300`}
                      >
                        ✕ Dismiss
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rules View */}
          {view === 'rules' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Alert Rules</h3>
                <button
                  onClick={() => setShowRuleBuilder(true)}
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg"
                >
                  + Create Rule
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {AlertEngine.triggerTypes.map(trigger => (
                  <div key={trigger.id} className={`p-5 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} border-2 ${isDark ? 'border-gray-700' : 'border-gray-200'} hover:border-red-500 transition-all`}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl">{trigger.icon}</span>
                      <span className="font-bold">{trigger.name}</span>
                    </div>
                    <button className="text-sm text-blue-600 hover:underline">Configure →</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analytics View */}
          {view === 'analytics' && (
            <div className="text-center py-12">
              <p className={theme.text.secondary}>Analytics dashboard with alert trends, response times, and escalation rates</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertCenter;
