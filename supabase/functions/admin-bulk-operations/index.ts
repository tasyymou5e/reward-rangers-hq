import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

interface BulkOperationRequest {
  operationType: 'create_families' | 'create_users' | 'update_permissions' | 'export_data';
  data: any[];
  options?: {
    chunkSize?: number;
    validateOnly?: boolean;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Initialize admin client for privileged operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Unauthorized', { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response('Invalid token', { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    // Check admin permissions
    const { data: hasPermission, error: permError } = await supabaseClient.rpc(
      'has_admin_permission',
      { p_user_id: user.id, p_permission: 'bulk_operations' }
    );

    if (permError || !hasPermission) {
      return new Response('Insufficient permissions', { 
        status: 403, 
        headers: corsHeaders 
      });
    }

    const { operationType, data, options = {} }: BulkOperationRequest = await req.json();
    const { chunkSize = 50, validateOnly = false } = options;

    // Create bulk operation record
    const { data: bulkOp, error: bulkOpError } = await supabaseClient
      .from('bulk_operations')
      .insert({
        operation_type: operationType,
        initiated_by: user.id,
        status: validateOnly ? 'pending' : 'running',
        total_items: data.length,
        operation_data: { items: data, options }
      })
      .select()
      .single();

    if (bulkOpError) {
      throw new Error(`Failed to create bulk operation: ${bulkOpError.message}`);
    }

    const results = {
      operation_id: bulkOp.id,
      total_items: data.length,
      processed_items: 0,
      failed_items: 0,
      errors: [] as string[],
      created_items: [] as any[]
    };

    // If validation only, return early
    if (validateOnly) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Validation completed',
        results
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Process in chunks
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      
      try {
        switch (operationType) {
          case 'create_families':
            await processFamilyCreation(chunk, supabaseAdmin, user.id, results);
            break;
          case 'create_users':
            await processUserCreation(chunk, supabaseAdmin, user.id, results);
            break;
          case 'update_permissions':
            await processPermissionUpdates(chunk, supabaseClient, user.id, results);
            break;
          case 'export_data':
            await processDataExport(chunk, supabaseClient, user.id, results);
            break;
          default:
            throw new Error(`Unknown operation type: ${operationType}`);
        }
      } catch (chunkError) {
        console.error(`Error processing chunk ${i}-${i + chunkSize}:`, chunkError);
        results.errors.push(`Chunk ${i}-${i + chunkSize}: ${chunkError.message}`);
        results.failed_items += chunk.length;
      }

      // Update progress
      results.processed_items = Math.min(results.processed_items + chunk.length, data.length);
      
      await supabaseClient
        .from('bulk_operations')
        .update({
          processed_items: results.processed_items,
          failed_items: results.failed_items,
          results: results
        })
        .eq('id', bulkOp.id);
    }

    // Mark as completed
    await supabaseClient
      .from('bulk_operations')
      .update({
        status: results.failed_items === 0 ? 'completed' : 'failed',
        completed_at: new Date().toISOString(),
        error_log: results.errors
      })
      .eq('id', bulkOp.id);

    // Log security audit
    await supabaseClient.rpc('log_security_audit', {
      p_action_type: 'bulk_operation_completed',
      p_resource_type: 'bulk_operation',
      p_resource_id: bulkOp.id,
      p_risk_level: 'medium',
      p_metadata: {
        operation_type: operationType,
        total_items: data.length,
        processed_items: results.processed_items,
        failed_items: results.failed_items
      }
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Bulk operation completed',
      results
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Bulk operation error:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Helper functions for different operation types
async function processFamilyCreation(
  chunk: any[], 
  supabaseAdmin: any, 
  userId: string, 
  results: any
) {
  for (const familyData of chunk) {
    try {
      const { data: family, error } = await supabaseAdmin
        .from('families')
        .insert({
          name: familyData.name,
          parent_id: familyData.parent_id || userId,
          family_code: familyData.family_code || generateFamilyCode()
        })
        .select()
        .single();

      if (error) throw error;
      results.created_items.push(family);
    } catch (error) {
      results.errors.push(`Family creation failed: ${error.message}`);
      results.failed_items++;
    }
  }
}

async function processUserCreation(
  chunk: any[], 
  supabaseAdmin: any, 
  userId: string, 
  results: any
) {
  for (const userData of chunk) {
    try {
      const { data: user, error } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          display_name: userData.display_name,
          role: userData.role || 'parent'
        }
      });

      if (error) throw error;
      results.created_items.push(user);
    } catch (error) {
      results.errors.push(`User creation failed: ${error.message}`);
      results.failed_items++;
    }
  }
}

async function processPermissionUpdates(
  chunk: any[], 
  supabaseClient: any, 
  userId: string, 
  results: any
) {
  for (const permData of chunk) {
    try {
      const { error } = await supabaseClient
        .from('admin_role_permissions')
        .upsert({
          user_id: permData.user_id,
          permission: permData.permission,
          granted_by: userId,
          expires_at: permData.expires_at
        });

      if (error) throw error;
      results.created_items.push(permData);
    } catch (error) {
      results.errors.push(`Permission update failed: ${error.message}`);
      results.failed_items++;
    }
  }
}

async function processDataExport(
  chunk: any[], 
  supabaseClient: any, 
  userId: string, 
  results: any
) {
  for (const exportRequest of chunk) {
    try {
      const { data, error } = await supabaseClient
        .from(exportRequest.table)
        .select(exportRequest.fields || '*')
        .limit(exportRequest.limit || 1000);

      if (error) throw error;
      results.created_items.push({
        table: exportRequest.table,
        records: data.length,
        data: data
      });
    } catch (error) {
      results.errors.push(`Data export failed: ${error.message}`);
      results.failed_items++;
    }
  }
}

function generateFamilyCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'FAM-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}