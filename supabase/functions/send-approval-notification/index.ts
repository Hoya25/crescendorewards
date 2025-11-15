import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { ApprovalNotificationEmail } from './_templates/approval-notification.tsx';

// TODO: Add RESEND_API_KEY secret before this function will work
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApprovalNotificationRequest {
  submission_id: string;
  reward_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

    if (!userEmail) {
      throw new Error('User email not found');
    }

    // Render email template
    const html = await renderAsync(
      React.createElement(ApprovalNotificationEmail, {
        userName,
        rewardTitle: submission.title,
        rewardId: reward_id,
        appUrl: Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovable.app') || '',
      })
    );

    // Send email via Resend
    const { error: emailError } = await resend.emails.send({
      from: 'NCTR Rewards <onboarding@resend.dev>',
      to: [userEmail],
      subject: `🎉 Your reward "${submission.title}" has been approved!`,
      html,
    });

    if (emailError) {
      throw emailError;
    }

    console.log(`Approval notification sent to ${userEmail} for submission ${submission_id}`);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending approval notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
