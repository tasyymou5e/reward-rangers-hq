import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

interface AuthRequest {
  email: string;
  password: string;
  action: 'signin' | 'signup';
  familyData?: {
    name: string;
    primaryParentData: {
      firstName: string;
      lastName: string;
    };
  };
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { email, password, action, familyData }: AuthRequest = await req.json();

    // Resolve email to primary email designator
    const { data: primaryEmail } = await supabase.rpc('resolve_to_primary_email', {
      input_email: email,
    });

    const resolvedEmail = primaryEmail || email;

    if (action === 'signup') {
      // Create new user with primary email
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: resolvedEmail,
        password,
        email_confirm: true,
        user_metadata: familyData?.primaryParentData || {},
      });

      if (authError) throw authError;

      // Create family if provided
      if (familyData && authData.user) {
        const { data: familyRecord, error: familyError } = await supabase
          .from('families')
          .insert({
            name: familyData.name,
            parent_id: authData.user.id,
            primary_email_designator: resolvedEmail,
            created_by_primary_email: true,
          })
          .select()
          .single();

        if (familyError) throw familyError;

        // Add to family members
        await supabase.from('family_members').insert({
          family_id: familyRecord.id,
          user_id: authData.user.id,
        });

        // Log security event
        await supabase.rpc('log_security_event', {
          event_type: 'primary_email_family_created',
          user_id: authData.user.id,
          metadata: {
            family_id: familyRecord.id,
            primary_email: resolvedEmail,
            timestamp: new Date().toISOString(),
          },
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          user: authData.user,
          message: 'User created successfully with primary email system',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 201,
        }
      );
    } else if (action === 'signin') {
      // Handle sign in with email resolution
      const { data: authData, error: authError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: resolvedEmail,
      });

      if (authError) throw authError;

      // Get family context if available
      const { data: familyId } = await supabase.rpc('get_family_by_email', {
        input_email: email,
      });

      // Log sign-in attempt
      if (familyId) {
        await supabase.rpc('log_security_event', {
          event_type: 'primary_email_signin_attempt',
          user_id: null,
          metadata: {
            original_email: email,
            resolved_email: resolvedEmail,
            family_id: familyId,
            timestamp: new Date().toISOString(),
          },
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Sign-in processed with primary email resolution',
          resolved_email: resolvedEmail,
          family_context: familyId,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    throw new Error('Invalid action specified');
  } catch (error) {
    console.error('Primary email auth error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
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