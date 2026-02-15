import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.text();
    const data = JSON.parse(body);

    const { user_id, session_id, ended_at, exit_page, duration_seconds } = data;

    // Validate session_id is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!session_id || typeof session_id !== "string" || !uuidRegex.test(session_id)) {
      return new Response(
        JSON.stringify({ error: "Invalid or missing session_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate and sanitize inputs
    const sanitizedExitPage = typeof exit_page === "string" ? exit_page.slice(0, 500) : null;
    const sanitizedDuration = typeof duration_seconds === "number" && duration_seconds >= 0 && duration_seconds <= 86400
      ? Math.floor(duration_seconds)
      : null;
    const sanitizedEndedAt = typeof ended_at === "string" && !isNaN(Date.parse(ended_at))
      ? ended_at
      : new Date().toISOString();
    const sanitizedUserId = typeof user_id === "string" && uuidRegex.test(user_id) ? user_id : null;

    // Update session with end time and calculate duration
    const { error } = await supabase
      .from("user_sessions")
      .update({
        ended_at: sanitizedEndedAt,
        exit_page: sanitizedExitPage,
        duration_seconds: sanitizedDuration
      })
      .eq("session_id", session_id);

    if (error) {
      console.error("Error updating session:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (sanitizedUserId) {
      await supabase.from("user_activity").insert({
        user_id: sanitizedUserId,
        session_id,
        event_type: "session_end",
        event_name: "session_ended",
        page_path: sanitizedExitPage,
        created_at: sanitizedEndedAt
      });
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
