import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/themeUtils';
import TwoFactorSetup from './TwoFactorSetup';
import EncryptionSetup from './EncryptionSetup';
import SecureStorage from '../utils/secureStorage';
import ProfileSettings from './ProfileSettings';

const SecuritySettings = ({ onClose }) => {
  const { isDark } = useTheme();
  const theme = getThemeClasses(isDark);
  const [activeTab, setActiveTab] = useState('profile'); // Default to profile as requested
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(localStorage.getItem('2fa_enabled') === 'true');
  const [twoFAMethod, setTwoFAMethod] = useState(localStorage.getItem('2fa_method') || 'none');
  const [showEncryptionSetup, setShowEncryptionSetup] = useState(false);
  const [isEncryptionEnabled, setIsEncryptionEnabled] = useState(SecureStorage.isEncryptionEnabled());

  const handle2FAToggle = () => {
    if (is2FAEnabled) {
      if (window.confirm('Are you sure you want to disable Two-Factor Authentication?')) {
        localStorage.removeItem('2fa_enabled');
        localStorage.removeItem('2fa_method');
        setIs2FAEnabled(false);
        setTwoFAMethod('none');
      }
    } else {
      setShow2FASetup(true);
    }
  };

  const handle2FAComplete = () => {
    setShow2FASetup(false);
    setIs2FAEnabled(true);
    setTwoFAMethod(localStorage.getItem('2fa_method'));
  };

  const handleEncryptionToggle = () => {
    if (isEncryptionEnabled) {
      if (window.confirm('Disabling encryption will decrypt all data. Continue?')) {
        localStorage.removeItem('encryption_enabled');
        setIsEncryptionEnabled(false);
        alert('Encryption disabled. Data is no longer encrypted.');
      }
    } else {
      setShowEncryptionSetup(true);
    }
  };

  const handleEncryptionComplete = () => {
    setShowEncryptionSetup(false);
    setIsEncryptionEnabled(true);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className={`max-w-4xl w-full max-h-[90vh] overflow-hidden ${theme.bg.card} rounded-xl shadow-2xl flex flex-col`}>
          {/* Header */}
          <div className="p-6 bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3 text-gray-800">
                  <span className="text-3xl">⚙️</span>
                  User Settings
                </h2>
                <p className="text-gray-600 mt-1">Manage your profile and security preferences</p>
              </div>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                <span className="text-2xl">×</span>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex space-x-6 mt-6 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('profile')}
                className={`pb-3 px-1 font-medium text-sm transition-colors relative ${activeTab === 'profile' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Profile Info
                {activeTab === 'profile' && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`pb-3 px-1 font-medium text-sm transition-colors relative ${activeTab === 'security' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Security & Privacy
                {activeTab === 'security' && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></span>
                )}
              </button>
            </div>
          </div>

          {/* Content Area - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'profile' ? (
              <ProfileSettings />
            ) : (
              <div className="space-y-6">
                {/* Two-Factor Authentication */}
                <div className={`p-6 rounded-lg border ${theme.border.primary} ${theme.bg.subtle}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="text-3xl bg-white p-2 rounded-lg shadow-sm">🔐</div>
                      <div>
                        <h3 className={`text-lg font-semibold ${theme.text.primary}`}>
                          Two-Factor Authentication
                        </h3>
                        <p className={`text-sm ${theme.text.secondary} mt-1`}>
                          Add an extra layer of security to your account
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handle2FAToggle}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${is2FAEnabled
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                    >
                      {is2FAEnabled ? 'Disable' : 'Enable'}
                    </button>
                  </div>

                  {is2FAEnabled && (
                    <div className={`mt-4 p-4 rounded-lg ${isDark ? 'bg-green-900/20' : 'bg-green-50'} border border-green-200`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-green-600 text-xl">✓</span>
                        <span className={`font-semibold ${theme.text.primary}`}>2FA is Active</span>
                      </div>
                      <p className={`text-sm ${theme.text.secondary}`}>
                        Method: {twoFAMethod === 'email' ? '📧 Email' : twoFAMethod === 'sms' ? '📱 SMS' : '🔐 Authenticator App'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Client-Side Encryption */}
                <div className={`p-6 rounded-lg border ${theme.border.primary} ${theme.bg.subtle}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="text-3xl bg-white p-2 rounded-lg shadow-sm">🛡️</div>
                      <div>
                        <h3 className={`text-lg font-semibold ${theme.text.primary}`}>
                          Client-Side Encryption
                        </h3>
                        <p className={`text-sm ${theme.text.secondary} mt-1`}>
                          AES-256 encryption for all sensitive data stored locally
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleEncryptionToggle}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${isEncryptionEnabled
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                    >
                      {isEncryptionEnabled ? 'Disable' : 'Enable'}
                    </button>
                  </div>

                  {isEncryptionEnabled && (
                    <div className={`mt-4 p-4 rounded-lg ${isDark ? 'bg-green-900/20' : 'bg-green-50'} border border-green-200`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-green-600 text-xl">✓</span>
                        <span className={`font-semibold ${theme.text.primary}`}>Encryption Active</span>
                      </div>
                      <p className={`text-sm ${theme.text.secondary}`}>
                        All data is encrypted with AES-256 before storage
                      </p>
                    </div>
                  )}
                </div>

                {/* Password Settings */}
                <div className={`p-6 rounded-lg border ${theme.border.primary} ${theme.bg.subtle}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="text-3xl bg-white p-2 rounded-lg shadow-sm">🔑</div>
                      <div>
                        <h3 className={`text-lg font-semibold ${theme.text.primary}`}>Password</h3>
                        <p className={`text-sm ${theme.text.secondary} mt-1`}>
                          Change your password regularly to keep your account secure
                        </p>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
                      Change
                    </button>
                  </div>
                </div>

                {/* Session Management */}
                <div className={`p-6 rounded-lg border ${theme.border.primary} ${theme.bg.subtle}`}>
                  <div className="flex items-start gap-4 mb-4">
                    <div className="text-3xl bg-white p-2 rounded-lg shadow-sm">💻</div>
                    <div>
                      <h3 className={`text-lg font-semibold ${theme.text.primary}`}>Active Sessions</h3>
                      <p className={`text-sm ${theme.text.secondary} mt-1`}>
                        Manage devices where you're currently logged in
                      </p>
                    </div>
                  </div>
                  <div className={`p-4 rounded-lg bg-white border border-gray-200 flex items-center justify-between`}>
                    <div>
                      <p className="font-semibold text-gray-800">Current Session</p>
                      <p className="text-xs text-gray-500">Last active: Just now</p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">Active</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {show2FASetup && (
        <TwoFactorSetup
          onComplete={handle2FAComplete}
          onCancel={() => setShow2FASetup(false)}
          userEmail={localStorage.getItem('currentUser')}
        />
      )}

      {showEncryptionSetup && (
        <EncryptionSetup
          onComplete={handleEncryptionComplete}
          onCancel={() => setShowEncryptionSetup(false)}
        />
      )}
    </>
  );
};

export default SecuritySettings;
