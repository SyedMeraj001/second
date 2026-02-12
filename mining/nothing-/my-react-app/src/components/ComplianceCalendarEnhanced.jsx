import React, { useState, useEffect } from 'react';

const ComplianceCalendar = ({ onClose }) => {
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Compliance Calendar</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="filters mb-6 flex gap-2">
            <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}>All</button>
            <button onClick={() => setFilter('pending')} className={`px-4 py-2 rounded-lg ${filter === 'pending' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}>Pending</button>
            <button onClick={() => setFilter('in-progress')} className={`px-4 py-2 rounded-lg ${filter === 'in-progress' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}>In Progress</button>
          </div>

          <div className="deadlines-list grid gap-4 mb-6">
            {filteredDeadlines.map(deadline => (
              <div key={deadline.id} className={`deadline-card p-4 rounded-lg border-l-4 ${
                deadline.priority === 'critical' ? 'border-red-500 bg-red-50' :
                deadline.priority === 'high' ? 'border-orange-500 bg-orange-50' :
                deadline.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' : 'border-blue-500 bg-blue-50'
              }`}>
                <h3 className="font-bold text-lg mb-2">{deadline.title}</h3>
                <p className="text-sm text-gray-600">Framework: {deadline.framework}</p>
                <p className="text-sm text-gray-600">Due: {deadline.date}</p>
                <p className="text-sm font-semibold text-gray-800">Days Left: {deadline.daysLeft}</p>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                  deadline.status === 'pending' ? 'bg-yellow-200 text-yellow-800' : 'bg-blue-200 text-blue-800'
                }`}>{deadline.status}</span>
              </div>
            ))}
          </div>

          <div className="upcoming-alerts bg-gray-50 p-4 rounded-lg">
            <h3 className="font-bold text-lg mb-3">Upcoming (Next 30 Days)</h3>
            {deadlines.filter(d => d.daysLeft <= 30).length === 0 ? (
              <p className="text-gray-500">No upcoming deadlines in the next 30 days</p>
            ) : (
              deadlines.filter(d => d.daysLeft <= 30).map(d => (
                <div key={d.id} className="alert-item py-2 border-b last:border-0">
                  {d.title} - {d.daysLeft} days
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceCalendar;
