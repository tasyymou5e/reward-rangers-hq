import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteChildRequest {
  childName: string;
  childPassword: string;
  familyId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get the authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify the user making the request
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { childName, childPassword, familyId }: InviteChildRequest = await req.json();

    // Get parent's profile to generate child email
    const { data: parentProfile, error: parentError } = await supabaseClient
      .from("profiles")
      .select("email")
      .eq("id", user.id)
      .single();

    if (parentError || !parentProfile) {
      return new Response(
        JSON.stringify({ error: "Parent profile not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate unique child email from parent email
    const parentEmailBase = parentProfile.email.split('@')[0];
    const domain = parentProfile.email.split('@')[1];
    const timestamp = Date.now();
    const childEmail = `${parentEmailBase}+child_${childName.toLowerCase().replace(/\s+/g, '')}_${timestamp}@${domain}`;

    // Verify the parent owns this family
    const { data: family, error: familyError } = await supabaseClient
      .from("families")
      .select("*")
      .eq("id", familyId)
      .eq("parent_id", user.id)
      .single();

    if (familyError || !family) {
      return new Response(
        JSON.stringify({ error: "Family not found or access denied" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create the child user account with parent-provided password
    const { data: newUser, error: userError } = await supabaseClient.auth.admin.createUser({
      email: childEmail,
      password: childPassword,
      email_confirm: true,
      user_metadata: {
        display_name: childName,
        role: "kid",
        invited_by: user.id,
        family_id: familyId,
      },
    });

    if (userError) {
      return new Response(
        JSON.stringify({ error: `Failed to create user account: ${userError.message}` }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Add the child to the family
    const { error: memberError } = await supabaseClient
      .from("family_members")
      .insert({
        family_id: familyId,
        user_id: newUser.user.id,
      });

    if (memberError) {
      // Clean up the created user if family member insertion fails
      await supabaseClient.auth.admin.deleteUser(newUser.user.id);
      return new Response(
        JSON.stringify({ error: "Failed to add child to family" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send invitation email
    const appUrl = Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovable.app") || "https://your-app.lovable.app";
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to ChoreQuest!</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 2.5em; margin-bottom: 10px; }
            .card { background: #f8f9fa; border-radius: 12px; padding: 24px; margin: 20px 0; }
            .credentials { background: #e3f2fd; border-radius: 8px; padding: 16px; margin: 16px 0; }
            .button { display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 10px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 0.9em; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🎯 ChoreQuest</div>
              <h1>Welcome to the Family, ${childName}!</h1>
            </div>
            
            <div class="card">
              <h2>🎉 You've been invited to join ChoreQuest!</h2>
              <p>Your parent has invited you to join the family on ChoreQuest, where chores become exciting adventures!</p>
              
              <p><strong>What is ChoreQuest?</strong></p>
              <ul>
                <li>🏆 Earn points (XP) by completing chores</li>
                <li>🎮 Play mini-games for bonus points</li>
                <li>🏅 Collect badges and achievements</li>
                <li>🎁 Redeem points for real rewards</li>
                <li>📈 Level up and track your progress</li>
              </ul>
            </div>

            <div class="card">
              <h3>🔐 Your Login Information</h3>
              <div class="credentials">
                <p><strong>Email:</strong> ${childEmail}</p>
                <p><strong>Password:</strong> Your parent has set up your password</p>
              </div>
              <p><strong>Important:</strong> Ask your parent for your password to log in!</p>
              
              <div style="text-align: center; margin: 20px 0;">
                <a href="${appUrl}/#/auth" class="button">🚀 Start Your Adventure</a>
              </div>
            </div>

            <div class="card">
              <h3>📱 Getting Started</h3>
              <ol>
                <li>Click the "Start Your Adventure" button above</li>
                <li>Ask your parent for your password and sign in</li>
                <li>Complete your first chore and earn XP!</li>
                <li>Have fun turning chores into adventures! 🎮</li>
              </ol>
            </div>

            <div class="footer">
              <p>🌟 Welcome to the ChoreQuest family! 🌟</p>
              <p>If you need help, ask your parent or contact support.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "ChoreQuest <noreply@resend.dev>",
      to: [childEmail],
      subject: `🎯 Welcome to ChoreQuest, ${childName}! Your Adventure Awaits`,
      html: emailHtml,
    });

    if (emailResponse.error) {
      // Email failed but don't fail the whole process
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Child invited successfully",
        childId: newUser.user.id,
        emailSent: !emailResponse.error,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);