import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';

interface AdminPermission {
  id: string;
  permission: string;
  granted_at: string;
  expires_at?: string;
}

interface SecurityAuditEntry {
  id: string;
  action_type: string;
  resource_type: string;
  resource_id?: string;
  risk_level: string;
  created_at: string;
  user_id?: string;
  family_context?: string;
  metadata: any;
}

interface BulkOperation {
  id: string;
  operation_type: string;
  status: string;
  total_items: number;
  processed_items: number;
  failed_items: number;
  created_at: string;
}

export function useEnhancedAdmin() {
  const { user } = useAuthStore();
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  const [auditTrail, setAuditTrail] = useState<SecurityAuditEntry[]>([]);
  const [bulkOperations, setBulkOperations] = useState<BulkOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user has specific admin permission
  const hasPermission = (permission: string): boolean => {
    return permissions.some(p => 
      p.permission === permission && 
      (!p.expires_at || new Date(p.expires_at) > new Date())
    );
  };

  // Fetch admin permissions
  const fetchPermissions = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.rpc('has_admin_permission', {
        p_user_id: user.id,
        p_permission: 'manage_users'
      });
      
      if (error) throw error;
      
      // If user has admin permissions, fetch detailed permissions
      if (data) {
        const { data: perms, error: permError } = await supabase
          .from('admin_role_permissions')
          .select('*')
          .eq('user_id', user.id);
          
        if (permError) throw permError;
        setPermissions(perms || []);
      }
    } catch (err) {
      console.error('Error fetching permissions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch permissions');
    }
  };

  // Fetch security audit trail
  const fetchAuditTrail = async (filters?: {
    action_type?: string;
    risk_level?: string;
    date_from?: string;
    date_to?: string;
  }) => {
    try {
      let query = supabase
        .from('security_audit_trail')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filters?.action_type) {
        query = query.eq('action_type', filters.action_type);
      }
      if (filters?.risk_level) {
        query = query.eq('risk_level', filters.risk_level);
      }
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setAuditTrail(data || []);
    } catch (err) {
      console.error('Error fetching audit trail:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch audit trail');
    }
  };

  // Fetch bulk operations
  const fetchBulkOperations = async () => {
    try {
      const { data, error } = await supabase
        .from('bulk_operations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setBulkOperations(data || []);
    } catch (err) {
      console.error('Error fetching bulk operations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch bulk operations');
    }
  };

  // Grant admin permission
  const grantPermission = async (userId: string, permission: string, expiresAt?: string) => {
    try {
      const { error } = await supabase
        .from('admin_role_permissions')
        .insert({
          user_id: userId,
          permission: permission as any,
          granted_by: user?.id,
          expires_at: expiresAt
        });

      if (error) throw error;
      
      // Log the permission grant
      await supabase.rpc('log_security_audit', {
        p_action_type: 'permission_granted',
        p_resource_type: 'admin_permission',
        p_resource_id: userId,
        p_risk_level: 'medium',
        p_metadata: { permission, granted_to: userId }
      });

      await fetchPermissions();
    } catch (err) {
      console.error('Error granting permission:', err);
      throw err;
    }
  };

  // Revoke admin permission
  const revokePermission = async (userId: string, permission: string) => {
    try {
      const { error } = await supabase
        .from('admin_role_permissions')
        .delete()
        .eq('user_id', userId)
        .eq('permission', permission as any);

      if (error) throw error;

      // Log the permission revocation
      await supabase.rpc('log_security_audit', {
        p_action_type: 'permission_revoked',
        p_resource_type: 'admin_permission',
        p_resource_id: userId,
        p_risk_level: 'medium',
        p_metadata: { permission, revoked_from: userId }
      });

      await fetchPermissions();
    } catch (err) {
      console.error('Error revoking permission:', err);
      throw err;
    }
  };

  // Create bulk operation
  const createBulkOperation = async (operationType: string, operationData: any) => {
    try {
      const { data, error } = await supabase
        .from('bulk_operations')
        .insert({
          operation_type: operationType,
          initiated_by: user?.id,
          operation_data: operationData,
          total_items: operationData.items?.length || 0
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchBulkOperations();
      return data;
    } catch (err) {
      console.error('Error creating bulk operation:', err);
      throw err;
    }
  };

  useEffect(() => {
    const initialize = async () => {
      if (user) {
        setLoading(true);
        await Promise.all([
          fetchPermissions(),
          fetchAuditTrail(),
          fetchBulkOperations()
        ]);
        setLoading(false);
      }
    };

    initialize();
  }, [user]);

  return {
    permissions,
    auditTrail,
    bulkOperations,
    loading,
    error,
    hasPermission,
    fetchAuditTrail,
    fetchBulkOperations,
    grantPermission,
    revokePermission,
    createBulkOperation,
    refreshData: () => {
      fetchPermissions();
      fetchAuditTrail();
      fetchBulkOperations();
    }
  };
}