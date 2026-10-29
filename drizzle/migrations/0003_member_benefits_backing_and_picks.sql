-- tier_benefits: say + perks per tier (earn rate stays on status_tiers)
CREATE TABLE public.tier_benefits (
  tier_name text PRIMARY KEY,
  backing_weight numeric NOT NULL,
  can_nominate boolean NOT NULL DEFAULT false,
  council_eligible boolean NOT NULL DEFAULT false,
  perks jsonb NOT NULL DEFAULT '[]'::jsonb,
  legacy_benefits jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tier_benefits TO anon, authenticated;
GRANT ALL ON public.tier_benefits TO service_role;
ALTER TABLE public.tier_benefits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tier benefits are public" ON public.tier_benefits FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage tier benefits" ON public.tier_benefits FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
GRANT INSERT, UPDATE, DELETE ON public.tier_benefits TO authenticated;

INSERT INTO public.tier_benefits (tier_name, backing_weight, can_nominate, council_eligible, perks, legacy_benefits)
SELECT st.tier_name,
  CASE st.tier_name WHEN 'bronze' THEN 1 WHEN 'silver' THEN 1.5 WHEN 'gold' THEN 2 WHEN 'platinum' THEN 2.5 WHEN 'diamond' THEN 3 END,
  st.tier_name IN ('gold','platinum','diamond'),
  st.tier_name IN ('platinum','diamond'),
  '[]'::jsonb,
  st.benefits
FROM public.status_tiers st
WHERE st.tier_name IN ('bronze','silver','gold','platinum','diamond')
ON CONFLICT (tier_name) DO NOTHING;

-- reward_backing: server-written snapshots
CREATE TABLE public.reward_backing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reward_id uuid NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  tier_at_backing text NOT NULL,
  weight_at_backing numeric NOT NULL,
  participation_factor numeric NOT NULL DEFAULT 1.0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, reward_id)
);
CREATE INDEX reward_backing_reward_idx ON public.reward_backing (reward_id, created_at);
GRANT SELECT ON public.reward_backing TO authenticated;
GRANT ALL ON public.reward_backing TO service_role;
ALTER TABLE public.reward_backing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read own backing" ON public.reward_backing FOR SELECT TO authenticated USING (user_id = auth.uid());

-- pick cycles
CREATE TABLE public.pick_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('member','commons')),
  cycle_month date NOT NULL,
  envelope_claims integer,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('draft','open','tallying','decided')),
  winner_reward_id uuid REFERENCES public.rewards(id) ON DELETE SET NULL,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.pick_cycle_candidates (
  cycle_id uuid NOT NULL REFERENCES public.pick_cycles(id) ON DELETE CASCADE,
  reward_id uuid NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (cycle_id, reward_id)
);
CREATE TABLE public.pick_tally (
  cycle_id uuid NOT NULL REFERENCES public.pick_cycles(id) ON DELETE CASCADE,
  reward_id uuid NOT NULL,
  raw_score numeric NOT NULL,
  final_score numeric NOT NULL,
  backer_count integer NOT NULL,
  first_backing_at timestamptz,
  rank integer NOT NULL,
  detail jsonb,
  computed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (cycle_id, reward_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pick_cycles, public.pick_cycle_candidates, public.pick_tally TO authenticated;
GRANT ALL ON public.pick_cycles, public.pick_cycle_candidates, public.pick_tally TO service_role;
ALTER TABLE public.pick_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pick_cycle_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pick_tally ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage pick cycles" ON public.pick_cycles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage pick candidates" ON public.pick_cycle_candidates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins read pick tally" ON public.pick_tally FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- aggregate-only public projection
CREATE VIEW public.backing_public AS
SELECT r.id AS reward_id,
  COALESCE(b.n, 0)::integer AS backer_count,
  EXISTS (SELECT 1 FROM public.pick_cycle_candidates c JOIN public.pick_cycles pc ON pc.id = c.cycle_id
          WHERE c.reward_id = r.id AND pc.status = 'open') AS in_running
FROM public.rewards r
LEFT JOIN (SELECT reward_id, count(*) n FROM public.reward_backing GROUP BY reward_id) b ON b.reward_id = r.id
WHERE r.is_active = true;
GRANT SELECT ON public.backing_public TO anon, authenticated;

-- studio share setting
INSERT INTO public.admin_settings (setting_key, setting_value, description)
SELECT 'show_studio_share', 'false'::jsonb, 'Show the Studio backing share line on the Status page'
WHERE NOT EXISTS (SELECT 1 FROM public.admin_settings WHERE setting_key = 'show_studio_share');

CREATE OR REPLACE FUNCTION public.get_show_studio_share()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT (setting_value)::text = 'true' FROM public.admin_settings WHERE setting_key = 'show_studio_share'), false)
$$;
REVOKE ALL ON FUNCTION public.get_show_studio_share() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_show_studio_share() TO anon, authenticated;

-- TODO(BH): replace with a verified Bounty Hunter confirmed-earn lookup (prior 30 days).
CREATE OR REPLACE FUNCTION public.get_member_recent_earn(p_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT true -- TODO: stub; always true until the BH interface is specified
$$;
REVOKE ALL ON FUNCTION public.get_member_recent_earn(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.current_member_tier()
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_bal numeric; v_override text; v_tier text;
BEGIN
  SELECT COALESCE(up.nctr_locked_points,0), up.tier_override INTO v_bal, v_override
  FROM public.unified_profiles up WHERE up.auth_user_id = auth.uid() LIMIT 1;
  IF v_override IS NOT NULL AND v_override <> '' THEN
    SELECT tier_name INTO v_tier FROM public.status_tiers WHERE lower(tier_name) = lower(v_override) OR id::text = v_override LIMIT 1;
    IF v_tier IS NOT NULL THEN RETURN v_tier; END IF;
  END IF;
  SELECT tier_name INTO v_tier FROM public.status_tiers
  WHERE is_active AND min_nctr_360_locked <= COALESCE(v_bal,0)
  ORDER BY min_nctr_360_locked DESC LIMIT 1;
  RETURN v_tier;
END $$;
REVOKE ALL ON FUNCTION public.current_member_tier() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_member_tier() TO authenticated;

CREATE OR REPLACE FUNCTION public.back_reward(p_reward_id uuid)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_tier text; v_weight numeric;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Sign in to back rewards'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.rewards WHERE id = p_reward_id AND is_active) THEN
    RAISE EXCEPTION 'Reward not available';
  END IF;
  v_tier := public.current_member_tier();
  SELECT backing_weight INTO v_weight FROM public.tier_benefits WHERE tier_name = v_tier;
  IF v_tier IS NULL OR v_weight IS NULL THEN RAISE EXCEPTION 'Reach Bronze to back rewards'; END IF;
  INSERT INTO public.reward_backing (user_id, reward_id, tier_at_backing, weight_at_backing, participation_factor)
  VALUES (v_uid, p_reward_id, v_tier, v_weight, 1.0)
  ON CONFLICT (user_id, reward_id) DO NOTHING;
  RETURN jsonb_build_object('backed', true, 'tier', v_tier, 'weight', v_weight);
END $$;
REVOKE ALL ON FUNCTION public.back_reward(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.back_reward(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.withdraw_backing(p_reward_id uuid)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  DELETE FROM public.reward_backing WHERE user_id = auth.uid() AND reward_id = p_reward_id;
  RETURN jsonb_build_object('backed', false);
END $$;
REVOKE ALL ON FUNCTION public.withdraw_backing(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.withdraw_backing(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_pick_cycles_public()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', pc.id, 'kind', pc.kind, 'cycle_month', pc.cycle_month, 'envelope_claims', pc.envelope_claims,
    'status', pc.status, 'winner_reward_id', pc.winner_reward_id,
    'candidates', COALESCE((SELECT jsonb_agg(jsonb_build_object('reward_id', r.id, 'title', r.title, 'image_url', r.image_url) ORDER BY c.created_at)
                   FROM public.pick_cycle_candidates c JOIN public.rewards r ON r.id = c.reward_id WHERE c.cycle_id = pc.id), '[]'::jsonb)
  ) ORDER BY pc.cycle_month DESC), '[]'::jsonb)
  FROM public.pick_cycles pc WHERE pc.status IN ('open','decided')
$$;
REVOKE ALL ON FUNCTION public.get_pick_cycles_public() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_pick_cycles_public() TO anon, authenticated;

-- Admin tally. Steps:
-- 1 gather backings on candidates; 2 recompute participation factor (1.0 with recent BH earn, else 1/weight);
-- 3 contribution = weight * factor; 4 sum per tier per reward; 5 tier cap = GREATEST(1/3, 1/participating tiers)
-- of grand total; 6 scale each over-cap tier down to the cap; 7 sum per reward; 8 rank (ties: earliest backing).
CREATE OR REPLACE FUNCTION public.tally_pick_cycle(p_cycle_id uuid)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
  DELETE FROM public.pick_tally WHERE cycle_id = p_cycle_id;
  WITH b AS (
    SELECT rb.reward_id, rb.tier_at_backing AS tier, rb.created_at, rb.weight_at_backing AS w,
      CASE WHEN public.get_member_recent_earn(rb.user_id) THEN 1.0 ELSE 1.0 / NULLIF(rb.weight_at_backing,0) END AS f
    FROM public.reward_backing rb
    JOIN public.pick_cycle_candidates c ON c.reward_id = rb.reward_id AND c.cycle_id = p_cycle_id
  ), per_tier AS (
    SELECT reward_id, tier, sum(w * f) AS s FROM b GROUP BY reward_id, tier
  ), tier_tot AS (
    SELECT tier, sum(s) AS t FROM per_tier GROUP BY tier
  ), g AS (
    SELECT sum(t) AS total, GREATEST(1.0/3, 1.0/NULLIF(count(*),0)) AS cap FROM tier_tot
  ), scaled AS (
    SELECT p.reward_id, p.tier, p.s,
      p.s * LEAST(1.0, (g.cap * g.total) / NULLIF(tt.t,0)) AS s_capped
    FROM per_tier p JOIN tier_tot tt USING (tier) CROSS JOIN g
  ), agg AS (
    SELECT c.reward_id,
      COALESCE(sum(s.s),0) AS raw_score, COALESCE(sum(s.s_capped),0) AS final_score,
      (SELECT count(*) FROM b WHERE b.reward_id = c.reward_id) AS backer_count,
      (SELECT min(created_at) FROM b WHERE b.reward_id = c.reward_id) AS first_at,
      jsonb_object_agg(COALESCE(s.tier,'none'), s.s_capped) FILTER (WHERE s.tier IS NOT NULL) AS detail
    FROM public.pick_cycle_candidates c LEFT JOIN scaled s ON s.reward_id = c.reward_id
    WHERE c.cycle_id = p_cycle_id GROUP BY c.reward_id
  )
  INSERT INTO public.pick_tally (cycle_id, reward_id, raw_score, final_score, backer_count, first_backing_at, rank, detail)
  SELECT p_cycle_id, reward_id, raw_score, final_score, backer_count, first_at,
    row_number() OVER (ORDER BY final_score DESC, first_at ASC NULLS LAST), detail
  FROM agg;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  UPDATE public.pick_cycles SET status = 'tallying' WHERE id = p_cycle_id AND status = 'open';
  RETURN jsonb_build_object('candidates_tallied', v_count);
END $$;
REVOKE ALL ON FUNCTION public.tally_pick_cycle(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tally_pick_cycle(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.set_pick_cycle_winner(p_cycle_id uuid, p_reward_id uuid)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.pick_cycle_candidates WHERE cycle_id = p_cycle_id AND reward_id = p_reward_id) THEN
    RAISE EXCEPTION 'Reward is not a candidate in this cycle';
  END IF;
  UPDATE public.pick_cycles SET winner_reward_id = p_reward_id, status = 'decided', decided_at = now() WHERE id = p_cycle_id;
  RETURN jsonb_build_object('decided', true);
END $$;
REVOKE ALL ON FUNCTION public.set_pick_cycle_winner(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_pick_cycle_winner(uuid, uuid) TO authenticated;