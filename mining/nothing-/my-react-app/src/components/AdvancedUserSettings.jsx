import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import TwoFactorAuth from './TwoFactorAuth';

const AdvancedUserSettings = ({ onClose }) => {
  const { isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [settings, setSettings] = useState({
    profile: {
      name: localStorage.getItem('userName') || 'John Doe',
      email: localStorage.getItem('userEmail') || 'john@company.com',
      role: localStorage.getItem('userRole') || 'Manager',
      avatar: localStorage.getItem('userAvatar') || null,
      timezone: localStorage.getItem('timezone') || 'UTC',
      language: localStorage.getItem('language') || 'en'
    },
    security: {
      twoFactor: localStorage.getItem('twoFactor') === 'true',
      sessionTimeout: parseInt(localStorage.getItem('sessionTimeout')) || 30,
      loginAlerts: localStorage.getItem('loginAlerts') !== 'false',
      dataEncryption: localStorage.getItem('dataEncryption') !== 'false'
    },
    notifications: {
      email: localStorage.getItem('emailNotifications') !== 'false',
      push: localStorage.getItem('pushNotifications') !== 'false',
      sms: localStorage.getItem('smsNotifications') === 'true',
      alerts: localStorage.getItem('alertNotifications') !== 'false'
    },
    preferences: {
      theme: isDark ? 'dark' : 'light',
      autoSave: localStorage.getItem('autoSave') !== 'false',
      compactView: localStorage.getItem('compactView') === 'true',
      animations: localStorage.getItem('animations') !== 'false'
    }
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'preferences', label: 'Preferences', icon: '⚙️' }
  ];

  const handleSave = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: { ...prev[section], [key]: value }
    }));
    
    try {
      const storageKey = section === 'profile' && key === 'name' ? 'userName' : 
                        section === 'profile' && key === 'email' ? 'userEmail' :
                        section === 'profile' && key === 'role' ? 'userRole' :
                        section === 'profile' && key === 'avatar' ? 'userAvatar' :
                        section === 'profile' && key === 'timezone' ? 'timezone' :
                        section === 'profile' && key === 'language' ? 'language' :
                        section === 'security' && key === 'twoFactor' ? 'twoFactor' :
                        section === 'security' && key === 'sessionTimeout' ? 'sessionTimeout' :
                        section === 'security' && key === 'loginAlerts' ? 'loginAlerts' :
                        section === 'security' && key === 'dataEncryption' ? 'dataEncryption' :
                        section === 'notifications' && key === 'email' ? 'emailNotifications' :
                        section === 'notifications' && key === 'push' ? 'pushNotifications' :
                        section === 'notifications' && key === 'sms' ? 'smsNotifications' :
                        section === 'notifications' && key === 'alerts' ? 'alertNotifications' :
                        section === 'preferences' && key === 'autoSave' ? 'autoSave' :
                        section === 'preferences' && key === 'compactView' ? 'compactView' :
                        section === 'preferences' && key === 'animations' ? 'animations' : key;
      
      localStorage.setItem(storageKey, value.toString());
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        // Revert the state change
        setSettings(prev => ({
          ...prev,
          [section]: { ...prev[section], [key]: prev[section][key] }
        }));
        throw error;
      }
    }
  };

  const handleAvatarUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file size (limit to 100KB)
      if (file.size > 100000) {
        alert('Image too large. Please choose an image smaller than 100KB.');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const avatar = e.target.result;
          handleSave('profile', 'avatar', avatar);
        } catch (error) {
          if (error.name === 'QuotaExceededError') {
            alert('Storage quota exceeded. Please choose a smaller image.');
          } else {
            alert('Failed to save avatar. Please try again.');
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const renderProfile = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
            {settings.profile.avatar ? (
              <img src={settings.profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              settings.profile.name.charAt(0).toUpperCase()
            )}
          </div>
          <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" id="avatar-upload" />
          <label htmlFor="avatar-upload" className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer text-xs ${
            isDark ? 'bg-gray-700 text-white' : 'bg-white text-gray-700'
          } shadow-lg border-2 border-white`}>
            📷
          </label>
        </div>
        <div>
          <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{settings.profile.name}</h3>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{settings.profile.role}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Full Name</label>
          <input
            type="text"
            value={settings.profile.name}
            onChange={(e) => handleSave('profile', 'name', e.target.value)}
            className={`w-full p-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
          />
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Email</label>
          <input
            type="email"
            value={settings.profile.email}
            onChange={(e) => handleSave('profile', 'email', e.target.value)}
            className={`w-full p-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
          />
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Timezone</label>
          <select
            value={settings.profile.timezone}
            onChange={(e) => handleSave('profile', 'timezone', e.target.value)}
            className={`w-full p-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
          >
            <option value="UTC">UTC</option>
            <option value="EST">Eastern Time</option>
            <option value="PST">Pacific Time</option>
            <option value="GMT">Greenwich Mean Time</option>
          </select>
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Language</label>
          <select
            value={settings.profile.language}
            onChange={(e) => handleSave('profile', 'language', e.target.value)}
            className={`w-full p-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
      <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-blue-50'} border ${isDark ? 'border-gray-700' : 'border-blue-200'}`}>
        <div className="flex items-center space-x-3 mb-3">
          <span className="text-2xl">🛡️</span>
          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Security Status</h3>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <span className={settings.security.twoFactor ? 'text-green-500' : 'text-red-500'}>●</span>
            <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Two-Factor Auth</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={settings.security.dataEncryption ? 'text-green-500' : 'text-red-500'}>●</span>
            <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Data Encryption</span>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Two-Factor Authentication</h4>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Add extra security to your account</p>
          </div>
          <button
            onClick={() => setShowTwoFactor(true)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
            }`}
          >
            {settings.security.twoFactor ? 'Manage' : 'Setup'}
          </button>
        </div>
        
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Session Timeout (minutes)</label>
          <input
            type="number"
            min="5"
            max="120"
            value={settings.security.sessionTimeout}
            onChange={(e) => handleSave('security', 'sessionTimeout', parseInt(e.target.value))}
            className={`w-full p-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Login Alerts</h4>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Get notified of new login attempts</p>
          </div>
          <button
            onClick={() => handleSave('security', 'loginAlerts', !settings.security.loginAlerts)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.security.loginAlerts ? 'bg-green-500' : 'bg-gray-300'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.security.loginAlerts ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-6">
      {[
        { key: 'email', label: 'Email Notifications', desc: 'Receive updates via email', icon: '📧' },
        { key: 'push', label: 'Push Notifications', desc: 'Browser push notifications', icon: '🔔' },
        { key: 'sms', label: 'SMS Notifications', desc: 'Text message alerts', icon: '📱' },
        { key: 'alerts', label: 'System Alerts', desc: 'Critical system notifications', icon: '⚠️' }
      ].map((item) => (
        <div key={item.key} className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{item.icon}</span>
            <div>
              <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.label}</h4>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{item.desc}</p>
            </div>
          </div>
          <button
            onClick={() => handleSave('notifications', item.key, !settings.notifications[item.key])}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.notifications[item.key] ? 'bg-green-500' : 'bg-gray-300'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.notifications[item.key] ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      ))}
    </div>
  );

  const renderPreferences = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{isDark ? '🌙' : '☀️'}</span>
          <div>
            <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Theme</h4>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Choose your preferred theme</p>
          </div>
        </div>
        <button
          onClick={() => {
            toggleTheme();
            handleSave('preferences', 'theme', !isDark ? 'dark' : 'light');
          }}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDark ? 'bg-blue-500' : 'bg-yellow-500'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDark ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>
      
      {[
        { key: 'autoSave', label: 'Auto Save', desc: 'Automatically save your work', icon: '💾' },
        { key: 'compactView', label: 'Compact View', desc: 'Use compact interface layout', icon: '📱' },
        { key: 'animations', label: 'Animations', desc: 'Enable interface animations', icon: '✨' }
      ].map((item) => (
        <div key={item.key} className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{item.icon}</span>
            <div>
              <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.label}</h4>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{item.desc}</p>
            </div>
          </div>
          <button
            onClick={() => handleSave('preferences', item.key, !settings.preferences[item.key])}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.preferences[item.key] ? 'bg-green-500' : 'bg-gray-300'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.preferences[item.key] ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden ${
        isDark ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'
      }`}>
        <div className={`p-6 border-b flex items-center justify-between ${
          isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center space-x-3">
            <span className="text-2xl">⚙️</span>
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Advanced Settings</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-600'
            }`}
          >
            ✕
          </button>
        </div>
        
        <div className="flex">
          <div className={`w-64 p-6 border-r ${
            isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
          }`}>
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all ${
                    activeTab === tab.id
                      ? (isDark ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700')
                      : (isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100')
                  }`}
                >
                  <span className="text-xl">{tab.icon}</span>
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {activeTab === 'profile' && renderProfile()}
            {activeTab === 'security' && renderSecurity()}
            {activeTab === 'notifications' && renderNotifications()}
            {activeTab === 'preferences' && renderPreferences()}
          </div>
        </div>
        
        <div className={`p-6 border-t flex justify-end space-x-3 ${
          isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
        }`}>
          <button
            onClick={onClose}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
      
      {/* Two-Factor Authentication Modal */}
      {showTwoFactor && (
        <TwoFactorAuth onClose={() => setShowTwoFactor(false)} />
      )}
    </div>
  );
};

export default AdvancedUserSettings;