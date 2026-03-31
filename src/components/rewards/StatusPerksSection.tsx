import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lock, Sparkles, Shield, Tv } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthContext } from '@/contexts/AuthContext';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { toast } from 'sonner';

const TOTAL_SUPPLY = 100;

interface StatusPerk {
  id: string;
  title: string;
  brand: string;
  description: string;
  minTier: string;
  totalSupply: number;
  remainingCount: number;
  category: string;
}

const RAD_PERK: StatusPerk = {
  id: 'rad-stream-pass',
  title: 'RAD.live Stream Pass',
  brand: 'RAD.live',
  description:
    'Reach Silver status and claim your RAD.live Stream Pass NFT — lifetime premium streaming, on us. 4K content, AI films, VR experiences, and ad-free viewing across PS5, Apple TV, iOS, Android, Quest, and web. Own it. Keep it. Resell it if you want.',
  minTier: 'silver',
  totalSupply: TOTAL_SUPPLY,
  remainingCount: 100, // hardcoded for now
  category: 'Entertainment',
};

const TIER_ORDER = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

export function StatusPerksSection() {
  const navigate = useNavigate();
  const { isAuthenticated, setShowAuthModal, setAuthMode } = useAuthContext();
  const { tier } = useUnifiedUser();
  const userTier = tier?.tier_name?.toLowerCase() || 'bronze';
  const userTierIndex = TIER_ORDER.indexOf(userTier);
  const requiredIndex = TIER_ORDER.indexOf(RAD_PERK.minTier);
  const isEligible = isAuthenticated && userTierIndex >= requiredIndex;
  const isLocked = !isEligible;
  const isSoldOut = RAD_PERK.remainingCount <= 0;

  const handleClaim = () => {
    if (!isAuthenticated) {
      setAuthMode('signin');
      setShowAuthModal(true);
      return;
    }
    if (isLocked) {
      navigate('/crescendo?unlock=Silver');
      return;
    }
    if (isSoldOut) return;
    toast.success('Claim submitted! Redemption details coming soon.');
  };

  return (
    <div className="container mx-auto px-4 pt-6 pb-2 max-w-full">
      {/* Section header */}
      <div className="flex items-center gap-2.5 mb-4">
        <Shield className="w-5 h-5" style={{ color: '#E2FF6D' }} />
        <h2 className="text-lg font-semibold text-foreground">
          Status Perks — Unlocked by Reaching Silver and Above
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* RAD.live Card */}
        <Card
          className={cn(
            'group relative overflow-hidden rounded-xl border transition-all duration-300 cursor-pointer',
            'hover:scale-[1.02] hover:shadow-2xl shadow-md',
            isLocked && 'opacity-60',
          )}
          style={{ backgroundColor: '#1A1A1A', borderColor: 'rgba(226,255,109,0.25)' }}
          onClick={handleClaim}
        >
          {/* STATUS PERK banner */}
          <div
            className="px-3 py-1.5 text-[11px] font-bold tracking-widest uppercase text-center"
            style={{ backgroundColor: 'rgba(226,255,109,0.12)', color: '#E2FF6D' }}
          >
            ✦ Status Perk
          </div>

          {/* Hero area */}
          <div className="relative aspect-[4/3] w-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #0D0D0D 0%, #1A1A1A 50%, #0D0D0D 100%)' }}
          >
            <div className="flex flex-col items-center gap-3">
              <Tv className="w-14 h-14" style={{ color: '#E2FF6D' }} />
              <span className="text-xl font-bold text-white tracking-tight">RAD.live</span>
            </div>

            {/* Lock overlay for ineligible */}
            {isLocked && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-2">
                  <Lock className="w-8 h-8 text-[#C0C0C0]" />
                  <span className="text-sm font-semibold text-[#C0C0C0]">Unlock at Silver</span>
                </div>
              </div>
            )}

            {/* Gradient bottom */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#1A1A1A] to-transparent" />

            {/* Bottom of image: title */}
            <div className="absolute left-0 right-0 bottom-0 p-4">
              <h3 className="font-bold text-base text-white leading-tight drop-shadow-lg">
                {RAD_PERK.title}
              </h3>
            </div>
          </div>

          {/* Content */}
          <div className="p-3.5 space-y-3" style={{ backgroundColor: '#1A1A1A' }}>
            {/* LIMITED badge + remaining */}
            <div className="flex items-center justify-between">
              <Badge
                className="text-[11px] font-bold tracking-wide border-0 px-2.5 py-1"
                style={{ backgroundColor: '#E2FF6D', color: '#0D0D0D' }}
              >
                LIMITED · {RAD_PERK.totalSupply} AVAILABLE
              </Badge>
              {!isSoldOut ? (
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {RAD_PERK.remainingCount} remaining
                </span>
              ) : (
                <span className="text-xs font-semibold text-red-400">Fully Claimed</span>
              )}
            </div>

            {/* Description */}
            <p className="text-xs leading-relaxed line-clamp-3" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {RAD_PERK.description}
            </p>

            {/* Category + Tier */}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] border-white/10 text-white/50">
                {RAD_PERK.category}
              </Badge>
              <Badge
                variant="outline"
                className="text-[10px] border-0"
                style={{ backgroundColor: 'rgba(192,192,192,0.15)', color: '#C0C0C0' }}
              >
                Silver+
              </Badge>
            </div>

            {/* CTA */}
            <Button
              className={cn(
                'w-full font-semibold text-sm h-9',
                isSoldOut
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : !isAuthenticated
                    ? 'text-[#0D0D0D] hover:opacity-90'
                    : isLocked
                      ? 'bg-muted text-muted-foreground'
                      : 'text-[#0D0D0D] hover:opacity-90',
              )}
              style={
                !isSoldOut && (isEligible || !isAuthenticated)
                  ? { backgroundColor: '#E2FF6D' }
                  : undefined
              }
              disabled={isSoldOut}
              onClick={(e) => {
                e.stopPropagation();
                handleClaim();
              }}
            >
              {isSoldOut ? (
                'Fully Claimed'
              ) : !isAuthenticated ? (
                'Sign Up to Claim'
              ) : isLocked ? (
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  Unlock at Silver
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Claim — Free Perk
                </span>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
