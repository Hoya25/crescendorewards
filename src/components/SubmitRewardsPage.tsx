import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
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

interface SubmitRewardsPageProps {
  onBack: () => void;
}

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

export function SubmitRewardsPage({ onBack }: SubmitRewardsPageProps) {
  const { user, profile } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedLockRate, setSelectedLockRate] = useState<'360' | '90'>('360');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    brand: '',
    suggestedNCTR: '',
    claimPassRequired: '1',
    lockPeriod: '30',
    stockQuantity: '',
    imageUrl: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

    if (!selectedType || !formData.title || !formData.description || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);

    try {
      // In production, this would save to a reward_submissions table
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Reward submitted successfully! Our team will review it soon.');
      
      // Reset form
      setSelectedType('');
      setFormData({
        title: '',
        description: '',
        category: '',
        brand: '',
        suggestedNCTR: '',
        claimPassRequired: '1',
        lockPeriod: '30',
        stockQuantity: '',
        imageUrl: '',
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
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Submit Reward Idea</h1>
              <p className="text-sm text-muted-foreground">
                Contribute to the Crescendo rewards marketplace
              </p>
            </div>
            <Badge variant="outline" className="hidden sm:flex gap-1">
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
                      <span className="font-semibold">You choose:</span> Select <span className="font-semibold">360LOCK</span> to earn 200 NCTR per pass (locked 360 days), or <span className="font-semibold">90LOCK</span> to earn 75 NCTR per pass (locked 90 days). Your choice applies to all claims of this reward.
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

              {/* How It Works */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-primary" />
                    How It Works
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">1</span>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Submit Your Idea</h4>
                      <p className="text-sm text-muted-foreground">
                        Fill out the reward details including type, description, and suggested value
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">2</span>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Community Review</h4>
                      <p className="text-sm text-muted-foreground">
                        Our team and community members review your submission for quality and fit
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">3</span>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Earn Rewards</h4>
                      <p className="text-sm text-muted-foreground">
                        If approved, earn NCTR tokens and contributor recognition
                      </p>
                    </div>
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
                    <Label htmlFor="imageUrl">Image URL (Optional)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="imageUrl"
                        placeholder="https://example.com/image.jpg"
                        value={formData.imageUrl}
                        onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                      />
                      <Button type="button" variant="outline" size="icon">
                        <Upload className="w-4 h-4" />
                      </Button>
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
                  onClick={onBack}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || getProgress() < 80}
                  className="flex-1 gap-2"
                >
                  {submitting ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Reward
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
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Completion</span>
                      <span className="font-semibold">{Math.round(getProgress())}%</span>
                    </div>
                    <Progress value={getProgress()} className="h-2" />
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2">
                      {selectedType ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-border" />
                      )}
                      <span className={selectedType ? 'text-green-500' : 'text-muted-foreground'}>
                        Select reward type
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {formData.title ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-border" />
                      )}
                      <span className={formData.title ? 'text-green-500' : 'text-muted-foreground'}>
                        Add reward title
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {formData.description ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-border" />
                      )}
                      <span className={formData.description ? 'text-green-500' : 'text-muted-foreground'}>
                        Write description
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {formData.category ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-border" />
                      )}
                      <span className={formData.category ? 'text-green-500' : 'text-muted-foreground'}>
                        Choose category
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {formData.suggestedNCTR ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-border" />
                      )}
                      <span className={formData.suggestedNCTR ? 'text-green-500' : 'text-muted-foreground'}>
                        Set NCTR value
                      </span>
                    </div>
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
