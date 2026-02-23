import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2, AtSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { toast } from 'sonner';

export function ClaimHandleCard() {
  const { profile, refreshUnifiedProfile } = useUnifiedUser();
  const [input, setInput] = useState('');
  const [checking, setChecking] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [availability, setAvailability] = useState<{
    available: boolean;
    reason?: string;
  } | null>(null);

  // Debounced availability check
  const checkAvailability = useCallback(async (value: string) => {
    if (value.length < 3) {
      setAvailability(null);
      return;
    }
    setChecking(true);
    try {
      const { data, error } = await supabase.rpc('check_handle_available', { p_handle: value });
      if (error) throw error;
      const result = data as unknown as { available: boolean; reason?: string };
      setAvailability(result);
    } catch {
      setAvailability(null);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (input.length >= 3) {
        checkAvailability(input);
      } else {
        setAvailability(null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [input, checkAvailability]);

  // Already has handle — don't render
  if (profile?.handle) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow lowercase letters, numbers, underscores
    const cleaned = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setInput(cleaned);
  };

  const handleClaim = async () => {
    if (!profile?.id || !availability?.available) return;
    setClaiming(true);
    try {
      const { data, error } = await supabase.rpc('claim_handle', {
        p_user_id: profile.id,
        p_handle: input,
      });
      if (error) throw error;
      const result = data as unknown as { success: boolean; handle?: string; error?: string };
      if (result.success) {
        toast.success(`You are @${result.handle} on Crescendo! 🎉`, { duration: 5000 });
        await refreshUnifiedProfile();
      } else {
        toast.error(result.error || 'Failed to claim handle');
      }
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setClaiming(false);
    }
  };

  const getStatusMessage = () => {
    if (!input || input.length < 3) return null;
    if (checking) return { icon: <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />, text: 'Checking...', color: 'text-muted-foreground' };
    if (!availability) return null;
    if (availability.available) return { icon: <Check className="h-4 w-4" style={{ color: '#E2FF6D' }} />, text: 'Available!', color: 'text-[#E2FF6D]' };
    
    const reasons: Record<string, string> = {
      taken: 'Already taken',
      reserved: 'This handle is reserved',
      invalid_format: '3-20 characters, letters/numbers/underscores only',
    };
    return { icon: <X className="h-4 w-4 text-destructive" />, text: reasons[availability.reason || ''] || 'Not available', color: 'text-destructive' };
  };

  const status = getStatusMessage();

  return (
    <Card className="border-2 overflow-hidden" style={{ borderColor: '#E2FF6D30' }}>
      <CardHeader className="pb-3" style={{ background: 'linear-gradient(135deg, rgba(226,255,109,0.08), transparent)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#E2FF6D20' }}>
            <AtSign className="h-5 w-5" style={{ color: '#E2FF6D' }} />
          </div>
          <div>
            <CardTitle className="text-lg">Claim Your @Handle</CardTitle>
            <CardDescription>Choose your permanent identity on Crescendo</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm">@</span>
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="yourhandle"
              maxLength={20}
              className="pl-8"
              disabled={claiming}
            />
          </div>
          {status && (
            <div className={`flex items-center gap-1.5 text-xs ${status.color}`}>
              {status.icon}
              <span>{status.text}</span>
            </div>
          )}
        </div>

        <Button
          onClick={handleClaim}
          disabled={!availability?.available || claiming || checking}
          className="w-full font-bold border-0"
          style={{ backgroundColor: '#E2FF6D', color: '#323232' }}
        >
          {claiming ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Claiming...</>
          ) : (
            `Claim @${input || '...'}`
          )}
        </Button>

        <p className="text-[11px] text-muted-foreground text-center">
          Choose carefully — this cannot be changed later
        </p>
      </CardContent>
    </Card>
  );
}
