import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Gift, ArrowLeft, CheckCircle, XCircle, Clock, LogIn } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { useGiftClaims } from '@/hooks/useGiftClaims';
import { format, formatDistanceToNow } from 'date-fns';
import type { ClaimGift } from '@/types/gifts';

export default function ClaimGiftPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile } = useUnifiedUser();
  const { isLoading, claimGift, getGiftByCode } = useGiftClaims();

  const [giftCode, setGiftCode] = useState(searchParams.get('code') || '');
  const [gift, setGift] = useState<ClaimGift | null>(null);
  const [loadingGift, setLoadingGift] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claimed, setClaimed] = useState(false);
  const [claimedAmount, setClaimedAmount] = useState(0);

  const fetchGift = async (code: string) => {
    if (!code || code.length < 5) return;
    setLoadingGift(true);
    setError(null);
    const result = await getGiftByCode(code);
    if (!result) {
      setError('Gift not found. Please check the code and try again.');
      setGift(null);
    } else if (result.status === 'claimed') {
      setError('This gift has already been claimed.');
      setGift(result);
    } else if (result.status === 'expired' || new Date(result.expires_at) < new Date()) {
      setError(`This gift expired on ${format(new Date(result.expires_at), 'MMM d, yyyy')}.`);
      setGift(result);
    } else if (result.status === 'cancelled') {
      setError('This gift has been cancelled.');
      setGift(result);
    } else {
      setGift(result);
    }
    setLoadingGift(false);
  };

  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) {
      setGiftCode(codeFromUrl);
      fetchGift(codeFromUrl);
    }
  }, [searchParams]);

  const handleLookup = () => fetchGift(giftCode);

  const handleClaim = async () => {
    if (!profile) {
      navigate('/');
      return;
    }
    const result = await claimGift(giftCode);
    if (result.success) {
      setClaimed(true);
      setClaimedAmount(result.claimsReceived || 0);
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
    }
  };

  const isValidGift = gift && gift.status === 'pending' && new Date(gift.expires_at) > new Date();

  if (claimed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <div className="bg-primary/10 rounded-full w-20 h-20 mx-auto flex items-center justify-center mb-4">
              <CheckCircle className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Gift Claimed!</h2>
            <p className="text-4xl font-bold text-primary mb-4">+{claimedAmount} Claims</p>
            <p className="text-muted-foreground mb-6">The Claims have been added to your balance.</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => navigate('/gift-claims')}>View Gifts</Button>
              <Button className="flex-1" onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-lg mx-auto py-8 px-4">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Gift className="h-6 w-6 text-primary" />Claim Gift</h1>
            <p className="text-muted-foreground">Redeem your gift code</p>
          </div>
        </div>

        {!gift && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Enter Gift Code</CardTitle>
              <CardDescription>Enter the code you received to claim your gift</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="GIFT-XXXXXXXX" value={giftCode} onChange={(e) => setGiftCode(e.target.value.toUpperCase())} className="text-center text-lg font-mono uppercase" />
              <Button className="w-full" onClick={handleLookup} disabled={loadingGift || giftCode.length < 5}>{loadingGift ? 'Looking up...' : 'Find Gift'}</Button>
              {error && !gift && <div className="flex items-center gap-2 text-destructive text-sm"><XCircle className="h-4 w-4" />{error}</div>}
            </CardContent>
          </Card>
        )}

        {gift && (
          <Card className={`${isValidGift ? 'border-primary/50 bg-primary/5' : 'border-muted'}`}>
            <CardContent className="pt-6">
              {!isValidGift && (
                <div className={`rounded-lg p-3 mb-4 flex items-center gap-2 ${gift.status === 'claimed' ? 'bg-primary/10 text-primary' : gift.status === 'expired' ? 'bg-muted text-muted-foreground' : 'bg-destructive/10 text-destructive'}`}>
                  {gift.status === 'claimed' && <CheckCircle className="h-5 w-5" />}
                  {gift.status === 'expired' && <Clock className="h-5 w-5" />}
                  {gift.status === 'cancelled' && <XCircle className="h-5 w-5" />}
                  <span className="font-medium">{error}</span>
                </div>
              )}
              {isValidGift && (
                <div className="text-center mb-6">
                  <div className="bg-primary/10 rounded-full w-16 h-16 mx-auto flex items-center justify-center mb-4"><Gift className="h-8 w-8 text-primary" /></div>
                  <h2 className="text-xl font-semibold mb-1">You've received a gift!</h2>
                </div>
              )}
              <div className="flex items-center gap-3 mb-4">
                <Avatar><AvatarImage src={gift.sender?.avatar_url || ''} /><AvatarFallback>{gift.is_admin_gift ? '🎁' : (gift.sender?.display_name || 'U').charAt(0)}</AvatarFallback></Avatar>
                <div><p className="font-medium">{gift.is_admin_gift ? 'Crescendo Team' : gift.sender?.display_name || 'Anonymous'}</p><p className="text-sm text-muted-foreground">{gift.is_admin_gift ? 'sent you a gift' : 'wants to gift you Claims'}</p></div>
              </div>
              <div className="text-center py-6 bg-muted/30 rounded-lg mb-4"><p className="text-4xl font-bold text-primary">{gift.claims_amount}</p><p className="text-muted-foreground">Claims</p></div>
              {gift.message && <div className="bg-muted/50 rounded-lg p-4 mb-4"><p className="text-sm italic">"{gift.message}"</p></div>}
              {isValidGift && <p className="text-sm text-muted-foreground text-center mb-4">Expires {formatDistanceToNow(new Date(gift.expires_at), { addSuffix: true })}</p>}
              {isValidGift && (profile ? (
                <Button className="w-full" size="lg" onClick={handleClaim} disabled={isLoading}>{isLoading ? 'Claiming...' : `Claim ${gift.claims_amount} Claims`}</Button>
              ) : (
                <Button className="w-full" size="lg" onClick={() => navigate('/')}><LogIn className="h-4 w-4 mr-2" />Sign in to Claim</Button>
              ))}
              {!isValidGift && <Button variant="outline" className="w-full" onClick={() => { setGift(null); setGiftCode(''); setError(null); }}>Try Another Code</Button>}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
