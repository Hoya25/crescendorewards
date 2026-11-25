const KROMA_LOGO =
  'https://yhwcaodofmbusjurawhp.supabase.co/storage/v1/object/public/reward-images/kroma/kroma-logo.webp';

export function WellnessRewardsSection() {
  return (
    <section className="py-8 relative overflow-hidden" style={{ background: '#1F2020' }}>
      <div className="container mx-auto px-4 max-w-full">
        <div
          className="flex flex-col sm:flex-row sm:items-center gap-4 border p-5"
          style={{ borderRadius: '0px', borderColor: '#323232', borderLeft: '3px solid #E2FF6D' }}
        >
          <img src={KROMA_LOGO} alt="Kroma Wellness" className="w-20 h-auto shrink-0 dark:invert" />
          <div className="flex-1">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground" style={{ fontFamily: '"DM Mono", monospace' }}>
              Founding brand
            </div>
            <h2 className="text-xl font-bold uppercase mt-1" style={{ fontFamily: '"Barlow Condensed", sans-serif' }}>
              KROMA WELLNESS
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Kroma Wellness signed as the first founding brand.
            </p>
          </div>
          <a
            href="https://kromawellness.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-foreground hover:underline shrink-0"
          >
            Visit Kroma Wellness →
          </a>
        </div>
      </div>
    </section>
  );
}
