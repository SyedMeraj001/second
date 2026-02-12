import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/themeUtils';
import { CDPEngine } from '../utils/cdpEngine';
import { getStoredData } from '../utils/storage';

const CDPQuestionnaireWizard = ({ onClose }) => {
  const { isDark } = useTheme();
  const theme = getThemeClasses(isDark);
  const [currentModule, setCurrentModule] = useState(0);
  const [answers, setAnswers] = useState({});
  const [esgData, setEsgData] = useState([]);
  const [autoFilled, setAutoFilled] = useState({});
  const [lastSaved, setLastSaved] = useState(null);

  useEffect(() => {
    loadESGData();
    const interval = setInterval(autoSave, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadESGData = async () => {
    const data = await getStoredData();
    setEsgData(data);
    autoFillQuestions(data);
  };

  const autoFillQuestions = (data) => {
    const filled = {};
    const autoFilledMap = {};
    
    Object.keys(CDPEngine.sampleQuestions).forEach(qId => {
      const value = CDPEngine.autoFillFromESGData(qId, data);
      if (value !== null) {
        filled[qId] = value;
        autoFilledMap[qId] = true;
      }
    });

    setAnswers(filled);
    setAutoFilled(autoFilledMap);
  };

  const autoSave = () => {
    setLastSaved(new Date());
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers({ ...answers, [questionId]: value });
    setAutoFilled({ ...autoFilled, [questionId]: false });
  };

  const completeness = CDPEngine.calculateCompleteness(answers);
  const modules = CDPEngine.modules;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className={`max-w-7xl w-full max-h-[90vh] overflow-y-auto ${theme.bg.card} rounded-3xl shadow-2xl border ${isDark ? 'border-green-500/30' : 'border-green-200'}`}>
        
        {/* Header */}
        <div className={`p-6 border-b ${isDark ? 'border-green-500/30' : 'border-green-200'} bg-gradient-to-br ${isDark ? 'from-green-900 via-teal-900 to-blue-900' : 'from-green-50 via-teal-50 to-blue-50'} relative overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
          <div className="flex justify-between items-center relative z-10">
            <div>
              <h2 className={`text-3xl font-bold ${theme.text.primary} flex items-center gap-3`}>
                <span className="text-4xl">📋</span>
                CDP Climate Change Questionnaire
                <span className="text-xs px-3 py-1 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-full font-semibold shadow-lg">2024</span>
              </h2>
              <p className={`${theme.text.secondary} mt-2 text-sm`}>Complete your CDP disclosure with auto-populated data</p>
            </div>
            <button onClick={onClose} className={`text-3xl hover:text-red-500 hover:rotate-90 transition-all duration-300 w-12 h-12 flex items-center justify-center rounded-full ${isDark ? 'hover:bg-red-900/30' : 'hover:bg-red-50'}`}>✕</button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-semibold">Overall Progress</span>
            <span className="text-sm font-bold text-green-600">{completeness}% Complete</span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-teal-500 transition-all duration-500"
              style={{ width: `${completeness}%` }}
            ></div>
          </div>
          {lastSaved && (
            <div className="text-xs text-gray-500 mt-2">
              ✓ Auto-saved at {lastSaved.toLocaleTimeString()}
            </div>
          )}
        </div>

        <div className="flex">
          {/* Module Sidebar */}
          <div className={`w-64 border-r ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'} p-4`}>
            <h3 className="font-bold mb-3">Modules</h3>
            <div className="space-y-2">
              {modules.map((module, idx) => (
                <button
                  key={module.code}
                  onClick={() => setCurrentModule(idx)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                    currentModule === idx
                      ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold'
                      : `${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{module.code}: {module.name}</span>
                    <span className="text-xs opacity-70">{module.questions}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Question Area */}
          <div className="flex-1 p-6">
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2">{modules[currentModule].name}</h3>
              <p className="text-sm text-gray-500">Module {modules[currentModule].code} • {modules[currentModule].questions} questions</p>
            </div>

            {/* Sample Questions */}
            <div className="space-y-6">
              {Object.values(CDPEngine.sampleQuestions)
                .filter(q => q.module === modules[currentModule].code)
                .map(question => (
                  <div key={question.id} className={`p-5 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} border-2 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-bold text-green-600">{question.id}</span>
                          {question.required && <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded-full">Required</span>}
                          {autoFilled[question.id] && <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded-full">✓ Auto-filled</span>}
                        </div>
                        <p className={`${theme.text.primary} font-medium`}>{question.text}</p>
                      </div>
                    </div>

                    {question.type === 'TEXT' && (
                      <textarea
                        value={answers[question.id] || ''}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        className={`w-full px-4 py-3 border-2 rounded-lg ${theme.bg.input} ${theme.border.input} focus:ring-2 focus:ring-green-500`}
                        rows={4}
                        maxLength={question.maxLength}
                      />
                    )}

                    {question.type === 'NUMBER' && (
                      <div>
                        <input
                          type="number"
                          value={answers[question.id] || ''}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          className={`w-full px-4 py-3 border-2 rounded-lg ${theme.bg.input} ${theme.border.input} focus:ring-2 focus:ring-green-500`}
                        />
                        {question.unit && <span className="text-sm text-gray-500 mt-1 block">{question.unit}</span>}
                      </div>
                    )}

                    {question.type === 'DATE' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs mb-1 block">Start Date</label>
                          <input
                            type="date"
                            value={answers[question.id]?.startDate || ''}
                            onChange={(e) => handleAnswerChange(question.id, { ...answers[question.id], startDate: e.target.value })}
                            className={`w-full px-4 py-3 border-2 rounded-lg ${theme.bg.input} ${theme.border.input}`}
                          />
                        </div>
                        <div>
                          <label className="text-xs mb-1 block">End Date</label>
                          <input
                            type="date"
                            value={answers[question.id]?.endDate || ''}
                            onChange={(e) => handleAnswerChange(question.id, { ...answers[question.id], endDate: e.target.value })}
                            className={`w-full px-4 py-3 border-2 rounded-lg ${theme.bg.input} ${theme.border.input}`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <button
                onClick={() => setCurrentModule(Math.max(0, currentModule - 1))}
                disabled={currentModule === 0}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-all"
              >
                ← Previous Module
              </button>
              
              {currentModule === modules.length - 1 ? (
                <div className="flex gap-3">
                  <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg">
                    📊 Export to Excel
                  </button>
                  <button className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg">
                    📤 Export to CDP ORS
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setCurrentModule(Math.min(modules.length - 1, currentModule + 1))}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Next Module →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CDPQuestionnaireWizard;
