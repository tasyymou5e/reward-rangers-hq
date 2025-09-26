import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

interface EmailRoutingRequest {
  email: string;
  action: 'resolve' | 'get_family' | 'get_aliases' | 'send_notification' | 'create_alias' | 'setup_family';
  data?: any;
}

// Rate limiting map for email operations
const emailOperationLimits = new Map<string, number>();

const checkRateLimit = (ip: string, limit = 10): boolean => {
  const now = Date.now();
  const windowStart = now - (60 * 1000); // 1 minute window
  
  const currentCount = emailOperationLimits.get(ip) || 0;
  if (currentCount >= limit) {
    return false; // Rate limited
  }
  
  emailOperationLimits.set(ip, currentCount + 1);
  
  // Clean up old entries
  setTimeout(() => {
    emailOperationLimits.delete(ip);
  }, 60 * 1000);
  
  return true;
};

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
  
  try {
    // Rate limiting
    if (!checkRateLimit(clientIP)) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded. Please try again later.',
          success: false,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429,
        }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { email, action, data }: EmailRoutingRequest = await req.json();

    console.log(`Email routing action: ${action} for email: ${email?.replace(/(.{2})(.*)(@.*)/, '$1***$3')}`);

    switch (action) {
      case 'resolve': {
        // Enhanced email resolution with security logging
        const { data: primaryEmail, error } = await supabase.rpc('resolve_to_primary_email_secure', {
          input_email: email,
        });

        if (error) throw error;

        // Log resolution attempt
        await supabase.rpc('log_security_event_with_rate_limit', {
          event_type: 'email_resolution_attempt',
          user_id_param: null,
          metadata_param: {
            original_email: email?.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
            resolved_email: primaryEmail?.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
            is_alias: primaryEmail !== email,
            ip_address: clientIP,
            timestamp: new Date().toISOString()
          }
        });

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
      }

      case 'get_family': {
        // Enhanced family retrieval with security
        const { data: familyId, error: familyError } = await supabase.rpc('get_family_by_email_secure', {
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

        // Get family details with security logging
        const { data: familyData, error } = await supabase
          .from('families')
          .select(`
            id,
            name,
            primary_email_designator,
            created_at,
            family_code
          `)
          .eq('id', familyId)
          .single();

        if (error) throw error;

        // Log family access
        await supabase.rpc('log_security_event_with_rate_limit', {
          event_type: 'family_data_accessed_via_email',
          user_id_param: null,
          metadata_param: {
            email: email?.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
            family_id: familyId,
            ip_address: clientIP,
            timestamp: new Date().toISOString()
          }
        });

        return new Response(
          JSON.stringify({
            success: true,
            family: {
              ...familyData,
              family_code: familyData.family_code?.replace(/(.{2})(.*)/, '$1***') // Partially mask family code
            },
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      case 'get_aliases': {
        // Get all aliases for a family with enhanced security
        const { data: familyId } = await supabase.rpc('get_family_by_email_secure', {
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

      case 'send_notification': {
        // Email notification service integration via fetch
        const resendApiKey = Deno.env.get('RESEND_API_KEY');
        if (!resendApiKey) {
          throw new Error('Email service not configured - RESEND_API_KEY missing');
        }
        
        const { to, subject, message, notificationType = 'general' } = data;

        try {
          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'ChoreQuest Family <noreply@chatterbox.family>',
              to: [to],
              subject: subject,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">ChoreQuest Family</h1>
                  </div>
                  <div style="padding: 20px; background: #f9f9f9;">
                    <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                      ${message}
                    </div>
                    <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
                      <p>This email was sent through the ChoreQuest Family Email System</p>
                    </div>
                  </div>
                </div>
              `,
            }),
          });

          if (!emailResponse.ok) {
            const errorData = await emailResponse.text();
            throw new Error(`Email API error: ${emailResponse.status} - ${errorData}`);
          }

          const emailResult = await emailResponse.json();

          // Log email sent
          await supabase.rpc('log_security_event_with_rate_limit', {
            event_type: 'family_email_notification_sent',
            user_id_param: null,
            metadata_param: {
              to_email: to?.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
              subject: subject,
              notification_type: notificationType,
              email_id: emailResult?.id,
              ip_address: clientIP,
              timestamp: new Date().toISOString()
            }
          });

          return new Response(
            JSON.stringify({
              success: true,
              message: 'Email notification sent successfully',
              email_id: emailResult?.id,
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            }
          );
        } catch (emailError) {
          console.error('Email sending error:', emailError);
          throw new Error('Failed to send email notification');
        }
      }

      case 'create_alias': {
        // Create new email alias for family member
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
          throw new Error('Authentication required for alias creation');
        }

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser(
          authHeader.replace('Bearer ', '')
        );

        if (authError || !user) {
          throw new Error('Invalid authentication for alias creation');
        }

        const { familyId, targetUserId, displayName, memberType = 'child' } = data;

        // Use secure function to create alias
        const { data: aliasEmail, error: aliasError } = await supabase.rpc('create_family_email_alias_secure', {
          p_family_id: familyId,
          p_user_id: targetUserId,
          p_display_name: displayName,
          p_member_type: memberType
        });

        if (aliasError) throw aliasError;

        return new Response(
          JSON.stringify({
            success: true,
            alias_email: aliasEmail,
            message: 'Email alias created successfully',
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      case 'setup_family': {
        // Setup primary email designator for new family
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
          throw new Error('Authentication required for family setup');
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser(
          authHeader.replace('Bearer ', '')
        );

        if (authError || !user) {
          throw new Error('Invalid authentication for family setup');
        }

        const { familyId, primaryEmail } = data;

        // Use secure function to setup designator
        const { data: designatorId, error: setupError } = await supabase.rpc('setup_primary_email_designator_secure', {
          p_family_id: familyId,
          p_primary_email: primaryEmail,
          p_primary_user_id: user.id
        });

        if (setupError) throw setupError;

        return new Response(
          JSON.stringify({
            success: true,
            designator_id: designatorId,
            message: 'Primary email designator setup successfully',
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      default:
        throw new Error('Invalid action specified');
    }
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