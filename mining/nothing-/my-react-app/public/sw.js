const CACHE_NAME = 'esg-mobile-v1';
const API_CACHE_NAME = 'esg-api-v1';

// Files to cache for offline use
const STATIC_CACHE_FILES = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  '/api/esg/templates',
  '/api/esg/frameworks',
  '/api/phase4/gri/templates'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static files');
        return cache.addAll(STATIC_CACHE_FILES);
      })
      .then(() => {
        console.log('Service Worker installed');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request));
  }
  // Handle static files
  else {
    event.respondWith(handleStaticRequest(request));
  }
});

// Handle API requests with network-first strategy
async function handleAPIRequest(request) {
  const url = new URL(request.url);
  
  // For GET requests, try network first, then cache
  if (request.method === 'GET') {
    try {
      const networkResponse = await fetch(request);
      
      // Cache successful responses for specific endpoints
      if (networkResponse.ok && shouldCacheAPI(url.pathname)) {
        const cache = await caches.open(API_CACHE_NAME);
        cache.put(request, networkResponse.clone());
      }
      
      return networkResponse;
    } catch (error) {
      // Network failed, try cache
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Return offline response
      return new Response(
        JSON.stringify({ 
          error: 'Offline', 
          message: 'This request requires an internet connection' 
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
  
  // For POST/PUT requests, try network or queue for background sync
  else {
    try {
      return await fetch(request);
    } catch (error) {
      // Queue for background sync
      if (request.method === 'POST' && url.pathname === '/api/esg/data') {
        await queueBackgroundSync(request);
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Data queued for sync when online',
            offline: true
          }),
          {
            status: 202,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Offline', 
          message: 'Cannot process this request while offline' 
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
}

// Handle static file requests with cache-first strategy
async function handleStaticRequest(request) {
  // Try cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Try network
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match('/');
      return offlineResponse || new Response('Offline', { status: 503 });
    }
    
    throw error;
  }
}

// Check if API endpoint should be cached
function shouldCacheAPI(pathname) {
  return API_CACHE_PATTERNS.some(pattern => pathname.includes(pattern));
}

// Queue request for background sync
async function queueBackgroundSync(request) {
  try {
    const requestData = {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: await request.text(),
      timestamp: Date.now()
    };
    
    // Store in IndexedDB for background sync
    const db = await openDB();
    const transaction = db.transaction(['sync_queue'], 'readwrite');
    const store = transaction.objectStore('sync_queue');
    const addRequest = store.add(requestData);
    
    await new Promise((resolve, reject) => {
      addRequest.onsuccess = () => resolve();
      addRequest.onerror = () => reject(addRequest.error);
    });
    
    console.log('Request queued for background sync');
  } catch (error) {
    console.error('Failed to queue request for background sync:', error);
  }
}

// Open IndexedDB for background sync queue
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ESGOfflineDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create sync queue store
      if (!db.objectStoreNames.contains('sync_queue')) {
        const store = db.createObjectStore('sync_queue', { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        store.createIndex('timestamp', 'timestamp');
      }
    };
  });
}

// Background sync event
self.addEventListener('sync', (event) => {
  if (event.tag === 'esg-data-sync') {
    event.waitUntil(syncQueuedRequests());
  }
});

// Sync queued requests
async function syncQueuedRequests() {
  try {
    const db = await openDB();
    const transaction = db.transaction(['sync_queue'], 'readonly');
    const store = transaction.objectStore('sync_queue');
    const getAllRequest = store.getAll();
    
    const requests = await new Promise((resolve, reject) => {
      getAllRequest.onsuccess = () => resolve(getAllRequest.result || []);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    });
    
    if (!requests || requests.length === 0) {
      console.log('No requests to sync');
      return;
    }
    
    for (const requestData of requests) {
      try {
        const response = await fetch(requestData.url, {
          method: requestData.method,
          headers: requestData.headers,
          body: requestData.body
        });
        
        if (response.ok) {
          // Remove from queue on successful sync
          const deleteTransaction = db.transaction(['sync_queue'], 'readwrite');
          const deleteStore = deleteTransaction.objectStore('sync_queue');
          const deleteRequest = deleteStore.delete(requestData.id);
          
          await new Promise((resolve, reject) => {
            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = () => reject(deleteRequest.error);
          });
          
          console.log('Background sync successful for request:', requestData.id);
        }
      } catch (error) {
        console.error('Background sync failed for request:', requestData.id, error);
      }
    }
  } catch (error) {
    console.error('Background sync process failed:', error);
  }
}

// Message event for manual sync trigger
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SYNC_NOW') {
    event.waitUntil(syncQueuedRequests());
  }
});

// Push event for notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'ESG data sync completed',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'esg-sync',
    requireInteraction: false
  };
  
  event.waitUntil(
    self.registration.showNotification('ESG Platform', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});