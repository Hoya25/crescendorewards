import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  UserPlus, Copy, Check, ChevronRight, Lock, 
  QrCode, X, Share2
} from 'lucide-react';
import { toast } from 'sonner';
import { NCTRLogo } from '@/components/NCTRLogo';
import { useReferralSettings } from '@/hooks/useReferralSettings';
import { useReferralStats } from '@/hooks/useReferralStats';
import { useReferralSlug } from '@/hooks/useReferralSlug';
import { generateReferralLink, PRODUCTION_DOMAIN } from '@/lib/referral-links';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { REFERRAL_REWARDS } from '@/constants/referral';
import { cn } from '@/lib/utils';

interface CompactReferralCardProps {
  variant?: 'default' | 'featured';
  showQROnHover?: boolean;
  className?: string;
}

export function CompactReferralCard({ 
  variant = 'default',
  showQROnHover = true,
  className 
}: CompactReferralCardProps) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  
  const { profile } = useUnifiedUser();
  const { data: referralSettings } = useReferralSettings();
  const { data: stats } = useReferralStats();
  const { currentSlug } = useReferralSlug();

  const crescendoData = profile?.crescendo_data || {};
  const referralCode = crescendoData.referral_code || '';
  const allocation = referralSettings?.allocation360Lock ?? REFERRAL_REWARDS.defaults.allocation360Lock;
  
  // Generate links
  const standardLink = generateReferralLink(referralCode);
  const personalizedLink = currentSlug ? `${PRODUCTION_DOMAIN}/join/${currentSlug}` : null;
  const displayLink = personalizedLink || standardLink;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayLink);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join me on Crescendo',
        text: REFERRAL_REWARDS.shareText.default(allocation),
        url: displayLink
      });
    } else {
      handleCopy();
    }
  };

  const totalReferrals = stats?.totalReferrals || 0;
  const nextMilestone = REFERRAL_REWARDS.milestones.find(m => m.count > totalReferrals);
  const toNextMilestone = nextMilestone ? nextMilestone.count - totalReferrals : 0;

  if (variant === 'featured') {
    return (
      <Card 
        className={cn(
          "relative overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/15 hover:border-primary/50 transition-all cursor-pointer group",
          className
        )}
        onClick={() => navigate('/invite')}
      >
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shrink-0">
              <UserPlus className="w-7 h-7 text-primary-foreground" />
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                Invite Friends
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                {REFERRAL_REWARDS.descriptions.inviter.short(allocation)}
              </p>
              
              {/* Stats row */}
              {totalReferrals > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="gap-1">
                    🏆 {totalReferrals} invited
                  </Badge>
                  {toNextMilestone > 0 && (
                    <span>{toNextMilestone} to next reward</span>
                  )}
                </div>
              )}
            </div>
            
            {/* Arrow */}
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </div>
          
          {/* Quick actions bar */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5"
              onClick={(e) => {
                e.stopPropagation();
                handleCopy();
              }}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={(e) => {
                e.stopPropagation();
                setShowQR(!showQR);
              }}
            >
              {showQR ? <X className="w-3.5 h-3.5" /> : <QrCode className="w-3.5 h-3.5" />}
            </Button>
            <Button
              variant="default"
              size="sm"
              className="gap-1.5"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/invite');
              }}
            >
              Invite Now
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
          
          {/* Expandable QR Code */}
          {showQR && (
            <div 
              className="mt-4 p-4 bg-white rounded-xl flex flex-col items-center gap-3 animate-in slide-in-from-top-2 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <QRCodeSVG
                value={displayLink}
                size={120}
                level="M"
                includeMargin={true}
                bgColor="#ffffff"
                fgColor="#000000"
              />
              <p className="text-xs text-muted-foreground text-center max-w-[180px] truncate">
                {displayLink}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Default compact variant
  return (
    <div 
      className={cn(
        "relative flex items-center gap-4 p-4 rounded-xl border bg-card cursor-pointer transition-all duration-200 ease-out hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/20 group",
        className
      )}
      onClick={() => navigate('/invite')}
    >
      {/* Icon */}
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm shrink-0">
        <UserPlus className="w-6 h-6 text-primary-foreground" />
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-bold text-base group-hover:text-primary transition-colors">
            Invite Friends
          </h3>
        </div>
        <p className="text-muted-foreground text-sm line-clamp-1">
          {REFERRAL_REWARDS.descriptions.inviter.short(allocation)}
        </p>
        {totalReferrals > 0 && (
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">
              🏆 {totalReferrals} invited
            </Badge>
          </div>
        )}
      </div>
      
      {/* Right side - Reward badge + QR toggle */}
      <div className="flex items-center gap-3 shrink-0">
        <Badge 
          className="text-xs font-semibold whitespace-nowrap bg-primary/10 text-primary hover:bg-primary/20"
        >
          <Lock className="w-3 h-3 mr-1" />
          {allocation.toLocaleString()} <NCTRLogo size="xs" className="ml-0.5" />
        </Badge>
        
        {showQROnHover && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              setShowQR(!showQR);
            }}
          >
            {showQR ? <X className="w-4 h-4" /> : <QrCode className="w-4 h-4" />}
          </Button>
        )}
        
        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-muted group-hover:bg-primary/10 transition-colors">
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>
      
      {/* Expandable Mini QR */}
      {showQR && (
        <div 
          className="absolute right-4 top-full mt-2 z-50 p-4 bg-white dark:bg-gray-900 rounded-xl shadow-xl border animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <QRCodeSVG
            value={displayLink}
            size={100}
            level="M"
            includeMargin={true}
            bgColor="#ffffff"
            fgColor="#000000"
          />
          <p className="text-xs text-muted-foreground text-center mt-2 max-w-[120px] truncate">
            Scan to join
          </p>
          <div className="flex gap-1 mt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 text-xs h-7"
              onClick={handleCopy}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 text-xs h-7"
              onClick={handleShare}
            >
              <Share2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
