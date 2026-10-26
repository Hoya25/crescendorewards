ALTER POLICY "Admins can manage all rewards"
ON public.rewards TO authenticated;

ALTER POLICY "Admins can manage brands"
ON public.brands TO authenticated;