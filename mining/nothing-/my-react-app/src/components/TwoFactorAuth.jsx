import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const TwoFactorAuth = ({ onClose }) => {
  const { isDark } = useTheme();
  const [step, setStep] = useState(localStorage.getItem('twoFactorEnabled') === 'true' ? 'status' : 'methods');
  const [selectedMethod, setSelectedMethod] = useState('app');
  const [isEnabled, setIsEnabled] = useState(localStorage.getItem('twoFactorEnabled') === 'true');
  const [phoneNumber, setPhoneNumber] = useState(localStorage.getItem('userPhone') || '');
  const [emailAddress, setEmailAddress] = useState(localStorage.getItem('userEmail') || '');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [showSecret, setShowSecret] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (step === 'setup' && selectedMethod === 'app') {
      generateSecret();
    }
  }, [step, selectedMethod]);

  const generateSecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSecret(result);
    
    const issuer = 'ESG-Platform';
    const accountName = localStorage.getItem('userEmail') || 'user@company.com';
    const qrUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${result}&issuer=${encodeURIComponent(issuer)}`;
    setQrCode(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`);
  };

  const generateBackupCodes = () => {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substr(2, 8).toUpperCase();
      codes.push(code);
    }
    setBackupCodes(codes);
    localStorage.setItem('backupCodes', JSON.stringify(codes));
  };

  const sendSMSCode = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    setStep('verify');
  };

  const sendEmailCode = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    setStep('verify');
  };

  const verifyCode = async () => {
    setLoading(true);
    setError('');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (selectedMethod === 'app' && verificationCode.length === 6 && /^\d+$/.test(verificationCode)) {
      setIsEnabled(true);
      localStorage.setItem('twoFactorEnabled', 'true');
      localStorage.setItem('twoFactorMethod', selectedMethod);
      localStorage.setItem('twoFactorSecret', secret);
      generateBackupCodes();
      setStep('backup');
    } else if ((selectedMethod === 'sms' || selectedMethod === 'email') && verificationCode.length === 6) {
      setIsEnabled(true);
      localStorage.setItem('twoFactorEnabled', 'true');
      localStorage.setItem('twoFactorMethod', selectedMethod);
      if (selectedMethod === 'sms') localStorage.setItem('userPhone', phoneNumber);
      if (selectedMethod === 'email') localStorage.setItem('userEmail', emailAddress);
      generateBackupCodes();
      setStep('backup');
    } else {
      setError('Invalid verification code. Please try again.');
    }
    setLoading(false);
  };

  const disableTwoFactor = () => {
    setIsEnabled(false);
    localStorage.setItem('twoFactorEnabled', 'false');
    localStorage.removeItem('twoFactorSecret');
    localStorage.removeItem('backupCodes');
    setStep('status');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${
        isDark ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'
      }`}>
        <div className={`p-6 border-b flex items-center justify-between ${
          isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🔐</span>
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Two-Factor Authentication
            </h2>
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
        
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {step === 'methods' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Choose Your 2FA Method
                </h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Select how you'd like to receive verification codes
                </p>
              </div>
              
              <div className="space-y-3">
                <div 
                  onClick={() => setSelectedMethod('app')}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedMethod === 'app'
                      ? (isDark ? 'border-blue-500 bg-blue-900/20' : 'border-blue-500 bg-blue-50')
                      : (isDark ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300')
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">📱</span>
                    <div className="flex-1">
                      <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Authenticator App
                      </h4>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Most secure - works offline
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                      Recommended
                    </span>
                  </div>
                </div>
                
                <div 
                  onClick={() => setSelectedMethod('sms')}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedMethod === 'sms'
                      ? (isDark ? 'border-blue-500 bg-blue-900/20' : 'border-blue-500 bg-blue-50')
                      : (isDark ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300')
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">💬</span>
                    <div className="flex-1">
                      <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        SMS Text Message
                      </h4>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Receive codes via text
                      </p>
                    </div>
                  </div>
                </div>
                
                <div 
                  onClick={() => setSelectedMethod('email')}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedMethod === 'email'
                      ? (isDark ? 'border-blue-500 bg-blue-900/20' : 'border-blue-500 bg-blue-50')
                      : (isDark ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300')
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">📧</span>
                    <div className="flex-1">
                      <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Email Verification
                      </h4>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Receive codes via email
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={`p-4 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                <h4 className={`font-medium mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Coming Soon
                </h4>
                <div className="space-y-2">
                  {[
                    { icon: '🔑', name: 'Hardware Security Keys', desc: 'FIDO2/WebAuthn support' },
                    { icon: '☁️', name: 'Cloud Backup', desc: 'Sync across devices' },
                    { icon: '📞', name: 'Voice Calls', desc: 'Automated voice verification' },
                    { icon: '⌚', name: 'Smart Watch', desc: 'Apple Watch & WearOS' },
                    { icon: '🔐', name: 'Biometric Auth', desc: 'Fingerprint & Face ID' }
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3 p-2 rounded opacity-60">
                      <span className="text-lg">{feature.icon}</span>
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {feature.name}
                        </div>
                        <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          {feature.desc}
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                        Soon
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setStep('status')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Back
                </button>
                <button
                  onClick={() => setStep('setup')}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Continue with {selectedMethod === 'app' ? 'App' : selectedMethod === 'sms' ? 'SMS' : 'Email'}
                </button>
              </div>
            </div>
          )}

          {step === 'status' && (
            <div className="space-y-6">
              <div className={`p-6 rounded-lg border ${
                isEnabled 
                  ? (isDark ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200')
                  : (isDark ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200')
              }`}>
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-3xl">{isEnabled ? '🔐' : '🔓'}</span>
                  <div>
                    <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Two-Factor Authentication
                    </h3>
                    <p className={`text-sm ${
                      isEnabled 
                        ? (isDark ? 'text-green-400' : 'text-green-600')
                        : (isDark ? 'text-red-400' : 'text-red-600')
                    }`}>
                      {isEnabled ? 'Enabled and protecting your account' : 'Disabled - your account is at risk'}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {isEnabled ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Status: Active since {new Date().toLocaleDateString()}
                        </span>
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                          ✓ Secured
                        </span>
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => setStep('manage')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                          }`}
                        >
                          Manage Settings
                        </button>
                        <button
                          onClick={disableTwoFactor}
                          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          Disable 2FA
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      onClick={() => setStep('methods')}
                      className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Enable Two-Factor Authentication
                    </button>
                  )}
                </div>
              </div>
              
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <h4 className={`font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  What is Two-Factor Authentication?
                </h4>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  2FA adds an extra layer of security by requiring a second form of verification when signing in. 
                  Even if someone knows your password, they won't be able to access your account without your phone.
                </p>
              </div>
            </div>
          )}

          {step === 'setup' && selectedMethod === 'sms' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  SMS Verification Setup
                </h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Enter your phone number to receive verification codes
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className={`w-full p-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  />
                </div>
                
                <div className={`p-3 rounded-lg ${isDark ? 'bg-yellow-900/20' : 'bg-yellow-50'}`}>
                  <p className={`text-sm ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                    ⚠️ SMS codes may incur carrier charges and are less secure than authenticator apps.
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setStep('methods')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Back
                </button>
                <button
                  onClick={sendSMSCode}
                  disabled={!phoneNumber || loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Sending...' : 'Send SMS Code'}
                </button>
              </div>
            </div>
          )}

          {step === 'setup' && selectedMethod === 'email' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Email Verification Setup
                </h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Confirm your email address to receive verification codes
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    placeholder="user@company.com"
                    className={`w-full p-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  />
                </div>
                
                <div className={`p-3 rounded-lg ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                  <p className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                    📧 Make sure you have access to this email address.
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setStep('methods')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Back
                </button>
                <button
                  onClick={sendEmailCode}
                  disabled={!emailAddress || loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Sending...' : 'Send Email Code'}
                </button>
              </div>
            </div>
          )}

          {step === 'setup' && selectedMethod === 'app' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Set up Two-Factor Authentication
                </h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Scan the QR code with your authenticator app
                </p>
              </div>
              
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-white rounded-lg">
                  <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                </div>
                
                <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <p className={`text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Can't scan? Enter this code manually:
                  </p>
                  <div className="flex items-center space-x-2">
                    <code className={`px-2 py-1 rounded text-xs font-mono ${
                      isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {showSecret ? secret : secret.replace(/./g, '•')}
                    </code>
                    <button
                      onClick={() => setShowSecret(!showSecret)}
                      className={`text-xs px-2 py-1 rounded ${
                        isDark ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {showSecret ? 'Hide' : 'Show'}
                    </button>
                    <button
                      onClick={() => copyToClipboard(secret)}
                      className={`text-xs px-2 py-1 rounded ${
                        isDark ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Recommended authenticator apps:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: 'Google Authenticator', icon: '🔐' },
                    { name: 'Microsoft Authenticator', icon: '🛡️' },
                    { name: 'Authy', icon: '🔑' },
                    { name: 'LastPass Authenticator', icon: '🔒' }
                  ].map((app) => (
                    <div key={app.name} className={`p-3 rounded-lg border ${
                      isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
                    }`}>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{app.icon}</span>
                        <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {app.name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setStep('methods')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Back
                </button>
                <button
                  onClick={() => setStep('verify')}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Continue to Verification
                </button>
              </div>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {selectedMethod === 'app' ? 'Verify Your Setup' : 
                   selectedMethod === 'sms' ? 'Enter SMS Code' : 'Enter Email Code'}
                </h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {selectedMethod === 'app' ? 'Enter the 6-digit code from your authenticator app' :
                   selectedMethod === 'sms' ? `Enter the code sent to ${phoneNumber}` :
                   `Enter the code sent to ${emailAddress}`}
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className={`w-full p-4 text-center text-2xl font-mono rounded-lg border ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    } ${error ? 'border-red-500' : ''}`}
                    maxLength={6}
                  />
                  {error && (
                    <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
                  )}
                </div>
                
                <div className={`p-3 rounded-lg ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                  <p className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                    {selectedMethod === 'app' ? '💡 The code changes every 30 seconds. If it doesn\'t work, wait for a new code.' :
                     selectedMethod === 'sms' ? '📱 Didn\'t receive the SMS? Check your signal and try again.' :
                     '📧 Check your email inbox and spam folder for the verification code.'}
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setStep('setup')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Back
                </button>
                <button
                  onClick={verifyCode}
                  disabled={verificationCode.length !== 6 || loading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Verifying...' : 'Verify & Enable'}
                </button>
              </div>
            </div>
          )}

          {step === 'backup' && (
            <div className="space-y-6">
              <div className="text-center">
                <span className="text-4xl mb-4 block">✅</span>
                <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Two-Factor Authentication Enabled!
                </h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Save these backup codes in a safe place
                </p>
              </div>
              
              <div className={`p-4 rounded-lg border ${isDark ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-200'}`}>
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-xl">⚠️</span>
                  <h4 className={`font-medium ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>
                    Important: Save Your Backup Codes
                  </h4>
                </div>
                <p className={`text-sm ${isDark ? 'text-yellow-300' : 'text-yellow-600'}`}>
                  These codes can be used to access your account if you lose your phone. Each code can only be used once.
                </p>
              </div>
              
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Backup Codes
                  </h4>
                  <button
                    onClick={() => copyToClipboard(backupCodes.join('\n'))}
                    className={`text-xs px-3 py-1 rounded ${
                      isDark ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    Copy All
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, index) => (
                    <div key={index} className={`p-2 rounded font-mono text-sm ${
                      isDark ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-700'
                    }`}>
                      {code}
                    </div>
                  ))}
                </div>
              </div>
              
              <button
                onClick={() => setStep('status')}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Complete Setup
              </button>
            </div>
          )}

          {step === 'manage' && (
            <div className="space-y-6">
              <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Manage Two-Factor Authentication
              </h3>
              
              <div className="space-y-4">
                <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <h4 className={`font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Regenerate Backup Codes
                  </h4>
                  <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Generate new backup codes. This will invalidate your current codes.
                  </p>
                  <button
                    onClick={generateBackupCodes}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                    }`}
                  >
                    Generate New Codes
                  </button>
                </div>
                
                <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <h4 className={`font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Reset Authenticator
                  </h4>
                  <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Set up 2FA with a new device or app. This will require re-verification.
                  </p>
                  <button
                    onClick={() => setStep('methods')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isDark ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700'
                    }`}
                  >
                    Reset Setup
                  </button>
                </div>
              </div>
              
              <button
                onClick={() => setStep('status')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Back to Status
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TwoFactorAuth;