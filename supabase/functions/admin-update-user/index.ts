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

    // Create a user-scoped client using the incoming JWT for RLS/auth.uid()
    const supabaseUserClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    // Check if user is admin using database function with proper auth context
    const { data: isAdmin, error: adminCheckError } = await supabaseUserClient
      .rpc('is_admin_enhanced');
    
    if (adminCheckError || !isAdmin) {
      console.error('Admin check failed:', adminCheckError);
      throw new Error('Insufficient permissions: Admin role required');
    }

    const { userId, action, password, generatePassword, notifyUser } = await req.json();

    if (!userId || !action) {
      throw new Error('Missing required parameters');
    }

    let result: any = { success: true };

    switch (action) {
      case 'reset_password':
        // Determine which password to use
        let newPassword: string;
        
        if (password) {
          // Use custom password provided by admin
          newPassword = password;
          console.log(`Using custom password for user ${userId}`);
        } else if (generatePassword) {
          // Generate secure temporary password
          newPassword = generateSecurePassword();
          result.tempPassword = newPassword;
          console.log(`Generated temporary password for user ${userId}`);
        } else {
          throw new Error('Either password or generatePassword must be provided');
        }
        
        // Validate password meets requirements
        if (newPassword.length < 8) {
          throw new Error('Password must be at least 8 characters long');
        }
        
        // Update user password via auth admin
        const { error: passwordError } = await supabaseClient.auth.admin.updateUserById(
          userId,
          { password: newPassword }
        );

        if (passwordError) {
          throw new Error(`Password reset failed: ${passwordError.message}`);
        }
        
        // Log successful password reset
        console.log(`Password reset successful for user ${userId}`);
        
        // TODO: Send email notification if notifyUser is true
        if (notifyUser) {
          console.log(`TODO: Send email notification to user ${userId}`);
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

    // Log the admin action with enhanced metadata
    await supabaseClient.rpc('log_security_audit', {
      p_action_type: `admin_user_${action}`,
      p_resource_type: 'user',
      p_resource_id: userId,
      p_risk_level: action === 'reset_password' ? 'high' : action.includes('disable') ? 'high' : 'medium',
      p_metadata: {
        admin_user_id: user.id,
        action: action,
        timestamp: new Date().toISOString(),
        password_type: password ? 'custom' : generatePassword ? 'generated' : 'none',
        notify_user: notifyUser || false
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