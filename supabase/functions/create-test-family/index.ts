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

    // Use the secure is_admin_enhanced() function to verify admin status
    // CRITICAL: Use user client (not service role) so auth.uid() works inside the function
    console.log('🔐 Checking admin status using is_admin_enhanced()...');
    const { data: isAdmin, error: adminCheckError } = await supabaseUser
      .rpc('is_admin_enhanced');
    
    console.log('Admin check result:', { isAdmin, error: adminCheckError });
    
    if (adminCheckError) {
      console.error('❌ Admin verification failed:', adminCheckError);
      return new Response(
        JSON.stringify({ 
          error: 'Admin verification failed',
          details: adminCheckError.message,
          hint: 'Database function error - check RLS policies and function permissions'
        }),
        { 
          status: 500,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
    
    if (!isAdmin) {
      console.log('❌ Unauthorized test family creation attempt:', { 
        userId: user.id,
        email: user.email
      });
      return new Response(
        JSON.stringify({ 
          error: 'Access denied. Admin privileges required.',
          userId: user.id,
          email: user.email,
          hint: 'Your account does not have admin privileges'
        }),
        { 
          status: 403,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
    
    console.log('✅ Admin verification successful');

    const { familyName, parentEmail, parentPassword, parentName, children } = await req.json();

    console.log('Creating test family:', { familyName, parentEmail, parentName, childrenCount: children.length });

    // Generate unique email addresses by adding timestamp
    const timestamp = Date.now();
    const uniqueParentEmail = parentEmail.replace('@', `+${timestamp}@`);

    // Create parent user
    const { data: parentAuth, error: parentAuthError } = await supabaseAdmin.auth.admin.createUser({
      email: uniqueParentEmail,
      password: parentPassword,
      email_confirm: true,
      user_metadata: {
        display_name: parentName,
        role: 'parent',
      }
    });

    if (parentAuthError) {
      console.error('Parent auth error:', parentAuthError);
      throw parentAuthError;
    }

    console.log('Parent created:', parentAuth.user?.id);

    // Create family
    const { data: family, error: familyError } = await supabaseAdmin
      .from('families')
      .insert({
        name: familyName,
        parent_id: parentAuth.user.id,
      })
      .select()
      .single();

    if (familyError) {
      console.error('Family creation error:', familyError);
      throw familyError;
    }

    console.log('Family created:', family.id);

    // Create children users
    const createdChildren = [];
    for (const child of children) {
      // Generate unique email for each child
      const uniqueChildEmail = child.email.replace('@', `+${timestamp}@`);
      
      const { data: childAuth, error: childAuthError } = await supabaseAdmin.auth.admin.createUser({
        email: uniqueChildEmail,
        password: child.password,
        email_confirm: true,
        user_metadata: {
          display_name: child.name,
          role: 'kid',
        }
      });

      if (childAuthError) {
        console.error('Child auth error:', childAuthError);
        throw childAuthError;
      }

      // Update child profile role
      const { error: childProfileError } = await supabaseAdmin
        .from('profiles')
        .update({ role: 'kid' })
        .eq('id', childAuth.user.id);

      if (childProfileError) {
        console.error('Child profile update error:', childProfileError);
        throw childProfileError;
      }

      // Add child to family
      const { error: memberError } = await supabaseAdmin
        .from('family_members')
        .insert({
          family_id: family.id,
          user_id: childAuth.user.id,
        });

      if (memberError) {
        console.error('Family member error:', memberError);
        throw memberError;
      }

      createdChildren.push({
        id: childAuth.user.id,
        name: child.name,
        email: uniqueChildEmail,
      });

      console.log('Child created and added to family:', childAuth.user.id);
    }

    // Create some sample chores for the family
    const sampleChores = [
      { title: 'Make bed', description: 'Make your bed every morning', points_value: 10, difficulty: 'easy' },
      { title: 'Take out trash', description: 'Take the trash bins to the curb', points_value: 15, difficulty: 'medium' },
      { title: 'Feed pets', description: 'Feed the family pets', points_value: 10, difficulty: 'easy' },
      { title: 'Load dishwasher', description: 'Load dirty dishes into the dishwasher', points_value: 12, difficulty: 'easy' },
    ];

    for (const chore of sampleChores) {
      // Randomly assign to one of the children
      const randomChild = createdChildren[Math.floor(Math.random() * createdChildren.length)];
      
      const { error: choreError } = await supabaseAdmin
        .from('chores')
        .insert({
          ...chore,
          family_id: family.id,
          assigned_to: randomChild.id,
          created_by: parentAuth.user.id,
          due_date: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(), // Random due date within a week
        });

      if (choreError) {
        console.error('Chore creation error:', choreError);
        // Don't throw - chores are optional
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        family: {
          id: family.id,
          name: family.name,
          family_code: family.family_code,
        },
        parent: {
          id: parentAuth.user.id,
          name: parentName,
          email: parentEmail,
        },
        children: createdChildren,
        message: `Test family "${familyName}" created successfully with ${children.length} children`
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error creating test family:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create test family';
    return new Response(
      JSON.stringify({ 
        error: errorMessage 
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