import React, { useState } from 'react';

const OnboardingWizard = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    companyName: '',
    industry: 'mining',
    employees: '',
    locations: '',
    frameworks: [],
    goals: []
  });

  const frameworks = ['GRI', 'SASB', 'TCFD', 'CDP', 'ISSB', 'SDGs'];
  const goals = ['Reduce emissions', 'Improve water efficiency', 'Enhance safety', 'Increase diversity', 'Strengthen governance'];

  return (
    <div className="onboarding-wizard">
      <div className="progress-bar">
        <div className="step-indicator">Step {step} of 4</div>
      </div>

      {step === 1 && (
        <div className="step-content">
          <h2>Company Information</h2>
          <input
            type="text"
            placeholder="Company Name"
            value={data.companyName}
            onChange={(e) => setData({...data, companyName: e.target.value})}
          />
          <select value={data.industry} onChange={(e) => setData({...data, industry: e.target.value})}>
            <option value="mining">Mining</option>
            <option value="manufacturing">Manufacturing</option>
            <option value="energy">Energy</option>
          </select>
          <input
            type="number"
            placeholder="Number of Employees"
            value={data.employees}
            onChange={(e) => setData({...data, employees: e.target.value})}
          />
        </div>
      )}

      {step === 2 && (
        <div className="step-content">
          <h2>Select Frameworks</h2>
          {frameworks.map(fw => (
            <label key={fw}>
              <input
                type="checkbox"
                checked={data.frameworks.includes(fw)}
                onChange={(e) => {
                  const updated = e.target.checked
                    ? [...data.frameworks, fw]
                    : data.frameworks.filter(f => f !== fw);
                  setData({...data, frameworks: updated});
                }}
              />
              {fw}
            </label>
          ))}
        </div>
      )}

      {step === 3 && (
        <div className="step-content">
          <h2>Set Goals</h2>
          {goals.map(goal => (
            <label key={goal}>
              <input
                type="checkbox"
                checked={data.goals.includes(goal)}
                onChange={(e) => {
                  const updated = e.target.checked
                    ? [...data.goals, goal]
                    : data.goals.filter(g => g !== goal);
                  setData({...data, goals: updated});
                }}
              />
              {goal}
            </label>
          ))}
        </div>
      )}

      {step === 4 && (
        <div className="step-content">
          <h2>Setup Complete!</h2>
          <p>Company: {data.companyName}</p>
          <p>Frameworks: {data.frameworks.join(', ')}</p>
          <p>Goals: {data.goals.length} selected</p>
        </div>
      )}

      <div className="actions">
        {step > 1 && <button onClick={() => setStep(step - 1)}>Back</button>}
        {step < 4 ? (
          <button onClick={() => setStep(step + 1)}>Next</button>
        ) : (
          <button onClick={() => onComplete(data)}>Finish</button>
        )}
      </div>
    </div>
  );
};

export default OnboardingWizard;
