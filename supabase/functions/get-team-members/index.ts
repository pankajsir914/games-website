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

    // Get the current user from the request
    const authHeader = req.headers.get('Authorization')!
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
      .single()

    if (!userRole) {
      throw new Error('Only master admins can view team members')
    }

    console.log('Fetching team members...')

    // Get all users with admin roles
    const { data: adminRoles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id, role, assigned_at')
      .in('role', ['master_admin', 'admin', 'moderator'])

    if (rolesError) {
      console.error('Error fetching admin roles:', rolesError)
      throw rolesError
    }

    if (!adminRoles || adminRoles.length === 0) {
      return new Response(
        JSON.stringify({ success: true, teamMembers: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user profiles
    const userIds = adminRoles.map(role => role.user_id)
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, phone')
      .in('id', userIds)

    if (profilesError) {
      console.warn('Error fetching profiles:', profilesError)
    }

    // Get auth users info using service role
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers()

    if (usersError) {
      console.error('Error fetching auth users:', usersError)
      throw usersError
    }

    // Get admin credit balances (for distributing to users)
    const { data: adminCredits, error: creditsError } = await supabaseAdmin
      .from('admin_credit_accounts')
      .select('admin_id, balance')
      .in('admin_id', userIds)

    if (creditsError) {
      console.warn('Error fetching admin credits:', creditsError)
    }

    // Combine all data
    const teamMembers = adminRoles.map(role => {
      const authUser = users?.find(u => u.id === role.user_id)
      const profile = profiles?.find(p => p.id === role.user_id)
      const credits = adminCredits?.find(c => c.admin_id === role.user_id)

      return {
        id: role.user_id,
        full_name: profile?.full_name || null,
        email: authUser?.email || '',
        phone: profile?.phone || null,
        role: role.role,
        created_at: role.assigned_at,
        last_sign_in_at: authUser?.last_sign_in_at || null,
        admin_credits: credits?.balance || 0, // Credits admin can distribute to users
        status: getStatusFromLastSignIn(authUser?.last_sign_in_at)
      }
    })

    console.log(`Found ${teamMembers.length} team members`)

    return new Response(
      JSON.stringify({
        success: true,
        teamMembers
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error fetching team members:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to fetch team members'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})

function getStatusFromLastSignIn(lastSignIn: string | null): 'active' | 'inactive' | 'suspended' {
  if (!lastSignIn) return 'inactive'
  
  const lastSignInDate = new Date(lastSignIn)
  const now = new Date()
  const daysDiff = (now.getTime() - lastSignInDate.getTime()) / (1000 * 3600 * 24)
  
  if (daysDiff < 1) return 'active'
  if (daysDiff < 7) return 'inactive'
  return 'suspended'
}
