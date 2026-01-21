import { useState, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Megaphone, Calendar, Link as LinkIcon, Image as ImageIcon, AlertTriangle, Upload, Loader2, X, CheckCircle2, Library } from 'lucide-react';
import { SponsorBadge } from '@/components/rewards/SponsorBadge';
import { getSponsorshipStatus, formatSponsorshipStatus, type SponsorshipData } from '@/lib/sponsorship-utils';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { compressLogo, validateLogoFile, getCompressionSummary, type LogoCompressionResult } from '@/lib/logo-compression';
import { toast } from 'sonner';
import { SponsorLogoLibrary } from './SponsorLogoLibrary';

interface SponsorshipFormData {
  sponsor_enabled: boolean;
  sponsor_name: string | null;
  sponsor_logo: string | null;
  sponsor_link: string | null;
  sponsor_start_date: string | null;
  sponsor_end_date: string | null;
}

interface SponsorshipEditorProps {
  formData: SponsorshipFormData;
  onChange: (data: Partial<SponsorshipFormData>) => void;
}

/**
 * Admin component for editing reward sponsorship details
 */
export function SponsorshipEditor({ formData, onChange }: SponsorshipEditorProps) {
  const [uploading, setUploading] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null);
  const [logoInputMethod, setLogoInputMethod] = useState<'library' | 'upload' | 'url'>('library');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sponsorData: SponsorshipData = {
    sponsor_enabled: formData.sponsor_enabled,
    sponsor_name: formData.sponsor_name,
    sponsor_logo: formData.sponsor_logo,
    sponsor_link: formData.sponsor_link,
    sponsor_start_date: formData.sponsor_start_date,
    sponsor_end_date: formData.sponsor_end_date,
  };

  const status = getSponsorshipStatus(sponsorData);
  const statusDisplay = formatSponsorshipStatus(status);

  // Validation
  const isValid = !formData.sponsor_enabled || (
    formData.sponsor_name &&
    formData.sponsor_logo &&
    formData.sponsor_start_date &&
    formData.sponsor_end_date
  );

  const endBeforeStart = formData.sponsor_start_date && 
    formData.sponsor_end_date && 
    new Date(formData.sponsor_end_date) < new Date(formData.sponsor_start_date);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate using logo-specific validation
    const validation = validateLogoFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setUploading(true);
    setCompressionInfo(null);

    try {
      // Compress logo with optimized settings
      const result: LogoCompressionResult = await compressLogo(file);
      
      // Show compression summary
      const summary = getCompressionSummary(result);
      setCompressionInfo(summary);

      // Generate unique filename with correct extension
      const fileExt = result.hasTransparency ? 'png' : 'jpg';
      const fileName = `sponsor-logo-${Date.now()}.${fileExt}`;
      const filePath = `sponsor-logos/${fileName}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('rewards')
        .upload(filePath, result.file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('rewards')
        .getPublicUrl(filePath);

      onChange({ sponsor_logo: publicUrl });
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload logo');
      setCompressionInfo(null);
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = () => {
    onChange({ sponsor_logo: null });
    setCompressionInfo(null);
  };

  return (
    <div className="space-y-4 pt-4 border-t">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-semibold flex items-center gap-2">
            <Megaphone className="w-4 h-4" /> Sponsorship
          </Label>
          <p className="text-xs text-muted-foreground mt-1">
            Display sponsor branding on this reward
          </p>
        </div>
        <div className="flex items-center gap-3">
          {formData.sponsor_enabled && (
            <Badge className={statusDisplay.className} variant={statusDisplay.variant}>
              {statusDisplay.label}
            </Badge>
          )}
          <Switch
            checked={formData.sponsor_enabled}
            onCheckedChange={(checked) => onChange({ sponsor_enabled: checked })}
          />
        </div>
      </div>

      {/* Sponsorship Fields */}
      {formData.sponsor_enabled && (
        <div className="space-y-4 pl-4 border-l-2 border-primary/20">
          {/* Sponsor Name */}
          <div className="space-y-1">
            <Label className="text-xs">Sponsor Name *</Label>
            <Input
              value={formData.sponsor_name || ''}
              onChange={(e) => onChange({ sponsor_name: e.target.value || null })}
              placeholder="e.g., Nike, Spotify"
            />
          </div>

          {/* Sponsor Logo */}
          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-1">
              <ImageIcon className="w-3 h-3" /> Sponsor Logo *
            </Label>
            
            <Tabs value={logoInputMethod} onValueChange={(v) => setLogoInputMethod(v as 'library' | 'upload' | 'url')}>
              <TabsList className="h-8">
                <TabsTrigger value="library" className="text-xs px-2 py-1">
                  <Library className="w-3 h-3 mr-1" /> Library
                </TabsTrigger>
                <TabsTrigger value="upload" className="text-xs px-2 py-1">
                  <Upload className="w-3 h-3 mr-1" /> Upload
                </TabsTrigger>
                <TabsTrigger value="url" className="text-xs px-2 py-1">
                  <LinkIcon className="w-3 h-3 mr-1" /> URL
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="library" className="mt-2">
                <SponsorLogoLibrary
                  currentLogo={formData.sponsor_logo}
                  onSelect={(url) => {
                    onChange({ sponsor_logo: url });
                    setCompressionInfo(null);
                  }}
                />
                {formData.sponsor_logo && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="p-2 bg-muted rounded border">
                      <img
                        src={formData.sponsor_logo}
                        alt="Selected logo"
                        className="h-10 w-auto object-contain"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs text-destructive hover:text-destructive"
                      onClick={handleRemoveLogo}
                    >
                      <X className="w-3 h-3 mr-1" /> Clear
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="upload" className="mt-2">
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  {formData.sponsor_logo ? (
                    <div className="space-y-2">
                      <div className="relative inline-block">
                        <div className="p-2 bg-muted rounded border">
                          <img
                            src={formData.sponsor_logo}
                            alt="Sponsor logo"
                            className="h-12 w-auto object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-5 w-5"
                          onClick={handleRemoveLogo}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      {compressionInfo && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                          {compressionInfo}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-3 h-3 mr-2" />
                          Select Logo Image
                        </>
                      )}
                    </Button>
                  )}
                  
                  {formData.sponsor_logo && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="text-xs"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        'Replace Logo'
                      )}
                    </Button>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="url" className="mt-2">
                <Input
                  value={formData.sponsor_logo || ''}
                  onChange={(e) => onChange({ sponsor_logo: e.target.value || null })}
                  placeholder="https://example.com/logo.png"
                />
                {formData.sponsor_logo && (
                  <div className="mt-2 p-2 bg-muted rounded border">
                    <img
                      src={formData.sponsor_logo}
                      alt="Logo preview"
                      className="h-8 w-auto object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sponsor Link */}
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1">
              <LinkIcon className="w-3 h-3" /> Sponsor Link (optional)
            </Label>
            <Input
              value={formData.sponsor_link || ''}
              onChange={(e) => onChange({ sponsor_link: e.target.value || null })}
              placeholder="https://sponsor-website.com"
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Start Date *
              </Label>
              <Input
                type="date"
                value={formData.sponsor_start_date || ''}
                onChange={(e) => onChange({ sponsor_start_date: e.target.value || null })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1">
                <Calendar className="w-3 h-3" /> End Date *
              </Label>
              <Input
                type="date"
                value={formData.sponsor_end_date || ''}
                onChange={(e) => onChange({ sponsor_end_date: e.target.value || null })}
                className={cn(endBeforeStart && 'border-destructive')}
              />
            </div>
          </div>

          {/* Validation Errors */}
          {endBeforeStart && (
            <div className="flex items-center gap-2 text-destructive text-xs">
              <AlertTriangle className="w-3 h-3" />
              End date must be after start date
            </div>
          )}

          {formData.sponsor_enabled && !isValid && !endBeforeStart && (
            <div className="flex items-center gap-2 text-amber-600 text-xs">
              <AlertTriangle className="w-3 h-3" />
              Please fill in all required fields (*)
            </div>
          )}

          {/* Preview */}
          {formData.sponsor_name && formData.sponsor_logo && (
            <Card className="bg-muted/30">
              <CardContent className="p-3">
                <Label className="text-xs text-muted-foreground mb-2 block">Preview</Label>
                <div className="flex flex-col gap-2">
                  <div>
                    <span className="text-xs text-muted-foreground">Card view:</span>
                    <div className="mt-1">
                      <SponsorBadge sponsorData={{
                        ...sponsorData,
                        // Force show preview even if dates aren't in range
                        sponsor_start_date: null,
                        sponsor_end_date: null,
                      }} variant="card" />
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Detail view:</span>
                    <div className="mt-1">
                      <SponsorBadge sponsorData={{
                        ...sponsorData,
                        sponsor_start_date: null,
                        sponsor_end_date: null,
                      }} variant="detail" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
