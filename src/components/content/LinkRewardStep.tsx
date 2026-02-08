import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface LinkRewardStepProps {
  rewardId: string | null;
  onRewardIdChange: (id: string | null) => void;
}

export function LinkRewardStep({ rewardId, onRewardIdChange }: LinkRewardStepProps) {
  const [linked, setLinked] = useState(!!rewardId);
  const [search, setSearch] = useState('');

  const { data: rewards = [] } = useQuery({
    queryKey: ['rewards-for-content'],
    queryFn: async () => {
      const { data } = await supabase
        .from('rewards')
        .select('id, title, image_url')
        .eq('is_active', true)
        .order('title');
      return data || [];
    },
  });

  const filtered = rewards.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = (val: boolean) => {
    setLinked(val);
    if (!val) onRewardIdChange(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Link to Reward</CardTitle>
        <CardDescription>Is this content about a specific reward?</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Switch checked={linked} onCheckedChange={handleToggle} id="link-reward" />
          <Label htmlFor="link-reward">Yes, this is about a specific reward</Label>
        </div>

        {linked && (
          <>
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search rewards..."
            />
            <div className="max-h-60 overflow-y-auto space-y-2">
              {filtered.map(r => (
                <button
                  key={r.id}
                  onClick={() => onRewardIdChange(r.id)}
                  className={cn(
                    "w-full flex items-center gap-3 text-left p-3 rounded-lg border transition-colors",
                    rewardId === r.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  )}
                >
                  {r.image_url && (
                    <img src={r.image_url} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
                  )}
                  <span className="text-sm font-medium">{r.title}</span>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No rewards found</p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
