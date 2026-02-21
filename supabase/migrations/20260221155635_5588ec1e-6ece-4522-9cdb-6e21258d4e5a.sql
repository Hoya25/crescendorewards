
CREATE TABLE public.glossary_terms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  term TEXT NOT NULL UNIQUE,
  short_definition TEXT NOT NULL,
  long_definition TEXT,
  category TEXT DEFAULT 'general',
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.glossary_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Glossary terms are publicly readable"
  ON public.glossary_terms FOR SELECT
  USING (true);

CREATE TRIGGER update_glossary_terms_updated_at
  BEFORE UPDATE ON public.glossary_terms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.glossary_terms (term, short_definition, long_definition, category)
VALUES (
  '360LOCK',
  'A 360-day commitment that unlocks premium rewards. Commitment is the core of everything here.',
  'Lock your earned rewards for 360 days. You keep everything — it stays committed for that period. In return, you unlock premium Crescendo benefits and higher status tiers. One option. One decision. The longer you commit, the more you receive — that principle applies to everyone in the ecosystem, not just members.',
  'commitment'
);
