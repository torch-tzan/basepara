import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CreateAccountRequest {
  id: string;
  name: string;
  email: string;
  role_id: string;
  active: boolean;
  teams?: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify the caller is an admin
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;

    // Check if caller has admin role
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (roleData?.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Only admins can create accounts" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: CreateAccountRequest = await req.json();
    const { id, name, email, role_id, active, teams } = body;

    // Validate required fields
    if (!id || !name || !email || !role_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: id, name, email, role_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if email already exists in auth
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const emailExists = existingUsers?.users?.some(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (emailExists) {
      return new Response(
        JSON.stringify({ error: "此 Email 已被使用" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if email already exists in accounts table
    const { data: existingAccount } = await supabaseAdmin
      .from("accounts")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (existingAccount) {
      return new Response(
        JSON.stringify({ error: "此 Email 已被使用" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Default password for new accounts
    const defaultPassword = "000000";

    // Create auth user with auto-confirm
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password: defaultPassword,
      email_confirm: true,
      user_metadata: { name },
    });

    if (authError) {
      console.error("Auth user creation error:", authError);
      return new Response(
        JSON.stringify({ error: `無法建立帳號: ${authError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authUserId = authUser.user.id;

    // Map role_id to app_role
    // This maps the custom role IDs to the app_role enum
    let appRole: "admin" | "venue_coach" | "team_coach" = "team_coach";
    
    // Get role name from roles table
    const { data: roleInfo } = await supabaseAdmin
      .from("roles")
      .select("name")
      .eq("id", role_id)
      .single();

    if (roleInfo) {
      const roleName = roleInfo.name.toLowerCase();
      if (roleName.includes("管理") || roleName.includes("admin")) {
        appRole = "admin";
      } else if (roleName.includes("場館") || roleName.includes("venue")) {
        appRole = "venue_coach";
      } else if (roleName.includes("球隊") || roleName.includes("team")) {
        appRole = "team_coach";
      }
    }

    // Assign role in user_roles table
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: authUserId, role: appRole });

    if (roleError) {
      console.error("Role assignment error:", roleError);
      // Cleanup: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(authUserId);
      return new Response(
        JSON.stringify({ error: `無法指派角色: ${roleError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert into accounts table
    const { error: accountError } = await supabaseAdmin
      .from("accounts")
      .insert({
        id,
        name,
        email: email.toLowerCase(),
        role_id,
        active: active ?? true,
      });

    if (accountError) {
      console.error("Account insert error:", accountError);
      // Cleanup: delete auth user and role
      await supabaseAdmin.from("user_roles").delete().eq("user_id", authUserId);
      await supabaseAdmin.auth.admin.deleteUser(authUserId);
      return new Response(
        JSON.stringify({ error: `無法建立帳號記錄: ${accountError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert team assignments if provided
    if (teams && teams.length > 0) {
      const teamInserts = teams.map((teamId) => ({
        account_id: id,
        team_id: teamId,
      }));

      const { error: teamsError } = await supabaseAdmin
        .from("account_teams")
        .insert(teamInserts);

      if (teamsError) {
        console.error("Team assignment error:", teamsError);
        // Don't fail the whole operation for team assignment errors
      }

      // Also sync to user_team_assignments for RLS
      const userTeamInserts = teams.map((teamId) => ({
        user_id: authUserId,
        team_id: teamId,
      }));

      const { error: userTeamsError } = await supabaseAdmin
        .from("user_team_assignments")
        .insert(userTeamInserts);

      if (userTeamsError) {
        console.error("User team assignment error:", userTeamsError);
      }
    }

    console.log(`Account created successfully: ${email} with role ${appRole}`);

    return new Response(
      JSON.stringify({
        success: true,
        account: {
          id,
          name,
          email: email.toLowerCase(),
          role_id,
          active: active ?? true,
          auth_user_id: authUserId,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
