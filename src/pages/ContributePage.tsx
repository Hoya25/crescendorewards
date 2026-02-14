import { useState, useRef } from 'react';
import { Gift, Upload, Sparkles, Palette, Briefcase, Trophy, Clock, Crown, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  'Experiences',
  'Merch',
  'Subscriptions',
  'Community',
  'Gift Cards',
  'Entertainment',
  'Other',
];

const DELIVERY_METHODS = [
  'In-person',
  'Virtual / Online',
  'Shipped',
  'Digital download',
  'Redeemable code',
];

const ARCHETYPE_CARDS = [
  {
    id: 'creator',
    title: "I'm a Creator",
    description: 'Lessons, content, shoutouts, exclusive access',
    icon: Sparkles,
    defaultCategory: 'Experiences',
    gradient: 'from-purple-500/20 to-violet-600/20',
    iconColor: 'text-purple-400',
    borderColor: 'border-purple-500/30 hover:border-purple-400/50',
  },
  {
    id: 'maker',
    title: 'I Make Things',
    description: 'Products, art, crafts, handmade goods',
    icon: Palette,
    defaultCategory: 'Merch',
    gradient: 'from-amber-500/20 to-orange-600/20',
    iconColor: 'text-amber-400',
    borderColor: 'border-amber-500/30 hover:border-amber-400/50',
  },
  {
    id: 'skills',
    title: 'I Have Skills',
    description: 'Consulting, coaching, mentorship, services',
    icon: Briefcase,
    defaultCategory: 'Community',
    gradient: 'from-emerald-500/20 to-teal-600/20',
    iconColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30 hover:border-emerald-400/50',
  },
];

function statusBadge(status: string) {
  switch (status) {
    case 'pending':
      return <Badge className="bg-yellow-500/10 text-yellow-500 border-0">Pending Review</Badge>;
    case 'approved':
      return <Badge className="bg-green-500/10 text-green-500 border-0">Live</Badge>;
    case 'rejected':
      return <Badge className="bg-red-500/10 text-red-500 border-0">Rejected</Badge>;
    case 'paused':
      return <Badge className="bg-muted text-muted-foreground border-0">Paused</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default function ContributePage() {
  const { profile, tier } = useUnifiedUser();
  const { user } = useAuthContext();
  const formRef = useRef<HTMLFormElement>(null);

  const userMultiplier = tier?.earning_multiplier ?? 1;

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('');
  const [location, setLocation] = useState('');
  const [claimLimit, setClaimLimit] = useState(10);
  const [unlimited, setUnlimited] = useState(false);
  const [claimCost, setClaimCost] = useState(1);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedArchetype, setSelectedArchetype] = useState<string | null>(null);

  const baseEarnings = claimCost * 50;

  // My contributions query
  const { data: contributions = [], refetch: refetchContributions } = useQuery({
    queryKey: ['my-contributions', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('contributed_by', profile.id)
        .eq('is_contributed', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!profile?.id,
  });

  // Earnings per reward
  const { data: earningsMap = {} } = useQuery({
    queryKey: ['contribution-earnings', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return {};
      const { data, error } = await supabase
        .from('contributed_reward_earnings')
        .select('reward_id, final_nctr_earned')
        .eq('contributor_id', profile.id);
      if (error) return {};
      const map: Record<string, number> = {};
      (data ?? []).forEach((row: any) => {
        map[row.reward_id] = (map[row.reward_id] || 0) + Number(row.final_nctr_earned);
      });
      return map;
    },
    enabled: !!profile?.id,
  });

  // Top contributors leaderboard
  const { data: topContributors = [] } = useQuery({
    queryKey: ['top-contributors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rewards')
        .select('contributed_by, total_claims')
        .eq('is_contributed', true)
        .eq('is_active', true)
        .not('contributed_by', 'is', null);
      if (error) return [];

      // Aggregate claims per contributor
      const contributorMap: Record<string, number> = {};
      (data ?? []).forEach((r: any) => {
        if (r.contributed_by) {
          contributorMap[r.contributed_by] = (contributorMap[r.contributed_by] || 0) + (r.total_claims || 0);
        }
      });

      const sorted = Object.entries(contributorMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);

      if (sorted.length === 0) return [];

      // Fetch profile info
      const ids = sorted.map(([id]) => id);
      const { data: profiles } = await supabase
        .from('unified_profiles')
        .select('id, display_name, avatar_url')
        .in('id', ids);

      const profileMap: Record<string, any> = {};
      (profiles ?? []).forEach((p: any) => { profileMap[p.id] = p; });

      return sorted.map(([id, claims], index) => ({
        rank: index + 1,
        id,
        name: profileMap[id]?.display_name || 'Contributor',
        avatar: profileMap[id]?.avatar_url,
        totalClaims: claims,
      }));
    },
  });

  // Recently listed contributed rewards
  const { data: recentlyListed = [] } = useQuery({
    queryKey: ['recently-listed-contributions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rewards')
        .select('id, title, image_url, cost, category, created_at, contributed_by')
        .eq('is_contributed', true)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) return [];
      return data ?? [];
    },
  });

  const handleArchetypeClick = (archetype: typeof ARCHETYPE_CARDS[0]) => {
    setSelectedArchetype(archetype.id);
    setCategory(archetype.defaultCategory);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id || !user?.id) return;
    if (!title || !category || !description || description.length < 50 || !deliveryMethod) {
      toast({ title: 'Missing fields', description: 'Please fill in all required fields. Description must be at least 50 characters.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl: string | null = null;

      if (imageFile) {
        const ext = imageFile.name.split('.').pop();
        const path = `contributions/${profile.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('reward-images')
          .upload(path, imageFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('reward-images').getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from('rewards').insert({
        title,
        description,
        image_url: imageUrl,
        is_contributed: true,
        contributed_by: profile.id,
        contribution_status: 'pending',
        contribution_category: category,
        delivery_method: deliveryMethod,
        delivery_location: deliveryMethod === 'In-person' ? location : null,
        claim_limit: unlimited ? 99999 : claimLimit,
        contributor_nctr_per_claim: claimCost * 50,
        cost: claimCost,
        is_active: false,
        category: category.toLowerCase().replace(/\s*\/\s*/g, '_').replace(/\s+/g, '_'),
        min_status_tier: 'bronze',
      });

      if (error) throw error;

      toast({ title: '🎉 Submitted!', description: "Your reward has been submitted for review! We'll notify you when it's approved." });
      setTitle(''); setCategory(''); setDescription(''); setDeliveryMethod('');
      setLocation(''); setClaimLimit(10); setUnlimited(false); setClaimCost(1);
      setImageFile(null); setImagePreview(null); setSelectedArchetype(null);
      refetchContributions();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to submit reward', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (rewardId: string, newStatus: string, activate: boolean) => {
    const { error } = await supabase
      .from('rewards')
      .update({ contribution_status: newStatus, is_active: activate })
      .eq('id', rewardId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      refetchContributions();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ===== HERO SECTION ===== */}
      <section className="relative overflow-hidden py-16 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="relative max-w-3xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            Turn Your Skills Into Rewards
          </h1>
          <p className="mt-3 text-muted-foreground text-lg max-w-xl mx-auto">
            Offer your talent, products, or services to the Crescendo community. Earn NCTR every time someone claims your reward.
          </p>
        </div>
      </section>

      {/* ===== ARCHETYPE CARDS ===== */}
      <section className="max-w-3xl mx-auto px-4 -mt-4 mb-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {ARCHETYPE_CARDS.map((arch) => {
            const Icon = arch.icon;
            const isSelected = selectedArchetype === arch.id;
            return (
              <Card
                key={arch.id}
                onClick={() => handleArchetypeClick(arch)}
                className={cn(
                  "cursor-pointer p-5 transition-all duration-200 hover:scale-[1.02]",
                  "border bg-card",
                  arch.borderColor,
                  isSelected && "ring-2 ring-primary border-primary"
                )}
              >
                <div className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center mb-3 bg-gradient-to-br",
                  arch.gradient
                )}>
                  <Icon className={cn("w-5 h-5", arch.iconColor)} />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{arch.title}</h3>
                <p className="text-sm text-muted-foreground leading-snug">{arch.description}</p>
                <div className="mt-3 flex items-center gap-1 text-xs font-medium text-primary">
                  Get started <ArrowRight className="w-3 h-3" />
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ===== CONTRIBUTE FORM ===== */}
      <section className="max-w-2xl mx-auto px-4 mb-12">
        <form ref={formRef} onSubmit={handleSubmit} className="bg-card rounded-xl p-6 border border-border space-y-5 scroll-mt-24">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            List Your Reward
          </h2>

          <div>
            <Label htmlFor="title">What are you offering?</Label>
            <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., 1-Hour Design Consultation" required />
          </div>

          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent className="bg-popover border-border z-50">
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe what the claimer will receive. Be specific about what's included, how it's delivered, and any conditions."
              minLength={50}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">{description.length}/50 min characters</p>
          </div>

          <div>
            <Label>How is it delivered?</Label>
            <Select value={deliveryMethod} onValueChange={setDeliveryMethod}>
              <SelectTrigger><SelectValue placeholder="Select delivery method" /></SelectTrigger>
              <SelectContent className="bg-popover border-border z-50">
                {DELIVERY_METHODS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {deliveryMethod === 'In-person' && (
            <div>
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={location} onChange={e => setLocation(e.target.value)} placeholder="City, State" />
            </div>
          )}

          <div>
            <Label htmlFor="claimLimit">How many members can claim this?</Label>
            <Input
              id="claimLimit"
              type="number"
              value={unlimited ? '' : claimLimit}
              onChange={e => setClaimLimit(Number(e.target.value))}
              min={1}
              disabled={unlimited}
            />
            <div className="flex items-center gap-2 mt-2">
              <Checkbox id="unlimited" checked={unlimited} onCheckedChange={(v) => setUnlimited(!!v)} />
              <label htmlFor="unlimited" className="text-sm text-muted-foreground cursor-pointer">Unlimited</label>
            </div>
          </div>

          <div>
            <Label>Add a photo (optional)</Label>
            <div className="flex items-center gap-3 mt-1">
              <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-muted text-muted-foreground text-sm hover:bg-accent transition-colors">
                <Upload className="h-4 w-4" />
                Choose file
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
              {imagePreview && (
                <img src={imagePreview} alt="Preview" className="h-16 w-16 rounded-lg object-cover" />
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="claimCost">Claim cost</Label>
            <p className="text-xs text-muted-foreground mb-1">How many Claims does a member spend to claim this?</p>
            <Input id="claimCost" type="number" value={claimCost} onChange={e => setClaimCost(Math.max(1, Number(e.target.value)))} min={1} />
            <p className="text-xs text-muted-foreground mt-2">
              You'll earn <span className="font-semibold text-[hsl(var(--accent-lime))]">{baseEarnings} NCTR</span> per claim
            </p>
          </div>

          <Button type="submit" className="w-full bg-[hsl(var(--accent-lime))] text-black font-semibold hover:bg-[hsl(var(--accent-lime))]/90 mt-6" disabled={submitting}>
            {submitting ? 'Submitting...' : 'List My Reward'}
          </Button>
        </form>
      </section>

      {/* ===== MY CONTRIBUTIONS ===== */}
      {profile?.id && (
        <section className="max-w-2xl mx-auto mb-12 px-4">
          <h2 className="text-foreground text-xl font-semibold mb-4">Your Contributed Rewards</h2>

          {contributions.length === 0 ? (
            <div className="bg-card rounded-xl p-8 text-center border border-border">
              <Gift className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">You haven't contributed any rewards yet.</p>
              <p className="text-muted-foreground/70 text-sm mt-1">
                List something you can offer and earn NCTR when others claim it.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {contributions.map((r: any) => (
                <div key={r.id} className="bg-card rounded-xl p-4 border border-border flex gap-4 items-start">
                  <div className="shrink-0">
                    {r.image_url ? (
                      <ImageWithFallback src={r.image_url} alt={r.title} className="h-16 w-16 rounded-lg object-cover" />
                    ) : (
                      <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
                        <Gift className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground truncate">{r.title}</span>
                      {statusBadge(r.contribution_status)}
                    </div>
                    {r.contribution_status === 'rejected' && r.rejection_reason && (
                      <p className="text-red-400 text-xs mt-1">Reason: {r.rejection_reason}</p>
                    )}
                    <div className="flex gap-3 mt-1 text-xs">
                      <span className="text-muted-foreground">Claimed {r.total_claims ?? 0} times</span>
                      <span className="text-[hsl(var(--accent-lime))] font-semibold">
                        Earned {Math.round(earningsMap[r.id] || 0)} NCTR
                      </span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      {r.contribution_status === 'approved' && (
                        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleStatusChange(r.id, 'paused', false)}>
                          Pause
                        </Button>
                      )}
                      {r.contribution_status === 'paused' && (
                        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleStatusChange(r.id, 'approved', true)}>
                          Resume
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ===== TOP CONTRIBUTORS LEADERBOARD ===== */}
      <section className="max-w-2xl mx-auto mb-12 px-4">
        <h2 className="text-foreground text-xl font-semibold mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          Top Contributors
        </h2>
        {topContributors.length === 0 ? (
          <div className="bg-card rounded-xl p-8 text-center border border-border">
            <p className="text-muted-foreground">No contributors yet. Be the first!</p>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {topContributors.map((contributor: any, idx: number) => (
              <div
                key={contributor.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3",
                  idx < topContributors.length - 1 && "border-b border-border"
                )}
              >
                <span className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                  contributor.rank === 1 && "bg-amber-500/20 text-amber-400",
                  contributor.rank === 2 && "bg-slate-400/20 text-slate-300",
                  contributor.rank === 3 && "bg-orange-500/20 text-orange-400",
                  contributor.rank > 3 && "bg-muted text-muted-foreground"
                )}>
                  {contributor.rank <= 3 ? ['🥇','🥈','🥉'][contributor.rank - 1] : contributor.rank}
                </span>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={contributor.avatar} />
                  <AvatarFallback className="text-xs bg-muted">{contributor.name[0]}</AvatarFallback>
                </Avatar>
                <span className="flex-1 text-sm font-medium text-foreground truncate">{contributor.name}</span>
                <span className="text-xs text-muted-foreground">{contributor.totalClaims} claims</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ===== RECENTLY LISTED ===== */}
      <section className="max-w-2xl mx-auto mb-20 px-4">
        <h2 className="text-foreground text-xl font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Recently Listed
        </h2>
        {recentlyListed.length === 0 ? (
          <div className="bg-card rounded-xl p-8 text-center border border-border">
            <p className="text-muted-foreground">No community rewards listed yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentlyListed.map((r: any) => (
              <div key={r.id} className="bg-card rounded-xl p-4 border border-border flex gap-4 items-center">
                <div className="shrink-0">
                  {r.image_url ? (
                    <ImageWithFallback src={r.image_url} alt={r.title} className="h-14 w-14 rounded-lg object-cover" />
                  ) : (
                    <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center">
                      <Gift className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-foreground text-sm truncate block">{r.title}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{r.category}</Badge>
                    <span className="text-xs text-muted-foreground">{r.cost} {r.cost === 1 ? 'Claim' : 'Claims'}</span>
                  </div>
                </div>
                <Badge className="bg-primary/10 text-primary border-0 text-xs shrink-0">
                  <Gift className="w-3 h-3 mr-1" /> Community
                </Badge>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
