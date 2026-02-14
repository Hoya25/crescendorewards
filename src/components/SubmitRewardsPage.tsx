import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { 
  ArrowLeft, Upload, Send, Sparkles, Gift, Shirt, CreditCard, 
  Ticket, Zap, Package, Star, CheckCircle2, Shield,
  TrendingUp, DollarSign, Lightbulb, Users, Crown
} from 'lucide-react';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { validateImageFile, validateImageDimensions } from '@/lib/image-validation';
import { compressImageWithStats, formatBytes } from '@/lib/image-compression';
import { NCTRLogo } from './NCTRLogo';
import { LockOptionCards, NCTR_RATE, LOCK_OPTIONS } from '@/components/rewards/LockOptionCards';
import { SubmissionSummary } from '@/components/rewards/SubmissionSummary';
import { ContributorTierPricing } from '@/components/rewards/ContributorTierPricing';
import { useClaimValue } from '@/hooks/useClaimValue';

const rewardTypes = [
  { id: 'physical', label: 'Physical Product', icon: Package },
  { id: 'digital', label: 'Digital Good', icon: Zap },
  { id: 'giftcard', label: 'Gift Card', icon: CreditCard },
  { id: 'experience', label: 'Experience', icon: Ticket },
  { id: 'nft', label: 'NFT/Crypto', icon: Sparkles },
  { id: 'merch', label: 'Merchandise', icon: Shirt },
  { id: 'subscription', label: 'Subscription', icon: Star },
  { id: 'other', label: 'Other', icon: Gift },
];

export function SubmitRewardsPage() {
  const navigate = useNavigate();
  const { profile } = useUnifiedUser();
  const { claimValue, getClaimsRequired } = useClaimValue();
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedLockOption, setSelectedLockOption] = useState<'30' | '90' | '360' | '720'>('360');
  const [floorAmount, setFloorAmount] = useState<string>('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const MAX_IMAGES = 4;
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    brand: '',
    stockQuantity: '',
    minStatusTier: 'all', // 'all', 'bronze', 'silver', 'gold', 'platinum', 'diamond'
  });
  
  // Tier-based pricing state for contributors
  const [tierPricingEnabled, setTierPricingEnabled] = useState(false);
  const [tierPricing, setTierPricing] = useState<{
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
    diamond: number;
  } | null>(null);

  const floorAmountNum = parseFloat(floorAmount) || 0;
  const MIN_FLOOR_AMOUNT = 5;
  const HIGH_FLOOR_THRESHOLD = 1000;
  const isFloorTooLow = floorAmountNum > 0 && floorAmountNum < MIN_FLOOR_AMOUNT;
  const isFloorHigh = floorAmountNum > HIGH_FLOOR_THRESHOLD;
  const baseNCTR = floorAmountNum > 0 ? Math.round(floorAmountNum / NCTR_RATE) : 0;
  const selectedOption = LOCK_OPTIONS.find(o => o.id === selectedLockOption);
  const calculatedNCTR = selectedOption ? Math.round(baseNCTR * selectedOption.multiplier) : 0;
  const claimsRequired = getClaimsRequired(floorAmountNum);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = MAX_IMAGES - selectedImages.length;
    if (remainingSlots <= 0) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      e.target.value = '';
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const file of filesToProcess) {
      // Basic validation (format, size)
      const basicValidation = validateImageFile(file);
      if (!basicValidation.valid) {
        toast.error(`${file.name}: ${basicValidation.error}`);
        continue;
      }

      // Dimension validation (async)
      const dimensionValidation = await validateImageDimensions(file);
      if (!dimensionValidation.valid) {
        toast.error(`${file.name}: ${dimensionValidation.error}`);
        continue;
      }

      validFiles.push(file);

      // Create preview
      const preview = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      newPreviews.push(preview);
    }

    if (validFiles.length > 0) {
      setSelectedImages(prev => [...prev, ...validFiles]);
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }

    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    if (selectedImages.length === 0 || !profile) return [];

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const image of selectedImages) {
        const { file: compressedFile, originalSize, compressedSize, compressionRatio } = 
          await compressImageWithStats(image);

        if (compressionRatio > 0.1) {
          toast.success(
            `Image compressed: ${formatBytes(originalSize)} → ${formatBytes(compressedSize)} (${(compressionRatio * 100).toFixed(0)}% reduction)`
          );
        }

        const fileExt = compressedFile.name.split('.').pop();
        const fileName = `${profile.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('reward-images')
          .upload(fileName, compressedFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('reward-images')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }

      return uploadedUrls;
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images');
      return uploadedUrls; // Return any that succeeded
    } finally {
      setUploading(false);
    }
  };

  const getProgress = () => {
    const fields = [
      selectedType,
      formData.title,
      formData.description,
      formData.category,
      floorAmount,
    ];
    const completed = fields.filter(Boolean).length;
    return (completed / fields.length) * 100;
  };

  const handleSubmitClick = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile) {
      toast.error('You must be logged in to submit rewards');
      return;
    }

    if (!selectedType || !formData.title || !formData.description || !formData.category || !floorAmount || floorAmountNum <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (floorAmountNum < MIN_FLOOR_AMOUNT) {
      toast.error(`Minimum floor amount is $${MIN_FLOOR_AMOUNT}`);
      return;
    }

    setShowConfirmSubmit(true);
  };

  const handleSubmit = async () => {
    setShowConfirmSubmit(false);
    setSubmitting(true);

    try {
      let imageUrls: string[] = [];
      if (selectedImages.length > 0) {
        imageUrls = await uploadImages();
        if (imageUrls.length === 0 && selectedImages.length > 0) {
          setSubmitting(false);
          return;
        }
      }

      const { error } = await supabase
        .from('reward_submissions')
        .insert({
          user_id: profile?.auth_user_id,
          lock_rate: selectedLockOption,
          reward_type: selectedType,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          brand: formData.brand || null,
          nctr_value: calculatedNCTR,
          claim_passes_required: claimsRequired,
          stock_quantity: formData.stockQuantity ? parseInt(formData.stockQuantity) : null,
          image_url: imageUrls[0] || null,
          image_urls: imageUrls,
          // New compensation fields
          floor_usd_amount: floorAmountNum,
          lock_option: selectedLockOption,
          nctr_rate_at_submission: NCTR_RATE,
          claims_required: claimsRequired,
          claim_value_at_submission: claimValue,
          // Status access requirement
          min_status_tier: formData.minStatusTier === 'all' ? null : formData.minStatusTier,
          // Tier-based pricing (optional, contributor suggestion)
          status_tier_claims_cost: tierPricingEnabled && tierPricing ? tierPricing : null,
        });

      if (error) throw error;
      
      toast.success('Reward submitted successfully! Our team will review it soon.');
      
      // Reset form
      setSelectedType('');
      setSelectedLockOption('360');
      setFloorAmount('');
      setSelectedImages([]);
      setImagePreviews([]);
      setTierPricingEnabled(false);
      setTierPricing(null);
      setFormData({
        title: '',
        description: '',
        category: '',
        brand: '',
        stockQuantity: '',
        minStatusTier: 'all',
      });
    } catch (error) {
      console.error('Error submitting reward:', error);
      toast.error('Failed to submit reward. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="flex-shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold">Contribute to Crescendo</h1>
              <p className="text-sm text-muted-foreground truncate">
                Contribute to the Crescendo marketplace
              </p>
            </div>
            <Badge variant="outline" className="hidden sm:flex gap-1 flex-shrink-0">
              <TrendingUp className="w-3 h-3" />
              Earn contributor rewards
            </Badge>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmitClick}>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* How It Works */}
            <div className="mb-8 bg-gradient-to-br from-blue-50/80 to-cyan-50/80 dark:from-blue-950/30 dark:to-cyan-950/30 border border-blue-200/50 dark:border-blue-800/50 rounded-2xl p-8">
              <div className="flex items-start gap-4 mb-8">
                <div className="p-3 bg-blue-600 rounded-xl">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold">How It Works</h3>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                      1
                    </div>
                  </div>
                  <div>
                    <p className="text-foreground">
                      Set your floor dollar amount and choose a lock period
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                      2
                    </div>
                  </div>
                  <div>
                    <p className="text-foreground">
                      Members claim your reward using their Claims
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                      3
                    </div>
                  </div>
                  <div>
                    <p className="text-foreground">
                      You receive NCTR tokens with your chosen lock multiplier
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contributor Compensation Section */}
            <Card className="border-[#E85D04]/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[#E85D04]" />
                  Contributor Compensation
                </CardTitle>
                <CardDescription>
                  Set your floor amount and choose how long to commit your NCTR for bonus multipliers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Step 1: Floor Amount Input */}
                <div className="space-y-2">
                  <Label htmlFor="floorAmount" className="text-base font-semibold">
                    Your Floor Amount <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    What's the minimum dollar value you'll accept for this contribution? (Minimum ${MIN_FLOOR_AMOUNT})
                  </p>
                  <div className="relative max-w-xs">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                    <Input
                      id="floorAmount"
                      type="number"
                      placeholder="50"
                      value={floorAmount}
                      onChange={(e) => setFloorAmount(e.target.value)}
                      min={MIN_FLOOR_AMOUNT}
                      step="1"
                      className={`pl-7 text-lg ${isFloorTooLow ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    />
                  </div>
                  
                  {/* Validation Messages */}
                  {isFloorTooLow && (
                    <p className="text-sm text-destructive flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-destructive" />
                      Minimum floor amount is ${MIN_FLOOR_AMOUNT}
                    </p>
                  )}
                  
                  {/* Claims Required Display */}
                  {floorAmountNum >= MIN_FLOOR_AMOUNT && claimsRequired > 0 && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <Users className="w-4 h-4 text-primary" />
                      <p className="text-sm">
                        Your <span className="font-semibold">${floorAmountNum.toLocaleString()}</span> floor = <span className="font-bold text-primary">{claimsRequired} Claims</span> required from members
                        <span className="text-muted-foreground ml-1">(at ${claimValue} each)</span>
                      </p>
                    </div>
                  )}
                  
                  {isFloorHigh && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                      <span className="text-amber-500 text-lg">⚠️</span>
                      <p className="text-sm text-amber-700 dark:text-amber-400">
                        High value submission! Amounts over ${HIGH_FLOOR_THRESHOLD.toLocaleString()} may require additional verification. 
                        Our team will review your contribution carefully.
                      </p>
                    </div>
                  )}
                </div>

                {/* Step 2: Lock Option Cards (includes NCTR rate display) */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">
                    Choose Your LOCK Period <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Longer locks earn higher multipliers on your NCTR
                  </p>
                  <LockOptionCards
                    floorAmount={floorAmountNum}
                    selectedLockOption={selectedLockOption}
                    onSelectLockOption={setSelectedLockOption}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Reward Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Reward Type</CardTitle>
                <CardDescription>
                  Select the type of reward you'd like to submit
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {rewardTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setSelectedType(type.id)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          selectedType === type.id
                            ? 'border-primary bg-primary/5 shadow-lg shadow-primary/20'
                            : 'border-border hover:border-primary/50 hover:bg-accent'
                        }`}
                      >
                        <Icon className={`w-6 h-6 mx-auto mb-2 ${
                          selectedType === type.id ? 'text-primary' : 'text-muted-foreground'
                        }`} />
                        <div className="text-xs font-medium text-center">{type.label}</div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Reward Details */}
            <Card>
              <CardHeader>
                <CardTitle>Reward Details</CardTitle>
                <CardDescription>
                  Provide detailed information about the reward
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Reward Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g., Premium Headphones Bundle"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    maxLength={100}
                  />
                  <div className="text-xs text-muted-foreground text-right">
                    {formData.title.length}/100 characters
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">
                    Description <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder={`Describe the reward in detail. Include:\n\n• What it is and what makes it unique\n• Who created it or where it comes from\n• Key features, specs, or details\n• Why someone would want this`}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={8}
                    maxLength={2500}
                    className="min-h-[200px]"
                  />
                  <div className="text-xs text-muted-foreground text-right">
                    {formData.description.length}/2,500 characters
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">
                      Category <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => handleInputChange('category', value)}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tech">Technology</SelectItem>
                        <SelectItem value="fashion">Fashion</SelectItem>
                        <SelectItem value="entertainment">Entertainment</SelectItem>
                        <SelectItem value="travel">Travel</SelectItem>
                        <SelectItem value="food">Food & Dining</SelectItem>
                        <SelectItem value="wellness">Wellness</SelectItem>
                        <SelectItem value="opportunity">Opportunity</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand/Partner (Optional)</Label>
                    <Input
                      id="brand"
                      placeholder="e.g., Sony, Nike"
                      value={formData.brand}
                      onChange={(e) => handleInputChange('brand', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stockQuantity">Stock Quantity (Optional)</Label>
                  <Input
                    id="stockQuantity"
                    type="number"
                    placeholder="Leave empty for unlimited"
                    value={formData.stockQuantity}
                    onChange={(e) => handleInputChange('stockQuantity', e.target.value)}
                    min="1"
                  />
                </div>

                {/* Status Access Settings */}
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <Label className="text-base font-semibold">Status Access Settings</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Choose which Crescendo Status levels can claim this reward. Higher tiers unlock exclusive rewards.
                  </p>
                  <Select
                    value={formData.minStatusTier}
                    onValueChange={(value) => handleInputChange('minStatusTier', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select minimum status requirement" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <span>🔓</span>
                          <div>
                            <span className="font-medium">All Members</span>
                            <span className="text-muted-foreground text-xs ml-2">Anyone can claim</span>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="bronze">
                        <div className="flex items-center gap-2">
                          <span>🥉</span>
                          <div>
                            <span className="font-medium">Bronze+</span>
                            <span className="text-muted-foreground text-xs ml-2">Bronze, Silver, Gold, Platinum, Diamond</span>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="silver">
                        <div className="flex items-center gap-2">
                          <span>🥈</span>
                          <div>
                            <span className="font-medium">Silver+</span>
                            <span className="text-muted-foreground text-xs ml-2">Silver, Gold, Platinum, Diamond</span>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="gold">
                        <div className="flex items-center gap-2">
                          <span>🥇</span>
                          <div>
                            <span className="font-medium">Gold+</span>
                            <span className="text-muted-foreground text-xs ml-2">Gold, Platinum, Diamond</span>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="platinum">
                        <div className="flex items-center gap-2">
                          <span>💎</span>
                          <div>
                            <span className="font-medium">Platinum+</span>
                            <span className="text-muted-foreground text-xs ml-2">Platinum, Diamond only</span>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="diamond">
                        <div className="flex items-center gap-2">
                          <span>👑</span>
                          <div>
                            <span className="font-medium">Diamond Only</span>
                            <span className="text-muted-foreground text-xs ml-2">Exclusive to Diamond members</span>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.minStatusTier !== 'all' && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                      <span className="text-amber-500 text-lg">⚡</span>
                      <p className="text-sm text-amber-700 dark:text-amber-400">
                        Restricting access can make your reward more exclusive and desirable to higher-tier members.
                      </p>
                    </div>
                  )}
                </div>

                {/* Tier-Based Pricing (Optional) */}
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-primary" />
                    <Label className="text-base font-semibold">Tier-Based Pricing (Optional)</Label>
                    <Badge variant="outline" className="text-xs">Advanced</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Offer discounts to higher-tier members. Admins may adjust during review.
                  </p>
                  <ContributorTierPricing
                    baseCost={claimsRequired}
                    enabled={tierPricingEnabled}
                    pricing={tierPricing}
                    onEnabledChange={setTierPricingEnabled}
                    onPricingChange={setTierPricing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="imageUpload">Reward Images (Optional - up to {MAX_IMAGES})</Label>
                  <div className="space-y-3">
                    {imagePreviews.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground font-medium">
                          Preview ({imagePreviews.length}/{MAX_IMAGES} images):
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {imagePreviews.map((preview, index) => (
                            <div key={index} className="relative aspect-[4/5] rounded-lg overflow-hidden border border-border bg-muted/20">
                              <img 
                                src={preview} 
                                alt={`Preview ${index + 1}`} 
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                              {index === 0 && (
                                <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] font-medium rounded">
                                  Primary
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground/70">First image will be the primary display image. Drag to reorder coming soon.</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Input
                        id="imageUpload"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('imageUpload')?.click()}
                        className="flex-1 gap-2"
                        disabled={uploading || selectedImages.length >= MAX_IMAGES}
                      >
                        <Upload className="w-4 h-4" />
                        {selectedImages.length === 0 ? 'Upload Images' : `Add More (${MAX_IMAGES - selectedImages.length} remaining)`}
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p className="font-medium">Image Guidelines:</p>
                      <ul className="list-disc list-inside space-y-0.5 text-muted-foreground/80">
                        <li><span className="font-medium">Quantity:</span> Up to {MAX_IMAGES} images per submission</li>
                        <li><span className="font-medium">Size:</span> At least 600px on shortest side (800px+ recommended)</li>
                        <li><span className="font-medium">Aspect ratio:</span> Square, portrait, or landscape accepted</li>
                        <li><span className="font-medium">Format:</span> JPG, PNG, WebP, or GIF</li>
                        <li><span className="font-medium">Max file size:</span> 5MB each (under 1MB preferred)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submission Progress - Simplified to 4 items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Submission Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  {floorAmountNum > 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                  )}
                  <span className={`text-sm ${floorAmountNum > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                    Set compensation (floor amount + lock period)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {selectedType ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                  )}
                  <span className={`text-sm ${selectedType ? 'text-foreground' : 'text-muted-foreground'}`}>
                    Select reward type
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {formData.title && formData.description && formData.category ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                  )}
                  <span className={`text-sm ${formData.title && formData.description && formData.category ? 'text-foreground' : 'text-muted-foreground'}`}>
                    Add details (title, description, category)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {imagePreviews.length > 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                  )}
                  <span className={`text-sm ${imagePreviews.length > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                    Upload images (optional, up to {MAX_IMAGES})
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Tips & Contributor Info - Collapsible Accordion */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="tips-info" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-primary" />
                    <span className="font-semibold">Tips & Contributor Info</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4">
                  <div className="grid sm:grid-cols-2 gap-6">
                    {/* Quality Tips */}
                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <Star className="w-4 h-4 text-primary" />
                        Quality Tips
                      </h4>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                          <p>Use clear, descriptive titles that highlight the reward's value</p>
                        </div>
                        <div className="flex gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                          <p>Include specific details about features, specs, or benefits</p>
                        </div>
                        <div className="flex gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                          <p>Add high-quality images (600px+ on shortest side)</p>
                        </div>
                      </div>
                    </div>

                    {/* Contributor Protection */}
                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <Shield className="w-4 h-4 text-green-500" />
                        Contributor Protection
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Your submissions are protected. You retain credit for approved ideas and earn rewards when your contributions are featured.
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Submission Summary - Before Submit Button */}
            <SubmissionSummary
              title={formData.title}
              rewardType={selectedType}
              category={formData.category}
              floorAmount={floorAmountNum}
              selectedLockOption={selectedLockOption}
            />

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || uploading || getProgress() < 80}
                className="flex-1 gap-2"
              >
                {submitting || uploading ? (
                  <>{uploading ? 'Uploading image...' : 'Processing...'}</>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Reward
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>

      <ConfirmationDialog
        isOpen={showConfirmSubmit}
        onClose={() => setShowConfirmSubmit(false)}
        title="Submit Reward?"
        description={`You're requesting ${calculatedNCTR.toLocaleString()} NCTR (${selectedLockOption}LOCK) for "${formData.title}". Our team will review your submission.`}
        confirmText="Submit"
        onConfirm={handleSubmit}
      />
    </div>
  );
}
