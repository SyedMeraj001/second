import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/themeUtils';
import { useNavigate } from 'react-router-dom';

const SupplyChainESG = ({ onClose }) => {
  const { isDark } = useTheme();
  const theme = getThemeClasses(isDark);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  
  const [suppliers, setSuppliers] = useState([
    {
      id: 1,
      name: "Green Materials Co.",
      category: "Raw Materials",
      location: "Germany",
      tier: "Tier 1",
      esgScore: 85,
      riskLevel: "Low",
      certifications: ["ISO 14001", "SA8000", "OHSAS 18001"],
      scope3Emissions: 1250,
      lastAssessment: "2024-01-15",
      dueDiligenceStatus: "Complete",
      humanRightsScore: 92,
      environmentalScore: 88,
      governanceScore: 81,
      conflictMinerals: "Compliant",
      modernSlaveryRisk: "Low",
      auditDate: "2024-02-10",
      correctiveActions: 0,
      sustainabilityReport: true,
      contact: "hans.mueller@greenmaterials.de",
      revenue: 2500000,
      employees: 150
    },
    {
      id: 2,
      name: "Tech Components Ltd.",
      category: "Electronics",
      location: "Taiwan",
      tier: "Tier 1",
      esgScore: 72,
      riskLevel: "Medium",
      certifications: ["ISO 9001", "RBA"],
      scope3Emissions: 2800,
      lastAssessment: "2023-11-20",
      dueDiligenceStatus: "In Progress",
      humanRightsScore: 75,
      environmentalScore: 68,
      governanceScore: 73,
      conflictMinerals: "Under Review",
      modernSlaveryRisk: "Medium",
      auditDate: "2023-12-05",
      correctiveActions: 3,
      sustainabilityReport: false,
      contact: "li.chen@techcomponents.tw",
      revenue: 5200000,
      employees: 320
    },
    {
      id: 3,
      name: "Logistics Express",
      category: "Transportation",
      location: "India",
      tier: "Tier 2",
      esgScore: 58,
      riskLevel: "High",
      certifications: ["ISO 9001"],
      scope3Emissions: 4200,
      lastAssessment: "2023-09-15",
      dueDiligenceStatus: "Overdue",
      humanRightsScore: 62,
      environmentalScore: 55,
      governanceScore: 57,
      conflictMinerals: "N/A",
      modernSlaveryRisk: "High",
      auditDate: "2023-10-20",
      correctiveActions: 7,
      sustainabilityReport: false,
      contact: "raj.patel@logisticsexpress.in",
      revenue: 1800000,
      employees: 450
    }
  ]);

  const [newSupplier, setNewSupplier] = useState({
    name: '',
    category: '',
    location: '',
    tier: 'Tier 1',
    esgScore: '',
    certifications: [],
    contact: '',
    revenue: '',
    employees: ''
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showDueDiligence, setShowDueDiligence] = useState(false);
  const [alerts, setAlerts] = useState([
    { id: 1, type: 'high', message: 'Logistics Express due diligence overdue', supplier: 'Logistics Express' },
    { id: 2, type: 'medium', message: 'Tech Components audit required', supplier: 'Tech Components Ltd.' },
    { id: 3, type: 'low', message: '3 suppliers need sustainability reports', supplier: 'Multiple' }
  ]);

  const dueDiligenceQuestions = [
    { id: 1, category: 'Human Rights', question: 'Do you have a written human rights policy?', required: true },
    { id: 2, category: 'Human Rights', question: 'Do you prohibit child labor in all operations?', required: true },
    { id: 3, category: 'Human Rights', question: 'Do you prohibit forced or bonded labor?', required: true },
    { id: 4, category: 'Environment', question: 'Do you have environmental management systems?', required: true },
    { id: 5, category: 'Environment', question: 'Do you track and report GHG emissions?', required: true },
    { id: 6, category: 'Governance', question: 'Do you have anti-corruption policies?', required: true },
    { id: 7, category: 'Governance', question: 'Do you conduct regular ESG training?', required: false },
    { id: 8, category: 'Conflict Minerals', question: 'Do you source conflict-free minerals?', required: true }
  ];

  const handleAddSupplier = () => {
    if (newSupplier.name && newSupplier.category) {
      const supplier = {
        id: Date.now(),
        ...newSupplier,
        esgScore: parseInt(newSupplier.esgScore) || 0,
        riskLevel: getRiskLevel(parseInt(newSupplier.esgScore) || 0),
        scope3Emissions: Math.floor(Math.random() * 5000) + 500,
        lastAssessment: new Date().toISOString().split('T')[0],
        dueDiligenceStatus: 'Pending',
        humanRightsScore: 0,
        environmentalScore: 0,
        governanceScore: 0,
        conflictMinerals: 'Pending',
        modernSlaveryRisk: 'Unknown',
        auditDate: null,
        correctiveActions: 0,
        sustainabilityReport: false,
        revenue: parseInt(newSupplier.revenue) || 0,
        employees: parseInt(newSupplier.employees) || 0
      };
      
      setSuppliers([...suppliers, supplier]);
      setNewSupplier({ name: '', category: '', location: '', tier: 'Tier 1', esgScore: '', certifications: [], contact: '', revenue: '', employees: '' });
      setShowAddForm(false);
    }
  };

  const getRiskLevel = (score) => {
    if (score >= 80) return "Low";
    if (score >= 60) return "Medium";
    return "High";
  };

  const getRiskColor = (risk) => {
    switch(risk) {
      case "Low": return "bg-green-100 text-green-800";
      case "Medium": return "bg-yellow-100 text-yellow-800";
      case "High": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getComplianceColor = (status) => {
    switch(status) {
      case "Complete": case "Compliant": return "bg-green-100 text-green-800";
      case "In Progress": case "Under Review": return "bg-yellow-100 text-yellow-800";
      case "Overdue": case "Non-Compliant": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const totalScope3 = suppliers.reduce((sum, supplier) => sum + supplier.scope3Emissions, 0);
  const avgESGScore = suppliers.length > 0 ? 
    Math.round(suppliers.reduce((sum, supplier) => sum + supplier.esgScore, 0) / suppliers.length) : 0;
  const highRiskSuppliers = suppliers.filter(s => s.riskLevel === "High").length;
  const overdueDueDiligence = suppliers.filter(s => s.dueDiligenceStatus === "Overdue").length;
  const pendingActions = suppliers.reduce((sum, supplier) => sum + supplier.correctiveActions, 0);

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className={`p-6 rounded-xl border transition-all duration-300 hover:scale-105 ${theme.bg.card} ${theme.border.primary}`}>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🏭</span>
            <h3 className={`font-semibold ${theme.text.primary}`}>Total Suppliers</h3>
          </div>
          <p className={`text-3xl font-bold ${theme.text.primary}`}>{suppliers.length}</p>
          <p className={`text-sm ${theme.text.secondary}`}>Across {new Set(suppliers.map(s => s.location)).size} countries</p>
        </div>

        <div className={`p-6 rounded-xl border transition-all duration-300 hover:scale-105 ${theme.bg.card} ${theme.border.primary}`}>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">📊</span>
            <h3 className={`font-semibold ${theme.text.primary}`}>Avg ESG Score</h3>
          </div>
          <p className={`text-3xl font-bold ${avgESGScore >= 80 ? 'text-green-600' : avgESGScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>{avgESGScore}</p>
          <div className={`w-full bg-gray-200 rounded-full h-2 mt-2`}>
            <div className={`h-2 rounded-full ${avgESGScore >= 80 ? 'bg-green-600' : avgESGScore >= 60 ? 'bg-yellow-600' : 'bg-red-600'}`} style={{width: `${avgESGScore}%`}}></div>
          </div>
        </div>

        <div className={`p-6 rounded-xl border transition-all duration-300 hover:scale-105 ${theme.bg.card} ${theme.border.primary}`}>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🌍</span>
            <h3 className={`font-semibold ${theme.text.primary}`}>Scope 3 Emissions</h3>
          </div>
          <p className={`text-3xl font-bold ${theme.text.primary}`}>{totalScope3.toLocaleString()}</p>
          <p className={`text-sm ${theme.text.secondary}`}>tCO2e annually</p>
        </div>

        <div className={`p-6 rounded-xl border transition-all duration-300 hover:scale-105 ${theme.bg.card} ${theme.border.primary}`}>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">⚠️</span>
            <h3 className={`font-semibold ${theme.text.primary}`}>High Risk</h3>
          </div>
          <p className={`text-3xl font-bold text-red-500`}>{highRiskSuppliers}</p>
          <p className={`text-sm ${theme.text.secondary}`}>Require immediate attention</p>
        </div>

        <div className={`p-6 rounded-xl border transition-all duration-300 hover:scale-105 ${theme.bg.card} ${theme.border.primary}`}>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">📋</span>
            <h3 className={`font-semibold ${theme.text.primary}`}>Pending Actions</h3>
          </div>
          <p className={`text-3xl font-bold text-orange-500`}>{pendingActions}</p>
          <p className={`text-sm ${theme.text.secondary}`}>Corrective actions needed</p>
        </div>
      </div>

      {/* Alerts Section */}
      <div className={`rounded-xl border ${theme.bg.card} ${theme.border.primary} p-6`}>
        <h3 className={`text-lg font-semibold mb-4 ${theme.text.primary}`}>🚨 Priority Alerts</h3>
        <div className="space-y-3">
          {alerts.map(alert => (
            <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${
              alert.type === 'high' ? 'border-red-500 bg-red-50' :
              alert.type === 'medium' ? 'border-yellow-500 bg-yellow-50' :
              'border-blue-500 bg-blue-50'
            }`}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{alert.message}</p>
                  <p className="text-sm text-gray-600">Supplier: {alert.supplier}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  alert.type === 'high' ? 'bg-red-100 text-red-800' :
                  alert.type === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {alert.type.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSuppliersTab = () => (
    <div className="space-y-6">
      {/* Enhanced Suppliers Table */}
      <div className={`rounded-xl border ${theme.bg.card} ${theme.border.primary} overflow-hidden`}>
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className={`text-xl font-bold ${theme.text.primary}`}>Supplier Directory</h2>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDueDiligence(true)}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
              >
                📋 Due Diligence
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Add Supplier
              </button>
            </div>
          </div>
        </div>

        {showAddForm && (
          <div className={`p-6 border-b border-gray-200 ${theme.bg.subtle}`}>
            <h3 className="font-semibold mb-4">Add New Supplier</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Supplier Name"
                value={newSupplier.name}
                onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})}
                className={`border rounded-lg px-3 py-2 ${theme.bg.input} ${theme.border.input}`}
              />
              <select
                value={newSupplier.category}
                onChange={(e) => setNewSupplier({...newSupplier, category: e.target.value})}
                className={`border rounded-lg px-3 py-2 ${theme.bg.input} ${theme.border.input}`}
              >
                <option value="">Select Category</option>
                <option value="Raw Materials">Raw Materials</option>
                <option value="Electronics">Electronics</option>
                <option value="Transportation">Transportation</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Services">Services</option>
              </select>
              <input
                type="text"
                placeholder="Location"
                value={newSupplier.location}
                onChange={(e) => setNewSupplier({...newSupplier, location: e.target.value})}
                className={`border rounded-lg px-3 py-2 ${theme.bg.input} ${theme.border.input}`}
              />
              <select
                value={newSupplier.tier}
                onChange={(e) => setNewSupplier({...newSupplier, tier: e.target.value})}
                className={`border rounded-lg px-3 py-2 ${theme.bg.input} ${theme.border.input}`}
              >
                <option value="Tier 1">Tier 1</option>
                <option value="Tier 2">Tier 2</option>
                <option value="Tier 3">Tier 3</option>
              </select>
              <input
                type="email"
                placeholder="Contact Email"
                value={newSupplier.contact}
                onChange={(e) => setNewSupplier({...newSupplier, contact: e.target.value})}
                className={`border rounded-lg px-3 py-2 ${theme.bg.input} ${theme.border.input}`}
              />
              <input
                type="number"
                placeholder="Annual Revenue (USD)"
                value={newSupplier.revenue}
                onChange={(e) => setNewSupplier({...newSupplier, revenue: e.target.value})}
                className={`border rounded-lg px-3 py-2 ${theme.bg.input} ${theme.border.input}`}
              />
              <div className="flex gap-2 col-span-full">
                <button
                  onClick={handleAddSupplier}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Add Supplier
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${theme.bg.subtle}`}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ESG Scores</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Diligence</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compliance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {suppliers.map((supplier) => (
                <tr key={supplier.id} className={`${theme.hover.bg} cursor-pointer`} onClick={() => setSelectedSupplier(supplier)}>
                  <td className="px-6 py-4">
                    <div>
                      <div className={`font-medium ${theme.text.primary}`}>{supplier.name}</div>
                      <div className={`text-sm ${theme.text.secondary}`}>{supplier.category} • {supplier.location}</div>
                      <div className={`text-xs ${theme.text.muted}`}>
                        {supplier.certifications.slice(0, 2).join(', ')}
                        {supplier.certifications.length > 2 && ` +${supplier.certifications.length - 2} more`}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      supplier.tier === 'Tier 1' ? 'bg-blue-100 text-blue-800' :
                      supplier.tier === 'Tier 2' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {supplier.tier}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs w-8">ESG:</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div className={`h-2 rounded-full ${supplier.esgScore >= 80 ? 'bg-green-500' : supplier.esgScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{width: `${supplier.esgScore}%`}}></div>
                        </div>
                        <span className="text-xs font-medium">{supplier.esgScore}</span>
                      </div>
                      <div className="flex gap-1 text-xs">
                        <span className="text-green-600">E:{supplier.environmentalScore}</span>
                        <span className="text-blue-600">S:{supplier.humanRightsScore}</span>
                        <span className="text-purple-600">G:{supplier.governanceScore}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(supplier.riskLevel)}`}>
                      {supplier.riskLevel}
                    </span>
                    {supplier.modernSlaveryRisk === 'High' && (
                      <div className="mt-1">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                          ⚠️ Slavery Risk
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getComplianceColor(supplier.dueDiligenceStatus)}`}>
                      {supplier.dueDiligenceStatus}
                    </span>
                    <div className={`text-xs mt-1 ${theme.text.secondary}`}>
                      Last: {supplier.lastAssessment}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getComplianceColor(supplier.conflictMinerals)}`}>
                        Minerals: {supplier.conflictMinerals}
                      </span>
                      {supplier.correctiveActions > 0 && (
                        <div className="text-xs text-orange-600">
                          {supplier.correctiveActions} pending actions
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button className="text-blue-600 hover:text-blue-800 text-sm">📊 Assess</button>
                      <button className="text-green-600 hover:text-green-800 text-sm">📝 Audit</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
  const renderDueDiligenceTab = () => (
    <div className="space-y-6">
      <div className={`rounded-xl border ${theme.bg.card} ${theme.border.primary} p-6`}>
        <h3 className={`text-lg font-semibold mb-4 ${theme.text.primary}`}>📋 Due Diligence Questionnaire</h3>
        <p className={`${theme.text.secondary} mb-6`}>CSRD/ESRS S2 compliant supplier assessment covering human rights, environmental impact, and governance.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {['Human Rights', 'Environment', 'Governance', 'Conflict Minerals'].map(category => {
            const questions = dueDiligenceQuestions.filter(q => q.category === category);
            return (
              <div key={category} className={`p-4 rounded-lg ${theme.bg.subtle} border`}>
                <h4 className={`font-medium ${theme.text.primary} mb-2`}>{category}</h4>
                <p className={`text-2xl font-bold ${theme.text.primary}`}>{questions.length}</p>
                <p className={`text-sm ${theme.text.secondary}`}>Questions</p>
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          {dueDiligenceQuestions.map(question => (
            <div key={question.id} className={`p-4 rounded-lg border ${theme.bg.subtle}`}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    question.category === 'Human Rights' ? 'bg-red-100 text-red-800' :
                    question.category === 'Environment' ? 'bg-green-100 text-green-800' :
                    question.category === 'Governance' ? 'bg-blue-100 text-blue-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {question.category}
                  </span>
                  {question.required && (
                    <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                      Required
                    </span>
                  )}
                </div>
              </div>
              <p className={`font-medium ${theme.text.primary} mb-3`}>{question.question}</p>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input type="radio" name={`q${question.id}`} value="yes" className="mr-2" />
                  <span className={theme.text.secondary}>Yes</span>
                </label>
                <label className="flex items-center">
                  <input type="radio" name={`q${question.id}`} value="no" className="mr-2" />
                  <span className={theme.text.secondary}>No</span>
                </label>
                <label className="flex items-center">
                  <input type="radio" name={`q${question.id}`} value="partial" className="mr-2" />
                  <span className={theme.text.secondary}>Partial</span>
                </label>
                <label className="flex items-center">
                  <input type="radio" name={`q${question.id}`} value="na" className="mr-2" />
                  <span className={theme.text.secondary}>N/A</span>
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            Save Draft
          </button>
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Submit Assessment
          </button>
        </div>
      </div>
    </div>
  );

  const renderComplianceTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-6 rounded-xl border ${theme.bg.card} ${theme.border.primary}`}>
          <h3 className={`font-semibold mb-4 ${theme.text.primary}`}>📜 Modern Slavery Act</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className={theme.text.secondary}>Compliant Suppliers</span>
              <span className={`font-medium ${theme.text.primary}`}>{suppliers.filter(s => s.modernSlaveryRisk === 'Low').length}/{suppliers.length}</span>
            </div>
            <div className="flex justify-between">
              <span className={theme.text.secondary}>High Risk</span>
              <span className="font-medium text-red-600">{suppliers.filter(s => s.modernSlaveryRisk === 'High').length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{width: `${(suppliers.filter(s => s.modernSlaveryRisk === 'Low').length / suppliers.length) * 100}%`}}></div>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-xl border ${theme.bg.card} ${theme.border.primary}`}>
          <h3 className={`font-semibold mb-4 ${theme.text.primary}`}>⚙️ Conflict Minerals</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className={theme.text.secondary}>Compliant</span>
              <span className={`font-medium ${theme.text.primary}`}>{suppliers.filter(s => s.conflictMinerals === 'Compliant').length}</span>
            </div>
            <div className="flex justify-between">
              <span className={theme.text.secondary}>Under Review</span>
              <span className="font-medium text-yellow-600">{suppliers.filter(s => s.conflictMinerals === 'Under Review').length}</span>
            </div>
            <div className="flex justify-between">
              <span className={theme.text.secondary}>N/A</span>
              <span className={`font-medium ${theme.text.primary}`}>{suppliers.filter(s => s.conflictMinerals === 'N/A').length}</span>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-xl border ${theme.bg.card} ${theme.border.primary}`}>
          <h3 className={`font-semibold mb-4 ${theme.text.primary}`}>📅 Audit Schedule</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className={theme.text.secondary}>This Quarter</span>
              <span className={`font-medium ${theme.text.primary}`}>2</span>
            </div>
            <div className="flex justify-between">
              <span className={theme.text.secondary}>Overdue</span>
              <span className="font-medium text-red-600">{overdueDueDiligence}</span>
            </div>
            <div className="flex justify-between">
              <span className={theme.text.secondary}>Completed YTD</span>
              <span className={`font-medium ${theme.text.primary}`}>8</span>
            </div>
          </div>
        </div>
      </div>

      <div className={`rounded-xl border ${theme.bg.card} ${theme.border.primary} p-6`}>
        <h3 className={`text-lg font-semibold mb-4 ${theme.text.primary}`}>📈 Compliance Trends</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className={`font-medium mb-3 ${theme.text.primary}`}>ESG Score Distribution</h4>
            <div className="space-y-2">
              {['80-100 (Excellent)', '60-79 (Good)', '40-59 (Fair)', '0-39 (Poor)'].map((range, index) => {
                const count = suppliers.filter(s => {
                  if (index === 0) return s.esgScore >= 80;
                  if (index === 1) return s.esgScore >= 60 && s.esgScore < 80;
                  if (index === 2) return s.esgScore >= 40 && s.esgScore < 60;
                  return s.esgScore < 40;
                }).length;
                return (
                  <div key={range} className="flex justify-between items-center">
                    <span className={`text-sm ${theme.text.secondary}`}>{range}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className={`h-2 rounded-full ${
                          index === 0 ? 'bg-green-500' :
                          index === 1 ? 'bg-blue-500' :
                          index === 2 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} style={{width: `${(count / suppliers.length) * 100}%`}}></div>
                      </div>
                      <span className={`text-sm font-medium ${theme.text.primary}`}>{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <h4 className={`font-medium mb-3 ${theme.text.primary}`}>Risk Assessment</h4>
            <div className="space-y-2">
              {['Low Risk', 'Medium Risk', 'High Risk'].map(risk => {
                const count = suppliers.filter(s => s.riskLevel === risk.split(' ')[0]).length;
                return (
                  <div key={risk} className="flex justify-between items-center">
                    <span className={`text-sm ${theme.text.secondary}`}>{risk}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className={`h-2 rounded-full ${
                          risk === 'Low Risk' ? 'bg-green-500' :
                          risk === 'Medium Risk' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} style={{width: `${(count / suppliers.length) * 100}%`}}></div>
                      </div>
                      <span className={`text-sm font-medium ${theme.text.primary}`}>{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50/40 to-purple-50/30'
    }`} style={{
      backgroundImage: isDark ? '' : 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.12) 0%, transparent 50%), radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.1) 0%, transparent 50%)'
    }}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header with Back Button */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${theme.text.primary} mb-2`}>Supply Chain ESG Management</h1>
            <p className={`text-lg ${theme.text.secondary}`}>CSRD/ESRS S2 compliant supply chain monitoring and due diligence</p>
          </div>
          {(onClose || navigate) && (
            <button
              onClick={onClose || (() => navigate('/'))} 
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 ${
                isDark 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600' 
                  : 'bg-white/70 hover:bg-white/90 text-gray-700 border border-white/30 shadow-lg'
              }`}
              style={{
                backdropFilter: 'blur(10px)',
                boxShadow: isDark ? '' : '0 8px 32px rgba(0, 0, 0, 0.1)'
              }}
            >
              ← Back to Dashboard
            </button>
          )}
        </div>

        {/* Main Content Card */}
        <div className={`rounded-2xl p-6 border transition-all duration-300 ${
          isDark 
            ? 'bg-gray-800/90 border-gray-700 shadow-xl backdrop-blur-sm' 
            : 'bg-white/70 backdrop-blur-2xl border-white/30 shadow-lg shadow-slate-200/30'
        }`} style={{
          boxShadow: isDark ? '' : '0 25px 50px -12px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.3)'
        }}>

          {/* Tabs */}
          <div className="mb-6">
            <div className="flex space-x-1 p-1 rounded-xl bg-gray-100/50">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'suppliers', label: 'Suppliers', icon: '🏭' },
                { id: 'due-diligence', label: 'Due Diligence', icon: '📋' },
                { id: 'compliance', label: 'Compliance', icon: '⚙️' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-6 py-3 font-medium text-sm rounded-lg transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-white text-blue-600 shadow-md'
                      : `${theme.text.secondary} hover:${theme.text.primary} hover:bg-white/50`
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'suppliers' && renderSuppliersTab()}
          {activeTab === 'due-diligence' && renderDueDiligenceTab()}
          {activeTab === 'compliance' && renderComplianceTab()}
        </div>
      </div>
    </div>
  );
};

export default SupplyChainESG;