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

    // Check admin role using RPC to avoid RLS recursion
    const { data: isAdmin, error: adminCheckError } = await supabaseClient.rpc('is_admin_enhanced');
    
    if (adminCheckError || !isAdmin) {
      throw new Error('Insufficient permissions');
    }

    const { userId, familyId } = await req.json();

    if (!userId || !familyId) {
      throw new Error('Missing required parameters');
    }

    // Verify family exists and get family info
    const { data: family, error: familyError } = await supabaseClient
      .from('families')
      .select('id, name, parent_id')
      .eq('id', familyId)
      .single();

    if (familyError || !family) {
      throw new Error('Family not found');
    }

    // Prevent removing the family parent
    if (family.parent_id === userId) {
      throw new Error('Cannot remove the family parent. Transfer ownership first.');
    }

    // Get user info before removal
    const { data: userProfile } = await supabaseClient
      .from('profiles')
      .select('display_name, email')
      .eq('id', userId)
      .single();

    // Remove from family_members
    const { error: memberError } = await supabaseClient
      .from('family_members')
      .delete()
      .eq('family_id', familyId)
      .eq('user_id', userId);

    if (memberError) {
      throw new Error(`Failed to remove family member: ${memberError.message}`);
    }

    // Clean up related data
    await Promise.all([
      // Remove family roles
      supabaseClient
        .from('family_roles')
        .delete()
        .eq('family_id', familyId)
        .eq('user_id', userId),
      
      // Remove chore assignments
      supabaseClient
        .from('chores')
        .update({ assigned_to: null, status: 'pending' })
        .eq('family_id', familyId)
        .eq('assigned_to', userId),
      
      // Remove point transactions
      supabaseClient
        .from('point_transactions')
        .delete()
        .eq('family_id', familyId)
        .eq('user_id', userId),
      
      // Remove wishlist items
      supabaseClient
        .from('wishlist_items')
        .delete()
        .eq('family_id', familyId)
        .eq('user_id', userId)
    ]);

    console.log(`Successfully removed member: ${userProfile?.display_name} (${userProfile?.email}) from family ${family.name}`);

    return new Response(JSON.stringify({
      success: true,
      message: `Family member removed successfully`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Remove family member error:', error);
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