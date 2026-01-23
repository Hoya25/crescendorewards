import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, QrCode, Share2, Link2, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReferralQRCodeProps {
  standardLink: string;
  personalizedLink?: string | null;
  referralCode: string;
}

export function ReferralQRCode({ 
  standardLink, 
  personalizedLink,
  referralCode 
}: ReferralQRCodeProps) {
  const [activeLink, setActiveLink] = useState<'personalized' | 'standard'>(
    personalizedLink ? 'personalized' : 'standard'
  );
  
  const currentLink = activeLink === 'personalized' && personalizedLink 
    ? personalizedLink 
    : standardLink;

  const handleDownload = () => {
    const svg = document.getElementById('referral-qr-code');
    if (!svg) return;
    
    // Create canvas from SVG
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      canvas.width = img.width * 2; // Higher resolution
      canvas.height = img.height * 2;
      
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
      
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `crescendo-invite-${referralCode}.png`;
      downloadLink.click();
      
      URL.revokeObjectURL(url);
    };
    
    img.src = url;
  };

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <QrCode className="h-4 w-4 text-primary" />
          QR Code
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

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDownload}
            className="flex-1 gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'Join me on Crescendo',
                  text: 'Sign up and we both earn rewards!',
                  url: currentLink
                });
              }
            }}
            className="flex-1 gap-1.5"
            disabled={!navigator.share}
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </Button>
        </div>
        
        <p className="text-xs text-center text-muted-foreground">
          Print or share this code for easy in-person referrals
        </p>
      </CardContent>
    </Card>
  );
}
