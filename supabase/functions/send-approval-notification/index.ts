import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

// TODO: Add RESEND_API_KEY secret and implement email sending
// For now, this function just logs the notification

interface ApprovalNotificationRequest {
  submission_id: string;
  reward_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;
  
  const corsHeaders = getCorsHeaders(req);

  try {
    const { submission_id, reward_id }: ApprovalNotificationRequest = await req.json();

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Fetch submission details with user profile
    const { data: submission, error: submissionError } = await supabaseClient
      .from('reward_submissions')
      .select(`
        *,
        profiles (
          email,
          full_name
        )
      `)
      .eq('id', submission_id)
      .single();

    if (submissionError || !submission) {
      throw new Error('Submission not found');
    }

    const userEmail = submission.profiles?.email;
    const userName = submission.profiles?.full_name || 'User';

    console.log(`[TODO] Send email to ${userEmail}: Your reward "${submission.title}" (ID: ${reward_id}) has been approved!`);
    console.log(`User: ${userName}, Email: ${userEmail}`);
    console.log(`Reward ID: ${reward_id}, Submission ID: ${submission_id}`);
    console.log('Note: Add RESEND_API_KEY to enable actual email sending');

    return new Response(
      JSON.stringify({ success: true, message: 'Email notification logged (not sent - add RESEND_API_KEY)' }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in approval notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...getCorsHeaders(req) },
      }
    );
  }
};

serve(handler);
