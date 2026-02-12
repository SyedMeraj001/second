import React, { useState } from 'react';
import { useTheme } from './contexts/ThemeContext';
import { getThemeClasses } from './utils/themeUtils';
import ProfessionalHeader from './components/ProfessionalHeader';
import { useNavigate } from 'react-router-dom';

const Stakeholders = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const theme = getThemeClasses(isDark);
  
  const [showModal, setShowModal] = useState(false);
  const [stakeholders, setStakeholders] = useState([
    { 
      id: 1, 
      name: 'Investors & Shareholders', 
      icon: '💰',
      type: 'Financial', 
      engagement: 'High', 
      satisfaction: 85,
      priority: 'Critical Priority',
      lastContact: '2024-01-15',
      department: 'Finance Department',
      description: 'Key financial stakeholders and equity holders',
      concerns: 'Financial Performance, ESG Risks, Governance',
      color: 'green'
    },
    { 
      id: 2, 
      name: 'Employees & Workforce', 
      icon: '👥',
      type: 'Internal', 
      engagement: 'Medium', 
      satisfaction: 72,
      priority: 'High Priority',
      lastContact: '2024-01-10',
      department: 'Human Resources',
      description: 'Internal workforce and employee representatives',
      concerns: 'Working Conditions, Benefits, Career Development',
      color: 'orange'
    },
    { 
      id: 3, 
      name: 'Customers & Clients', 
      icon: '🛒',
      type: 'External', 
      engagement: 'High', 
      satisfaction: 88,
      priority: 'Critical Priority',
      lastContact: '2024-01-12',
      department: 'Customer Relations',
      description: 'End customers and business clients',
      concerns: 'Product Quality, Sustainability, Service',
      color: 'green'
    },
    { 
      id: 4, 
      name: 'Regulators & Government', 
      icon: '⚖️',
      type: 'Compliance', 
      engagement: 'Medium', 
      satisfaction: 78,
      priority: 'High Priority',
      lastContact: '2024-01-08',
      department: 'Legal & Compliance',
      description: 'Regulatory bodies and government agencies',
      concerns: 'Compliance, Reporting, Legal Requirements',
      color: 'orange'
    },
    { 
      id: 5, 
      name: 'Local Communities', 
      icon: '🏘️',
      type: 'Social', 
      engagement: 'Low', 
      satisfaction: 65,
      priority: 'Medium Priority',
      lastContact: '2024-01-05',
      department: 'Community Relations',
      description: 'Local communities and NGOs',
      concerns: 'Environmental Impact, Social Programs',
      color: 'red'
    },
    { 
      id: 6, 
      name: 'Suppliers & Partners', 
      icon: '🚚',
      type: 'Business', 
      engagement: 'Medium', 
      satisfaction: 80,
      priority: 'High Priority',
      lastContact: '2024-01-14',
      department: 'Supply Chain',
      description: 'Supply chain partners and vendors',
      concerns: 'Payment Terms, Sustainability Standards',
      color: 'orange'
    }
  ]);

  const [formData, setFormData] = useState({
    name: '',
    type: 'External',
    engagement: 'Medium',
    priority: 'Medium',
    email: '',
    percentage: 0,
    department: '',
    icon: '👥',
    description: '',
    concerns: '',
    nextAction: ''
  });

  const iconOptions = [
    { icon: '💰', name: 'Money/Finance' },
    { icon: '👥', name: 'People/Team' },
    { icon: '🛒', name: 'Shopping/Customers' },
    { icon: '⚖️', name: 'Legal/Compliance' },
    { icon: '🏘️', name: 'Community' },
    { icon: '🚚', name: 'Supply Chain' },
    { icon: '🏭', name: 'Industry/Factory' },
    { icon: '🌍', name: 'Global/Environment' },
    { icon: '📊', name: 'Analytics/Data' },
    { icon: '🎯', name: 'Target/Goals' }
  ];

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    navigate("/login");
  };

  const handleAddStakeholder = () => {
    const newStakeholder = {
      id: Date.now(),
      name: formData.name,
      icon: formData.icon,
      type: formData.type,
      engagement: formData.engagement,
      satisfaction: Math.floor(Math.random() * 30) + 70,
      priority: formData.priority === 'Critical' ? 'Critical Priority' : 
                formData.priority === 'High' ? 'High Priority' : 'Medium Priority',
      lastContact: new Date().toISOString().split('T')[0],
      department: formData.department,
      description: formData.description,
      concerns: formData.concerns,
      color: formData.engagement === 'High' ? 'green' : 
             formData.engagement === 'Medium' ? 'orange' : 'red'
    };
    
    setStakeholders([...stakeholders, newStakeholder]);
    setShowModal(false);
    setFormData({
      name: '', type: 'External', engagement: 'Medium', priority: 'Medium',
      email: '', percentage: 0, department: '', icon: '👥',
      description: '', concerns: '', nextAction: ''
    });
  };

  const handleDelete = (id) => {
    setStakeholders(stakeholders.filter(s => s.id !== id));
  };

  const stats = {
    high: stakeholders.filter(s => s.engagement === 'High').length,
    medium: stakeholders.filter(s => s.engagement === 'Medium').length,
    low: stakeholders.filter(s => s.engagement === 'Low').length,
    avgSatisfaction: Math.round(stakeholders.reduce((acc, s) => acc + s.satisfaction, 0) / stakeholders.length)
  };

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50/40 to-purple-50/30'
    }`}>
      <ProfessionalHeader onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto p-6">
        {/* Header Section */}
        <div className={`rounded-2xl p-6 mb-6 border ${
          isDark 
            ? 'bg-gray-800/90 border-gray-700 shadow-xl' 
            : 'bg-white/70 backdrop-blur-2xl border-white/30 shadow-lg'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-500 rounded-xl flex items-center justify-center text-3xl">
                👥
              </div>
              <div>
                <h1 className={`text-3xl font-bold ${theme.text.primary}`}>Stakeholder Management</h1>
                <p className={`text-sm ${theme.text.secondary}`}>Comprehensive stakeholder engagement and relationship tracking</p>
              </div>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
            >
              + Add Stakeholder
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-white/60'}`}>
              <div className="text-3xl font-bold text-green-600">{stats.high}</div>
              <div className={`text-sm ${theme.text.secondary}`}>High Engagement</div>
            </div>
            <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-white/60'}`}>
              <div className="text-3xl font-bold text-orange-600">{stats.medium}</div>
              <div className={`text-sm ${theme.text.secondary}`}>Medium Engagement</div>
            </div>
            <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-white/60'}`}>
              <div className="text-3xl font-bold text-red-600">{stats.low}</div>
              <div className={`text-sm ${theme.text.secondary}`}>Low Engagement</div>
            </div>
            <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-white/60'}`}>
              <div className="text-3xl font-bold text-blue-600">{stats.avgSatisfaction}%</div>
              <div className={`text-sm ${theme.text.secondary}`}>Avg Satisfaction</div>
            </div>
          </div>
        </div>

        {/* Stakeholder Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stakeholders.map((stakeholder) => (
            <div key={stakeholder.id} className={`rounded-2xl p-6 border ${
              isDark 
                ? 'bg-gray-800/90 border-gray-700' 
                : 'bg-white/70 backdrop-blur-2xl border-white/30 shadow-lg'
            }`}>
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                    stakeholder.color === 'green' ? 'bg-green-500' :
                    stakeholder.color === 'orange' ? 'bg-orange-500' : 'bg-red-500'
                  }`}>
                    {stakeholder.icon}
                  </div>
                  <div>
                    <h3 className={`font-bold ${theme.text.primary}`}>{stakeholder.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      stakeholder.priority === 'Critical Priority' 
                        ? 'bg-red-100 text-red-700' 
                        : stakeholder.priority === 'High Priority'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {stakeholder.priority}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleDelete(stakeholder.id)}
                    className="text-red-500 hover:bg-red-50 px-3 py-1 rounded text-sm"
                  >
                    Delete
                  </button>
                  <button className="text-blue-500 hover:bg-blue-50 px-3 py-1 rounded text-sm">
                    ▶
                  </button>
                </div>
              </div>

              {/* Engagement Level */}
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <span className={`text-sm ${theme.text.secondary}`}>Engagement Level</span>
                  <span className={`text-sm font-semibold ${
                    stakeholder.engagement === 'High' ? 'text-green-600' :
                    stakeholder.engagement === 'Medium' ? 'text-orange-600' : 'text-red-600'
                  }`}>
                    {stakeholder.engagement}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      stakeholder.engagement === 'High' ? 'bg-green-500' :
                      stakeholder.engagement === 'Medium' ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: stakeholder.engagement === 'High' ? '85%' : stakeholder.engagement === 'Medium' ? '60%' : '30%' }}
                  />
                </div>
              </div>

              {/* Satisfaction */}
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <span className={`text-sm ${theme.text.secondary}`}>Satisfaction</span>
                  <span className="text-sm font-semibold text-blue-600">{stakeholder.satisfaction}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                    style={{ width: `${stakeholder.satisfaction}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Details */}
              <div className={`text-sm space-y-2 ${theme.text.secondary}`}>
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span className="font-semibold">{stakeholder.type}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Contact:</span>
                  <span className="font-semibold">{stakeholder.lastContact}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Add Stakeholder Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-bold ${theme.text.primary}`}>Add New Stakeholder</h2>
              <button onClick={() => setShowModal(false)} className="text-2xl">&times;</button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${theme.text.primary}`}>Name *</label>
                <input
                  type="text"
                  placeholder="Enter stakeholder name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className={`w-full p-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-2 ${theme.text.primary}`}>Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className={`w-full p-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                >
                  <option>External</option>
                  <option>Internal</option>
                  <option>Financial</option>
                  <option>Compliance</option>
                  <option>Social</option>
                  <option>Business</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-2 ${theme.text.primary}`}>Engagement Level</label>
                <select
                  value={formData.engagement}
                  onChange={(e) => setFormData({...formData, engagement: e.target.value})}
                  className={`w-full p-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-2 ${theme.text.primary}`}>Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  className={`w-full p-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-2 ${theme.text.primary}`}>Contact Email</label>
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className={`w-full p-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-2 ${theme.text.primary}`}>Stakeholder Percentage (%)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={formData.percentage}
                  onChange={(e) => setFormData({...formData, percentage: e.target.value})}
                  className={`w-full p-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-2 ${theme.text.primary}`}>Department/Organization</label>
                <input
                  type="text"
                  placeholder="Department or organization"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  className={`w-full p-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-2 ${theme.text.primary}`}>Icon</label>
                <select
                  value={formData.icon}
                  onChange={(e) => setFormData({...formData, icon: e.target.value})}
                  className={`w-full p-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                >
                  {iconOptions.map(item => (
                    <option key={item.icon} value={item.icon}>{item.icon} {item.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className={`block text-sm font-semibold mb-2 ${theme.text.primary}`}>Description</label>
                <textarea
                  placeholder="Describe the stakeholder and their role..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className={`w-full p-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  rows="3"
                />
              </div>
              <div className="col-span-2">
                <label className={`block text-sm font-semibold mb-2 ${theme.text.primary}`}>Key Concerns</label>
                <input
                  type="text"
                  placeholder="Separate concerns with commas (e.g., Financial Performance, ESG Risks)"
                  value={formData.concerns}
                  onChange={(e) => setFormData({...formData, concerns: e.target.value})}
                  className={`w-full p-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                />
              </div>
              <div className="col-span-2">
                <label className={`block text-sm font-semibold mb-2 ${theme.text.primary}`}>Next Action</label>
                <input
                  type="text"
                  placeholder="Next planned action or meeting"
                  value={formData.nextAction}
                  onChange={(e) => setFormData({...formData, nextAction: e.target.value})}
                  className={`w-full p-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleAddStakeholder}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:opacity-90"
              >
                ✅ Add Stakeholder
              </button>
              <button
                onClick={() => setShowModal(false)}
                className={`px-6 py-3 rounded-lg font-semibold ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stakeholders;
