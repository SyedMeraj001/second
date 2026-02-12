import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingButton, Toast } from './EnhancedUIComponents';

const SurveyBuilder = ({ onSave }) => {
  const [survey, setSurvey] = useState({
    title: '',
    description: '',
    targetGroups: [],
    questions: [],
    status: 'draft',
    deadline: '',
    anonymous: false
  });
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [previewMode, setPreviewMode] = useState(false);

  const questionTypes = [
    { value: 'multiple-choice', label: '☑️ Multiple Choice', icon: '☑️' },
    { value: 'rating', label: '⭐ Rating Scale (1-5)', icon: '⭐' },
    { value: 'text', label: '📝 Text Response', icon: '📝' },
    { value: 'yes-no', label: '✓ Yes/No', icon: '✓' },
    { value: 'importance', label: '🎯 Importance Rating', icon: '🎯' }
  ];

  const stakeholderGroups = [
    { value: 'investors', label: '💼 Investors', icon: '💼' },
    { value: 'employees', label: '👥 Employees', icon: '👥' },
    { value: 'customers', label: '🛒 Customers', icon: '🛒' },
    { value: 'community', label: '🏘️ Community', icon: '🏘️' },
    { value: 'regulators', label: '⚖️ Regulators', icon: '⚖️' },
    { value: 'suppliers', label: '🚚 Suppliers', icon: '🚚' },
    { value: 'board', label: '🎓 Board Members', icon: '🎓' },
    { value: 'civil-society', label: '🌍 Civil Society', icon: '🌍' }
  ];

  const esgTopics = [
    'Climate Change', 'Water Management', 'Biodiversity', 'Waste Management',
    'Employee Health & Safety', 'Diversity & Inclusion', 'Labor Practices',
    'Community Relations', 'Board Composition', 'Ethics & Compliance',
    'Risk Management', 'Supply Chain Management'
  ];

  const addQuestion = () => {
    setSurvey({
      ...survey,
      questions: [...survey.questions, {
        id: Date.now(),
        type: 'multiple-choice',
        question: '',
        options: ['Option 1', 'Option 2'],
        required: true,
        category: 'general'
      }]
    });
  };

  const duplicateQuestion = (question) => {
    setSurvey({
      ...survey,
      questions: [...survey.questions, { ...question, id: Date.now() }]
    });
  };

  const updateQuestion = (id, field, value) => {
    setSurvey({
      ...survey,
      questions: survey.questions.map(q => 
        q.id === id ? { ...q, [field]: value } : q
      )
    });
  };

  const deleteQuestion = (id) => {
    setSurvey({
      ...survey,
      questions: survey.questions.filter(q => q.id !== id)
    });
  };

  const moveQuestion = (index, direction) => {
    const newQuestions = [...survey.questions];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < newQuestions.length) {
      [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
      setSurvey({ ...survey, questions: newQuestions });
    }
  };

  const toggleStakeholderGroup = (group) => {
    const groups = survey.targetGroups.includes(group)
      ? survey.targetGroups.filter(g => g !== group)
      : [...survey.targetGroups, group];
    setSurvey({ ...survey, targetGroups: groups });
  };

  const addQuestionFromTemplate = (template) => {
    const templates = {
      materiality: {
        type: 'importance',
        question: 'How important is [TOPIC] to your decision-making?',
        required: true,
        category: 'materiality'
      },
      satisfaction: {
        type: 'rating',
        question: 'How satisfied are you with our performance on [TOPIC]?',
        required: true,
        category: 'satisfaction'
      },
      openFeedback: {
        type: 'text',
        question: 'What additional ESG topics should we prioritize?',
        required: false,
        category: 'feedback'
      }
    };
    setSurvey({
      ...survey,
      questions: [...survey.questions, { ...templates[template], id: Date.now() }]
    });
  };

  const saveSurvey = async (publish = false) => {
    if (!survey.title || survey.questions.length === 0) {
      setToast({ message: 'Please add title and at least one question', type: 'error' });
      return;
    }
    if (survey.targetGroups.length === 0) {
      setToast({ message: 'Please select at least one stakeholder group', type: 'error' });
      return;
    }

    try {
      const surveyData = { ...survey, status: publish ? 'published' : 'draft' };
      await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(surveyData)
      });
      setToast({ 
        message: publish ? 'Survey published successfully!' : 'Survey saved as draft!', 
        type: 'success' 
      });
      if (onSave) setTimeout(() => onSave(surveyData), 1500);
    } catch (error) {
      setToast({ message: 'Failed to save survey', type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-6"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">📋 Create Stakeholder Survey</h1>
              <p className="text-gray-600">Build engaging surveys to gather stakeholder insights</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-all"
              >
                {previewMode ? '✏️ Edit' : '👁️ Preview'}
              </button>
              <LoadingButton 
                onClick={() => saveSurvey(false)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
              >
                💾 Save Draft
              </LoadingButton>
              <LoadingButton 
                onClick={() => saveSurvey(true)}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold"
              >
                🚀 Publish
              </LoadingButton>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b">
            {['basic', 'questions', 'settings'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-medium transition-all ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab === 'basic' && '📝 Basic Info'}
                {tab === 'questions' && '❓ Questions'}
                {tab === 'settings' && '⚙️ Settings'}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Basic Info Tab */}
        {activeTab === 'basic' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl shadow-xl p-8 mb-6"
          >
            <h2 className="text-2xl font-bold mb-6">Survey Details</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Survey Title *</label>
                <input
                  type="text"
                  placeholder="e.g., Annual Stakeholder Materiality Survey 2024"
                  value={survey.title}
                  onChange={(e) => setSurvey({...survey, title: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                <textarea
                  placeholder="Explain the purpose of this survey and how the data will be used..."
                  value={survey.description}
                  onChange={(e) => setSurvey({...survey, description: e.target.value})}
                  rows="4"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Target Stakeholder Groups *</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {stakeholderGroups.map(group => (
                    <button
                      key={group.value}
                      onClick={() => toggleStakeholderGroup(group.value)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        survey.targetGroups.includes(group.value)
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{group.icon}</div>
                      <div className="text-sm font-medium">{group.label.replace(group.icon + ' ', '')}</div>
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Selected: {survey.targetGroups.length} group(s)
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Questions Tab */}
        {activeTab === 'questions' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Question Templates */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-bold mb-4">📚 Quick Templates</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={() => addQuestionFromTemplate('materiality')}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="font-semibold">🎯 Materiality Question</div>
                  <div className="text-xs text-gray-600 mt-1">Importance rating template</div>
                </button>
                <button
                  onClick={() => addQuestionFromTemplate('satisfaction')}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="font-semibold">⭐ Satisfaction Question</div>
                  <div className="text-xs text-gray-600 mt-1">Rating scale template</div>
                </button>
                <button
                  onClick={() => addQuestionFromTemplate('openFeedback')}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="font-semibold">💬 Open Feedback</div>
                  <div className="text-xs text-gray-600 mt-1">Text response template</div>
                </button>
              </div>
            </div>

            {/* Questions List */}
            <AnimatePresence>
              {survey.questions.map((question, index) => (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-2xl shadow-xl p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-blue-600">Q{index + 1}</span>
                      <select
                        value={question.type}
                        onChange={(e) => updateQuestion(question.id, 'type', e.target.value)}
                        className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none font-medium"
                      >
                        {questionTypes.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => moveQuestion(index, 'up')}
                        disabled={index === 0}
                        className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30"
                        title="Move up"
                      >
                        ⬆️
                      </button>
                      <button
                        onClick={() => moveQuestion(index, 'down')}
                        disabled={index === survey.questions.length - 1}
                        className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30"
                        title="Move down"
                      >
                        ⬇️
                      </button>
                      <button
                        onClick={() => duplicateQuestion(question)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        title="Duplicate"
                      >
                        📋
                      </button>
                      <button
                        onClick={() => deleteQuestion(question.id)}
                        className="p-2 hover:bg-red-100 text-red-600 rounded-lg"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <textarea
                    placeholder="Enter your question here..."
                    value={question.question}
                    onChange={(e) => updateQuestion(question.id, 'question', e.target.value)}
                    rows="2"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none mb-4 text-lg"
                  />

                  {question.type === 'multiple-choice' && (
                    <div className="space-y-2 mb-4">
                      <label className="block text-sm font-semibold text-gray-700">Options:</label>
                      {question.options.map((option, i) => (
                        <div key={i} className="flex gap-2">
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...question.options];
                              newOptions[i] = e.target.value;
                              updateQuestion(question.id, 'options', newOptions);
                            }}
                            className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                          />
                          {question.options.length > 2 && (
                            <button
                              onClick={() => {
                                const newOptions = question.options.filter((_, idx) => idx !== i);
                                updateQuestion(question.id, 'options', newOptions);
                              }}
                              className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          updateQuestion(question.id, 'options', [...question.options, `Option ${question.options.length + 1}`]);
                        }}
                        className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium"
                      >
                        + Add Option
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={question.required}
                        onChange={(e) => updateQuestion(question.id, 'required', e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded"
                      />
                      <span className="font-medium">Required question</span>
                    </label>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Add Question Button */}
            <button
              onClick={addQuestion}
              className="w-full p-6 border-2 border-dashed border-gray-300 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all font-semibold text-gray-600 hover:text-blue-600"
            >
              ➕ Add New Question
            </button>
          </motion.div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <h2 className="text-2xl font-bold mb-6">Survey Settings</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Response Deadline</label>
                <input
                  type="date"
                  value={survey.deadline}
                  onChange={(e) => setSurvey({...survey, deadline: e.target.value})}
                  className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={survey.anonymous}
                  onChange={(e) => setSurvey({...survey, anonymous: e.target.checked})}
                  className="w-5 h-5 text-blue-600 rounded"
                />
                <label htmlFor="anonymous" className="font-medium cursor-pointer">
                  Allow anonymous responses
                </label>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold mb-2">📊 Survey Summary</h3>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• {survey.questions.length} question(s)</li>
                  <li>• {survey.targetGroups.length} stakeholder group(s)</li>
                  <li>• Status: {survey.status}</li>
                  <li>• Anonymous: {survey.anonymous ? 'Yes' : 'No'}</li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SurveyBuilder;
