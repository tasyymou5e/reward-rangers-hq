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
      
      // Load login controls using secure function with enhanced error handling
      const { data: loginData, error: loginError } = await supabase
        .rpc('get_system_setting_secure', { key_name: 'login_controls' });
      
      // Load maintenance settings using secure function with enhanced error handling
      const { data: maintenanceData, error: maintenanceError } = await supabase
        .rpc('get_system_setting_secure', { key_name: 'system_maintenance' });

      if (loginError) {
        console.error('Error loading login controls:', loginError);
        setError(`Failed to load login settings: ${loginError.message}`);
        // Use safe defaults
        setLoginControls({
          parents_login_enabled: true,
          kids_login_enabled: true,
          maintenance_message: ""
        });
      } else if (loginData) {
        try {
          setLoginControls(loginData as unknown as LoginControls);
        } catch (parseError) {
          console.error('Error parsing login controls:', parseError);
          setError('Invalid login settings format');
          setLoginControls({
            parents_login_enabled: true,
            kids_login_enabled: true,
            maintenance_message: ""
          });
        }
      }
      
      if (maintenanceError) {
        console.error('Error loading maintenance settings:', maintenanceError);
        setError(prevError => prevError ? 
          `${prevError}; Failed to load maintenance settings: ${maintenanceError.message}` : 
          `Failed to load maintenance settings: ${maintenanceError.message}`
        );
        // Use safe defaults
        setSystemMaintenance({
          enabled: false,
          message: "System is currently under maintenance. Please try again later."
        });
      } else if (maintenanceData) {
        try {
          setSystemMaintenance(maintenanceData as unknown as SystemMaintenance);
        } catch (parseError) {
          console.error('Error parsing maintenance settings:', parseError);
          setError(prevError => prevError ? 
            `${prevError}; Invalid maintenance settings format` : 
            'Invalid maintenance settings format'
          );
          setSystemMaintenance({
            enabled: false,
            message: "System is currently under maintenance. Please try again later."
          });
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error loading system settings:', error);
      setError(`Critical error loading system settings: ${errorMessage}`);
      
      // Set safe defaults for all settings on critical error
      setLoginControls({
        parents_login_enabled: true,
        kids_login_enabled: true,
        maintenance_message: ""
      });
      setSystemMaintenance({
        enabled: false,
        message: "System is currently under maintenance. Please try again later."
      });
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