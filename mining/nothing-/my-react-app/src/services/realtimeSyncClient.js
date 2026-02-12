class RealtimeSyncClient {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.listeners = new Map();
  }

  connect(userId) {
    // Validate and sanitize userId to prevent SSRF attacks
    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid userId');
    }
    
    // Sanitize userId and encode for URL
    const sanitizedUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '');
    const encodedUserId = encodeURIComponent(sanitizedUserId);
    
    const wsUrl = `${process.env.REACT_APP_WS_URL || 'ws://localhost:5000'}/ws/sync?userId=${encodedUserId}`;
    
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.startHeartbeat();
    };
    
    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Sanitize message data to prevent XSS
        if (data.userId) {
          data.userId = String(data.userId).replace(/[<>"'&]/g, '');
        }
        this.handleMessage(data);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.stopHeartbeat();
      this.attemptReconnect(userId);
    };
  }

  handleMessage(data) {
    switch (data.type) {
      case 'connected':
        // Sanitize userId to prevent XSS
        const sanitizedUserId = data.userId ? String(data.userId).replace(/[<>"'&]/g, '') : 'unknown';
        console.log('Connected with userId:', sanitizedUserId);
        break;
      case 'update':
        this.notifyListeners(data.entityType, data);
        break;
      case 'pong':
        // Heartbeat response
        break;
    }
  }

  syncUpdate(entityType, entityId, action, payload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'sync',
        entityType,
        entityId,
        action,
        payload
      }));
    }
  }

  subscribe(entityType, callback) {
    if (!this.listeners.has(entityType)) {
      this.listeners.set(entityType, []);
    }
    this.listeners.get(entityType).push(callback);
  }

  unsubscribe(entityType, callback) {
    if (this.listeners.has(entityType)) {
      const callbacks = this.listeners.get(entityType);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  notifyListeners(entityType, data) {
    if (this.listeners.has(entityType)) {
      this.listeners.get(entityType).forEach(callback => callback(data));
    }
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
  }

  attemptReconnect(userId) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      // Sanitize userId to prevent XSS in log output
      const sanitizedUserId = userId ? String(userId).replace(/[<>"'&]/g, '') : 'unknown';
      console.log(`Reconnecting in ${delay}ms for user: ${sanitizedUserId}`);
      setTimeout(() => this.connect(userId), delay);
    }
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export default new RealtimeSyncClient();
