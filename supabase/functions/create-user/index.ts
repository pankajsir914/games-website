import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the current user from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Missing Authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: userData } = await supabaseAdmin.auth.getUser(token)
    if (!userData.user) {
      return new Response(JSON.stringify({ success: false, error: 'Not authenticated' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    // Check if caller is admin or master_admin
    const { data: roleRecord, error: roleErr } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .in('role', ['admin', 'master_admin'])
      .maybeSingle()

    if (roleErr) {
      console.error('Role fetch error:', roleErr)
    }

    if (!roleRecord) {
      return new Response(JSON.stringify({ success: false, error: 'Only admins can create users' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }

    // Parse request body
    const { email, password, fullName, phone } = await req.json()

    if (!email || !password || !fullName) {
      return new Response(JSON.stringify({ success: false, error: 'Email, password, and full name are required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    if (typeof password !== 'string' || password.length < 6) {
      return new Response(JSON.stringify({ success: false, error: 'Password must be at least 6 characters' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    console.log(`Creating regular user: ${email}`)

    // Create auth user
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, phone: phone || null },
    })

    if (createErr) {
      console.error('Auth creation error:', createErr)
      return new Response(JSON.stringify({ success: false, error: createErr.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    if (!created.user) {
      return new Response(JSON.stringify({ success: false, error: 'User creation failed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Create profile
    const { error: profileErr } = await supabaseAdmin
      .from('profiles')
      .upsert({ id: created.user.id, full_name: fullName, phone: phone || null }, { onConflict: 'id' })

    if (profileErr) {
      console.error('Profile error:', profileErr)
      // rollback auth user
      await supabaseAdmin.auth.admin.deleteUser(created.user.id)
      return new Response(JSON.stringify({ success: false, error: `Failed to create profile: ${profileErr.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Create wallet
    const { error: walletErr } = await supabaseAdmin
      .from('wallets')
      .upsert({ user_id: created.user.id, current_balance: 0 }, { onConflict: 'user_id' })

    if (walletErr) {
      console.error('Wallet error:', walletErr)
      await supabaseAdmin.auth.admin.deleteUser(created.user.id)
      return new Response(JSON.stringify({ success: false, error: `Failed to create wallet: ${walletErr.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Log activity (best-effort)
    try {
      await supabaseAdmin.rpc('log_admin_activity', {
        p_action_type: 'create_user',
        p_target_type: 'user',
        p_target_id: created.user.id,
        p_details: { email, full_name: fullName, created_by_admin: userData.user.id },
      })
    } catch (logErr) {
      console.warn('Activity logging failed:', logErr)
    }

    return new Response(
      JSON.stringify({ success: true, user_id: created.user.id, email: created.user.email, message: 'User created successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (err) {
    console.error('Unexpected error in create-user:', err)
    return new Response(JSON.stringify({ success: false, error: err.message || 'Unexpected error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
