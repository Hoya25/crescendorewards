import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json().catch(() => ({}))
    const submission_id = body?.submission_id
    if (!submission_id || typeof submission_id !== 'string' || !UUID_RE.test(submission_id)) {
      return new Response(JSON.stringify({ error: 'invalid submission_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Find a live reward linked to this submission
    const { data: reward, error: rErr } = await supabase
      .from('rewards')
      .select('id, title, description, image_url, category, is_active, contributor_user_id')
      .eq('submission_id', submission_id)
      .eq('is_active', true)
      .maybeSingle()

    if (rErr || !reward) {
      return new Response(JSON.stringify({ public: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let contributor_display_name: string | null = null
    if (reward.contributor_user_id) {
      const { data: prof } = await supabase
        .from('unified_profiles')
        .select('display_name, first_name')
        .eq('auth_user_id', reward.contributor_user_id)
        .maybeSingle()
      contributor_display_name = prof?.display_name || prof?.first_name || null
    }

    return new Response(
      JSON.stringify({
        public: true,
        submission_id,
        reward_id: reward.id,
        title: reward.title,
        description: reward.description,
        image_url: reward.image_url,
        category: reward.category,
        contributor_display_name,
        status: 'available',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (e) {
    return new Response(JSON.stringify({ error: 'internal_error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
