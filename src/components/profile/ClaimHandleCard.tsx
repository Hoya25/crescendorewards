import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Check, X, Loader2, AtSign, Sparkles, AlertTriangle, Lock } from 'lucide-react';
import { HandleSuggestionsDropdown } from './HandleSuggestionsDropdown';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const BRONZE_REQUIREMENT = 100;

function generateSuggestions(base: string): string[] {
  if (!base || base.length < 3) return [];
  const cleaned = base.replace(/[^a-z0-9_]/g, '');
  if (cleaned.length < 2) return [];
  const candidates = [
    cleaned + '_' + Math.floor(Math.random() * 90 + 10),
    cleaned.length <= 17 ? cleaned + '_og' : null,
    cleaned.length <= 16 ? cleaned + '_real' : null,
    cleaned.length <= 18 ? cleaned + '_x' : null,
    cleaned.length <= 17 ? 'the_' + cleaned : null,
    cleaned.length <= 16 ? cleaned + '_here' : null,
  ];
  return candidates
    .filter((s): s is string => s !== null && s.length >= 3 && s.length <= 20)
    .slice(0, 5);
}

export function ClaimHandleCard() {
  const { profile, refreshUnifiedProfile, total360Locked } = useUnifiedUser();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [checking, setChecking] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [availability, setAvailability] = useState<{
    available: boolean;
    reason?: string;
  } | null>(null);

  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictHandle, setConflictHandle] = useState('');
  const [modalSuggestions, setModalSuggestions] = useState<{ handle: string; available: boolean; checking: boolean }[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const isBronze = total360Locked >= BRONZE_REQUIREMENT;
  const progressPercent = Math.min(100, (total360Locked / BRONZE_REQUIREMENT) * 100);

  const checkAvailability = useCallback(async (value: string) => {
    if (value.length < 3) { setAvailability(null); return; }
    setChecking(true);
    try {
      const { data, error } = await supabase.rpc('check_handle_available', { p_handle: value });
      if (error) throw error;
      const result = data as unknown as { available: boolean; reason?: string };
      setAvailability(result);
      if (!result.available && result.reason === 'taken') {
        setConflictHandle(value);
        setShowConflictModal(true);
        loadSuggestions(value);
      }
    } catch {
      setAvailability(null);
    } finally {
      setChecking(false);
    }
  }, []);

  const loadSuggestions = async (base: string) => {
    setLoadingSuggestions(true);
    const candidates = generateSuggestions(base);
    const initial = candidates.map((h) => ({ handle: h, available: false, checking: true }));
    setModalSuggestions(initial);
    const results = await Promise.all(
      candidates.map(async (h) => {
        try {
          const { data: d } = await supabase.rpc('check_handle_available', { p_handle: h });
          const r = d as unknown as { available: boolean };
          return { handle: h, available: r?.available ?? false, checking: false };
        } catch { return { handle: h, available: false, checking: false }; }
      })
    );
    setModalSuggestions(results);
    setLoadingSuggestions(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (input.length >= 3) checkAvailability(input);
      else setAvailability(null);
    }, 500);
    return () => clearTimeout(timer);
  }, [input, checkAvailability]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Already has handle — success banner
  if (profile?.handle) {
    return (
      <Card className="border-2 overflow-hidden" style={{ borderColor: '#E2FF6D50' }}>
        <CardContent className="flex items-center gap-3 py-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#E2FF6D20' }}>
            <Check className="h-5 w-5" style={{ color: '#E2FF6D' }} />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm" style={{ color: '#E2FF6D' }}>@{profile.handle}</p>
            <p className="text-xs text-muted-foreground">Your handle is claimed and active across Crescendo</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Not Bronze — locked state
  if (!isBronze) {
    return (
      <Card className="border-2 overflow-hidden opacity-70" style={{ borderColor: '#E2FF6D15' }}>
        <CardHeader className="pb-3" style={{ background: 'linear-gradient(135deg, rgba(226,255,109,0.04), transparent)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center relative" style={{ backgroundColor: '#E2FF6D10' }}>
              <AtSign className="h-5 w-5 text-muted-foreground" />
              <Lock className="h-3.5 w-3.5 absolute -bottom-0.5 -right-0.5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg text-muted-foreground">Claim Your @Handle</CardTitle>
              <CardDescription>Bronze Benefit — Reach Bronze status to unlock</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{Math.floor(total360Locked)} / {BRONZE_REQUIREMENT} NCTR locked</span>
              <span>{Math.floor(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
          <p className="text-xs text-muted-foreground">
            Lock {Math.max(0, BRONZE_REQUIREMENT - Math.floor(total360Locked))} more NCTR to reach Bronze and unlock your permanent @handle identity.
          </p>
          <Button variant="outline" className="w-full text-sm" onClick={() => navigate('/membership')}>
            <Lock className="h-4 w-4 mr-2" />
            Lock NCTR to Reach Bronze →
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Bronze+ — show claim form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setInput(cleaned);
    setShowDropdown(cleaned.length >= 3);
  };

  const handleSelectSuggestion = (handle: string) => {
    setInput(handle);
    setAvailability({ available: true });
    setShowDropdown(false);
  };

  const handlePickSuggestion = (handle: string) => {
    setInput(handle);
    setAvailability({ available: true });
    setShowConflictModal(false);
  };

  const handleClaim = async () => {
    if (!profile?.id || !availability?.available) return;
    setClaiming(true);
    try {
      const { data, error } = await supabase.rpc('claim_handle', { p_user_id: profile.id, p_handle: input });
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
      taken: 'Already taken — click to see alternatives',
      reserved: 'This handle is reserved',
      invalid_format: '3-20 characters, letters/numbers/underscores only',
    };
    return { icon: <X className="h-4 w-4 text-destructive" />, text: reasons[availability.reason || ''] || 'Not available', color: 'text-destructive' };
  };

  const status = getStatusMessage();
  const availableSuggestions = modalSuggestions.filter((s) => s.available);

  return (
    <>
      <Card className="border-2 overflow-hidden" style={{ borderColor: '#E2FF6D30' }}>
        <CardHeader className="pb-3" style={{ background: 'linear-gradient(135deg, rgba(226,255,109,0.08), transparent)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#E2FF6D20' }}>
              <AtSign className="h-5 w-5" style={{ color: '#E2FF6D' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">Claim Your @Handle</CardTitle>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse" style={{ backgroundColor: '#E2FF6D20', color: '#E2FF6D' }}>
                  UNLOCKED
                </span>
              </div>
              <CardDescription>Choose your permanent identity on Crescendo</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2" ref={wrapperRef}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm">@</span>
              <Input value={input} onChange={handleInputChange} onFocus={() => input.length >= 3 && setShowDropdown(true)}
                     placeholder="yourhandle" maxLength={20} className="pl-8" disabled={claiming} />
              <HandleSuggestionsDropdown input={input} visible={showDropdown} onSelect={handleSelectSuggestion} />
            </div>
            {status && (
              <button type="button"
                onClick={() => {
                  if (availability && !availability.available && availability.reason === 'taken') {
                    setConflictHandle(input); setShowConflictModal(true); loadSuggestions(input);
                  }
                }}
                className={`flex items-center gap-1.5 text-xs ${status.color} ${
                  availability && !availability.available && availability.reason === 'taken' ? 'cursor-pointer hover:underline' : 'cursor-default'
                }`}>
                {status.icon}
                <span>{status.text}</span>
              </button>
            )}
          </div>

          <Button onClick={handleClaim} disabled={!availability?.available || claiming || checking}
                  className="w-full font-bold border-0" style={{ backgroundColor: '#E2FF6D', color: '#323232' }}>
            {claiming ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Claiming...</> : `Claim @${input || '...'}`}
          </Button>

          <p className="text-[11px] text-muted-foreground text-center">Choose carefully — this cannot be changed later</p>
        </CardContent>
      </Card>

      {/* Conflict Resolution Modal */}
      <Dialog open={showConflictModal} onOpenChange={setShowConflictModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-destructive/10">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <DialogTitle className="text-base">@{conflictHandle} is taken</DialogTitle>
                <DialogDescription className="text-xs">Pick an available alternative or go back and try a different name</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {loadingSuggestions ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Finding available handles…
              </div>
            ) : availableSuggestions.length > 0 ? (
              <>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-3">
                  <Sparkles className="h-3.5 w-3.5" style={{ color: '#E2FF6D' }} /> Available alternatives
                </p>
                <div className="space-y-1.5">
                  {availableSuggestions.map((s) => (
                    <button key={s.handle} onClick={() => handlePickSuggestion(s.handle)}
                      className="w-full flex items-center justify-between rounded-lg border border-border/60 px-4 py-3 text-sm transition-all hover:border-[#E2FF6D]/60 hover:bg-[#E2FF6D]/5 group">
                      <span className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">@</span>
                        <span className="font-medium">{s.handle}</span>
                      </span>
                      <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-1">
                        <Check className="h-3 w-3" style={{ color: '#E2FF6D' }} /> Use this
                      </span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">No close alternatives found. Try a different handle.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConflictModal(false)} className="w-full">Try a different name</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
