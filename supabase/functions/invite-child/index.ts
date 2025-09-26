import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface InviteChildRequest {
  childName: string;
  password: string;
  familyId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase clients
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify user authentication
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid authentication');
    }

    // Check if user is admin or parent using RPC
    const { data: isAdmin, error: adminError } = await supabaseAdmin.rpc('is_admin_enhanced');
    const { data: isParent, error: parentError } = await supabaseAdmin
      .from('families')
      .select('id')
      .eq('parent_id', user.id)
      .single();

    if ((adminError || !isAdmin) && (parentError || !isParent)) {
      throw new Error('Insufficient permissions');
    }

    const { childName, password, familyId }: InviteChildRequest = await req.json();

    if (!childName || !password || !familyId) {
      throw new Error('Missing required parameters');
    }

    // Get parent profile for email generation
    const { data: parentProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('email, display_name')
      .eq('id', user.id)
      .single();

    if (profileError || !parentProfile) {
      throw new Error('Parent profile not found');
    }

    // Verify family ownership
    const { data: family, error: familyError } = await supabaseAdmin
      .from('families')
      .select('id, name, parent_id')
      .eq('id', familyId)
      .single();

    if (familyError || !family) {
      throw new Error('Family not found');
    }

    if (family.parent_id !== user.id && !isAdmin) {
      throw new Error('You can only invite children to your own family');
    }

    // Generate unique email for child
    const timestamp = Date.now();
    const childEmail = `${childName.toLowerCase().replace(/\s+/g, '')}.${timestamp}@${parentProfile.email.split('@')[1]}`;

    // Create child user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: childEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        role: 'kid',
        invited_by: user.id,
        family_id: familyId
      }
    });

    if (createError) {
      throw new Error(`Failed to create child user: ${createError.message}`);
    }

    if (!newUser.user) {
      throw new Error('Failed to create child user');
    }

    try {
      // Create profile for child (handle race condition with trigger)
      const { error: profileInsertError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: newUser.user.id,
          email: childEmail,
          display_name: childName,
          username: childName.toLowerCase().replace(/\s+/g, ''),
          role: 'kid'
        }, {
          onConflict: 'id'
        });

      if (profileInsertError) {
        console.error('Profile creation error:', profileInsertError);
        // Don't throw here as the trigger might have already created it
      }

      // Add child to family
      const { error: memberError } = await supabaseAdmin
        .from('family_members')
        .insert({
          family_id: familyId,
          user_id: newUser.user.id
        });

      if (memberError) {
        // If family member insertion fails, clean up the user
        await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
        throw new Error(`Failed to add child to family: ${memberError.message}`);
      }

      // Log the invitation using RPC
      await supabaseAdmin.rpc('log_security_audit', {
        p_action_type: 'child_invited',
        p_resource_type: 'user',
        p_resource_id: newUser.user.id,
        p_risk_level: 'low',
        p_metadata: {
          child_id: newUser.user.id,
          child_name: childName,
          family_id: familyId,
          invited_by: user.id,
          timestamp: new Date().toISOString()
        }
      });

      console.log(`Successfully invited child: ${childName} (${childEmail}) to family ${family.name}`);

      return new Response(JSON.stringify({
        success: true,
        childId: newUser.user.id,
        message: `Child ${childName} invited successfully`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      // Clean up user if anything fails after creation
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      throw error;
    }

  } catch (error) {
    console.error('Invite child error:', error);
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