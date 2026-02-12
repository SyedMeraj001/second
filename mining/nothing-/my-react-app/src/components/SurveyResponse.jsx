import React, { useState, useEffect } from 'react';
import { LoadingSpinner, LoadingButton, Toast } from './EnhancedUIComponents';

const SurveyResponse = ({ surveyId, respondentId }) => {
  const [survey, setSurvey] = useState(null);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadSurvey();
  }, [surveyId]);

  const loadSurvey = async () => {
    try {
      const response = await fetch(`/api/surveys/${surveyId}/public`);
      const data = await response.json();
      setSurvey(data);
    } catch (error) {
      setToast({ message: 'Failed to load survey', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = (questionId, value) => {
    setResponses({
      ...responses,
      [questionId]: value
    });
  };

  const submitSurvey = async () => {
    // Validate required questions
    const unanswered = survey.questions.filter(q => 
      q.required && !responses[q.id]
    );

    if (unanswered.length > 0) {
      setToast({ message: 'Please answer all required questions', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      await fetch(`/api/surveys/${surveyId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          respondentId,
          responses,
          submittedAt: new Date().toISOString()
        })
      });
      setToast({ message: 'Thank you for your response!', type: 'success' });
    } catch (error) {
      setToast({ message: 'Submission failed', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading survey..." />;

  return (
    <div className="survey-response">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="survey-header">
        <h1>{survey.title}</h1>
        <p>{survey.description}</p>
        <p className="target-group">For: {survey.targetGroup}</p>
      </div>

      <div className="questions">
        {survey.questions.map((question, index) => (
          <div key={question.id} className="question">
            <label>
              {index + 1}. {question.question}
              {question.required && <span className="required">*</span>}
            </label>

            {question.type === 'multiple-choice' && (
              <div className="options">
                {question.options.map((option, i) => (
                  <label key={i} className="option">
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={option}
                      onChange={(e) => handleResponse(question.id, e.target.value)}
                    />
                    {option}
                  </label>
                ))}
              </div>
            )}

            {question.type === 'rating' && (
              <div className="rating">
                {[1, 2, 3, 4, 5].map(rating => (
                  <label key={rating}>
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={rating}
                      onChange={(e) => handleResponse(question.id, parseInt(e.target.value))}
                    />
                    {rating}
                  </label>
                ))}
              </div>
            )}

            {question.type === 'importance' && (
              <div className="importance">
                {['Not Important', 'Slightly Important', 'Moderately Important', 'Very Important', 'Extremely Important'].map((level, i) => (
                  <label key={i}>
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={i + 1}
                      onChange={(e) => handleResponse(question.id, parseInt(e.target.value))}
                    />
                    {level}
                  </label>
                ))}
              </div>
            )}

            {question.type === 'yes-no' && (
              <div className="yes-no">
                <label>
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value="yes"
                    onChange={(e) => handleResponse(question.id, e.target.value)}
                  />
                  Yes
                </label>
                <label>
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value="no"
                    onChange={(e) => handleResponse(question.id, e.target.value)}
                  />
                  No
                </label>
              </div>
            )}

            {question.type === 'text' && (
              <textarea
                placeholder="Your answer..."
                onChange={(e) => handleResponse(question.id, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>

      <LoadingButton loading={submitting} onClick={submitSurvey}>
        Submit Survey
      </LoadingButton>
    </div>
  );
};

export default SurveyResponse;
