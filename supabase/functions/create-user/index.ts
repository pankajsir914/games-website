import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      throw new Error("Server configuration error");
    }

    // Admin client (service role) for privileged operations
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Authenticate caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: caller } = await supabaseAdmin.auth.getUser(token);
    if (!caller.user) throw new Error("Not authenticated");

    // Check caller role: admin OR master_admin can create regular users
    const { data: highestRole, error: roleErr } = await supabaseAdmin.rpc('get_user_highest_role', {
      _user_id: caller.user.id,
    });

    if (roleErr) throw new Error(roleErr.message);
    if (!highestRole || !['admin', 'master_admin'].includes(highestRole as string)) {
      throw new Error('Only admins can create users');
    }

    // Parse request body
    const { email, password, fullName, phone, userType = 'user' } = await req.json();

    // Validate inputs
    if (!email || !password || !fullName) {
      throw new Error("Email, password, and full name are required");
    }
    if (typeof password !== "string" || password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    // Enforce admin-only creation rules
    if (userType === 'admin' && (highestRole as string) !== 'master_admin') {
      throw new Error('Only master admins can create admin users');
    }

    // Create the auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        phone: phone || null,
      },
    });

    if (authError) {
      if (authError.message?.toLowerCase().includes("already")) {
        throw new Error("A user with this email already exists");
      }
      throw new Error(`Failed to create user: ${authError.message}`);
    }

    if (!authUser.user) throw new Error("User creation failed");

    const newUserId = authUser.user.id;

    // Create profile with password change required flag
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: newUserId,
          full_name: fullName,
          phone: phone || null,
          created_by: caller.user.id,
          requires_password_change: true, // Require password change on first login
        },
        { onConflict: "id" }
      );
    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      throw new Error(`Failed to create profile: ${profileError.message}`);
    }

    // Create wallet
    const { error: walletError } = await supabaseAdmin
      .from("wallets")
      .upsert({ user_id: newUserId, current_balance: 0 }, { onConflict: "user_id" });
    if (walletError) {
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      throw new Error(`Failed to create wallet: ${walletError.message}`);
    }

    // If admin account requested, assign admin role
    if (userType === 'admin') {
      const { error: roleInsertErr } = await supabaseAdmin
        .from('user_roles')
        .upsert({ user_id: newUserId, role: 'admin', assigned_by: caller.user.id }, { onConflict: 'user_id,role' });
      if (roleInsertErr) {
        await supabaseAdmin.auth.admin.deleteUser(newUserId);
        throw new Error(`Failed to assign admin role: ${roleInsertErr.message}`);
      }
    }

    // Log activity (best effort)
    try {
      await supabaseAdmin.rpc("log_admin_activity", {
        p_action_type: "create_user",
        p_target_type: "user",
        p_target_id: newUserId,
        p_details: {
          email,
          full_name: fullName,
          created_by: caller.user.id,
          user_type: userType,
        },
      });
    } catch (e) {
      console.warn("Failed to log admin activity", e);
    }

    return new Response(
      JSON.stringify({ success: true, user_id: newUserId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
