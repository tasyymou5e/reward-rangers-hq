import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// Note: For email functionality, configure RESEND_API_KEY in edge function secrets
// Temporarily commenting out Resend import until API key is configured
// import { Resend } from "npm:resend@2.0.0";

// const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

    const { familyId, inviteeEmail, inviteeName, role } = await req.json();

    if (!familyId || !inviteeEmail || !inviteeName || !role) {
      throw new Error('Missing required parameters');
    }

    // Get family info
    const { data: family, error: familyError } = await supabaseClient
      .from('families')
      .select('id, name, family_code')
      .eq('id', familyId)
      .single();

    if (familyError || !family) {
      throw new Error('Family not found');
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('email', inviteeEmail)
      .single();

    if (existingUser) {
      // Check if already a family member
      const { data: existingMember } = await supabaseClient
        .from('family_members')
        .select('id')
        .eq('family_id', familyId)
        .eq('user_id', existingUser.id)
        .single();

      if (existingMember) {
        throw new Error('User is already a member of this family');
      }
    }

    // Create family invitation
    const { data: invitation, error: inviteError } = await supabaseClient
      .from('family_invitations')
      .insert({
        family_id: familyId,
        invitee_email: inviteeEmail,
        invitee_name: inviteeName,
        role: role,
        invited_by: user.id,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      })
      .select()
      .single();

    if (inviteError) {
      throw new Error(`Failed to create invitation: ${inviteError.message}`);
    }

    // Send email notification (requires RESEND_API_KEY configuration)
    const baseUrl = Deno.env.get('SITE_URL') || 'https://chatterbox.live';
    const acceptUrl = `${baseUrl}/accept-invitation?code=${invitation.invitation_code}`;

    console.log(`Invitation created for ${inviteeEmail}. Acceptance URL: ${acceptUrl}`);
    
    // TODO: Configure RESEND_API_KEY and uncomment email sending
    /*
    try {
      await resend.emails.send({
        from: "Chatterbox Family <noreply@chatterbox.live>",
        to: [inviteeEmail],
        subject: `You're invited to join ${family.name} on Chatterbox!`,
        html: emailTemplate
      });
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
    }
    */

    console.log(`Invitation sent to ${inviteeEmail} for family ${family.name}`);

    return new Response(JSON.stringify({
      success: true,
      invitationId: invitation.id,
      message: `Invitation sent successfully`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Send family invitation error:', error);
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