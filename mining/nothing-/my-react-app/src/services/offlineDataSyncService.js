class OfflineDataSyncService {
  constructor() {
    this.STORAGE_KEY = 'esg_offline_data';
    this.SYNC_QUEUE_KEY = 'esg_sync_queue';
    this.isOnline = navigator.onLine;
    this.syncInProgress = false;
    
    this.initializeEventListeners();
    this.registerServiceWorker();
  }

  initializeEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncOfflineData();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
    
    // Sync when page becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.syncOfflineData();
      }
    });
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered for offline support');
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  // Save data offline
  saveOfflineData(data) {
    const offlineEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      data: data,
      synced: false,
      attempts: 0,
      lastAttempt: null
    };

    const existingData = this.getOfflineData();
    existingData.push(offlineEntry);
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingData));
    
    // Add to sync queue
    this.addToSyncQueue(offlineEntry.id);
    
    return offlineEntry.id;
  }

  // Get all offline data
  getOfflineData() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
    } catch (error) {
      console.error('Error reading offline data:', error);
      return [];
    }
  }

  // Get unsynced data
  getUnsyncedData() {
    return this.getOfflineData().filter(item => !item.synced);
  }

  // Add to sync queue
  addToSyncQueue(dataId) {
    const queue = this.getSyncQueue();
    if (!queue.includes(dataId)) {
      queue.push(dataId);
      localStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(queue));
    }
  }

  // Get sync queue
  getSyncQueue() {
    try {
      return JSON.parse(localStorage.getItem(this.SYNC_QUEUE_KEY) || '[]');
    } catch (error) {
      return [];
    }
  }

  // Clear sync queue
  clearSyncQueue() {
    localStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify([]));
  }

  // Sync offline data to server
  async syncOfflineData() {
    if (this.syncInProgress || !this.isOnline) {
      return { success: false, message: 'Sync already in progress or offline' };
    }

    this.syncInProgress = true;
    const unsyncedData = this.getUnsyncedData();
    const results = { synced: 0, failed: 0, errors: [] };

    try {
      for (const item of unsyncedData) {
        try {
          const success = await this.syncSingleItem(item);
          if (success) {
            this.markAsSynced(item.id);
            results.synced++;
          } else {
            this.incrementAttempts(item.id);
            results.failed++;
          }
        } catch (error) {
          console.error(`Sync failed for item ${item.id}:`, error);
          this.incrementAttempts(item.id);
          results.failed++;
          results.errors.push({ id: item.id, error: error.message });
        }
      }

      // Clean up old synced data (keep for 7 days)
      this.cleanupOldData();
      
    } finally {
      this.syncInProgress = false;
    }

    return results;
  }

  // Sync single item to server
  async syncSingleItem(item) {
    try {
      // Validate item data to prevent CSRF attacks
      if (!item || !item.data || !item.id) {
        throw new Error('Invalid item data');
      }
      
      // Get CSRF token and auth token for protection
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || 
                       document.cookie.split('; ').find(row => row.startsWith('csrf-token='))?.split('=')[1];
      const authToken = localStorage.getItem('authToken');
      
      // Require both tokens for enhanced security
      if (!csrfToken || !authToken) {
        throw new Error('Missing security tokens');
      }
      
      const response = await fetch('/api/esg/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          ...item.data,
          offlineId: item.id,
          offlineTimestamp: item.timestamp
        })
      });

      if (response.ok) {
        return true;
      } else {
        console.error(`Server error for item ${item.id}:`, response.status);
        return false;
      }
    } catch (error) {
      console.error(`Network error for item ${item.id}:`, error);
      return false;
    }
  }

  // Mark item as synced
  markAsSynced(itemId) {
    const data = this.getOfflineData();
    const item = data.find(d => d.id === itemId);
    if (item) {
      item.synced = true;
      item.syncedAt = new Date().toISOString();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    }
  }

  // Increment sync attempts
  incrementAttempts(itemId) {
    const data = this.getOfflineData();
    const item = data.find(d => d.id === itemId);
    if (item) {
      item.attempts = (item.attempts || 0) + 1;
      item.lastAttempt = new Date().toISOString();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    }
  }

  // Clean up old synced data
  cleanupOldData() {
    const data = this.getOfflineData();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const filteredData = data.filter(item => {
      if (item.synced) {
        const syncDate = new Date(item.syncedAt || item.timestamp);
        return syncDate > sevenDaysAgo;
      }
      return true; // Keep unsynced data
    });

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredData));
  }

  // Get sync status
  getSyncStatus() {
    const allData = this.getOfflineData();
    const unsynced = allData.filter(item => !item.synced);
    const failed = unsynced.filter(item => (item.attempts || 0) > 3);

    return {
      total: allData.length,
      synced: allData.length - unsynced.length,
      pending: unsynced.length - failed.length,
      failed: failed.length,
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress
    };
  }

  // Force sync specific item
  async forceSyncItem(itemId) {
    const data = this.getOfflineData();
    const item = data.find(d => d.id === itemId);
    
    if (!item) {
      throw new Error('Item not found');
    }

    if (!this.isOnline) {
      throw new Error('Device is offline');
    }

    const success = await this.syncSingleItem(item);
    if (success) {
      this.markAsSynced(itemId);
      return { success: true, message: 'Item synced successfully' };
    } else {
      this.incrementAttempts(itemId);
      throw new Error('Sync failed');
    }
  }

  // Delete offline item
  deleteOfflineItem(itemId) {
    const data = this.getOfflineData();
    const filteredData = data.filter(item => item.id !== itemId);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredData));
  }

  // Generate unique ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  // Export offline data for backup
  exportOfflineData() {
    const data = this.getOfflineData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Sanitize filename to prevent XSS
    const safeDate = new Date().toISOString().split('T')[0].replace(/[^a-zA-Z0-9-]/g, '');
    const sanitizedFilename = `esg_offline_backup_${safeDate}.json`;
    
    const a = document.createElement('a');
    a.href = url;
    a.download = sanitizedFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Import offline data from backup
  async importOfflineData(file) {
    return new Promise((resolve, reject) => {
      // Validate file to prevent XSS
      if (!file || file.type !== 'application/json') {
        reject(new Error('Invalid file type. Please select a JSON file.'));
        return;
      }
      
      // Additional file size validation
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        reject(new Error('File too large. Maximum size is 10MB.'));
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const rawData = e.target.result;
          // Sanitize the raw data to prevent XSS
          const sanitizedData = String(rawData).replace(/[<>"'&]/g, '');
          const importedData = JSON.parse(sanitizedData);
          
          // Validate imported data structure
          if (!Array.isArray(importedData)) {
            throw new Error('Invalid data format');
          }
          
          const existingData = this.getOfflineData();
          
          // Merge data, avoiding duplicates
          const mergedData = [...existingData];
          importedData.forEach(item => {
            if (item && item.id && !mergedData.find(existing => existing.id === item.id)) {
              mergedData.push(item);
            }
          });
          
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(mergedData));
          resolve({ imported: importedData.length, total: mergedData.length });
        } catch (error) {
          reject(new Error('Invalid backup file format'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read backup file'));
      reader.readAsText(file);
    });
  }
}

// Create global instance
const offlineSync = new OfflineDataSyncService();

// Auto-sync every 5 minutes when online
setInterval(() => {
  if (offlineSync.isOnline && !offlineSync.syncInProgress) {
    offlineSync.syncOfflineData();
  }
}, 5 * 60 * 1000);

export default offlineSync;