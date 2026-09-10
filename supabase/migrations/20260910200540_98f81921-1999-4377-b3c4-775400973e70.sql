UPDATE public.status_tiers st
SET benefits = sub.new_benefits,
    updated_at = now()
FROM (
  SELECT s.id,
         jsonb_agg(
           CASE
             WHEN t.elem #>> '{}' LIKE 'Earn %x NCTR on all activities'
             THEN to_jsonb('Earn ' || (
                    CASE s.tier_name
                      WHEN 'bronze'   THEN '1.1'
                      WHEN 'silver'   THEN '1.3'
                      WHEN 'gold'     THEN '1.5'
                      WHEN 'platinum' THEN '1.8'
                      WHEN 'diamond'  THEN '2.5'
                    END
                  ) || 'x NCTR on all activities')
             ELSE t.elem
           END
           ORDER BY t.ord
         ) AS new_benefits
  FROM public.status_tiers s
  CROSS JOIN LATERAL jsonb_array_elements(s.benefits) WITH ORDINALITY AS t(elem, ord)
  WHERE s.tier_name IN ('bronze','silver','gold','platinum','diamond')
  GROUP BY s.id
) sub
WHERE st.id = sub.id;