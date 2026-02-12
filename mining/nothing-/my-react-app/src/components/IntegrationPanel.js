import { useState, useEffect } from 'react';
import APIService from '../services/apiService';

function IntegrationPanel() {
  const [status, setStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [showERPModal, setShowERPModal] = useState(false);
  const [showHRModal, setShowHRModal] = useState(false);
  const [erpConfig, setErpConfig] = useState({ type: 'SAP', baseURL: '', apiKey: '' });
  const [hrConfig, setHrConfig] = useState({ type: 'Workday', baseURL: '', apiKey: '' });

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    const result = await APIService.getIntegrationStatus();
    if (!result.error) setStatus(result);
  };

  const handleERPConfig = async () => {
    setLoading(true);
    await APIService.configureERP(erpConfig);
    await APIService.syncERP();
    await loadStatus();
    setShowERPModal(false);
    setLoading(false);
  };

  const handleHRConfig = async () => {
    setLoading(true);
    await APIService.configureHR(hrConfig);
    await APIService.syncHR();
    await loadStatus();
    setShowHRModal(false);
    setLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">{'🔗 Backend Integrations'}</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 border rounded">
          <div>
            <div className="font-medium">{'ERP Integration'}</div>
            <div className="text-sm text-gray-600">
              Status: {status.erp?.configured ? '✅ Connected' : '❌ Not configured'}
            </div>
          </div>
          <button 
            onClick={() => setShowERPModal(true)}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Configuring...' : 'Configure ERP'}
          </button>
        </div>

        <div className="flex items-center justify-between p-3 border rounded">
          <div>
            <div className="font-medium">{'HR Integration'}</div>
            <div className="text-sm text-gray-600">
              Status: {status.hr?.configured ? '✅ Connected' : '❌ Not configured'}
            </div>
          </div>
          <button 
            onClick={() => setShowHRModal(true)}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Configuring...' : 'Configure HR'}
          </button>
        </div>
      </div>

      {status.lastSync && (
        <div className="mt-4 text-sm text-gray-600">
          Last sync: {new Date(status.lastSync).toLocaleString()}
        </div>
      )}

      {/* ERP Configuration Modal */}
      {showERPModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h4 className="text-lg font-semibold mb-4">{'Configure ERP Integration'}</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">{'Type'}</label>
                <select 
                  value={erpConfig.type}
                  onChange={(e) => setErpConfig({...erpConfig, type: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="SAP">SAP</option>
                  <option value="Oracle">Oracle</option>
                  <option value="NetSuite">NetSuite</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{'Base URL'}</label>
                <input 
                  type="url"
                  value={erpConfig.baseURL}
                  onChange={(e) => setErpConfig({...erpConfig, baseURL: e.target.value})}
                  placeholder="https://api.example.com"
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{'API Key'}</label>
                <input 
                  type="password"
                  value={erpConfig.apiKey}
                  onChange={(e) => setErpConfig({...erpConfig, apiKey: e.target.value})}
                  placeholder="Enter API key"
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleERPConfig} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                {'Save & Sync'}
              </button>
              <button onClick={() => setShowERPModal(false)} className="flex-1 bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">
                {'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HR Configuration Modal */}
      {showHRModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h4 className="text-lg font-semibold mb-4">{'Configure HR Integration'}</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">{'Type'}</label>
                <select 
                  value={hrConfig.type}
                  onChange={(e) => setHrConfig({...hrConfig, type: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="Workday">Workday</option>
                  <option value="BambooHR">BambooHR</option>
                  <option value="ADP">ADP</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{'Base URL'}</label>
                <input 
                  type="url"
                  value={hrConfig.baseURL}
                  onChange={(e) => setHrConfig({...hrConfig, baseURL: e.target.value})}
                  placeholder="https://api.example.com"
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{'API Key'}</label>
                <input 
                  type="password"
                  value={hrConfig.apiKey}
                  onChange={(e) => setHrConfig({...hrConfig, apiKey: e.target.value})}
                  placeholder="Enter API key"
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleHRConfig} className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                {'Save & Sync'}
              </button>
              <button onClick={() => setShowHRModal(false)} className="flex-1 bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">
                {'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default IntegrationPanel;