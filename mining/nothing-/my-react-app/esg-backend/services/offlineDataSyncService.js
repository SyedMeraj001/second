const EventEmitter = require('events');

class OfflineDataSyncService extends EventEmitter {
  constructor() {
    super();
    this.syncQueue = [];
    this.isOnline = true;
    this.syncInProgress = false;
  }

  // Add data to sync queue
  queueForSync(data) {
    const syncItem = {
      id: Date.now() + Math.random(),
      data,
      timestamp: new Date().toISOString(),
      attempts: 0,
      maxAttempts: 3
    };
    
    this.syncQueue.push(syncItem);
    this.emit('queued', syncItem);
    
    if (this.isOnline && !this.syncInProgress) {
      this.processSyncQueue();
    }
    
    return syncItem.id;
  }

  // Process sync queue
  async processSyncQueue() {
    if (this.syncInProgress || this.syncQueue.length === 0) return;
    
    this.syncInProgress = true;
    this.emit('syncStarted');
    
    const itemsToSync = [...this.syncQueue];
    
    for (const item of itemsToSync) {
      try {
        await this.syncItem(item);
        this.removeFromQueue(item.id);
        this.emit('itemSynced', item);
      } catch (error) {
        item.attempts++;
        if (item.attempts >= item.maxAttempts) {
          this.removeFromQueue(item.id);
          this.emit('itemFailed', item, error);
        }
      }
    }
    
    this.syncInProgress = false;
    this.emit('syncCompleted');
  }

  // Sync individual item
  async syncItem(item) {
    const response = await fetch('/api/esg/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item.data)
    });
    
    if (!response.ok) {
      throw new Error(`Sync failed: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Remove item from queue
  removeFromQueue(id) {
    this.syncQueue = this.syncQueue.filter(item => item.id !== id);
  }

  // Set online status
  setOnlineStatus(isOnline) {
    this.isOnline = isOnline;
    this.emit('statusChanged', isOnline);
    
    if (isOnline && this.syncQueue.length > 0) {
      this.processSyncQueue();
    }
  }

  // Get queue status
  getQueueStatus() {
    return {
      pending: this.syncQueue.length,
      syncing: this.syncInProgress,
      online: this.isOnline
    };
  }
}

module.exports = new OfflineDataSyncService();