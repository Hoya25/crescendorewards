import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Upload, 
  Gift,
  Info,
  Save,
  Eye,
  Sparkles
} from 'lucide-react';
import { useSponsor } from '@/hooks/useSponsor';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';

const CATEGORIES = [
  { value: 'subscriptions', label: 'Subscriptions' },
  { value: 'gift_cards', label: 'Gift Cards' },
  { value: 'experiences', label: 'Experiences' },
  { value: 'merch', label: 'Merchandise' },
  { value: 'wellness', label: 'Health & Wellness' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'music', label: 'Music & Entertainment' },
  { value: 'events', label: 'Events & Tickets' },
  { value: 'alliance_tokens', label: 'Alliance Tokens' },
];

const TIER_ORDER = ['bronze', 'silver', 'gold', 'platinum', 'diamond'] as const;

export function SponsorSubmitReward() {
  const navigate = useNavigate();
  const { sponsor, loading, createSponsoredReward } = useSponsor();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'subscriptions',
    cost: '',
    stock_quantity: '',
  });
  
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const [enableTierPricing, setEnableTierPricing] = useState(false);
  const [tierPrices, setTierPrices] = useState<Record<string, string>>({
    bronze: '',
    silver: '',
    gold: '',
    platinum: '',
    diamond: '',
  });
  
  const [minTier, setMinTier] = useState<string>('');

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!sponsor) {
    navigate('/become-sponsor');
    return null;
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Image must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `reward-${sponsor.id}-${Date.now()}.${fileExt}`;
      const filePath = `reward-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('public')
        .getPublicUrl(filePath);

      setImageUrl(publicUrl);
      setImageError(false);
      toast({ title: 'Image uploaded' });
    } catch (error) {
      console.error('Error uploading:', error);
      toast({
        title: 'Upload failed',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.cost) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      // Build tier pricing if enabled
      let tierClaimsCost: Record<string, number> | null = null;
      if (enableTierPricing) {
        tierClaimsCost = {};
        for (const tier of TIER_ORDER) {
          const price = tierPrices[tier];
          tierClaimsCost[tier] = price ? parseInt(price) : parseInt(formData.cost);
        }
      }

      const rewardId = await createSponsoredReward({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        cost: parseInt(formData.cost),
        stock_quantity: formData.stock_quantity ? parseInt(formData.stock_quantity) : null,
        image_url: imageUrl || null,
      } as any);

      if (rewardId) {
        toast({
          title: 'Reward submitted!',
          description: 'Your reward is pending review and will be live soon.',
        });
        // Show prompt to add content
        const addContent = window.confirm('Want to add a video or images for this reward?\n\nClick OK to add content now, or Cancel for later.');
        if (addContent) {
          navigate('/sponsor/dashboard');
          // After navigation the sponsor can use the Content tab
        } else {
          navigate('/sponsor/dashboard');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/sponsor/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Submit a Sponsored Reward</h1>
            <p className="text-sm text-muted-foreground">
              Your submission will be reviewed by the Crescendo team
            </p>
          </div>
        </div>

        {/* Notice */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <Info className="w-5 h-5 text-amber-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-700 dark:text-amber-400">
              Submissions are reviewed within 24-48 hours
            </p>
            <p className="text-amber-600 dark:text-amber-500 mt-1">
              Once approved, your reward will appear in the marketplace with your sponsor branding.
            </p>
          </div>
        </div>

        {/* Reward Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              Reward Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Reward Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Premium Subscription - 1 Year"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe what members will receive..."
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select 
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Reward Image</Label>
              <div className="flex gap-4">
                <div className="w-32 h-24 rounded-lg bg-muted border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden">
                  {imageUrl && !imageError ? (
                    <img 
                      src={imageUrl} 
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <Gift className="w-8 h-8 text-muted-foreground/50" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? 'Uploading...' : 'Upload Image'}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Recommended: 800x600px, JPG or PNG
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing & Inventory */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing & Inventory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost">Base Cost (Claims) *</Label>
                <Input
                  id="cost"
                  type="number"
                  min="0"
                  placeholder="50"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stock Quantity</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  placeholder="Unlimited"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                />
              </div>
            </div>

            <Separator />

            {/* Tier-Based Pricing */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Tier-Based Pricing</Label>
                  <p className="text-xs text-muted-foreground">
                    Set different prices for different membership tiers
                  </p>
                </div>
                <Switch
                  checked={enableTierPricing}
                  onCheckedChange={setEnableTierPricing}
                />
              </div>

              {enableTierPricing && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-muted/50 rounded-lg">
                  {TIER_ORDER.map((tier) => (
                    <div key={tier} className="space-y-1">
                      <Label className="text-xs capitalize">{tier}</Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder={formData.cost || '0'}
                        value={tierPrices[tier]}
                        onChange={(e) => setTierPrices({ ...tierPrices, [tier]: e.target.value })}
                      />
                    </div>
                  ))}
                  <div className="col-span-full">
                    <p className="text-xs text-muted-foreground">
                      💡 Set to 0 for FREE access at that tier
                    </p>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Tier Restriction */}
            <div className="space-y-2">
              <Label>Minimum Tier Required</Label>
              <Select value={minTier} onValueChange={setMinTier}>
                <SelectTrigger>
                  <SelectValue placeholder="All members can claim" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All members</SelectItem>
                  <SelectItem value="bronze">Bronze and above</SelectItem>
                  <SelectItem value="silver">Silver and above</SelectItem>
                  <SelectItem value="gold">Gold and above</SelectItem>
                  <SelectItem value="platinum">Platinum and above</SelectItem>
                  <SelectItem value="diamond">Diamond exclusive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Preview
            </CardTitle>
            <CardDescription>
              How your sponsored reward will appear
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-xs mx-auto">
              <div className="rounded-xl border overflow-hidden shadow-lg">
                <div className="relative aspect-[3/2] bg-muted">
                  {imageUrl ? (
                    <img 
                      src={imageUrl} 
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Gift className="w-12 h-12 text-muted-foreground/40" />
                    </div>
                  )}
                  
                  {/* Sponsor Bar */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#1a1d21]/95 via-[#2a2d32]/90 to-transparent px-3 py-2">
                    <div className="flex items-center gap-2">
                      {sponsor.logo_url && (
                        <img 
                          src={sponsor.logo_url} 
                          alt={sponsor.name}
                          className="h-4 w-auto max-w-[40px] object-contain"
                        />
                      )}
                      <span className="text-[10px] text-white/80">
                        <span className="font-light">Sponsored by</span>
                        {' '}
                        <span className="font-semibold text-amber-300/90">
                          {sponsor.name}
                        </span>
                      </span>
                    </div>
                  </div>
                  
                  {/* Title overlay */}
                  <div className="absolute left-0 right-0 bottom-10 p-3">
                    <h3 className="font-bold text-sm text-white line-clamp-2 drop-shadow-md">
                      {formData.title || 'Your Reward Title'}
                    </h3>
                  </div>
                </div>
                
                <div className="p-3 bg-background">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      <Sparkles className="w-3 h-3 mr-1" />
                      {formData.cost || '0'} Claims
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => navigate('/sponsor/dashboard')}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            <Save className="w-4 h-4 mr-2" />
            {submitting ? 'Submitting...' : 'Submit for Review'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default SponsorSubmitReward;
