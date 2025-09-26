import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LoginControls {
  parents_login_enabled: boolean;
  kids_login_enabled: boolean;
  maintenance_message: string;
}

interface SystemMaintenance {
  enabled: boolean;
  message: string;
}

interface SystemSettingUpdate {
  key: string;
  value: any;
  description?: string;
}

export const useSecureSystemSettings = () => {
  const [loginControls, setLoginControls] = useState<LoginControls>({
    parents_login_enabled: true,
    kids_login_enabled: true,
    maintenance_message: ""
  });
  
  const [systemMaintenance, setSystemMaintenance] = useState<SystemMaintenance>({
    enabled: false,
    message: "System is currently under maintenance. Please try again later."
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load login controls using secure function
      const { data: loginData, error: loginError } = await supabase
        .rpc('get_system_setting_secure', { key_name: 'login_controls' });
      
      // Load maintenance settings using secure function
      const { data: maintenanceData, error: maintenanceError } = await supabase
        .rpc('get_system_setting_secure', { key_name: 'system_maintenance' });

      if (loginError) {
        console.error('Error loading login controls:', loginError);
        setError('Failed to load login controls: ' + loginError.message);
      } else if (loginData) {
        setLoginControls(loginData as unknown as LoginControls);
      }
      
      if (maintenanceError) {
        console.error('Error loading maintenance settings:', maintenanceError);
        setError('Failed to load maintenance settings: ' + maintenanceError.message);
      } else if (maintenanceData) {
        setSystemMaintenance(maintenanceData as unknown as SystemMaintenance);
      }
    } catch (error) {
      console.error('Error loading system settings:', error);
      setError('Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async ({ key, value, description }: SystemSettingUpdate): Promise<boolean> => {
    try {
      setUpdateLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .rpc('update_system_setting_secure', {
          key_name: key,
          new_value: value,
          setting_description: description
        });

      if (error) {
        console.error('Error updating system setting:', error);
        setError(`Failed to update ${key}: ${error.message}`);
        return false;
      }

      // Reload settings to get updated values
      await loadSettings();
      return true;
    } catch (error) {
      console.error('Error updating system setting:', error);
      setError('Failed to update system setting');
      return false;
    } finally {
      setUpdateLoading(false);
    }
  };

  const updateLoginControls = async (newControls: LoginControls): Promise<boolean> => {
    return updateSetting({
      key: 'login_controls',
      value: newControls,
      description: 'Controls which user types can log in to the system'
    });
  };

  const updateMaintenanceMode = async (newMaintenance: SystemMaintenance): Promise<boolean> => {
    return updateSetting({
      key: 'system_maintenance',
      value: newMaintenance,
      description: 'System-wide maintenance mode settings'
    });
  };

  const getSensitiveSetting = async (key: string) => {
    try {
      const { data, error } = await supabase
        .rpc('get_system_setting_secure', { key_name: key });

      if (error) {
        console.error(`Error loading sensitive setting ${key}:`, error);
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error(`Error accessing sensitive setting ${key}:`, error);
      throw error;
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return {
    // State
    loginControls,
    systemMaintenance,
    loading,
    error,
    updateLoading,
    
    // Actions
    refetch: loadSettings,
    updateLoginControls,
    updateMaintenanceMode,
    updateSetting,
    getSensitiveSetting
  };
};