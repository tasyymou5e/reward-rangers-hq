import { useState, useEffect, useCallback } from 'react';
import { offlineStorage } from '@/utils/offlineStorage';

interface OfflineData {
  id: string;
  data: any;
  timestamp: Date;
  type: 'chore' | 'achievement' | 'analytics' | 'user_action';
}

export const useOfflineStorage = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineData, setOfflineData] = useState<OfflineData[]>([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineData();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initialize offline storage and load existing data
    initializeStorage();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const initializeStorage = async () => {
    try {
      await offlineStorage.init();
      await loadOfflineData();
    } catch (error) {
      console.error('Failed to initialize offline storage:', error);
    }
  };

  const loadOfflineData = async () => {
    try {
      const allData = await offlineStorage.getAll();
      setOfflineData(allData);
    } catch (error) {
      console.error('Failed to load offline data:', error);
    }
  };

  const storeOfflineData = useCallback(async (
    data: any, 
    type: OfflineData['type']
  ): Promise<string> => {
    try {
      const id = crypto.randomUUID();
      await offlineStorage.store({ id, data, type });
      await loadOfflineData();
      return id;
    } catch (error) {
      console.error('Failed to store offline data:', error);
      throw error;
    }
  }, []);

  const syncOfflineData = useCallback(async () => {
    if (!isOnline || syncing) return;

    try {
      setSyncing(true);
      await offlineStorage.sync();
      await loadOfflineData();
    } catch (error) {
      console.error('Failed to sync offline data:', error);
    } finally {
      setSyncing(false);
    }
  }, [isOnline, syncing]);

  const removeOfflineData = useCallback(async (id: string) => {
    try {
      await offlineStorage.remove(id);
      await loadOfflineData();
    } catch (error) {
      console.error('Failed to remove offline data:', error);
    }
  }, []);

  const getOfflineDataByType = useCallback((type: OfflineData['type']) => {
    return offlineData.filter(item => item.type === type);
  }, [offlineData]);

  const hasOfflineData = offlineData.length > 0;
  const getPendingActionsCount = () => offlineData.length;

  return {
    isOnline,
    syncing,
    hasOfflineData,
    offlineData,
    storeOfflineData,
    syncOfflineData,
    removeOfflineData,
    getOfflineDataByType,
    getPendingActionsCount
  };
};