import React, { useState, useEffect } from 'react';
import './MobileDataCollection.css';

const MobileDataCollection = ({ companyId, userId }) => {
  const [formData, setFormData] = useState({});
  const [currentSection, setCurrentSection] = useState(0);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [savedOffline, setSavedOffline] = useState([]);

  const sections = [
    {
      title: 'Environmental Data',
      icon: '🌱',
      fields: [
        { key: 'scope1Emissions', label: 'Scope 1 Emissions', type: 'number', unit: 'tCO2e', required: true },
        { key: 'scope2Emissions', label: 'Scope 2 Emissions', type: 'number', unit: 'tCO2e', required: true },
        { key: 'energyConsumption', label: 'Energy Consumption', type: 'number', unit: 'MWh', required: true },
        { key: 'waterWithdrawal', label: 'Water Withdrawal', type: 'number', unit: 'm³', required: false },
        { key: 'wasteGenerated', label: 'Waste Generated', type: 'number', unit: 'tonnes', required: false }
      ]
    },
    {
      title: 'Social Data',
      icon: '👥',
      fields: [
        { key: 'totalEmployees', label: 'Total Employees', type: 'number', unit: 'count', required: true },
        { key: 'femaleEmployeesPercentage', label: 'Female Employees %', type: 'number', unit: '%', required: true },
        { key: 'lostTimeInjuryRate', label: 'Lost Time Injury Rate', type: 'number', unit: 'rate', required: true },
        { key: 'trainingHoursPerEmployee', label: 'Training Hours/Employee', type: 'number', unit: 'hours', required: false }
      ]
    },
    {
      title: 'Mining Specific',
      icon: '⛏️',
      fields: [
        { key: 'tailingsFacilities', label: 'Tailings Facilities', type: 'number', unit: 'count', required: true },
        { key: 'landDisturbed', label: 'Land Disturbed', type: 'number', unit: 'hectares', required: true },
        { key: 'landRehabilitated', label: 'Land Rehabilitated', type: 'number', unit: 'hectares', required: true },
        { key: 'localEmploymentRate', label: 'Local Employment %', type: 'number', unit: '%', required: false }
      ]
    }
  ];

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Load offline data
    loadOfflineData();
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadOfflineData = () => {
    const offline = JSON.parse(localStorage.getItem('esg_offline_data') || '[]');
    setSavedOffline(offline);
  };

  const handleInputChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    
    // Auto-save to localStorage
    const autoSave = { ...formData, [key]: value, timestamp: Date.now() };
    localStorage.setItem('esg_form_autosave', JSON.stringify(autoSave));
  };

  // GPS Location capture
  const captureLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          };
          setFormData(prev => ({ ...prev, gpsLocation: location }));
          alert(`Location captured: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`);
        },
        (error) => {
          console.error('GPS Error:', error);
          alert('Could not capture location. Please enable GPS.');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      alert('GPS not supported on this device');
    }
  };

  const saveOffline = () => {
    const offlineEntry = {
      id: Date.now(),
      companyId,
      userId,
      data: formData,
      timestamp: new Date().toISOString(),
      synced: false
    };
    
    const existing = JSON.parse(localStorage.getItem('esg_offline_data') || '[]');
    existing.push(offlineEntry);
    localStorage.setItem('esg_offline_data', JSON.stringify(existing));
    
    setSavedOffline(existing);
    alert('Data saved offline successfully!');
  };

  const syncOfflineData = async () => {
    const offlineData = JSON.parse(localStorage.getItem('esg_offline_data') || '[]');
    const unsynced = offlineData.filter(item => !item.synced);
    
    for (const item of unsynced) {
      try {
        await fetch('/api/esg/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyId: item.companyId,
            userId: item.userId,
            reportingYear: new Date().getFullYear(),
            environmental: item.data,
            social: item.data,
            governance: item.data
          })
        });
        
        item.synced = true;
      } catch (error) {
        console.error('Sync failed for item:', item.id);
      }
    }
    
    localStorage.setItem('esg_offline_data', JSON.stringify(offlineData));
    setSavedOffline(offlineData);
  };

  const nextSection = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const currentSectionData = sections[currentSection];
  const progress = ((currentSection + 1) / sections.length) * 100;

  return (
    <div className="mobile-data-collection">
      {/* Header */}
      <div className="mobile-header">
        <div className="status-bar">
          <span className={`connection-status ${isOffline ? 'offline' : 'online'}`}>
            {isOffline ? '📴 Offline' : '🌐 Online'}
          </span>
          <span className="sync-status">
            {savedOffline.filter(item => !item.synced).length} pending sync
          </span>
        </div>
        
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
        
        <h1 className="section-title">
          <span className="section-icon">{currentSectionData.icon}</span>
          {currentSectionData.title}
        </h1>
      </div>

      {/* Form Fields */}
      <div className="form-container">
        {currentSectionData.fields.map(field => (
          <div key={field.key} className="field-group">
            <label className="field-label">
              {field.label}
              {field.required && <span className="required">*</span>}
              <span className="field-unit">{field.unit}</span>
            </label>
            
            <input
              type={field.type}
              className="field-input touch-optimized"
              value={formData[field.key] || ''}
              onChange={(e) => handleInputChange(field.key, e.target.value)}
              placeholder={`Enter ${field.label.toLowerCase()}`}
              required={field.required}
            />
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="mobile-navigation">
        <button 
          className="nav-button secondary" 
          onClick={prevSection}
          disabled={currentSection === 0}
        >
          ← Previous
        </button>
        
        <div className="nav-center">
          <button className="save-offline-button" onClick={saveOffline}>
            💾 Save Offline
          </button>
          
          <button className="gps-button" onClick={captureLocation}>
            📍 Capture GPS
          </button>
          
          {!isOffline && savedOffline.some(item => !item.synced) && (
            <button className="sync-button" onClick={syncOfflineData}>
              🔄 Sync Data
            </button>
          )}
        </div>
        
        <button 
          className="nav-button primary" 
          onClick={nextSection}
          disabled={currentSection === sections.length - 1}
        >
          Next →
        </button>
      </div>

      {/* Section Indicators */}
      <div className="section-indicators">
        {sections.map((section, index) => (
          <div 
            key={index}
            className={`indicator ${index === currentSection ? 'active' : ''} ${index < currentSection ? 'completed' : ''}`}
            onClick={() => setCurrentSection(index)}
          >
            <span className="indicator-icon">{section.icon}</span>
            <span className="indicator-label">{section.title}</span>
          </div>
        ))}
      </div>

      {/* Offline Data List */}
      {savedOffline.length > 0 && (
        <div className="offline-data-list">
          <h3>Saved Offline Data ({savedOffline.length})</h3>
          {savedOffline.map(item => (
            <div key={item.id} className={`offline-item ${item.synced ? 'synced' : 'pending'}`}>
              <span className="offline-timestamp">
                {new Date(item.timestamp).toLocaleString()}
              </span>
              <span className="offline-status">
                {item.synced ? '✅ Synced' : '⏳ Pending'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MobileDataCollection;