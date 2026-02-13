import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const SupportTicketing = ({ onClose }) => {
  const { isDark } = useTheme();
  const [view, setView] = useState('list'); // list, create, detail
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    priority: 'medium',
    category: 'technical'
  });
  const [comment, setComment] = useState('');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadTickets();
    loadStats();
  }, []);

  const loadTickets = async () => {
    try {
      // Load from localStorage
      const storedTickets = JSON.parse(localStorage.getItem('supportTickets') || '[]');
      setTickets(storedTickets);
    } catch (error) {
      console.error('Failed to load tickets:', error);
    }
  };

  const loadStats = async () => {
    try {
      const storedTickets = JSON.parse(localStorage.getItem('supportTickets') || '[]');
      const stats = {
        total: storedTickets.length,
        byStatus: {
          open: storedTickets.filter(t => t.status === 'open').length,
          'in-progress': storedTickets.filter(t => t.status === 'in-progress').length,
          resolved: storedTickets.filter(t => t.status === 'resolved').length
        },
        slaViolations: 0
      };
      setStats(stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const createTicket = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const currentUser = localStorage.getItem('currentUser') || 'user@example.com';
      const response = await fetch('/api/reports/support/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: currentUser.split('@')[0],
          email: currentUser,
          subject: formData.subject,
          message: formData.description,
          priority: formData.priority
        })
      });
      const data = await response.json();
      
      if (data.success) {
        // Store ticket in localStorage
        const storedTickets = JSON.parse(localStorage.getItem('supportTickets') || '[]');
        const newTicket = {
          id: data.ticketId,
          subject: formData.subject,
          description: formData.description,
          priority: formData.priority,
          category: formData.category,
          status: 'open',
          created_at: new Date().toISOString(),
          comments: []
        };
        storedTickets.unshift(newTicket);
        localStorage.setItem('supportTickets', JSON.stringify(storedTickets));
        
        alert(`✅ ${data.message}\n\nTicket ID: ${data.ticketId}`);
        setFormData({ subject: '', description: '', priority: 'medium', category: 'technical' });
        loadTickets();
        loadStats();
        setView('list');
      } else {
        alert('Failed to create ticket: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Failed to create ticket: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const viewTicket = async (ticketId) => {
    try {
      const storedTickets = JSON.parse(localStorage.getItem('supportTickets') || '[]');
      const ticket = storedTickets.find(t => t.id === ticketId);
      if (ticket) {
        setSelectedTicket(ticket);
        setView('detail');
      }
    } catch (error) {
      alert('Failed to load ticket');
    }
  };

  const addComment = async () => {
    if (!comment.trim()) return;
    try {
      const storedTickets = JSON.parse(localStorage.getItem('supportTickets') || '[]');
      const ticketIndex = storedTickets.findIndex(t => t.id === selectedTicket.id);
      if (ticketIndex !== -1) {
        storedTickets[ticketIndex].comments = storedTickets[ticketIndex].comments || [];
        storedTickets[ticketIndex].comments.push({
          comment: comment,
          created_at: new Date().toISOString(),
          user: localStorage.getItem('currentUser') || 'user'
        });
        localStorage.setItem('supportTickets', JSON.stringify(storedTickets));
        setComment('');
        viewTicket(selectedTicket.id);
      }
    } catch (error) {
      alert('Failed to add comment');
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-300',
      high: 'bg-orange-100 text-orange-800 border-orange-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-blue-100 text-blue-800 border-blue-300'
    };
    return colors[priority] || colors.medium;
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-purple-100 text-purple-800',
      waiting: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors.open;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-6xl max-h-[90vh] rounded-xl shadow-2xl overflow-hidden ${
        isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      }`}>
        {/* Header */}
        <div className={`p-6 border-b ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎫</span>
              <div>
                <h2 className="text-2xl font-bold">24/7 Support Center</h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Get help anytime, anywhere
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-2xl hover:opacity-70">✕</button>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-4 gap-4 mt-4">
              <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-xs">Total Tickets</div>
              </div>
              <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="text-2xl font-bold text-green-600">{stats.byStatus?.open || 0}</div>
                <div className="text-xs">Open</div>
              </div>
              <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="text-2xl font-bold text-purple-600">{stats.byStatus?.['in-progress'] || 0}</div>
                <div className="text-xs">In Progress</div>
              </div>
              <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="text-2xl font-bold text-red-600">{stats.slaViolations || 0}</div>
                <div className="text-xs">SLA Violations</div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 rounded-lg font-medium ${
                view === 'list'
                  ? 'bg-blue-600 text-white'
                  : isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              My Tickets
            </button>
            <button
              onClick={() => setView('create')}
              className={`px-4 py-2 rounded-lg font-medium ${
                view === 'create'
                  ? 'bg-blue-600 text-white'
                  : isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              Create Ticket
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 250px)' }}>
          {/* List View */}
          {view === 'list' && (
            <div className="space-y-3">
              {tickets.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-6xl mb-4 block">📭</span>
                  <p className="text-xl font-semibold mb-2">No tickets yet</p>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                    Create your first support ticket to get help
                  </p>
                </div>
              ) : (
                tickets.map(ticket => (
                  <div
                    key={ticket.id}
                    onClick={() => viewTicket(ticket.id)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-lg ${
                      isDark ? 'bg-gray-700 border-gray-600 hover:bg-gray-650' : 'bg-gray-50 border-gray-200 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono text-sm font-semibold">{ticket.id}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority.toUpperCase()}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(ticket.status)}`}>
                            {ticket.status}
                          </span>
                        </div>
                        <h3 className="font-semibold mb-1">{ticket.subject}</h3>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {ticket.description?.substring(0, 100)}...
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs">
                          <span>📅 {new Date(ticket.created_at).toLocaleDateString()}</span>
                          <span>🏷️ {ticket.category}</span>
                        </div>
                      </div>
                      <span className="text-2xl">→</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Create View */}
          {view === 'create' && (
            <form onSubmit={createTicket} className="space-y-4">
              <div>
                <label className="block font-medium mb-2">Subject *</label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  className={`w-full p-3 rounded-lg border ${
                    isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                  }`}
                  placeholder="Brief description of your issue"
                />
              </div>

              <div>
                <label className="block font-medium mb-2">Description *</label>
                <textarea
                  required
                  rows={6}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className={`w-full p-3 rounded-lg border ${
                    isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                  }`}
                  placeholder="Detailed description of your issue..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-2">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    className={`w-full p-3 rounded-lg border ${
                      isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                    }`}
                  >
                    <option value="low">Low - General inquiry</option>
                    <option value="medium">Medium - Issue affecting work</option>
                    <option value="high">High - Urgent issue</option>
                    <option value="critical">Critical - System down</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className={`w-full p-3 rounded-lg border ${
                      isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                    }`}
                  >
                    <option value="technical">Technical Issue</option>
                    <option value="account">Account & Access</option>
                    <option value="data">Data & Reporting</option>
                    <option value="integration">Integration</option>
                    <option value="training">Training & Help</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className={`p-4 rounded-lg ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
                <h4 className="font-semibold mb-2">📞 Response Times (SLA)</h4>
                <ul className="text-sm space-y-1">
                  <li>🔴 Critical: 15 minutes response, 4 hours resolution</li>
                  <li>🟠 High: 1 hour response, 8 hours resolution</li>
                  <li>🟡 Medium: 4 hours response, 24 hours resolution</li>
                  <li>🔵 Low: 24 hours response, 72 hours resolution</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Support Ticket'}
              </button>
            </form>
          )}

          {/* Detail View */}
          {view === 'detail' && selectedTicket && (
            <div className="space-y-4">
              <button
                onClick={() => setView('list')}
                className="text-blue-600 hover:underline mb-4"
              >
                ← Back to tickets
              </button>

              <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-mono font-semibold">{selectedTicket.id}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(selectedTicket.priority)}`}>
                    {selectedTicket.priority.toUpperCase()}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedTicket.status)}`}>
                    {selectedTicket.status}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-2">{selectedTicket.subject}</h3>
                <p className="mb-3">{selectedTicket.description}</p>
                <div className="flex gap-4 text-sm">
                  <span>📅 {new Date(selectedTicket.created_at).toLocaleString()}</span>
                  <span>🏷️ {selectedTicket.category}</span>
                  <span>⏰ SLA: {new Date(selectedTicket.sla_deadline).toLocaleString()}</span>
                </div>
              </div>

              {/* Comments */}
              <div>
                <h4 className="font-semibold mb-3">💬 Comments</h4>
                <div className="space-y-3 mb-4">
                  {selectedTicket.comments?.map((c, i) => (
                    <div key={i} className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <div className="text-sm mb-1">{c.comment}</div>
                      <div className="text-xs opacity-70">{new Date(c.created_at).toLocaleString()}</div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a comment..."
                    className={`flex-1 p-3 rounded-lg border ${
                      isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                    }`}
                  />
                  <button
                    onClick={addComment}
                    className="px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportTicketing;
