import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify admin access
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid authentication');
    }

    // Check if user is admin using direct auth.users check  
    const { data: authUser, error: authCheckError } = await supabaseClient
      .from('auth.users')
      .select('raw_user_meta_data')
      .eq('id', user.id)
      .single();
    
    const isAdmin = authUser?.raw_user_meta_data?.role === 'admin';
    
    if (authCheckError || !isAdmin) {
      throw new Error('Insufficient permissions');
    }

    const { userId, action, generatePassword, notifyUser } = await req.json();

    if (!userId || !action) {
      throw new Error('Missing required parameters');
    }

    let result: any = { success: true };

    switch (action) {
      case 'reset_password':
        if (generatePassword) {
          // Generate secure temporary password
          const tempPassword = generateSecurePassword();
          
          // Update user password via auth admin
          const { error: passwordError } = await supabaseClient.auth.admin.updateUserById(
            userId,
            { password: tempPassword }
          );

          if (passwordError) {
            throw new Error(`Password reset failed: ${passwordError.message}`);
          }

          result.tempPassword = tempPassword;
          
          // TODO: Send email notification if notifyUser is true
          console.log(`Password reset for user ${userId}. Temp password: ${tempPassword}`);
        }
        break;

      case 'disable_account':
        // Disable user account
        const { error: disableError } = await supabaseClient.auth.admin.updateUserById(
          userId,
          { 
            user_metadata: { 
              account_disabled: true,
              disabled_at: new Date().toISOString(),
              disabled_by: user.id
            }
          }
        );

        if (disableError) {
          throw new Error(`Account disable failed: ${disableError.message}`);
        }
        break;

      case 'enable_account':
        // Enable user account
        const { error: enableError } = await supabaseClient.auth.admin.updateUserById(
          userId,
          { 
            user_metadata: { 
              account_disabled: false,
              enabled_at: new Date().toISOString(),
              enabled_by: user.id
            }
          }
        );

        if (enableError) {
          throw new Error(`Account enable failed: ${enableError.message}`);
        }
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Log the admin action
    await supabaseClient.rpc('log_security_audit', {
      p_action_type: `admin_user_${action}`,
      p_resource_type: 'user',
      p_resource_id: userId,
      p_risk_level: action.includes('disable') ? 'high' : 'medium',
      p_metadata: {
        admin_user_id: user.id,
        action: action,
        timestamp: new Date().toISOString()
      }
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Admin update user error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function generateSecurePassword(): string {
  const length = 12;
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return password;
}