import React, { useState, useEffect } from 'react';

const ComplianceCalendar = () => {
  const [deadlines, setDeadlines] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadDeadlines();
  }, []);

  const loadDeadlines = () => {
    setDeadlines([
      { id: 1, title: 'GRI Report', date: '2024-03-31', framework: 'GRI', status: 'pending', priority: 'high', daysLeft: 45 },
      { id: 2, title: 'SASB Disclosure', date: '2024-04-15', framework: 'SASB', status: 'pending', priority: 'medium', daysLeft: 60 },
      { id: 3, title: 'CDP Response', date: '2024-05-01', framework: 'CDP', status: 'in-progress', priority: 'high', daysLeft: 75 },
      { id: 4, title: 'ISO Audit', date: '2024-06-01', framework: 'ISO', status: 'pending', priority: 'critical', daysLeft: 105 }
    ]);
  };

  const filteredDeadlines = filter === 'all' ? deadlines : deadlines.filter(d => d.status === filter);

  return (
    <div className="compliance-calendar">
      <h2>Compliance Calendar</h2>
      
      <div className="filters">
        <button onClick={() => setFilter('all')} className={filter === 'all' ? 'active' : ''}>All</button>
        <button onClick={() => setFilter('pending')} className={filter === 'pending' ? 'active' : ''}>Pending</button>
        <button onClick={() => setFilter('in-progress')} className={filter === 'in-progress' ? 'active' : ''}>In Progress</button>
      </div>

      <div className="deadlines-list">
        {filteredDeadlines.map(deadline => (
          <div key={deadline.id} className={`deadline-card priority-${deadline.priority}`}>
            <h3>{deadline.title}</h3>
            <p>Framework: {deadline.framework}</p>
            <p>Due: {deadline.date}</p>
            <p>Days Left: {deadline.daysLeft}</p>
            <span className={`status ${deadline.status}`}>{deadline.status}</span>
          </div>
        ))}
      </div>

      <div className="upcoming-alerts">
        <h3>Upcoming (Next 30 Days)</h3>
        {deadlines.filter(d => d.daysLeft <= 30).map(d => (
          <div key={d.id} className="alert-item">
            {d.title} - {d.daysLeft} days
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComplianceCalendar;
