interface CrescendoHeroProps {
  onExploreRewards?: () => void;
  onLevelUp?: () => void;
}

export default function CrescendoHero({ onExploreRewards, onLevelUp }: CrescendoHeroProps) {
  return (
    <section className="py-12 px-4 text-center">
      <h1 className="text-3xl font-bold mb-4">Crescendo</h1>
      <p className="text-muted-foreground mb-6">Your journey to greater rewards starts here.</p>
      <div className="flex gap-4 justify-center">
        <button onClick={onExploreRewards} className="px-6 py-2 rounded-lg bg-primary text-primary-foreground">Explore Rewards</button>
        <button onClick={onLevelUp} className="px-6 py-2 rounded-lg border border-border">Level Up</button>
      </div>
    </section>
  );
}
