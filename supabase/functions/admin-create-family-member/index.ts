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

    // Check admin role
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const adminRoles = ['admin', 'full_admin'];
    if (!profile || !adminRoles.includes(profile.role)) {
      throw new Error('Insufficient permissions');
    }

    const { familyId, displayName, email, password, role } = await req.json();

    if (!familyId || !displayName || !email || !password || !role) {
      throw new Error('Missing required parameters');
    }

    // Verify family exists
    const { data: family, error: familyError } = await supabaseClient
      .from('families')
      .select('id, name')
      .eq('id', familyId)
      .single();

    if (familyError || !family) {
      throw new Error('Family not found');
    }

    // Create auth user
    const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: displayName,
        role: role,
        created_by_admin: true,
        family_id: familyId
      }
    });

    if (authError) {
      throw new Error(`Failed to create auth user: ${authError.message}`);
    }

    // Create profile
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .insert({
        id: authUser.user.id,
        username: email.split('@')[0],
        display_name: displayName,
        email: email,
        role: role,
        email_verified: true
      });

    if (profileError) {
      // Cleanup auth user if profile creation fails
      await supabaseClient.auth.admin.deleteUser(authUser.user.id);
      throw new Error(`Failed to create profile: ${profileError.message}`);
    }

    // Add to family members
    const { error: memberError } = await supabaseClient
      .from('family_members')
      .insert({
        family_id: familyId,
        user_id: authUser.user.id
      });

    if (memberError) {
      // Cleanup on failure
      await supabaseClient.auth.admin.deleteUser(authUser.user.id);
      throw new Error(`Failed to add to family: ${memberError.message}`);
    }

    console.log(`Successfully created family member: ${displayName} (${email}) for family ${family.name}`);

    return new Response(JSON.stringify({
      success: true,
      userId: authUser.user.id,
      message: `Family member created successfully`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Create family member error:', error);
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