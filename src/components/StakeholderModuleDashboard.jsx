import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './StakeholderModuleDashboard.css';

/**
 * STAKEHOLDER MODULE DASHBOARD
 * Main entry point for stakeholder engagement features
 * Access from: Main Dashboard → "Stakeholder Engagement" menu
 */
const StakeholderModuleDashboard = () => {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState([]);
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
      setSurveys(data);
    } catch (error) {
      console.error('Error loading surveys:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/surveys/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  return (
    <div className="stakeholder-dashboard">
      <div className="dashboard-header">
        <h1>📊 Stakeholder Engagement</h1>
        <button 
          className="btn-primary"
          onClick={() => navigate('/surveys/create')}
        >
          + Create New Survey
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-value">{stats.totalSurveys}</div>
          <div className="stat-label">Total Surveys</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{stats.activeSurveys}</div>
          <div className="stat-label">Active Surveys</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-value">{stats.totalResponses}</div>
          <div className="stat-label">Total Responses</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-value">{stats.avgResponseRate}%</div>
          <div className="stat-label">Avg Response Rate</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-grid">
          <div 
            className="action-card"
            onClick={() => navigate('/surveys/create')}
          >
            <div className="action-icon">📝</div>
            <h3>Create Survey</h3>
            <p>Build a new stakeholder survey</p>
          </div>
          <div 
            className="action-card"
            onClick={() => navigate('/materiality-assessment')}
          >
            <div className="action-icon">🎯</div>
            <h3>Materiality Assessment</h3>
            <p>Assess ESG topic materiality</p>
          </div>
          <div 
            className="action-card"
            onClick={() => navigate('/stakeholder-groups')}
          >
            <div className="action-icon">👥</div>
            <h3>Manage Groups</h3>
            <p>Configure stakeholder groups</p>
          </div>
          <div 
            className="action-card"
            onClick={() => navigate('/engagement-reports')}
          >
            <div className="action-icon">📊</div>
            <h3>View Reports</h3>
            <p>Engagement analytics & insights</p>
          </div>
        </div>
      </div>

      {/* Recent Surveys */}
      <div className="surveys-section">
        <h2>Recent Surveys</h2>
        <div className="surveys-list">
          {surveys.length === 0 ? (
            <div className="empty-state">
              <p>No surveys yet. Create your first survey to get started!</p>
              <button onClick={() => navigate('/surveys/create')}>
                Create Survey
              </button>
            </div>
          ) : (
            surveys.map(survey => (
              <div key={survey.id} className="survey-card">
                <div className="survey-header">
                  <h3>{survey.title}</h3>
                  <span className={`status-badge ${survey.status}`}>
                    {survey.status}
                  </span>
                </div>
                <p className="survey-description">{survey.description}</p>
                <div className="survey-meta">
                  <span>📅 {new Date(survey.createdAt).toLocaleDateString()}</span>
                  <span>👥 {survey.responseCount} responses</span>
                  <span>📊 {survey.responseRate}% response rate</span>
                </div>
                <div className="survey-actions">
                  <button onClick={() => navigate(`/surveys/${survey.id}/analytics`)}>
                    View Analytics
                  </button>
                  <button onClick={() => navigate(`/surveys/${survey.id}/distribute`)}>
                    Distribute
                  </button>
                  <button onClick={() => navigate(`/surveys/${survey.id}/edit`)}>
                    Edit
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default StakeholderModuleDashboard;
