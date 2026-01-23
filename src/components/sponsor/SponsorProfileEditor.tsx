import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, 
  ExternalLink, 
  Save, 
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ImageIcon,
  Globe,
  Mail,
  Building2
} from 'lucide-react';
import { useSponsor } from '@/hooks/useSponsor';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function SponsorProfileEditor() {
  const navigate = useNavigate();
  const { sponsor, loading, updateSponsorProfile, refresh } = useSponsor();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: sponsor?.name || '',
    description: sponsor?.description || '',
    website_url: sponsor?.website_url || '',
    contact_email: sponsor?.contact_email || '',
  });
  const [logoUrl, setLogoUrl] = useState(sponsor?.logo_url || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Update form when sponsor loads
  useState(() => {
    if (sponsor) {
      setFormData({
        name: sponsor.name || '',
        description: sponsor.description || '',
        website_url: sponsor.website_url || '',
        contact_email: sponsor.contact_email || '',
      });
      setLogoUrl(sponsor.logo_url || '');
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!sponsor) {
    navigate('/become-sponsor');
    return null;
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file (PNG, JPG, etc.)',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Logo must be less than 2MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `sponsor-${sponsor.id}-${Date.now()}.${fileExt}`;
      const filePath = `sponsor-logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('public')
        .getPublicUrl(filePath);

      setLogoUrl(publicUrl);
      setLogoError(false);
      toast({
        title: 'Logo uploaded',
        description: 'Your logo has been uploaded successfully.',
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload logo. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const success = await updateSponsorProfile({
        name: formData.name,
        description: formData.description,
        website_url: formData.website_url || null,
        contact_email: formData.contact_email || null,
        logo_url: logoUrl || null,
      });

      if (success) {
        await refresh();
        toast({
          title: 'Profile updated',
          description: 'Your sponsor profile has been saved.',
        });
      }
    } finally {
      setSaving(false);
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
            <h1 className="text-2xl font-bold">Edit Sponsor Profile</h1>
            <p className="text-sm text-muted-foreground">
              Update how your brand appears on Crescendo
            </p>
          </div>
        </div>

        {/* Verification Status */}
        {sponsor.is_verified ? (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="text-sm text-emerald-700 dark:text-emerald-400">
              Your sponsor profile is verified
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <span className="text-sm text-amber-700 dark:text-amber-400">
              Your profile is pending verification
            </span>
          </div>
        )}

        {/* Logo Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Sponsor Logo
            </CardTitle>
            <CardDescription>
              This is how your logo appears on reward cards
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Logo Preview */}
            <div className="flex flex-col md:flex-row gap-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-[#2a2d32] to-[#373b42] border border-[#4a4f58]/50 flex items-center justify-center overflow-hidden">
                  {logoUrl && !logoError ? (
                    <img 
                      src={logoUrl} 
                      alt="Sponsor logo"
                      className="max-w-full max-h-full object-contain p-3"
                      onError={() => setLogoError(true)}
                    />
                  ) : (
                    <Building2 className="w-12 h-12 text-muted-foreground" />
                  )}
                </div>
                {uploading && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-xl">
                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 space-y-3">
                <div className="space-y-2">
                  <Label>Upload Logo</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? 'Uploading...' : 'Upload New Logo'}
                  </Button>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Square format (1:1 ratio) recommended</li>
                  <li>• PNG with transparent background preferred</li>
                  <li>• Minimum 200x200 pixels</li>
                  <li>• Max file size: 2MB</li>
                </ul>
              </div>
            </div>

            {/* Preview on Card */}
            <div className="pt-4 border-t">
              <Label className="text-xs text-muted-foreground mb-2 block">
                PREVIEW: How your sponsorship appears on reward cards
              </Label>
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#1a1d21]/95 via-[#2a2d32]/90 to-[#1a1d21]/95 rounded-lg px-3 py-2 border border-[#4a4f58]/30">
                {logoUrl && !logoError && (
                  <img 
                    src={logoUrl} 
                    alt="Preview" 
                    className="h-4 w-auto max-w-[40px] object-contain"
                    onError={() => setLogoError(true)}
                  />
                )}
                <span className="text-[10px] text-white/80">
                  <span className="font-light">Sponsored by</span>
                  {' '}
                  <span className="font-semibold text-amber-300/90">
                    {formData.name || 'Your Brand'}
                  </span>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Profile Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name *</Label>
              <Input
                id="name"
                placeholder="Your brand or company name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                This appears as "Sponsored by [Name]"
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">About Your Brand</Label>
              <Textarea
                id="description"
                placeholder="Tell the community about your brand..."
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Website
              </Label>
              <Input
                id="website"
                type="url"
                placeholder="https://yourcompany.com"
                value={formData.website_url}
                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Contact Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="partnerships@yourcompany.com"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Public Profile Link */}
        {sponsor.slug && (
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Your Public Profile</p>
                  <p className="text-xs text-muted-foreground">
                    crescendo.nctr.live/sponsors/{sponsor.slug}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(`/sponsors/${sponsor.slug}`, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Save Button */}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => navigate('/sponsor/dashboard')}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !formData.name}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default SponsorProfileEditor;
