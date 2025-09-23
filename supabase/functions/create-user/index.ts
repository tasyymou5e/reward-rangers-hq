import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { 
          status: 401,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Verify the calling user is an admin
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { 
          status: 401,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseUser
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || !['admin', 'full_admin'].includes(profile.role)) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { 
          status: 403,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    const { email, password, display_name, role } = await req.json();

    // Validate input data
    if (!email || !password || !display_name || !role) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, password, display_name, role' }),
        { 
          status: 400,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Validate role
    const validRoles = ['admin', 'full_admin', 'read_only_admin', 'report_admin', 'parent', 'kid'];
    if (!validRoles.includes(role)) {
      return new Response(
        JSON.stringify({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` }),
        { 
          status: 400,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Create user in auth.users table
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for admin created users
      user_metadata: {
        display_name,
        role,
      }
    });

    if (authError) {
      // Log failed user creation attempt
      await supabaseAdmin
        .from('security_alerts')
        .insert({
          user_id: user.id,
          alert_type: 'admin_user_creation_failed',
          severity: 'medium',
          description: `Admin failed to create user: ${email}`,
          metadata: {
            target_email: email,
            target_role: role,
            error: authError.message,
            admin_user_id: user.id,
            timestamp: new Date().toISOString()
          }
        });
      throw authError;
    }

    

    // The profile will be created automatically by the trigger
    // But we need to update the role since the trigger sets it to 'parent' by default
    if (role !== 'parent') {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ role })
        .eq('id', authUser.user.id);

      if (profileError) {
        throw profileError;
      }
    }

    // Log successful user creation for security audit
    await supabaseAdmin
      .from('security_alerts')
      .insert({
        user_id: user.id,
        alert_type: 'admin_user_creation_success',
        severity: 'info',
        description: `Admin created new user: ${display_name} (${email})`,
        metadata: {
          created_user_id: authUser.user.id,
          created_user_email: email,
          created_user_role: role,
          admin_user_id: user.id,
          timestamp: new Date().toISOString()
        }
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: authUser.user.id,
        message: `${role} user created successfully` 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to create user' 
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});