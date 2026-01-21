import { useState, useRef, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Megaphone, Calendar, Link as LinkIcon, Image as ImageIcon, AlertTriangle, Upload, Loader2, X, CheckCircle2, Library, Eye, AlertCircle, ImageOff } from 'lucide-react';
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

type LogoValidationState = 'idle' | 'loading' | 'valid' | 'error';

/**
 * Admin component for editing reward sponsorship details
 */
export function SponsorshipEditor({ formData, onChange }: SponsorshipEditorProps) {
  const [uploading, setUploading] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null);
  const [logoInputMethod, setLogoInputMethod] = useState<'library' | 'upload' | 'url'>('library');
  const [logoValidation, setLogoValidation] = useState<LogoValidationState>('idle');
  const [logoError, setLogoError] = useState<string | null>(null);
  const [showFullPreview, setShowFullPreview] = useState(false);
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

  // Validate logo URL whenever it changes
  useEffect(() => {
    if (!formData.sponsor_logo) {
      setLogoValidation('idle');
      setLogoError(null);
      return;
    }

    setLogoValidation('loading');
    setLogoError(null);

    const img = new Image();
    img.onload = () => {
      // Check image dimensions
      if (img.width < 50 || img.height < 50) {
        setLogoValidation('error');
        setLogoError('Image is too small (min 50x50px)');
        return;
      }
      if (img.width > 2000 || img.height > 2000) {
        setLogoValidation('error');
        setLogoError('Image is too large (max 2000x2000px)');
        return;
      }
      setLogoValidation('valid');
    };
    img.onerror = () => {
      setLogoValidation('error');
      setLogoError('Failed to load image. Check the URL is correct and accessible.');
    };
    img.src = formData.sponsor_logo;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [formData.sponsor_logo]);

  // Validation
  const isValid = !formData.sponsor_enabled || (
    formData.sponsor_name &&
    formData.sponsor_logo &&
    formData.sponsor_start_date &&
    formData.sponsor_end_date &&
    logoValidation === 'valid'
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

      // Generate unique filename with correct extension and random suffix to prevent collisions
      const fileExt = result.hasTransparency ? 'png' : 'jpg';
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const fileName = `sponsor-logo-${Date.now()}-${randomSuffix}.${fileExt}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('sponsor-logos')
        .upload(fileName, result.file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('sponsor-logos')
        .getPublicUrl(fileName);

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
    setLogoValidation('idle');
    setLogoError(null);
  };

  // Render logo validation status indicator
  const renderLogoStatus = () => {
    if (!formData.sponsor_logo) return null;
    
    switch (logoValidation) {
      case 'loading':
        return (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            Validating image...
          </div>
        );
      case 'valid':
        return (
          <div className="flex items-center gap-1.5 text-xs text-green-600">
            <CheckCircle2 className="w-3 h-3" />
            Image loaded successfully
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-1.5 text-xs text-destructive">
            <AlertCircle className="w-3 h-3" />
            {logoError}
          </div>
        );
      default:
        return null;
    }
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
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2">
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
                    {renderLogoStatus()}
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
                        <div className={cn(
                          "p-2 bg-muted rounded border",
                          logoValidation === 'error' && "border-destructive"
                        )}>
                          {logoValidation === 'error' ? (
                            <div className="h-12 w-20 flex items-center justify-center">
                              <ImageOff className="w-6 h-6 text-muted-foreground" />
                            </div>
                          ) : (
                            <img
                              src={formData.sponsor_logo}
                              alt="Sponsor logo"
                              className="h-12 w-auto object-contain"
                            />
                          )}
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
                      {renderLogoStatus()}
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
              
              <TabsContent value="url" className="mt-2 space-y-2">
                <Input
                  value={formData.sponsor_logo || ''}
                  onChange={(e) => onChange({ sponsor_logo: e.target.value || null })}
                  placeholder="https://example.com/logo.png"
                  className={cn(logoValidation === 'error' && "border-destructive")}
                />
                {formData.sponsor_logo && (
                  <div className="space-y-2">
                    <div className={cn(
                      "p-2 bg-muted rounded border",
                      logoValidation === 'error' && "border-destructive"
                    )}>
                      {logoValidation === 'error' ? (
                        <div className="h-8 flex items-center justify-center gap-2 text-muted-foreground">
                          <ImageOff className="w-4 h-4" />
                          <span className="text-xs">Unable to load image</span>
                        </div>
                      ) : (
                        <img
                          src={formData.sponsor_logo}
                          alt="Logo preview"
                          className="h-8 w-auto object-contain"
                        />
                      )}
                    </div>
                    {renderLogoStatus()}
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
              {logoValidation === 'error' 
                ? 'Logo validation failed. Please use a valid image.'
                : 'Please fill in all required fields (*)'}
            </div>
          )}

          {/* Preview Section */}
          {formData.sponsor_name && formData.sponsor_logo && logoValidation === 'valid' && (
            <Card className="bg-muted/30 overflow-hidden">
              <CardContent className="p-0">
                {/* Preview Header */}
                <div className="flex items-center justify-between p-3 border-b bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                    <Label className="text-xs font-medium">Live Preview</Label>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setShowFullPreview(!showFullPreview)}
                  >
                    {showFullPreview ? 'Hide Details' : 'Show All Views'}
                  </Button>
                </div>
                
                <div className="p-3 space-y-4">
                  {/* Card Badge Preview */}
                  <div>
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Reward Card Badge</span>
                    <div className="mt-2">
                      <SponsorBadge sponsorData={{
                        ...sponsorData,
                        sponsor_start_date: null,
                        sponsor_end_date: null,
                      }} variant="card" />
                    </div>
                  </div>

                  {showFullPreview && (
                    <>
                      {/* Detail Badge Preview */}
                      <div>
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Detail Page Badge</span>
                        <div className="mt-2">
                          <SponsorBadge sponsorData={{
                            ...sponsorData,
                            sponsor_start_date: null,
                            sponsor_end_date: null,
                          }} variant="detail" />
                        </div>
                      </div>

                      {/* Full Sponsor Block Preview */}
                      <div>
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Detail Page Sponsor Block</span>
                        <div className="mt-2 rounded-xl overflow-hidden bg-gradient-to-br from-[#2a2d32] via-[#373b42] to-[#2a2d32] border border-[#4a4f58]/50">
                          <div className="relative flex flex-col items-center text-center p-6">
                            {/* Logo Container */}
                            <div className="relative mb-4">
                              <div className="absolute inset-0 bg-amber-400/20 blur-xl rounded-full" />
                              <div className="relative w-20 h-20 rounded-xl bg-gradient-to-br from-[#3a3f47] to-[#2a2d32] p-3 flex items-center justify-center shadow-lg border border-[#4a4f58]/30">
                                <img 
                                  src={formData.sponsor_logo} 
                                  alt={formData.sponsor_name || 'Sponsor'} 
                                  className="max-w-full max-h-full object-contain" 
                                />
                              </div>
                            </div>
                            
                            {/* Divider */}
                            <div className="w-10 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mb-3" />
                            
                            {/* Text */}
                            <p className="text-[10px] text-amber-400/80 font-semibold uppercase tracking-[0.2em]">
                              Brought to you by
                            </p>
                            <p className="font-bold text-lg mt-1 text-white">{formData.sponsor_name}</p>
                          </div>
                        </div>
                      </div>

                      {/* Validation Summary */}
                      <div className="pt-2 border-t">
                        <div className="flex items-center gap-2 text-xs text-green-600">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="font-medium">Logo validates correctly and will display as shown above</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
