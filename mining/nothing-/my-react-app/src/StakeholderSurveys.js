import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SurveyBuilder from './components/SurveyBuilder';
import SurveyDistribution from './components/SurveyDistribution';
import SurveyAnalytics from './components/SurveyAnalytics';

const StakeholderSurveys = () => {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState([]);
  const [activeView, setActiveView] = useState('list'); // 'list', 'create', 'distribute', 'analytics'
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [stats, setStats] = useState({
    totalSurveys: 0,
    activeSurveys: 0,
    totalResponses: 0,
    avgResponseRate: 0
  });

  useEffect(() => {
    loadSurveys();
    loadStats();
  }, []);

  const loadSurveys = async () => {
    try {
      const response = await fetch('/api/surveys');
      const data = await response.json();
      setSurveys(data || []);
    } catch (error) {
      console.error('Error loading surveys:', error);
      setSurveys([]);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/surveys/stats');
      const data = await response.json();
      setStats(data || { totalSurveys: 0, activeSurveys: 0, totalResponses: 0, avgResponseRate: 0 });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleCreateSurvey = () => {
    setActiveView('create');
  };

  const handleSurveySaved = () => {
    setActiveView('list');
    loadSurveys();
    loadStats();
  };

  const handleDistribute = (survey) => {
    setSelectedSurvey(survey);
    setActiveView('distribute');
  };

  const handleViewAnalytics = (survey) => {
    setSelectedSurvey(survey);
    setActiveView('analytics');
  };

  const handleBack = () => {
    setActiveView('list');
    setSelectedSurvey(null);
  };

  if (activeView === 'create') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <button 
            onClick={handleBack}
            className="mb-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
          >
            ← Back to Surveys
          </button>
          <SurveyBuilder onSave={handleSurveySaved} />
        </div>
      </div>
    );
  }

  if (activeView === 'distribute' && selectedSurvey) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <button 
            onClick={handleBack}
            className="mb-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
          >
            ← Back to Surveys
          </button>
          <SurveyDistribution surveyId={selectedSurvey.id} />
        </div>
      </div>
    );
  }

  if (activeView === 'analytics' && selectedSurvey) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <button 
            onClick={handleBack}
            className="mb-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
          >
            ← Back to Surveys
          </button>
          <SurveyAnalytics surveyId={selectedSurvey.id} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📊 Stakeholder Surveys</h1>
            <p className="text-gray-600 mt-2">Create, distribute, and analyze stakeholder engagement surveys</p>
          </div>
          <button 
            onClick={handleCreateSurvey}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-lg transition-all"
          >
            + Create New Survey
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="text-4xl mb-2">📋</div>
            <div className="text-3xl font-bold text-blue-600">{stats.totalSurveys}</div>
            <div className="text-sm text-gray-600">Total Surveys</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="text-4xl mb-2">✅</div>
            <div className="text-3xl font-bold text-green-600">{stats.activeSurveys}</div>
            <div className="text-sm text-gray-600">Active Surveys</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="text-4xl mb-2">👥</div>
            <div className="text-3xl font-bold text-purple-600">{stats.totalResponses}</div>
            <div className="text-sm text-gray-600">Total Responses</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="text-4xl mb-2">📈</div>
            <div className="text-3xl font-bold text-orange-600">{stats.avgResponseRate}%</div>
            <div className="text-sm text-gray-600">Avg Response Rate</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button 
              onClick={handleCreateSurvey}
              className="p-4 border-2 border-blue-200 hover:border-blue-400 rounded-lg text-center transition-all hover:shadow-md"
            >
              <div className="text-3xl mb-2">📝</div>
              <div className="font-semibold">Create Survey</div>
              <div className="text-xs text-gray-600">Build new survey</div>
            </button>
            <button 
              onClick={() => navigate('/materiality-assessment')}
              className="p-4 border-2 border-green-200 hover:border-green-400 rounded-lg text-center transition-all hover:shadow-md"
            >
              <div className="text-3xl mb-2">🎯</div>
              <div className="font-semibold">Materiality</div>
              <div className="text-xs text-gray-600">Assess topics</div>
            </button>
            <button 
              onClick={() => navigate('/stakeholders')}
              className="p-4 border-2 border-purple-200 hover:border-purple-400 rounded-lg text-center transition-all hover:shadow-md"
            >
              <div className="text-3xl mb-2">👥</div>
              <div className="font-semibold">Manage Groups</div>
              <div className="text-xs text-gray-600">Stakeholder groups</div>
            </button>
            <button 
              onClick={() => navigate('/dashboard')}
              className="p-4 border-2 border-gray-200 hover:border-gray-400 rounded-lg text-center transition-all hover:shadow-md"
            >
              <div className="text-3xl mb-2">📊</div>
              <div className="font-semibold">Dashboard</div>
              <div className="text-xs text-gray-600">Back to main</div>
            </button>
          </div>
        </div>

        {/* Surveys List */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Your Surveys</h2>
          {surveys.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-600 mb-4">No surveys yet. Create your first survey to get started!</p>
              <button 
                onClick={handleCreateSurvey}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
              >
                Create Your First Survey
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {surveys.map(survey => (
                <div key={survey.id} className="border rounded-lg p-4 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-semibold">{survey.title}</h3>
                      <p className="text-gray-600 text-sm">{survey.description}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      survey.status === 'active' ? 'bg-green-100 text-green-700' :
                      survey.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {survey.status}
                    </span>
                  </div>
                  <div className="flex gap-4 text-sm text-gray-600 mb-3">
                    <span>📅 {new Date(survey.createdAt).toLocaleDateString()}</span>
                    <span>👥 {survey.responseCount || 0} responses</span>
                    <span>📊 {survey.responseRate || 0}% response rate</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleViewAnalytics(survey)}
                      className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium"
                    >
                      View Analytics
                    </button>
                    <button 
                      onClick={() => handleDistribute(survey)}
                      className="px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm font-medium"
                    >
                      Distribute
                    </button>
                    <button 
                      onClick={() => {/* Edit logic */}}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StakeholderSurveys;
