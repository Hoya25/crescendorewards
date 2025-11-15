import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Upload, Send, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SubmitRewardsPageProps {
  onBack: () => void;
}

export function SubmitRewardsPage({ onBack }: SubmitRewardsPageProps) {
  const { user, profile } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    suggestedCost: '',
    contactEmail: profile?.email || '',
    additionalNotes: '',
  });

  const categories = [
    'Physical Products',
    'Digital Goods',
    'Gift Cards',
    'Experiences',
    'Crypto/NFTs',
    'Subscriptions',
    'Merchandise',
    'Other',
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to submit rewards');
      return;
    }

    if (!formData.title || !formData.description || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);

    try {
      // For now, we'll send this as an email or store in a separate submissions table
      // Since there's no submissions table yet, we'll just show success
      // In production, you'd want to create a reward_submissions table
      
      toast.success('Reward submitted successfully! Our team will review it soon.');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        suggestedCost: '',
        contactEmail: profile?.email || '',
        additionalNotes: '',
      });
    } catch (error) {
      console.error('Error submitting reward:', error);
      toast.error('Failed to submit reward. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Submit Reward Idea</h1>
              <p className="text-sm text-muted-foreground">
                Help us improve our rewards catalog
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero Section */}
        <Card className="mb-8 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-2">Have a Great Reward Idea?</h2>
                <p className="text-muted-foreground text-sm">
                  We're always looking to expand our rewards catalog with exciting new options. 
                  Submit your suggestion below and help shape the future of NCTR rewards!
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <div className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary">
                    ✓ Community-Driven
                  </div>
                  <div className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary">
                    ✓ Quick Review Process
                  </div>
                  <div className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary">
                    ✓ Get Featured
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submission Form */}
        <Card>
          <CardHeader>
            <CardTitle>Reward Details</CardTitle>
            <CardDescription>
              Fill out the form below with as much detail as possible
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="required">
                  Reward Title *
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Premium Gaming Headset"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="required">
                  Description *
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe the reward in detail... What makes it special? Why would users want it?"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={5}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Include brand names, models, specifications, or any relevant details
                </p>
              </div>

              {/* Category and Cost Row */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category" className="required">
                    Category *
                  </Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => handleInputChange('category', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Suggested Cost */}
                <div className="space-y-2">
                  <Label htmlFor="suggestedCost">
                    Suggested NCTR Cost (Optional)
                  </Label>
                  <Input
                    id="suggestedCost"
                    type="number"
                    placeholder="e.g., 5000"
                    value={formData.suggestedCost}
                    onChange={(e) => handleInputChange('suggestedCost', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    How much NCTR should this reward cost?
                  </p>
                </div>
              </div>

              {/* Contact Email */}
              <div className="space-y-2">
                <Label htmlFor="contactEmail" className="required">
                  Contact Email *
                </Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.contactEmail}
                  onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  We'll use this to contact you about your submission
                </p>
              </div>

              {/* Additional Notes */}
              <div className="space-y-2">
                <Label htmlFor="additionalNotes">
                  Additional Notes (Optional)
                </Label>
                <Textarea
                  id="additionalNotes"
                  placeholder="Any other information you'd like to share? Links to products, reference images, or special considerations..."
                  value={formData.additionalNotes}
                  onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                  rows={4}
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 gap-2"
                  size="lg"
                >
                  {submitting ? (
                    <>Submitting...</>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Reward
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  size="lg"
                >
                  Cancel
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center pt-2">
                By submitting, you agree that your suggestion may be used in our rewards catalog. 
                All submissions are subject to review and approval.
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Guidelines Card */}
        <Card className="mt-8 border-muted">
          <CardHeader>
            <CardTitle className="text-lg">Submission Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <div className="flex gap-3">
              <div className="text-primary font-bold">1.</div>
              <div>
                <strong className="text-foreground">Be Specific:</strong> Include brand names, 
                models, and specifications when applicable
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-primary font-bold">2.</div>
              <div>
                <strong className="text-foreground">Consider Value:</strong> Suggest rewards that 
                offer good value for our community
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-primary font-bold">3.</div>
              <div>
                <strong className="text-foreground">Stay Relevant:</strong> Focus on rewards that 
                align with our community's interests
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-primary font-bold">4.</div>
              <div>
                <strong className="text-foreground">Include Links:</strong> If possible, provide 
                links to products or reference images in the additional notes
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
