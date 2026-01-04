import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  ArrowLeft, Upload, Send, Sparkles, Gift, Shirt, CreditCard, 
  Ticket, Trophy, Zap, Package, Star, CheckCircle2, Shield,
  Info, TrendingUp, Lock, Users, Award
} from 'lucide-react';
import { validateImageFile } from '@/lib/image-validation';
import { compressImageWithStats, formatBytes } from '@/lib/image-compression';
import { NCTRLogo } from './NCTRLogo';

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

const lockPeriods = [
  { value: '30', label: '30 days', multiplier: '1x' },
  { value: '90', label: '90 days', multiplier: '1.5x' },
  { value: '180', label: '180 days', multiplier: '2x' },
  { value: '365', label: '365 days', multiplier: '3x' },
];

export function SubmitRewardsPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuthContext();
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedLockRate, setSelectedLockRate] = useState<'360' | '90'>('360');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    brand: '',
    suggestedNCTR: '',
    claimPassRequired: '1',
    lockPeriod: '30',
    stockQuantity: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      e.target.value = ''; // Reset file input
      return;
    }

    setSelectedImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedImage || !user) return null;

    setUploading(true);
    try {
      // Compress image before upload
      const { file: compressedFile, originalSize, compressedSize, compressionRatio } = 
        await compressImageWithStats(selectedImage);

      // Show compression stats if significant
      if (compressionRatio > 0.1) {
        toast.success(
          `Image compressed: ${formatBytes(originalSize)} → ${formatBytes(compressedSize)} (${(compressionRatio * 100).toFixed(0)}% reduction)`
        );
      }

      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('reward-images')
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('reward-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
      return null;
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
      formData.suggestedNCTR,
    ];
    const completed = fields.filter(Boolean).length;
    return (completed / fields.length) * 100;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to submit rewards');
      return;
    }

    if (!selectedType || !formData.title || !formData.description || !formData.category || !formData.suggestedNCTR) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);

    try {
      // Upload image if selected
      let imageUrl: string | null = null;
      if (selectedImage) {
        imageUrl = await uploadImage();
        if (!imageUrl) {
          setSubmitting(false);
          return;
        }
      }

      const { error } = await supabase
        .from('reward_submissions')
        .insert({
          user_id: user.id,
          lock_rate: selectedLockRate,
          reward_type: selectedType,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          brand: formData.brand || null,
          nctr_value: parseInt(formData.suggestedNCTR),
          claim_passes_required: parseInt(formData.claimPassRequired),
          stock_quantity: formData.stockQuantity ? parseInt(formData.stockQuantity) : null,
          image_url: imageUrl,
        });

      if (error) throw error;
      
      toast.success('Reward submitted successfully! Our team will review it soon.');
      
      // Reset form
      setSelectedType('');
      setSelectedLockRate('360');
      setSelectedImage(null);
      setImagePreview('');
      setFormData({
        title: '',
        description: '',
        category: '',
        brand: '',
        suggestedNCTR: '',
        claimPassRequired: '1',
        lockPeriod: '30',
        stockQuantity: '',
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
              <h1 className="text-2xl font-bold">Rewards Marketplace</h1>
              <p className="text-sm text-muted-foreground truncate">
                Contribute to the Crescendo rewards marketplace
              </p>
            </div>
            <Badge variant="outline" className="hidden sm:flex gap-1 flex-shrink-0">
              <TrendingUp className="w-3 h-3" />
              Earn contributor rewards
            </Badge>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Claim Pass Conversion Rates */}
              <div className="mb-8 bg-muted/30 rounded-2xl p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="p-3 bg-primary rounded-xl">
                    <Award className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Claim Pass Conversion Rates</h2>
                    <p className="text-muted-foreground mt-1">
                      Choose between higher NCTR with longer lock or lower NCTR with shorter lock
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  {/* 360 LOCK Option */}
                  <button
                    type="button"
                    onClick={() => setSelectedLockRate('360')}
                    className={`border-2 rounded-xl p-6 text-left transition-all ${
                      selectedLockRate === '360'
                        ? 'border-primary/50 bg-background shadow-lg shadow-primary/10'
                        : 'border-border bg-background hover:border-primary/30'
                    }`}
                  >
                    <div className="flex gap-2 mb-6">
                      <Badge className="bg-primary text-primary-foreground">360LOCK Rate</Badge>
                      <Badge variant="outline">Higher Reward</Badge>
                    </div>
                    <div className="flex items-baseline gap-2 mb-6">
                      <Trophy className="h-6 w-6 text-primary" />
                      <span className="text-4xl font-bold">1</span>
                      <span className="text-muted-foreground ml-2">Claim Pass =</span>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <span className="text-2xl font-bold text-primary">200 NCTR</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Lock className="h-4 w-4" />
                        <span>Locked for 360 days</span>
                      </div>
                    </div>
                    {selectedLockRate === '360' && (
                      <div className="mt-4 flex items-center gap-2 text-primary">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="text-sm font-medium">Selected</span>
                      </div>
                    )}
                  </button>

                  {/* 90 LOCK Option */}
                  <button
                    type="button"
                    onClick={() => setSelectedLockRate('90')}
                    className={`border-2 rounded-xl p-6 text-left transition-all ${
                      selectedLockRate === '90'
                        ? 'border-primary/50 bg-background shadow-lg shadow-primary/10'
                        : 'border-border bg-background hover:border-primary/30'
                    }`}
                  >
                    <div className="flex gap-2 mb-6">
                      <Badge variant="outline">90LOCK Rate</Badge>
                      <Badge variant="outline">Faster Access</Badge>
                    </div>
                    <div className="flex items-baseline gap-2 mb-6">
                      <Trophy className="h-6 w-6 text-muted-foreground" />
                      <span className="text-4xl font-bold">1</span>
                      <span className="text-muted-foreground ml-2">Claim Pass =</span>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-orange-500" />
                        <span className="text-2xl font-bold text-foreground">75 NCTR</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Lock className="h-4 w-4" />
                        <span>Locked for 90 days</span>
                      </div>
                    </div>
                    {selectedLockRate === '90' && (
                      <div className="mt-4 flex items-center gap-2 text-primary">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="text-sm font-medium">Selected</span>
                      </div>
                    )}
                  </button>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <div className="flex gap-3">
                    <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground">
                      <span className="font-semibold">You choose:</span> Select <span className="font-semibold">360LOCK</span> to earn <span className="inline-flex items-center gap-1">200 <NCTRLogo size="xs" /> per pass</span> (locked 360 days), or <span className="font-semibold">90LOCK</span> to earn <span className="inline-flex items-center gap-1">75 <NCTRLogo size="xs" /> per pass</span> (locked 90 days). Your choice applies to all claims of this reward.
                    </p>
                  </div>
                </div>
              </div>

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
                        Submit your reward with an exchange rate in Claims
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
                        You receive NCTR tokens with a lock period (360LOCK or 90LOCK)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

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
                      placeholder="Describe the reward in detail..."
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={4}
                      maxLength={500}
                    />
                    <div className="text-xs text-muted-foreground text-right">
                      {formData.description.length}/500 characters
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
                    <Label htmlFor="imageUpload">Reward Image (Optional)</Label>
                    <div className="space-y-3">
                      {imagePreview && (
                        <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border">
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedImage(null);
                              setImagePreview('');
                            }}
                            className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Input
                          id="imageUpload"
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('imageUpload')?.click()}
                          className="flex-1 gap-2"
                          disabled={uploading}
                        >
                          <Upload className="w-4 h-4" />
                          {selectedImage ? 'Change Image' : 'Upload Image'}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Max file size: 5MB. Supported formats: JPG, PNG, WEBP
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Exchange Rate & Supply */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Exchange Rate & Supply
                  </CardTitle>
                  <CardDescription>
                    Set the value and availability of this reward
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="suggestedNCTR">
                        Suggested NCTR Cost <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="suggestedNCTR"
                        type="number"
                        placeholder="1000"
                        value={formData.suggestedNCTR}
                        onChange={(e) => handleInputChange('suggestedNCTR', e.target.value)}
                        min="1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="claimPassRequired">Claim Passes Required</Label>
                      <Select
                        value={formData.claimPassRequired}
                        onValueChange={(value) => handleInputChange('claimPassRequired', value)}
                      >
                        <SelectTrigger id="claimPassRequired">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Pass</SelectItem>
                          <SelectItem value="2">2 Passes</SelectItem>
                          <SelectItem value="3">3 Passes</SelectItem>
                          <SelectItem value="5">5 Passes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lockPeriod">Recommended Lock Period</Label>
                    <Select
                      value={formData.lockPeriod}
                      onValueChange={(value) => handleInputChange('lockPeriod', value)}
                    >
                      <SelectTrigger id="lockPeriod">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {lockPeriods.map((period) => (
                          <SelectItem key={period.value} value={period.value}>
                            {period.label} ({period.multiplier} multiplier)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                </CardContent>
              </Card>

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
                      Submit Rewards
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Right Column - Progress & Tips */}
            <div className="space-y-6">
              {/* Submission Progress */}
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="text-lg">Submission Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
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
                    {formData.title && formData.description ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                    )}
                    <span className={`text-sm ${formData.title && formData.description ? 'text-foreground' : 'text-muted-foreground'}`}>
                      Add title & description
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {formData.category && formData.brand ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                    )}
                    <span className={`text-sm ${formData.category && formData.brand ? 'text-foreground' : 'text-muted-foreground'}`}>
                      Set category & brand
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {formData.suggestedNCTR && formData.claimPassRequired ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                    )}
                    <span className={`text-sm ${formData.suggestedNCTR && formData.claimPassRequired ? 'text-foreground' : 'text-muted-foreground'}`}>
                      Define pricing & supply
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {imagePreview ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                    )}
                    <span className={`text-sm ${imagePreview ? 'text-foreground' : 'text-muted-foreground'}`}>
                      Add reward image
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      Accept terms
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Quality Tips */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Star className="w-5 h-5 text-primary" />
                    Quality Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <p className="text-muted-foreground">
                      Use clear, descriptive titles that highlight the reward's value
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <p className="text-muted-foreground">
                      Include specific details about features, specs, or benefits
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <p className="text-muted-foreground">
                      Research fair NCTR pricing based on similar rewards
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <p className="text-muted-foreground">
                      Add high-quality images when possible
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Contributor Protection */}
              <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-500" />
                    Contributor Protection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    Your submissions are protected. You retain credit for approved ideas and earn rewards when your contributions are featured.
                  </p>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50 border border-green-500/20">
                    <Users className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-xs font-medium">
                      Join 1,200+ active contributors
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
