import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { TierPricingEditor } from './TierPricingEditor';
import { RewardPriceDisplay } from '@/components/rewards/RewardPriceDisplay';
import { 
  Upload, X, Image as ImageIcon, Info, Save, Eye,
  Sparkles, Tag, Lock, Calendar, Package
} from 'lucide-react';
import { validateImageFile } from '@/lib/image-validation';
import { compressImageWithStats, formatBytes } from '@/lib/image-compression';
import { cn } from '@/lib/utils';

interface TierPricing {
  bronze: number;
  silver: number;
  gold: number;
  platinum: number;
  diamond: number;
}

interface Campaign {
  id: string;
  campaign_name: string;
  sponsor_name: string;
  is_active: boolean;
}

interface Sponsor {
  id: string;
  name: string;
  logo_url: string | null;
  is_active: boolean;
}

interface SponsoredRewardFormProps {
  open: boolean;
  onClose: () => void;
  reward?: any;
  onSave: () => void;
}

const CATEGORIES = [
  { value: 'alliance_tokens', label: 'Alliance Tokens' },
  { value: 'experiences', label: 'Experiences' },
  { value: 'merch', label: 'Merchandise' },
  { value: 'gift_cards', label: 'Gift Cards' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'opportunity', label: 'Opportunity' },
];

const TIERS = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

export function SponsoredRewardForm({ open, onClose, reward, onSave }: SponsoredRewardFormProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [previewTier, setPreviewTier] = useState('bronze');

  const [formData, setFormData] = useState({
    // Basic
    title: '',
    description: '',
    category: 'experiences',
    cost: 100,
    // Sponsor
    is_sponsored: true,
    sponsor_name: '',
    sponsor_logo: '',
    sponsor_link: '',
    campaign_id: null as string | null,
    // Tier Pricing
    status_tier_claims_cost: null as TierPricing | null,
    // Restrictions
    min_status_tier: null as string | null,
    stock_quantity: null as number | null,
    sponsor_start_date: '',
    sponsor_end_date: '',
    is_active: true,
    is_featured: false,
    // Media
    image_url: null as string | null,
  });

  useEffect(() => {
    if (open) {
      loadCampaigns();
      loadSponsors();
      
      if (reward) {
        setFormData({
          title: reward.title || '',
          description: reward.description || '',
          category: reward.category || 'experiences',
          cost: reward.cost || 100,
          is_sponsored: reward.is_sponsored ?? true,
          sponsor_name: reward.sponsor_name || '',
          sponsor_logo: reward.sponsor_logo || reward.sponsor_logo_url || '',
          sponsor_link: reward.sponsor_link || '',
          campaign_id: reward.campaign_id || null,
          status_tier_claims_cost: reward.status_tier_claims_cost || null,
          min_status_tier: reward.min_status_tier || null,
          stock_quantity: reward.stock_quantity,
          sponsor_start_date: reward.sponsor_start_date ? reward.sponsor_start_date.split('T')[0] : '',
          sponsor_end_date: reward.sponsor_end_date ? reward.sponsor_end_date.split('T')[0] : '',
          is_active: reward.is_active ?? true,
          is_featured: reward.is_featured ?? false,
          image_url: reward.image_url || null,
        });
        setImagePreview(reward.image_url);
      } else {
        // Reset for new reward
        setFormData({
          title: '',
          description: '',
          category: 'experiences',
          cost: 100,
          is_sponsored: true,
          sponsor_name: '',
          sponsor_logo: '',
          sponsor_link: '',
          campaign_id: null,
          status_tier_claims_cost: null,
          min_status_tier: null,
          stock_quantity: null,
          sponsor_start_date: '',
          sponsor_end_date: '',
          is_active: true,
          is_featured: false,
          image_url: null,
        });
        setImagePreview(null);
      }
      setImageFile(null);
    }
  }, [open, reward]);

  const loadCampaigns = async () => {
    const { data } = await supabase
      .from('sponsored_campaigns')
      .select('id, campaign_name, sponsor_name, is_active')
      .order('campaign_name');
    setCampaigns(data || []);
  };

  const loadSponsors = async () => {
    const { data } = await supabase
      .from('sponsors')
      .select('id, name, logo_url, is_active')
      .eq('is_active', true)
      .order('name');
    setSponsors(data || []);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSetImage(file);
  };

  const validateAndSetImage = (file: File) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast({ title: 'Error', description: validation.error, variant: 'destructive' });
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSetImage(file);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return formData.image_url;
    try {
      setUploading(true);
      const { file: compressedFile, originalSize, compressedSize, compressionRatio } = 
        await compressImageWithStats(imageFile);
      if (compressionRatio > 0.1) {
        toast({ title: 'Image Compressed', description: `Reduced from ${formatBytes(originalSize)} to ${formatBytes(compressedSize)}` });
      }
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `rewards/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('reward-images')
        .upload(filePath, compressedFile, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('reward-images').getPublicUrl(filePath);
      return publicUrl;
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title) {
      toast({ title: 'Validation Error', description: 'Title is required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const imageUrl = await uploadImage();
      if (imageFile && !imageUrl) return;

      const dataToSave = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        cost: formData.cost,
        is_sponsored: formData.is_sponsored,
        sponsor_name: formData.sponsor_name || null,
        sponsor_logo: formData.sponsor_logo || null,
        sponsor_link: formData.sponsor_link || null,
        campaign_id: formData.campaign_id,
        status_tier_claims_cost: formData.status_tier_claims_cost as unknown as Record<string, number> | null,
        min_status_tier: formData.min_status_tier,
        stock_quantity: formData.stock_quantity,
        sponsor_start_date: formData.sponsor_start_date || null,
        sponsor_end_date: formData.sponsor_end_date || null,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
        image_url: imageUrl,
        sponsor_enabled: formData.is_sponsored,
      };

      if (reward?.id) {
        const { error } = await supabase
          .from('rewards')
          .update(dataToSave as any)
          .eq('id', reward.id);
        if (error) throw error;
        toast({ title: 'Success', description: 'Sponsored reward updated' });
      } else {
        const { error } = await supabase
          .from('rewards')
          .insert([dataToSave as any]);
        if (error) throw error;
        toast({ title: 'Success', description: 'Sponsored reward created' });
      }

      onSave();
      onClose();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const selectSponsor = (sponsorId: string) => {
    const sponsor = sponsors.find(s => s.id === sponsorId);
    if (sponsor) {
      setFormData({
        ...formData,
        sponsor_name: sponsor.name,
        sponsor_logo: sponsor.logo_url || '',
      });
    }
  };

  // Mock reward for preview
  const previewReward = {
    id: 'preview',
    cost: formData.cost,
    is_sponsored: formData.is_sponsored,
    status_tier_claims_cost: formData.status_tier_claims_cost,
    min_status_tier: formData.min_status_tier,
    stock_quantity: formData.stock_quantity,
    is_active: formData.is_active,
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {reward ? 'Edit Sponsored Reward' : 'Create Sponsored Reward'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic" className="gap-1">
              <Info className="w-3 h-3" />
              Basic
            </TabsTrigger>
            <TabsTrigger value="sponsor" className="gap-1">
              <Tag className="w-3 h-3" />
              Sponsor
            </TabsTrigger>
            <TabsTrigger value="pricing" className="gap-1">
              <Sparkles className="w-3 h-3" />
              Pricing
            </TabsTrigger>
            <TabsTrigger value="restrictions" className="gap-1">
              <Lock className="w-3 h-3" />
              Limits
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-1">
              <Eye className="w-3 h-3" />
              Preview
            </TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="VIP Concert Experience"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Exclusive backstage access..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cost">Base Cost (Claims)</Label>
                  <Input
                    id="cost"
                    type="number"
                    min={0}
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Reward Image</Label>
                <div
                  className={cn(
                    'border-2 border-dashed rounded-lg p-6 transition-colors text-center',
                    isDragging ? 'border-primary bg-primary/5' : 'border-border',
                    'hover:border-primary/50'
                  )}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  {imagePreview ? (
                    <div className="relative inline-block">
                      <img src={imagePreview} alt="Preview" className="max-h-40 rounded" />
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={() => { setImageFile(null); setImagePreview(null); }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <ImageIcon className="w-10 h-10 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Drag & drop an image or{' '}
                        <label className="text-primary cursor-pointer hover:underline">
                          browse
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                          />
                        </label>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>Active</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                  />
                  <Label>Featured</Label>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Sponsor Tab */}
          <TabsContent value="sponsor" className="space-y-4 mt-4">
            <div className="flex items-center gap-2 mb-4">
              <Switch
                checked={formData.is_sponsored}
                onCheckedChange={(checked) => setFormData({ ...formData, is_sponsored: checked })}
              />
              <Label className="font-medium">This is a sponsored reward</Label>
            </div>

            {formData.is_sponsored && (
              <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                {/* Quick Select from Sponsors */}
                {sponsors.length > 0 && (
                  <div className="space-y-2">
                    <Label>Quick Select Sponsor</Label>
                    <Select onValueChange={selectSponsor}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select existing sponsor..." />
                      </SelectTrigger>
                      <SelectContent>
                        {sponsors.map((sponsor) => (
                          <SelectItem key={sponsor.id} value={sponsor.id}>
                            {sponsor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sponsor_name">Sponsor Name</Label>
                    <Input
                      id="sponsor_name"
                      value={formData.sponsor_name}
                      onChange={(e) => setFormData({ ...formData, sponsor_name: e.target.value })}
                      placeholder="NCTR Alliance"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sponsor_logo">Sponsor Logo URL</Label>
                    <Input
                      id="sponsor_logo"
                      value={formData.sponsor_logo}
                      onChange={(e) => setFormData({ ...formData, sponsor_logo: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sponsor_link">Sponsor Link (Optional)</Label>
                  <Input
                    id="sponsor_link"
                    value={formData.sponsor_link}
                    onChange={(e) => setFormData({ ...formData, sponsor_link: e.target.value })}
                    placeholder="https://sponsor-website.com"
                  />
                </div>

                {/* Campaign Link */}
                {campaigns.length > 0 && (
                  <div className="space-y-2">
                    <Label>Link to Campaign (Optional)</Label>
                    <Select
                      value={formData.campaign_id || 'none'}
                      onValueChange={(value) => setFormData({ ...formData, campaign_id: value === 'none' ? null : value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Campaign</SelectItem>
                        {campaigns.map((campaign) => (
                          <SelectItem key={campaign.id} value={campaign.id}>
                            {campaign.campaign_name} ({campaign.sponsor_name})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Sponsor Logo Preview */}
                {formData.sponsor_logo && (
                  <div className="p-4 bg-muted rounded-lg">
                    <Label className="text-xs text-muted-foreground mb-2 block">Logo Preview</Label>
                    <img 
                      src={formData.sponsor_logo} 
                      alt="Sponsor Logo" 
                      className="h-8 object-contain"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing" className="space-y-4 mt-4">
            <TierPricingEditor
              baseCost={formData.cost}
              pricing={formData.status_tier_claims_cost}
              onChange={(pricing) => setFormData({ ...formData, status_tier_claims_cost: pricing })}
            />
          </TabsContent>

          {/* Restrictions Tab */}
          <TabsContent value="restrictions" className="space-y-4 mt-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Minimum Status Tier</Label>
                <Select
                  value={formData.min_status_tier || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, min_status_tier: value === 'none' ? null : value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Minimum (All Users)</SelectItem>
                    <SelectItem value="droplet">💧 Droplet</SelectItem>
                    <SelectItem value="eddy">🌀 Eddy</SelectItem>
                    <SelectItem value="spiral">🌊 Spiral</SelectItem>
                    <SelectItem value="surge">⚡ Surge</SelectItem>
                    <SelectItem value="torus">🔮 Torus</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Only users at or above this tier can claim this reward
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock">Quantity Available</Label>
                <Input
                  id="stock"
                  type="number"
                  min={0}
                  value={formData.stock_quantity ?? ''}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="Unlimited"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty for unlimited
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.sponsor_start_date}
                    onChange={(e) => setFormData({ ...formData, sponsor_start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.sponsor_end_date}
                    onChange={(e) => setFormData({ ...formData, sponsor_end_date: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Label>Preview as tier:</Label>
                <Select value={previewTier} onValueChange={setPreviewTier}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIERS.map((tier) => (
                      <SelectItem key={tier} value={tier}>
                        {tier.charAt(0).toUpperCase() + tier.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Card>
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    {/* Image */}
                    <div className="w-48 h-48 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="text-xl font-bold">{formData.title || 'Reward Title'}</h3>
                        {formData.is_sponsored && formData.sponsor_name && (
                          <Badge variant="secondary" className="mt-1">
                            Sponsored by {formData.sponsor_name}
                          </Badge>
                        )}
                      </div>

                      <p className="text-muted-foreground line-clamp-2">
                        {formData.description || 'Reward description will appear here...'}
                      </p>

                      {/* Price Display */}
                      <div className="pt-2">
                        <RewardPriceDisplay
                          reward={previewReward}
                          userTier={previewTier}
                          size="lg"
                          showTierBenefit
                        />
                      </div>

                      {/* Stock & Category */}
                      <div className="flex gap-2 pt-2">
                        <Badge variant="outline">{formData.category}</Badge>
                        {formData.stock_quantity !== null && (
                          <Badge variant="outline">
                            {formData.stock_quantity} left
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* All Tier Prices */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Price by Status Level</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-2">
                    {TIERS.map((tier) => {
                      const price = formData.status_tier_claims_cost?.[tier as keyof TierPricing] ?? formData.cost;
                      const isFree = price === 0;
                      return (
                        <div 
                          key={tier}
                          className={cn(
                            'text-center p-3 rounded-lg border',
                            previewTier === tier && 'ring-2 ring-primary'
                          )}
                        >
                          <div className="text-lg mb-1">
                            {tier === 'droplet' && '💧'}
                            {tier === 'eddy' && '🌀'}
                            {tier === 'spiral' && '🌊'}
                            {tier === 'surge' && '⚡'}
                            {tier === 'torus' && '🔮'}
                          </div>
                          <div className="text-xs text-muted-foreground capitalize">{tier}</div>
                          <div className={cn(
                            'font-bold mt-1',
                            isFree && 'text-green-600'
                          )}>
                            {isFree ? 'FREE' : `${price}`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || uploading} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : reward ? 'Update Reward' : 'Create Reward'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
