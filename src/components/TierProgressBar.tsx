interface TierProgressBarProps {
  onLevelUp?: () => void;
  onViewPerks?: () => void;
}

export default function TierProgressBar({ onLevelUp, onViewPerks }: TierProgressBarProps) {
  return (
    <div className="p-6 rounded-xl border border-border bg-card">
      <h2 className="text-lg font-semibold mb-3">Tier Progress</h2>
      <div className="w-full h-3 bg-muted rounded-full overflow-hidden mb-4">
        <div className="h-full bg-primary rounded-full" style={{ width: '35%' }} />
      </div>
      <div className="flex gap-3">
        <button onClick={onLevelUp} className="text-sm text-primary underline">Level Up</button>
        <button onClick={onViewPerks} className="text-sm text-muted-foreground underline">View Perks</button>
      </div>
    </div>
  );
}
