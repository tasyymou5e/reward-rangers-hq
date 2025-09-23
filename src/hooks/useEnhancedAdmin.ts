import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

type AdminPermissionType = 'manage_users' | 'manage_families' | 'view_security_logs' | 'manage_system_settings' | 'generate_reports' | 'bulk_operations';

interface AdminPermission {
  id: string;
  user_id: string;
  permission: AdminPermissionType;
  granted_by: string;
  granted_at: string;
  expires_at?: string;
  metadata: any;
}

interface SecurityAuditRecord {
  id: string;
  user_id?: string;
  action_type: string;
  resource_type: string;
  resource_id?: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
  family_context?: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  metadata: any;
  created_at: string;
}

interface BulkOperation {
  id: string;
  operation_type: string;
  initiated_by: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  total_items: number;
  processed_items: number;
  failed_items: number;
  operation_data: any;
  results: any;
  error_log: string[];
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export function useEnhancedAdmin() {
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  const [auditTrail, setAuditTrail] = useState<SecurityAuditRecord[]>([]);
  const [bulkOperations, setBulkOperations] = useState<BulkOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Permission management
  const hasPermission = async (permission: AdminPermissionType): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('has_admin_permission', {
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
        p_permission: permission
      });
      return data || false;
    } catch (err) {
      console.error('Permission check failed:', err);
      return false;
    }
  };

  const grantPermission = async (userId: string, permission: AdminPermissionType, expiresAt?: string) => {
    try {
      const { error } = await supabase.from('admin_role_permissions').insert({
        user_id: userId,
        permission,
        expires_at: expiresAt,
        granted_by: (await supabase.auth.getUser()).data.user?.id
      });
      
      if (error) throw error;
      await loadPermissions();
      return { success: true };
    } catch (err) {
      console.error('Failed to grant permission:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  };

  const revokePermission = async (permissionId: string) => {
    try {
      const { error } = await supabase.from('admin_role_permissions').delete().eq('id', permissionId);
      if (error) throw error;
      await loadPermissions();
      return { success: true };
    } catch (err) {
      console.error('Failed to revoke permission:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  };

  // Security audit trail
  const logSecurityEvent = async (
    actionType: string,
    resourceType: string,
    resourceId?: string,
    oldValues?: any,
    newValues?: any,
    riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low',
    metadata: any = {}
  ) => {
    try {
      const { data, error } = await supabase.rpc('log_security_audit', {
        p_action_type: actionType,
        p_resource_type: resourceType,
        p_resource_id: resourceId,
        p_old_values: oldValues,
        p_new_values: newValues,
        p_risk_level: riskLevel,
        p_metadata: metadata
      });
      
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Failed to log security event:', err);
      throw err;
    }
  };

  // Bulk operations
  const createBulkOperation = async (
    operationType: string,
    operationData: any
  ): Promise<{ success: boolean; operationId?: string; error?: string }> => {
    try {
      const { data, error } = await supabase.from('bulk_operations').insert({
        operation_type: operationType,
        operation_data: operationData,
        initiated_by: (await supabase.auth.getUser()).data.user?.id
      }).select().single();
      
      if (error) throw error;
      await loadBulkOperations();
      return { success: true, operationId: data.id };
    } catch (err) {
      console.error('Failed to create bulk operation:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  };

  const updateBulkOperation = async (
    operationId: string,
    updates: Partial<BulkOperation>
  ) => {
    try {
      const { error } = await supabase.from('bulk_operations')
        .update(updates)
        .eq('id', operationId);
      
      if (error) throw error;
      await loadBulkOperations();
      return { success: true };
    } catch (err) {
      console.error('Failed to update bulk operation:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  };

  // Bulk family creation
  const bulkCreateFamilies = async (familyData: Array<{
    name: string;
    parentEmail: string;
    parentName: string;
    children?: Array<{ name: string; password: string }>;
  }>) => {
    const operationResult = await createBulkOperation('bulk_create_families', {
      families: familyData,
      total_families: familyData.length
    });
    
    if (!operationResult.success) {
      return operationResult;
    }
    
    // Process families one by one
    let processedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];
    
    for (const family of familyData) {
      try {
        // Create family via edge function
        const { data, error } = await supabase.functions.invoke('create-test-family', {
          body: {
            familyName: family.name,
            parentEmail: family.parentEmail,
            parentPassword: 'TempPassword123!', // Admin sets temp password
            parentName: family.parentName,
            children: family.children || []
          }
        });
        
        if (error) throw error;
        processedCount++;
      } catch (err) {
        failedCount++;
        errors.push(`Failed to create family ${family.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
      
      // Update progress
      await updateBulkOperation(operationResult.operationId!, {
        processed_items: processedCount,
        failed_items: failedCount,
        error_log: errors
      });
    }
    
    // Mark as completed
    await updateBulkOperation(operationResult.operationId!, {
      status: failedCount === 0 ? 'completed' : 'failed',
      completed_at: new Date().toISOString()
    });
    
    return {
      success: true,
      operationId: operationResult.operationId,
      processed: processedCount,
      failed: failedCount,
      errors
    };
  };

  // Data loading functions
  const loadPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_role_permissions')
        .select('*')
        .order('granted_at', { ascending: false });
      
      if (error) throw error;
      setPermissions(data || []);
    } catch (err) {
      console.error('Failed to load permissions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load permissions');
    }
  };

  const loadAuditTrail = async (limit = 100) => {
    try {
      const { data, error } = await supabase
        .from('security_audit_trail')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      setAuditTrail(data || []);
    } catch (err) {
      console.error('Failed to load audit trail:', err);
      setError(err instanceof Error ? err.message : 'Failed to load audit trail');
    }
  };

  const loadBulkOperations = async () => {
    try {
      const { data, error } = await supabase
        .from('bulk_operations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setBulkOperations(data || []);
    } catch (err) {
      console.error('Failed to load bulk operations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load bulk operations');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          loadPermissions(),
          loadAuditTrail(),
          loadBulkOperations()
        ]);
      } catch (err) {
        console.error('Failed to load admin data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return {
    // State
    permissions,
    auditTrail,
    bulkOperations,
    loading,
    error,
    
    // Permission management
    hasPermission,
    grantPermission,
    revokePermission,
    
    // Security
    logSecurityEvent,
    
    // Bulk operations
    createBulkOperation,
    updateBulkOperation,
    bulkCreateFamilies,
    
    // Data loading
    loadPermissions,
    loadAuditTrail,
    loadBulkOperations
  };
}