import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, QrCode, Share2, Link2, Wand2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import crescendoLogoDark from '@/assets/crescendo-logo-dark.png';

interface ReferralQRCodeProps {
  standardLink: string;
  personalizedLink?: string | null;
  referralCode: string;
  inviterName?: string | null;
}

export function ReferralQRCode({ 
  standardLink, 
  personalizedLink,
  referralCode,
  inviterName
}: ReferralQRCodeProps) {
  const [activeLink, setActiveLink] = useState<'personalized' | 'standard'>(
    personalizedLink ? 'personalized' : 'standard'
  );
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const currentLink = activeLink === 'personalized' && personalizedLink 
    ? personalizedLink 
    : standardLink;

  const displayName = inviterName || 'A Friend';

  const handleDownloadQR = () => {
    const svg = document.getElementById('referral-qr-code');
    if (!svg) return;
    
    const canvas = document.createElement('canvas');
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
      
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `crescendo-invite-${referralCode}-qr.png`;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const generateShareableCard = async (): Promise<string | null> => {
    const cardElement = cardRef.current;
    if (!cardElement) return null;

    try {
      const canvas = await html2canvas(cardElement, {
        backgroundColor: '#000000',
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Failed to generate shareable card:', error);
      return null;
    }
  };

  const handleDownloadCard = async () => {
    setIsGeneratingCard(true);
    try {
      const imageData = await generateShareableCard();
      if (!imageData) {
        toast.error('Failed to generate card');
        return;
      }
      
      const link = document.createElement('a');
      link.href = imageData;
      link.download = `crescendo-invite-${referralCode}-card.png`;
      link.click();
      toast.success('Card downloaded!');
    } catch (error) {
      toast.error('Failed to download card');
    } finally {
      setIsGeneratingCard(false);
    }
  };

  const handleShareCard = async () => {
    setIsGeneratingCard(true);
    try {
      const imageData = await generateShareableCard();
      if (!imageData) {
        toast.error('Failed to generate card');
        return;
      }

      const blob = await (await fetch(imageData)).blob();
      const file = new File([blob], 'crescendo-invite.png', { type: 'image/png' });
      
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Join me on Crescendo',
          text: 'Scan the QR code or use my link to join and earn 500 NCTR!'
        });
      } else {
        // Fallback: download the image
        const link = document.createElement('a');
        link.href = imageData;
        link.download = `crescendo-invite-${referralCode}-card.png`;
        link.click();
        toast.success('Card downloaded (sharing not supported)');
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        toast.error('Failed to share card');
      }
    } finally {
      setIsGeneratingCard(false);
    }
  };

  const handleShareLink = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join me on Crescendo',
        text: 'Sign up and we both earn rewards!',
        url: currentLink
      });
    }
  };

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <QrCode className="h-4 w-4 text-primary" />
          QR Code & Share Card
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Link type selector if personalized link exists */}
        {personalizedLink && (
          <Tabs value={activeLink} onValueChange={(v) => setActiveLink(v as typeof activeLink)}>
            <TabsList className="grid w-full grid-cols-2 h-9">
              <TabsTrigger value="personalized" className="text-xs gap-1">
                <Wand2 className="h-3 w-3" />
                Personal
              </TabsTrigger>
              <TabsTrigger value="standard" className="text-xs gap-1">
                <Link2 className="h-3 w-3" />
                Standard
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {/* QR Code */}
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-white rounded-xl shadow-sm">
            <QRCodeSVG
              id="referral-qr-code"
              value={currentLink}
              size={160}
              level="H"
              includeMargin={true}
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>
          
          {/* Current link preview */}
          <p className="text-xs text-muted-foreground text-center break-all max-w-[200px]">
            {currentLink}
          </p>
        </div>

        {/* QR Only Actions */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDownloadQR}
            className="flex-1 gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            QR Only
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShareLink}
            className="flex-1 gap-1.5"
            disabled={!navigator.share}
          >
            <Share2 className="h-3.5 w-3.5" />
            Share Link
          </Button>
        </div>

        {/* Branded Card Actions */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground text-center mb-3">
            Or share a branded invite card
          </p>
          <div className="flex gap-2">
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleDownloadCard}
              className="flex-1 gap-1.5"
              disabled={isGeneratingCard}
            >
            {isGeneratingCard ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ImageIcon className="h-3.5 w-3.5" />
              )}
              Download Card
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleShareCard}
              className="flex-1 gap-1.5"
              disabled={isGeneratingCard}
            >
              {isGeneratingCard ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Share2 className="h-3.5 w-3.5" />
              )}
              Share Card
            </Button>
          </div>
        </div>
        
        <p className="text-xs text-center text-muted-foreground">
          Print or share this code for easy in-person referrals
        </p>
      </CardContent>

      {/* Hidden Shareable Card for html2canvas */}
      <div 
        ref={cardRef}
        className="absolute -left-[9999px] top-0"
        style={{ width: '400px', height: '600px' }}
      >
        <div 
          className="w-full h-full flex flex-col items-center justify-between p-8"
          style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center gap-2">
            <img 
              src={crescendoLogoDark} 
              alt="Crescendo" 
              className="h-10 object-contain"
              crossOrigin="anonymous"
            />
          </div>

          {/* Main Content */}
          <div className="flex flex-col items-center gap-6">
            {/* Invite Text */}
            <div className="text-center">
              <p className="text-white/70 text-sm mb-1">You're invited by</p>
              <p className="text-white text-2xl font-bold">{displayName}</p>
            </div>

            {/* QR Code */}
            <div className="p-5 bg-white rounded-2xl shadow-2xl">
              <QRCodeSVG
                value={currentLink}
                size={180}
                level="H"
                includeMargin={true}
                bgColor="#ffffff"
                fgColor="#000000"
              />
            </div>

            {/* Link */}
            <p className="text-white/60 text-xs text-center max-w-[300px] break-all">
              {currentLink}
            </p>
          </div>

          {/* Bottom CTA */}
          <div className="text-center">
            <div 
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full mb-3"
              style={{ backgroundColor: 'rgba(139, 92, 246, 0.2)' }}
            >
              <span className="text-white font-semibold">🎁 Earn 500 NCTR 360LOCK</span>
            </div>
            <p className="text-white/50 text-xs">
              Scan to join & start earning rewards
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
