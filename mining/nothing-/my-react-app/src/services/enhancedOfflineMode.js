// Enhanced Offline Mode with Better Sync
class EnhancedOfflineMode {
  constructor() {
    this.dbName = 'ESGOfflineDB';
    this.version = 2;
    this.db = null;
    this.syncQueue = [];
    this.isOnline = navigator.onLine;
    this.initDB();
    this.setupEventListeners();
  }

  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains('data')) {
          db.createObjectStore('data', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
          cacheStore.createIndex('timestamp', 'timestamp');
        }
      };
    });
  }

  setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncData();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  async saveOffline(storeName, data) {
    const tx = this.db.transaction([storeName], 'readwrite');
    const store = tx.objectStore(storeName);
    return store.add({ ...data, timestamp: Date.now() });
  }

  async getOfflineData(storeName) {
    const tx = this.db.transaction([storeName], 'readonly');
    const store = tx.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async addToSyncQueue(action, data) {
    await this.saveOffline('syncQueue', { action, data, timestamp: Date.now() });
  }

  async syncData() {
    if (!this.isOnline) return;
    
    const queue = await this.getOfflineData('syncQueue');
    
    for (const item of queue) {
      try {
        await this.syncItem(item);
        await this.removeFromQueue(item.id);
      } catch (error) {
        console.error('Sync failed:', error);
      }
    }
  }

  async syncItem(item) {
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    
    if (!response.ok) throw new Error('Sync failed');
    return response.json();
  }

  async removeFromQueue(id) {
    const tx = this.db.transaction(['syncQueue'], 'readwrite');
    const store = tx.objectStore('syncQueue');
    return store.delete(id);
  }

  async cacheData(key, data, ttl = 3600000) {
    const tx = this.db.transaction(['cache'], 'readwrite');
    const store = tx.objectStore('cache');
    return store.put({
      key,
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl
    });
  }

  async getCachedData(key) {
    const tx = this.db.transaction(['cache'], 'readonly');
    const store = tx.objectStore('cache');
    
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result;
        if (!result || Date.now() > result.expiry) {
          resolve(null);
        } else {
          resolve(result.data);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearExpiredCache() {
    const tx = this.db.transaction(['cache'], 'readwrite');
    const store = tx.objectStore('cache');
    const index = store.index('timestamp');
    
    const request = index.openCursor();
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        if (Date.now() > cursor.value.expiry) {
          cursor.delete();
        }
        cursor.continue();
      }
    };
  }

  getStatus() {
    return {
      online: this.isOnline,
      syncQueueLength: this.syncQueue.length,
      lastSync: localStorage.getItem('lastSync')
    };
  }
}

export default new EnhancedOfflineMode();
