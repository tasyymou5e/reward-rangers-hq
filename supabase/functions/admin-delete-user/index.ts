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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Create anon client for user verification
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('Unauthorized', { 
        status: 401, 
        headers: corsHeaders 
      })
    }

    // Verify the requesting user has admin permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response('Unauthorized', { 
        status: 401, 
        headers: corsHeaders 
      })
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || !['admin', 'full_admin'].includes(profile.role)) {
      return new Response('Forbidden: Admin role required', { 
        status: 403, 
        headers: corsHeaders 
      })
    }

    // Parse request body
    const { userId } = await req.json()

    if (!userId) {
      return new Response('User ID is required', { 
        status: 400, 
        headers: corsHeaders 
      })
    }

    // Prevent admin self-deletion
    if (userId === user.id) {
      return new Response('Cannot delete your own account', { 
        status: 400, 
        headers: corsHeaders 
      })
    }

    // Get user info before deletion for logging
    const { data: targetUser } = await supabaseAdmin
      .from('profiles')
      .select('display_name, role, email')
      .eq('id', userId)
      .single()

    // Delete user from auth (this will cascade to related data due to foreign keys)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('Error deleting user from auth:', deleteError)
      
      // If auth deletion fails, try to delete from profiles as fallback
      const { error: profileDeleteError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (profileDeleteError) {
        console.error('Error deleting profile:', profileDeleteError)
        return new Response('Failed to delete user', { 
          status: 500, 
          headers: corsHeaders 
        })
      }
    }

    // Log the deletion for security audit
    await supabaseAdmin
      .from('security_alerts')
      .insert({
        user_id: user.id,
        alert_type: 'admin_user_deletion',
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