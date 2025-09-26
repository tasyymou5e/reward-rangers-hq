import { useState, useEffect } from 'react';
import { OfflineData } from '@/utils/offlineStorage';

interface UseOfflineStorageResult {
  storedData: OfflineData[];
  storeData: (data: Omit<OfflineData, 'timestamp'>) => Promise<void>;
  syncData: () => Promise<void>;
  isOnline: boolean;
}

export function useOfflineStorage(): UseOfflineStorageResult {
  const [storedData, setStoredData] = useState<OfflineData[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOffline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const storeData = async (data: Omit<OfflineData, 'timestamp'>) => {
    try {
      const { offlineStorage } = await import('@/utils/offlineStorage');
      await offlineStorage.store(data);
      await refreshStoredData();
    } catch (error) {
      console.error('Error storing offline data:', error);
    }
  };

  const refreshStoredData = async () => {
    try {
      const { offlineStorage } = await import('@/utils/offlineStorage');
      const allData = await offlineStorage.getAll();
      setStoredData(allData);
    } catch (error) {
      console.error('Error refreshing stored data:', error);
    }
  };

  const syncData = async () => {
    if (!isOnline) return;
    
    try {
      const { offlineStorage } = await import('@/utils/offlineStorage');
      await offlineStorage.sync();
      await refreshStoredData();
    } catch (error) {
      console.error('Error syncing offline data:', error);
    }
  };

  useEffect(() => {
    refreshStoredData();
  }, []);

  useEffect(() => {
    if (isOnline) {
      syncData();
    }
  }, [isOnline]);

  return {
    storedData,
    storeData,
    syncData,
    isOnline
  };
}