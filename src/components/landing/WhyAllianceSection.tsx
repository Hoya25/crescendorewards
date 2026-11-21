const barlow = "'Barlow Condensed', sans-serif";

const proofLines = [
  'Kroma Wellness signed as the first founding brand.',
  'NCTR Merch earns today.',
  'Crescendo status opens with your first 360LOCK.',
];

export function WhyAllianceSection() {
  return (
    <section id="why-the-alliance" className="py-12 md:py-16 px-4 md:px-6 bg-page-bg-alt">
      <div className="max-w-5xl mx-auto">
        <span className="block text-xs font-semibold uppercase tracking-wider text-text-body-muted text-center">
          Why the alliance exists
        </span>
        <p className="text-sm md:text-base leading-relaxed text-text-body text-center max-w-3xl mx-auto mt-4">
          The everyday economy already pays out on everything we buy. The alliance points that money at members: brands fund member bounties, the alliance sponsors the rewards, and status decides who unlocks them.
        </p>
        <h2
          className="text-2xl md:text-4xl font-bold text-center text-text-heading max-w-4xl mx-auto mt-10 mb-10"
          style={{ fontFamily: barlow, letterSpacing: '-0.02em' }}
        >
          Each Impact Engine takes budget that used to vanish into ads and uses it to make one part of life more affordable to more people.
        </h2>
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {proofLines.map((line) => (
            <div
              key={line}
              className="p-6 text-center border border-border-card bg-page-bg"
              style={{ borderRadius: '0px' }}
            >
              <p className="text-sm leading-relaxed text-text-body">{line}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
