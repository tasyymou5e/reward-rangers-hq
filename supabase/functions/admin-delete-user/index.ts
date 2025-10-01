import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create service role client (has admin permissions)
    const SUPABASE_URL = 'https://rdvkwnoeojjvjuknlsjd.supabase.co'
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!SERVICE_ROLE) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY secret')
      return new Response(
        JSON.stringify({ error: 'Server misconfiguration: missing service role key' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create service role client (has admin permissions)
    const supabaseAdmin = createClient(
      SUPABASE_URL,
      SERVICE_ROLE,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    console.log('Auth header received:', authHeader ? 'Present' : 'Missing')
    
    if (!authHeader) {
      console.error('No authorization header found')
      return new Response('Unauthorized', { 
        status: 401, 
        headers: corsHeaders 
      })
    }

    // Create user client with JWT for RLS-protected queries
    const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkdmt3bm9lb2pqdmp1a25sc2pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMTc5MjksImV4cCI6MjA3MTc5MzkyOX0.B1DSj5FgX8_XrJ05WADQaW0qbDFDa9ShXxT83VqGoHY'
    const supabase = createClient(
      SUPABASE_URL,
      ANON_KEY,
      {
        global: { headers: { Authorization: authHeader } }
      }
    )

    // Verify the requesting user has admin permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    console.log('Auth user verification:', { 
      userId: user?.id, 
      hasError: !!authError,
      errorMessage: authError?.message 
    })

    if (authError || !user) {
      console.error('Auth verification failed:', authError)
      return new Response('Unauthorized', { 
        status: 401, 
        headers: corsHeaders 
      })
    }

    // Use the secure is_admin_enhanced() function to verify admin status
    // CRITICAL: Use user client (not service role) so auth.uid() works inside the function
    console.log('🔐 Checking admin status using is_admin_enhanced()...');
    const { data: isAdmin, error: adminCheckError } = await supabase
      .rpc('is_admin_enhanced');

    console.log('Admin check:', { 
      userId: user.id,
      isAdmin, 
      hasError: !!adminCheckError,
      errorMessage: adminCheckError?.message 
    });

    if (adminCheckError) {
      console.error('❌ Admin verification failed:', adminCheckError);
      return new Response(
        JSON.stringify({ 
          error: 'Admin verification failed',
          details: adminCheckError.message,
          hint: 'Database function error - check RLS policies and function permissions'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!isAdmin) {
      console.error('❌ Admin role verification failed');
      return new Response(
        JSON.stringify({
          error: 'Access denied. Admin privileges required.',
          userId: user.id,
          hint: 'Your account does not have admin privileges'
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    console.log('✅ Admin verification successful');

    // Parse request body
    const { userId } = await req.json()
    console.log('Delete request for userId:', userId)

    if (!userId) {
      console.error('No userId provided in request body')
      return new Response('User ID is required', { 
        status: 400, 
        headers: corsHeaders 
      })
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      console.error('Invalid UUID format:', userId)
      return new Response('Invalid user ID format', { 
        status: 400, 
        headers: corsHeaders 
      })
    }

    // Prevent admin self-deletion
    if (userId === user.id) {
      console.error('Admin attempted self-deletion')
      return new Response('Cannot delete your own account', { 
        status: 400, 
        headers: corsHeaders 
      })
    }

    // Get user info before deletion for logging
    const { data: targetUser, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('display_name, role, email')
      .eq('id', userId)
      .single()

    console.log('Target user info:', { 
      targetUser, 
      hasError: !!fetchError,
      errorMessage: fetchError?.message 
    })

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching target user:', fetchError)
      return new Response('Error fetching user information', { 
        status: 500, 
        headers: corsHeaders 
      })
    }

    // Prevent deletion of other admin users (only allow deletion of lower privilege users)
    if (targetUser?.role && ['admin', 'full_admin'].includes(targetUser.role)) {
      return new Response('Cannot delete admin users', { 
        status: 403, 
        headers: corsHeaders 
      })
    }

    console.log('Starting user deletion process for userId:', userId)

    // First, clean up any potential data integrity issues
    try {
      // Ensure profile exists and has valid role before deletion
      const { data: profileCheck, error: profileCheckError } = await supabaseAdmin
        .from('profiles')
        .select('id, role, display_name')
        .eq('id', userId)
        .single()

      if (profileCheckError && profileCheckError.code !== 'PGRST116') {
        console.error('Error checking profile before deletion:', profileCheckError)
        throw new Error(`Profile check failed: ${profileCheckError.message}`)
      }

      if (profileCheck) {
        console.log('Profile found before deletion:', profileCheck)
        
        // Validate the role is a proper enum value
        const validRoles = ['kid', 'parent', 'admin', 'full_admin', 'read_only_admin', 'report_admin']
        if (!validRoles.includes(profileCheck.role)) {
          console.warn('Invalid role detected, fixing:', profileCheck.role)
          
          // Fix invalid role before deletion
          await supabaseAdmin
            .from('profiles')
            .update({ role: 'parent' })
            .eq('id', userId)
        }
      }
    } catch (profileError) {
      console.error('Error in profile pre-deletion check:', profileError)
      // Continue with deletion attempt anyway
    }

    // Delete user from auth (this will cascade to related data due to foreign keys)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('Error deleting user from auth:', deleteError)
      
      // Log failed deletion attempt
      await supabaseAdmin
        .from('security_alerts')
        .insert({
          user_id: user.id,
          alert_type: 'admin_user_deletion_failed',
          severity: 'high',
          description: `Admin failed to delete user: ${targetUser?.display_name || 'Unknown'}`,
          metadata: {
            target_user_id: userId,
            target_user_email: targetUser?.email,
            target_user_role: targetUser?.role,
            error: deleteError.message,
            admin_user_id: user.id,
            timestamp: new Date().toISOString()
          }
        });
      
      // If auth deletion fails, try manual cleanup as fallback
      console.log('Attempting manual cleanup after auth deletion failure')
      
      try {
        // Delete from profiles table directly
        const { error: profileDeleteError } = await supabaseAdmin
          .from('profiles')
          .delete()
          .eq('id', userId)

        if (profileDeleteError) {
          console.error('Error deleting profile:', profileDeleteError)
          throw new Error(`Profile deletion failed: ${profileDeleteError.message}`)
        }

        console.log('Manual profile cleanup successful')
      } catch (cleanupError) {
        console.error('Manual cleanup failed:', cleanupError)
        return new Response('Failed to delete user completely', { 
          status: 500, 
          headers: corsHeaders 
        })
      }
    } else {
      console.log('User deleted from auth successfully')
    }

    // Log the deletion for security audit
    await supabaseAdmin
      .from('security_alerts')
      .insert({
        user_id: user.id,
        alert_type: 'admin_user_deletion_success',
        severity: 'medium',
        description: `Admin deleted user: ${targetUser?.display_name || 'Unknown'}`,
        metadata: {
          deleted_user_id: userId,
          deleted_user_email: targetUser?.email,
          deleted_user_role: targetUser?.role,
          admin_user_id: user.id,
          timestamp: new Date().toISOString()
        }
      })

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `User ${targetUser?.display_name || userId} deleted successfully`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in admin-delete-user function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})