import React, { useState, useEffect } from 'react';

const ComplianceCalendar = ({ onClose }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [events, setEvents] = useState([]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', framework: 'GRI', priority: 'medium' });
  const [showReminders, setShowReminders] = useState(false);
  const [reminders, setReminders] = useState([]);
  const [newReminder, setNewReminder] = useState({ title: '', type: 'deadline', frequency: 'once', date: '', recipients: '', priority: 'medium' });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = () => {
    // Load compliance events
    const stored = localStorage.getItem('complianceEvents');
    const defaultEvents = [
      { id: 1, title: 'GRI Report Due', date: '2025-03-31', framework: 'GRI', priority: 'high', type: 'deadline' },
      { id: 2, title: 'SASB Disclosure', date: '2025-04-15', framework: 'SASB', priority: 'medium', type: 'deadline' },
      { id: 3, title: 'CDP Climate Response', date: '2025-05-01', framework: 'CDP', priority: 'high', type: 'deadline' },
      { id: 4, title: 'TCFD Report', date: '2025-06-30', framework: 'TCFD', priority: 'critical', type: 'deadline' }
    ];
    
    // Load reminders
    const reminderStored = localStorage.getItem('automatedReminders');
    const defaultReminders = [
      { id: 1, title: 'GRI Report Submission', type: 'deadline', dueDate: '2025-01-15', frequency: 'once', recipients: 'esg-team@company.com', priority: 'high', category: 'GRI' },
      { id: 2, title: 'Monthly Carbon Data', type: 'data_collection', dueDate: '2025-01-31', frequency: 'monthly', recipients: 'site-managers@company.com', priority: 'medium', category: 'Environmental' }
    ];
    const loadedReminders = reminderStored ? JSON.parse(reminderStored) : defaultReminders;
    setReminders(loadedReminders);
    if (!reminderStored) localStorage.setItem('automatedReminders', JSON.stringify(defaultReminders));
    
    // Convert reminders to events
    const reminderEvents = loadedReminders.map(r => ({
      id: `reminder-${r.id}`,
      title: r.title,
      date: r.dueDate,
      framework: r.category || 'General',
      priority: r.priority || 'medium',
      type: 'reminder',
      description: r.recipients
    }));
    
    const allEvents = stored ? JSON.parse(stored) : defaultEvents;
    setEvents([...allEvents, ...reminderEvents]);
  };

  const saveEvents = (updatedEvents) => {
    localStorage.setItem('complianceEvents', JSON.stringify(updatedEvents));
    setEvents(updatedEvents);
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getEventsForDate = (date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  const addEvent = () => {
    if (!selectedDate || !newEvent.title) return;
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    const event = { ...newEvent, id: Date.now(), date: dateStr, type: 'deadline' };
    const complianceEvents = events.filter(e => e.type !== 'reminder');
    saveEvents([...complianceEvents, event]);
    setNewEvent({ title: '', framework: 'GRI', priority: 'medium' });
    setShowAddEvent(false);
    loadEvents(); // Reload to include reminders
  };

  const deleteEvent = (id) => {
    saveEvents(events.filter(e => e.id !== id));
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const addReminder = () => {
    if (!newReminder.title || !newReminder.date) return;
    const reminder = { ...newReminder, id: Date.now(), dueDate: newReminder.date, category: newReminder.framework };
    const updated = [...reminders, reminder];
    localStorage.setItem('automatedReminders', JSON.stringify(updated));
    setReminders(updated);
    setNewReminder({ title: '', type: 'deadline', frequency: 'once', date: '', recipients: '', priority: 'medium' });
    loadEvents();
  };

  const deleteReminder = (id) => {
    const updated = reminders.filter(r => r.id !== id);
    localStorage.setItem('automatedReminders', JSON.stringify(updated));
    setReminders(updated);
    loadEvents();
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const priorityColors = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-blue-500'
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <h2 className="text-2xl font-bold">📅 Compliance Calendar & Reminders</h2>
          <div className="flex gap-2">
            <button onClick={() => setShowReminders(!showReminders)} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-semibold">
              {showReminders ? '📅 Calendar' : '🔔 Reminders'}
            </button>
            <button onClick={onClose} className="text-white hover:text-gray-200 text-3xl">&times;</button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {!showReminders ? (
            <>
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={prevMonth} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold">← Prev</button>
            <h3 className="text-2xl font-bold text-gray-800">{monthNames[month]} {year}</h3>
            <button onClick={nextMonth} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold">Next →</button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 mb-6">
            {dayNames.map(day => (
              <div key={day} className="text-center font-bold text-gray-600 py-2">{day}</div>
            ))}
            
            {[...Array(startingDayOfWeek)].map((_, i) => (
              <div key={`empty-${i}`} className="h-24 bg-gray-50 rounded-lg"></div>
            ))}
            
            {[...Array(daysInMonth)].map((_, i) => {
              const day = i + 1;
              const date = new Date(year, month, day);
              const dayEvents = getEventsForDate(date);
              const isToday = new Date().toDateString() === date.toDateString();
              const isSelected = selectedDate?.toDateString() === date.toDateString();
              
              return (
                <div
                  key={day}
                  onClick={() => setSelectedDate(date)}
                  className={`h-24 p-2 border rounded-lg cursor-pointer transition-all ${
                    isSelected ? 'border-blue-500 bg-blue-50 shadow-lg' :
                    isToday ? 'border-green-500 bg-green-50' :
                    'border-gray-200 hover:border-gray-400 hover:shadow-md'
                  }`}
                >
                  <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-green-600' : 'text-gray-700'}`}>{day}</div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map(event => (
                      <div key={event.id} className={`text-xs px-1 py-0.5 rounded text-white truncate ${priorityColors[event.priority]}`}>
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-500">+{dayEvents.length - 2} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Date Details */}
          {selectedDate && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </h3>
                <button onClick={() => setShowAddEvent(!showAddEvent)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  + Add Event
                </button>
              </div>

              {showAddEvent && (
                <div className="mb-4 p-4 bg-white rounded-lg border">
                  <input
                    type="text"
                    placeholder="Event title"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    className="w-full p-2 border rounded mb-2"
                  />
                  <div className="flex gap-2">
                    <select value={newEvent.framework} onChange={(e) => setNewEvent({ ...newEvent, framework: e.target.value })} className="p-2 border rounded">
                      <option value="GRI">GRI</option>
                      <option value="SASB">SASB</option>
                      <option value="TCFD">TCFD</option>
                      <option value="CDP">CDP</option>
                      <option value="ISO">ISO</option>
                      <option value="CSRD">CSRD</option>
                    </select>
                    <select value={newEvent.priority} onChange={(e) => setNewEvent({ ...newEvent, priority: e.target.value })} className="p-2 border rounded">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                    <button onClick={addEvent} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Save</button>
                    <button onClick={() => setShowAddEvent(false)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {getEventsForDate(selectedDate).length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No events scheduled</p>
                ) : (
                  getEventsForDate(selectedDate).map(event => (
                    <div key={event.id} className={`p-3 rounded-lg border-l-4 ${priorityColors[event.priority]} bg-white flex justify-between items-center`}>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-800">{event.title}</h4>
                          {event.type === 'reminder' && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Reminder</span>}
                          {event.type === 'deadline' && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Deadline</span>}
                        </div>
                        <p className="text-sm text-gray-600">Framework: {event.framework} | Priority: {event.priority}</p>
                        {event.description && <p className="text-xs text-gray-500 mt-1">{event.description}</p>}
                      </div>
                      <button onClick={() => deleteEvent(event.id)} className="text-red-600 hover:text-red-800 font-bold">✕</button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Automated Reminders</h3>
                <button onClick={() => setShowAddEvent(!showAddEvent)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  + New Reminder
                </button>
              </div>

              {showAddEvent && (
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="Title" value={newReminder.title} onChange={(e) => setNewReminder({...newReminder, title: e.target.value})} className="p-2 border rounded" />
                    <select value={newReminder.type} onChange={(e) => setNewReminder({...newReminder, type: e.target.value})} className="p-2 border rounded">
                      <option value="deadline">Deadline</option>
                      <option value="data_collection">Data Collection</option>
                      <option value="meeting">Meeting</option>
                      <option value="audit">Audit</option>
                    </select>
                    <input type="date" value={newReminder.date} onChange={(e) => setNewReminder({...newReminder, date: e.target.value})} className="p-2 border rounded" />
                    <select value={newReminder.frequency} onChange={(e) => setNewReminder({...newReminder, frequency: e.target.value})} className="p-2 border rounded">
                      <option value="once">Once</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                    </select>
                    <input type="text" placeholder="Recipients (emails)" value={newReminder.recipients} onChange={(e) => setNewReminder({...newReminder, recipients: e.target.value})} className="col-span-2 p-2 border rounded" />
                    <select value={newReminder.priority} onChange={(e) => setNewReminder({...newReminder, priority: e.target.value})} className="p-2 border rounded">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={addReminder} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
                    <button onClick={() => setShowAddEvent(false)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {reminders.map(reminder => (
                  <div key={reminder.id} className="p-4 bg-white rounded-lg border shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-lg">{reminder.title}</h4>
                        <p className="text-sm text-gray-600">Type: {reminder.type} | Frequency: {reminder.frequency}</p>
                        <p className="text-sm text-gray-600">Due: {reminder.dueDate} | Priority: {reminder.priority}</p>
                        <p className="text-sm text-gray-500">Recipients: {reminder.recipients}</p>
                      </div>
                      <button onClick={() => deleteReminder(reminder.id)} className="text-red-600 hover:text-red-800 font-bold">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComplianceCalendar;
