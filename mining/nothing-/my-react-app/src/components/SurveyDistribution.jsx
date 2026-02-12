import React, { useState, useEffect } from 'react';
import { LoadingSpinner, Toast } from './EnhancedUIComponents';

const SurveyDistribution = ({ surveyId }) => {
  const [survey, setSurvey] = useState(null);
  const [distribution, setDistribution] = useState({
    method: 'email',
    recipients: [],
    message: '',
    deadline: ''
  });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadSurvey();
  }, [surveyId]);

  const loadSurvey = async () => {
    try {
      const response = await fetch(`/api/surveys/${surveyId}`);
      const data = await response.json();
      setSurvey(data);
    } catch (error) {
      setToast({ message: 'Failed to load survey', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const distributeSurvey = async () => {
    try {
      await fetch(`/api/surveys/${surveyId}/distribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(distribution)
      });
      setToast({ message: 'Survey distributed!', type: 'success' });
    } catch (error) {
      setToast({ message: 'Distribution failed', type: 'error' });
    }
  };

  const addRecipient = (email) => {
    if (email && !distribution.recipients.includes(email)) {
      setDistribution({
        ...distribution,
        recipients: [...distribution.recipients, email]
      });
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="survey-distribution">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <h2>Distribute Survey: {survey?.title}</h2>

      <div className="distribution-method">
        <label>Distribution Method:</label>
        <select
          value={distribution.method}
          onChange={(e) => setDistribution({...distribution, method: e.target.value})}
        >
          <option value="email">Email</option>
          <option value="link">Public Link</option>
          <option value="portal">Stakeholder Portal</option>
        </select>
      </div>

      {distribution.method === 'email' && (
        <div className="recipients-section">
          <label>Recipients:</label>
          <input
            type="email"
            placeholder="Enter email and press Enter"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                addRecipient(e.target.value);
                e.target.value = '';
              }
            }}
          />
          <div className="recipients-list">
            {distribution.recipients.map((email, i) => (
              <span key={i} className="recipient-tag">
                {email}
                <button onClick={() => {
                  setDistribution({
                    ...distribution,
                    recipients: distribution.recipients.filter((_, index) => index !== i)
                  });
                }}>×</button>
              </span>
            ))}
          </div>
        </div>
      )}

      {distribution.method === 'link' && (
        <div className="public-link">
          <label>Public Link:</label>
          <input
            type="text"
            value={`${window.location.origin}/survey/${surveyId}`}
            readOnly
          />
          <button onClick={() => {
            navigator.clipboard.writeText(`${window.location.origin}/survey/${surveyId}`);
            setToast({ message: 'Link copied!', type: 'success' });
          }}>Copy Link</button>
        </div>
      )}

      <div className="message-section">
        <label>Message:</label>
        <textarea
          value={distribution.message}
          onChange={(e) => setDistribution({...distribution, message: e.target.value})}
          placeholder="Add a message to stakeholders..."
        />
      </div>

      <div className="deadline-section">
        <label>Response Deadline:</label>
        <input
          type="date"
          value={distribution.deadline}
          onChange={(e) => setDistribution({...distribution, deadline: e.target.value})}
        />
      </div>

      <button onClick={distributeSurvey} className="distribute-btn">
        Distribute Survey
      </button>

      <div className="survey-stats">
        <h3>Survey Statistics</h3>
        <p>Total Sent: {survey?.sent || 0}</p>
        <p>Responses: {survey?.responses || 0}</p>
        <p>Response Rate: {survey?.sent ? ((survey.responses / survey.sent) * 100).toFixed(1) : 0}%</p>
      </div>
    </div>
  );
};

export default SurveyDistribution;
