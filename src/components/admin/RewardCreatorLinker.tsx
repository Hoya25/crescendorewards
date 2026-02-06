import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Search, Plus, X, GripVertical } from 'lucide-react';
import { PlatformIcon, PLATFORM_LABELS } from '@/components/creators/PlatformIcon';
import { CreatorShowcase } from '@/components/creators/CreatorShowcase';
import type { FeaturedCreator } from '@/types/creators';
import { cn } from '@/lib/utils';

interface RewardCreatorLinkerProps {
  rewardId: string;
  showcaseMode: string;
  onShowcaseModeChange: (mode: string) => void;
}

export function RewardCreatorLinker({ rewardId, showcaseMode, onShowcaseModeChange }: RewardCreatorLinkerProps) {
  const [allCreators, setAllCreators] = useState<FeaturedCreator[]>([]);
  const [linkedIds, setLinkedIds] = useState<Set<string>>(new Set());
  const [linkedCreators, setLinkedCreators] = useState<FeaturedCreator[]>([]);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAllCreators();
    loadLinkedCreators();
  }, [rewardId]);

  const loadAllCreators = async () => {
    const { data } = await supabase.from('featured_creators').select('*').order('display_priority', { ascending: false });
    setAllCreators((data || []) as unknown as FeaturedCreator[]);
  };

  const loadLinkedCreators = async () => {
    const { data } = await supabase
      .from('reward_featured_creators')
      .select('*, creator:featured_creators(*)')
      .eq('reward_id', rewardId)
      .order('display_order', { ascending: true });

    if (data) {
      const creators = (data as any[]).map(d => d.creator).filter(Boolean) as FeaturedCreator[];
      setLinkedCreators(creators);
      setLinkedIds(new Set(creators.map(c => c.id)));
    }
  };

  const toggleCreator = async (creatorId: string) => {
    setSaving(true);
    if (linkedIds.has(creatorId)) {
      await supabase.from('reward_featured_creators').delete().eq('reward_id', rewardId).eq('creator_id', creatorId);
    } else {
      await supabase.from('reward_featured_creators').insert({
        reward_id: rewardId,
        creator_id: creatorId,
        display_order: linkedCreators.length,
      });
    }
    await loadLinkedCreators();
    setSaving(false);
  };

  const removeCreator = async (creatorId: string) => {
    await supabase.from('reward_featured_creators').delete().eq('reward_id', rewardId).eq('creator_id', creatorId);
    await loadLinkedCreators();
  };

  const filtered = allCreators.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.handle?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const effectiveMode = showcaseMode as 'collage' | 'single' | 'carousel';

  return (
    <div className="space-y-4 border rounded-lg p-4">
      <h3 className="font-semibold text-sm">Featured Creators</h3>

      {/* Showcase Mode */}
      <div>
        <Label className="text-xs">Showcase Mode</Label>
        <Select value={showcaseMode} onValueChange={onShowcaseModeChange}>
          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default (reward image only)</SelectItem>
            <SelectItem value="single">Single Creator</SelectItem>
            <SelectItem value="collage">Collage (3-4 faces)</SelectItem>
            <SelectItem value="carousel">Carousel (rotate)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Linked creators */}
      {linkedCreators.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs">Linked Creators ({linkedCreators.length})</Label>
          <div className="space-y-1">
            {linkedCreators.map(c => (
              <div key={c.id} className="flex items-center gap-2 p-1.5 rounded border bg-muted/30 text-sm">
                <img src={c.image_url} alt="" className="w-6 h-6 rounded-full object-cover" onError={e => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
                <span className="font-medium flex-1 truncate">{c.name}</span>
                <PlatformIcon platform={c.platform} size={12} />
                <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => removeCreator(c.id)}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview */}
      {linkedCreators.length > 0 && showcaseMode !== 'default' && (
        <div className="border rounded-lg p-3 bg-muted/20">
          <Label className="text-xs mb-2 block">Preview</Label>
          <div className="aspect-[4/3] rounded-lg overflow-hidden bg-muted relative">
            {effectiveMode === 'collage' ? (
              <div className="w-full h-full flex items-center justify-center">
                <CreatorShowcase creators={linkedCreators} mode="collage" size="lg" />
              </div>
            ) : (
              <CreatorShowcase creators={linkedCreators} mode={effectiveMode} className="w-full h-full" />
            )}
          </div>
        </div>
      )}

      {/* Add creators */}
      <div>
        <Label className="text-xs">Add Creators</Label>
        <div className="relative mt-1">
          <Search className="absolute left-2 top-2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-7 h-8 text-sm" />
        </div>
        <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
          {filtered.slice(0, 10).map(c => (
            <label key={c.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 cursor-pointer text-sm">
              <Checkbox checked={linkedIds.has(c.id)} onCheckedChange={() => toggleCreator(c.id)} disabled={saving} />
              <img src={c.image_url} alt="" className="w-5 h-5 rounded-full object-cover" onError={e => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
              <span className="flex-1 truncate">{c.name}</span>
              <PlatformIcon platform={c.platform} size={12} />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
