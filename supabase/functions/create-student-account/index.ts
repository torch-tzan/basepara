import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CreateStudentRequest {
  name: string;
  email: string;
  team_id?: string;
  position?: string;
  height?: string;
  weight?: string;
  birthday?: string;
  throwing_hand?: string;
  batting_hand?: string;
  player_type?: string;
  responsibleCoachIds?: string[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "未授權的請求" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify the requesting user has permission (admin or venue_coach)
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: authHeader } },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "無效的使用者" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user has admin or venue_coach role
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!roleData || !["admin", "venue_coach"].includes(roleData.role)) {
      return new Response(
        JSON.stringify({ error: "權限不足" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: CreateStudentRequest = await req.json();
    const { name, email, team_id, position, height, weight, birthday, throwing_hand, batting_hand, player_type, responsibleCoachIds } = body;

    // Validate required fields
    if (!name?.trim()) {
      return new Response(
        JSON.stringify({ error: "請填寫姓名" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!email?.trim()) {
      return new Response(
        JSON.stringify({ error: "請填寫信箱" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "請輸入有效的信箱格式" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if email already exists in students table
    const { data: existingStudent } = await supabaseAdmin
      .from("students")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingStudent) {
      return new Response(
        JSON.stringify({ error: "此信箱已被其他學員使用" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Default password for new student accounts
    const tempPassword = "000000";

    // Create auth user with auto-confirm
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { name: name },
    });

    if (authError) {
      console.error("Auth error:", authError);
      if (authError.message.includes("already been registered")) {
        return new Response(
          JSON.stringify({ error: "此信箱已被註冊" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: `建立帳號失敗: ${authError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authUserId = authUser.user.id;

    // Assign student role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: authUserId, role: "student" });

    if (roleError) {
      console.error("Role assignment error:", roleError);
      // Clean up: delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(authUserId);
      return new Response(
        JSON.stringify({ error: "指派角色失敗" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create student record - use authUserId as the student id for consistency
    const studentId = authUserId;
    const { error: studentError } = await supabaseAdmin
      .from("students")
      .insert({
        id: studentId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        team_id: team_id || null,
        position: position || null,
        height: height || null,
        weight: weight || null,
        birthday: birthday || null,
        throwing_hand: throwing_hand || null,
        batting_hand: batting_hand || null,
        player_type: player_type || null,
      });

    if (studentError) {
      console.error("Student creation error:", studentError);
      // Clean up: delete the auth user and role
      await supabaseAdmin.from("user_roles").delete().eq("user_id", authUserId);
      await supabaseAdmin.auth.admin.deleteUser(authUserId);
      return new Response(
        JSON.stringify({ error: `建立學員資料失敗: ${studentError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create team history record
    let teamHistoryId: string | null = null;
    if (team_id) {
      const { data: historyData, error: historyError } = await supabaseAdmin
        .from("student_team_history")
        .insert({
          student_id: studentId,
          team_id: team_id,
          is_current: true,
          start_date: new Date().toISOString().split("T")[0],
        })
        .select("id")
        .single();

      if (historyError) {
        console.error("Team history error:", historyError);
      } else {
        teamHistoryId = historyData.id;
      }
    }

    // Create coach assignments linked to team history
    if (responsibleCoachIds && responsibleCoachIds.length > 0) {
      const { error: coachError } = await supabaseAdmin
        .from("student_coaches")
        .insert(
          responsibleCoachIds.map((coachId) => ({
            student_id: studentId,
            coach_id: coachId,
            team_history_id: teamHistoryId,
          }))
        );

      if (coachError) {
        console.error("Coach assignment error:", coachError);
      }
    }

    // Send password reset email so the student can set their own password
    const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: email,
    });

    if (resetError) {
      console.error("Password reset email error:", resetError);
      // Don't fail the operation, just log the error
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "學員帳號建立成功",
        studentId: studentId,
        authUserId: authUserId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "伺服器錯誤，請稍後再試" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
