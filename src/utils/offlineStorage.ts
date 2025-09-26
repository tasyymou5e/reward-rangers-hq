export interface OfflineData {
  id: string;
  data: any;
  timestamp: number;
  type: 'chore' | 'progress' | 'notification' | 'achievement' | 'analytics' | 'user_action';
}

class OfflineStorage {
  private dbName = 'chatterbox-offline';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('offline-data')) {
          const store = db.createObjectStore('offline-data', { keyPath: 'id' });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async store(data: Omit<OfflineData, 'timestamp'>): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['offline-data'], 'readwrite');
    const store = transaction.objectStore('offline-data');
    
    const offlineData: OfflineData = {
      ...data,
      timestamp: Date.now()
    };
    
    return new Promise((resolve, reject) => {
      const request = store.put(offlineData);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getByType(type: OfflineData['type']): Promise<OfflineData[]> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['offline-data'], 'readonly');
    const store = transaction.objectStore('offline-data');
    const index = store.index('type');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(type);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async remove(id: string): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['offline-data'], 'readwrite');
    const store = transaction.objectStore('offline-data');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async sync(): Promise<void> {
    const allData = await this.getAll();
    
    for (const item of allData) {
      try {
        // Attempt to sync with server
        await this.syncItem(item);
        await this.remove(item.id);
      } catch (error) {
        console.warn('Failed to sync item:', item.id, error);
      }
    }
  }

  // Public method for external access
  public async getAll(): Promise<OfflineData[]> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['offline-data'], 'readonly');
    const store = transaction.objectStore('offline-data');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async syncItem(item: OfflineData): Promise<void> {
    // Implementation would depend on your sync strategy
    // This is a placeholder for actual sync logic
    console.log('Syncing item:', item);
  }
}

export const offlineStorage = new OfflineStorage();