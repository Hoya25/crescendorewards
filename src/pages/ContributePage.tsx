import { useState, useEffect, useMemo } from 'react';
import { Gift, Upload, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  const queryClient = useQueryClient();

  const userMultiplier = tier?.earning_multiplier ?? 1;
  const tierName = tier?.display_name ?? 'Bronze';

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

  const baseEarnings = claimCost * 50;
  const finalEarnings = Math.ceil(baseEarnings * userMultiplier);

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
      // Reset form
      setTitle(''); setCategory(''); setDescription(''); setDeliveryMethod('');
      setLocation(''); setClaimLimit(10); setUnlimited(false); setClaimCost(1);
      setImageFile(null); setImagePreview(null);
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
    <div className="min-h-screen bg-page-bg">
      {/* Hero */}
      <div className="py-12 text-center px-4">
        <h1 className="text-3xl font-bold text-text-heading">Contribute to the Marketplace</h1>
        <p className="mt-2 text-text-secondary max-w-xl mx-auto">
          List a reward — a service, experience, product, or offer. Earn NCTR every time another member claims it.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-card-bg rounded-xl p-6 border border-border-card max-w-2xl mx-auto space-y-5">
        <div>
          <Label htmlFor="title">What are you offering?</Label>
          <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., 1-Hour Design Consultation" required />
        </div>

        <div>
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
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
          <p className="text-xs text-text-tertiary mt-1">{description.length}/50 min characters</p>
        </div>

        <div>
          <Label>How is it delivered?</Label>
          <Select value={deliveryMethod} onValueChange={setDeliveryMethod}>
            <SelectTrigger><SelectValue placeholder="Select delivery method" /></SelectTrigger>
            <SelectContent>
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
            <label htmlFor="unlimited" className="text-sm text-text-secondary cursor-pointer">Unlimited</label>
          </div>
        </div>

        <div>
          <Label>Add a photo (optional)</Label>
          <div className="flex items-center gap-3 mt-1">
            <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg border border-border-card bg-elevated text-text-secondary text-sm hover:bg-card-hover transition-colors">
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
          <Label htmlFor="claimCost">Claim Pass cost</Label>
          <p className="text-xs text-text-tertiary mb-1">How many Claim Passes does a member spend to claim this?</p>
          <Input id="claimCost" type="number" value={claimCost} onChange={e => setClaimCost(Math.max(1, Number(e.target.value)))} min={1} />
        </div>


        <Button type="submit" className="w-full bg-accent-lime text-black font-semibold hover:bg-accent-lime/90 mt-6" disabled={submitting}>
          {submitting ? 'Submitting...' : 'List My Reward'}
        </Button>
      </form>

      {/* My Contributions */}
      <div className="max-w-2xl mx-auto mt-12 mb-16 px-4">
        <h2 className="text-text-heading text-xl font-semibold mb-4">Your Contributed Rewards</h2>

        {contributions.length === 0 ? (
          <div className="bg-card-bg rounded-xl p-8 text-center border border-border-card">
            <Gift className="mx-auto h-10 w-10 text-text-tertiary mb-3" />
            <p className="text-text-secondary">You haven't contributed any rewards yet.</p>
            <p className="text-text-tertiary text-sm mt-1">
              List something you can offer and earn NCTR when others claim it.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {contributions.map((r: any) => (
              <div key={r.id} className="bg-card-bg rounded-xl p-4 border border-border-card flex gap-4 items-start">
                <div className="shrink-0">
                  {r.image_url ? (
                    <ImageWithFallback src={r.image_url} alt={r.title} className="h-16 w-16 rounded-lg object-cover" />
                  ) : (
                    <div className="h-16 w-16 rounded-lg bg-elevated flex items-center justify-center">
                      <Gift className="h-6 w-6 text-text-tertiary" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-text-heading truncate">{r.title}</span>
                    {statusBadge(r.contribution_status)}
                  </div>
                  {r.contribution_status === 'rejected' && r.rejection_reason && (
                    <p className="text-red-400 text-xs mt-1">Reason: {r.rejection_reason}</p>
                  )}
                  <div className="flex gap-3 mt-1 text-xs">
                    <span className="text-text-tertiary">Claimed {r.total_claims ?? 0} times</span>
                    <span className="text-accent-lime font-semibold">
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
      </div>
    </div>
  );
}
