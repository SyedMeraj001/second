import React, { useState, useEffect } from 'react';
import { LoadingSpinner, AnimatedCard } from './EnhancedUIComponents';

const SurveyAnalytics = ({ surveyId }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [surveyId]);

  const loadAnalytics = async () => {
    try {
      const response = await fetch(`/api/surveys/${surveyId}/analytics`);
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportResults = async (format) => {
    const response = await fetch(`/api/surveys/${surveyId}/export?format=${format}`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `survey-results.${format}`;
    a.click();
  };

  if (loading) return <LoadingSpinner message="Loading analytics..." />;

  return (
    <div className="survey-analytics">
      <div className="analytics-header">
        <h2>Survey Analytics: {analytics.title}</h2>
        <div className="export-buttons">
          <button onClick={() => exportResults('pdf')}>Export PDF</button>
          <button onClick={() => exportResults('excel')}>Export Excel</button>
          <button onClick={() => exportResults('csv')}>Export CSV</button>
        </div>
      </div>

      <div className="overview-stats">
        <AnimatedCard>
          <h3>Total Sent</h3>
          <p className="stat-value">{analytics.totalSent}</p>
        </AnimatedCard>

        <AnimatedCard>
          <h3>Responses</h3>
          <p className="stat-value">{analytics.totalResponses}</p>
        </AnimatedCard>

        <AnimatedCard>
          <h3>Response Rate</h3>
          <p className="stat-value">{analytics.responseRate}%</p>
        </AnimatedCard>

        <AnimatedCard>
          <h3>Avg. Completion Time</h3>
          <p className="stat-value">{analytics.avgCompletionTime} min</p>
        </AnimatedCard>
      </div>

      <div className="question-analytics">
        {analytics.questions.map((question, index) => (
          <AnimatedCard key={question.id} className="question-result">
            <h3>Q{index + 1}: {question.question}</h3>
            <p className="question-type">{question.type}</p>

            {question.type === 'multiple-choice' && (
              <div className="chart">
                {question.results.map(result => (
                  <div key={result.option} className="bar-chart-item">
                    <span className="option-label">{result.option}</span>
                    <div className="bar-container">
                      <div 
                        className="bar" 
                        style={{ width: `${result.percentage}%` }}
                      />
                      <span className="percentage">{result.percentage}% ({result.count})</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(question.type === 'rating' || question.type === 'importance') && (
              <div className="rating-results">
                <p className="average">Average: {question.average.toFixed(2)}</p>
                <div className="distribution">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <div key={rating} className="rating-bar">
                      <span>{rating}</span>
                      <div className="bar-container">
                        <div 
                          className="bar" 
                          style={{ width: `${question.distribution[rating]}%` }}
                        />
                        <span>{question.distribution[rating]}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {question.type === 'yes-no' && (
              <div className="yes-no-results">
                <div className="result-item">
                  <span>Yes:</span>
                  <span>{question.yes}% ({question.yesCount})</span>
                </div>
                <div className="result-item">
                  <span>No:</span>
                  <span>{question.no}% ({question.noCount})</span>
                </div>
              </div>
            )}

            {question.type === 'text' && (
              <div className="text-responses">
                <p>Total Responses: {question.responses.length}</p>
                <div className="responses-list">
                  {question.responses.slice(0, 5).map((response, i) => (
                    <div key={i} className="response-item">
                      "{response}"
                    </div>
                  ))}
                  {question.responses.length > 5 && (
                    <button>View All {question.responses.length} Responses</button>
                  )}
                </div>
              </div>
            )}
          </AnimatedCard>
        ))}
      </div>

      <div className="stakeholder-insights">
        <AnimatedCard>
          <h3>Key Insights</h3>
          <ul>
            {analytics.insights.map((insight, i) => (
              <li key={i}>{insight}</li>
            ))}
          </ul>
        </AnimatedCard>

        <AnimatedCard>
          <h3>Top Concerns</h3>
          <ol>
            {analytics.topConcerns.map((concern, i) => (
              <li key={i}>{concern}</li>
            ))}
          </ol>
        </AnimatedCard>
      </div>
    </div>
  );
};

export default SurveyAnalytics;
