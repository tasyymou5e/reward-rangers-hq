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

export const useSystemSettings = () => {
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

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load login controls
      const { data: loginData, error: loginError } = await supabase
        .rpc('get_system_setting', { key_name: 'login_controls' });
      
      // Load maintenance settings
      const { data: maintenanceData, error: maintenanceError } = await supabase
        .rpc('get_system_setting', { key_name: 'system_maintenance' });

      if (loginError) {
        console.error('Error loading login controls:', loginError);
        // Continue with defaults
      } else if (loginData) {
        setLoginControls(loginData as unknown as LoginControls);
      }
      
      if (maintenanceError) {
        console.error('Error loading maintenance settings:', maintenanceError);
        // Continue with defaults
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

  useEffect(() => {
    loadSettings();
  }, []);

  return {
    loginControls,
    systemMaintenance,
    loading,
    error,
    refetch: loadSettings
  };
};