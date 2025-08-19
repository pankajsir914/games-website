import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) {
      throw new Error('Server configuration error')
    }

    // Get the current user from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }
    
    const token = authHeader.replace('Bearer ', '')
    const { data: userData } = await supabaseAdmin.auth.getUser(token)

    if (!userData.user) {
      throw new Error('Not authenticated')
    }

    // Check if the current user is a master admin
    const { data: userRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .eq('role', 'master_admin')
      .maybeSingle()

    if (!userRole) {
      throw new Error('Only master admins can create admin users')
    }

    // Parse request body
    const { email, password, fullName, phone, initialPoints } = await req.json()

    // Validate inputs
    if (!email || !password || !fullName) {
      throw new Error('Email, password, and full name are required')
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters')
    }

    console.log(`Creating admin user: ${email}`)

    // Create the auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName,
        phone: phone || null
      }
    })

    if (authError) {
      console.error('Auth creation error:', authError)
      if (authError.message.includes('already registered')) {
        throw new Error('Admin already exists')
      }
      throw new Error(`Failed to create user: ${authError.message}`)
    }

    if (!authUser.user) {
      throw new Error('User creation failed')
    }

    console.log(`Auth user created: ${authUser.user.id}`)

    // Create or update profile entry
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: authUser.user.id,
        full_name: fullName,
        phone: phone || null,
        created_by: userData.user.id
      }, {
        onConflict: 'id'
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Try to delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      throw new Error(`Failed to create profile: ${profileError.message}`)
    }

    // Create or update wallet entry
    const { error: walletError } = await supabaseAdmin
      .from('wallets')
      .upsert({
        user_id: authUser.user.id,
        current_balance: 0
      }, {
        onConflict: 'user_id'
      })

    if (walletError) {
      console.error('Wallet creation error:', walletError)
      // Try to delete the auth user if wallet creation fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      throw new Error(`Failed to create wallet: ${walletError.message}`)
    }

    // Assign admin role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: authUser.user.id,
        role: 'admin',
        assigned_by: userData.user.id
      })

    if (roleError) {
      console.error('Role assignment error:', roleError)
      // Try to delete the auth user if role assignment fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      throw new Error(`Failed to assign role: ${roleError.message}`)
    }

    // Allocate initial points if specified
    if (initialPoints && initialPoints > 0) {
      try {
        const { error: creditError } = await supabaseAdmin.rpc('allocate_admin_credits', {
          p_admin_id: authUser.user.id,
          p_amount: initialPoints,
          p_notes: 'Initial admin credit allocation'
        })

        if (creditError) {
          console.warn('Failed to allocate initial credits:', creditError.message)
        }
      } catch (creditErr) {
        console.warn('Credit allocation failed:', creditErr)
      }
    }

    // Log the activity
    try {
      await supabaseAdmin.rpc('log_admin_activity', {
        p_action_type: 'create_admin_user',
        p_target_type: 'user',
        p_target_id: authUser.user.id,
        p_details: {
          email,
          full_name: fullName,
          created_by_master_admin: userData.user.id
        }
      })
    } catch (logErr) {
      console.warn('Activity logging failed:', logErr)
    }

    console.log(`Admin user created successfully: ${authUser.user.id}`)

    return new Response(
      JSON.stringify({
        success: true,
        user_id: authUser.user.id,
        email: authUser.user.email,
        message: 'Admin user created successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error creating admin user:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to create admin user'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})