import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

interface EmailRoutingRequest {
  email: string;
  action: 'resolve' | 'get_family' | 'get_aliases';
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { email, action }: EmailRoutingRequest = await req.json();

    if (action === 'resolve') {
      // Resolve any email (alias or primary) to its primary designator
      const { data: primaryEmail, error } = await supabase.rpc('resolve_to_primary_email', {
        input_email: email,
      });

      if (error) throw error;

      return new Response(
        JSON.stringify({
          success: true,
          original_email: email,
          primary_email: primaryEmail,
          is_alias: primaryEmail !== email,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } else if (action === 'get_family') {
      // Get family information from any email
      const { data: familyId, error: familyError } = await supabase.rpc('get_family_by_email', {
        input_email: email,
      });

      if (familyError) throw familyError;

      if (!familyId) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'No family found for this email',
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404,
          }
        );
      }

      // Get family details
      const { data: familyData, error } = await supabase
        .from('families')
        .select(`
          id,
          name,
          primary_email_designator,
          created_at
        `)
        .eq('id', familyId)
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({
          success: true,
          family: familyData,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } else if (action === 'get_aliases') {
      // Get all aliases for a family (primary email or any alias)
      const { data: familyId } = await supabase.rpc('get_family_by_email', {
        input_email: email,
      });

      if (!familyId) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'No family found for this email',
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404,
          }
        );
      }

      // Get all aliases for this family
      const { data: aliases, error } = await supabase
        .from('email_aliases')
        .select(`
          id,
          alias_email,
          primary_email,
          role,
          is_active,
          created_at
        `)
        .eq('family_id', familyId)
        .eq('is_active', true);

      if (error) throw error;

      // Get primary email designator
      const { data: familyData } = await supabase
        .from('families')
        .select('primary_email_designator')
        .eq('id', familyId)
        .single();

      return new Response(
        JSON.stringify({
          success: true,
          family_id: familyId,
          primary_email: familyData?.primary_email_designator,
          aliases: aliases || [],
          total_members: (aliases?.length || 0) + 1, // +1 for primary parent
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    throw new Error('Invalid action specified');
  } catch (error) {
    console.error('Email routing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Email routing failed';
    return new Response(
      JSON.stringify({
        error: errorMessage,
        success: false,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});