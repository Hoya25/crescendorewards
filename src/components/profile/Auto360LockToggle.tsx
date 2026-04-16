import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Lock, Shield, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { Skeleton } from '@/components/ui/skeleton';

function Auto360LockExplainerModal({
  isOpen,
  onEnable,
  onCancel,
  enabling,
}: {
  isOpen: boolean;
  onEnable: () => void;
  onCancel: () => void;
  enabling: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border rounded-none max-w-lg w-full p-6 relative">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-black tracking-tight uppercase mb-5">
          AUTO 360LOCK — WHY THIS MATTERS
        </h2>

        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            When enabled, every purchase bounty you complete will automatically commit to 360 days
            instead of the default 90 days. Longer commitments protect NCTR's long-term value by
            keeping tokens in the ecosystem.
          </p>
          <p>
            Members who maintain Auto 360LOCK for 30 consecutive days earn Verified Long-Term Holder
            status, which unlocks a +0.25x bonus on all bounty completions (coming with crew
            mechanics).
          </p>
          <p>
            You can toggle this off anytime, but benefits pause immediately and the 30-day clock
            restarts when you re-enable.
          </p>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            onClick={onEnable}
            disabled={enabling}
            className="flex-1 font-bold uppercase tracking-wider text-xs rounded-none"
            style={{ backgroundColor: '#E2FF6D', color: '#323232' }}
          >
            {enabling ? 'Enabling…' : 'Enable'}
          </Button>
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1 font-bold uppercase tracking-wider text-xs rounded-none"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Auto360LockToggle() {
  const { profile } = useUnifiedUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [auto360lock, setAuto360lock] = useState(false);
  const [enabledAt, setEnabledAt] = useState<string | null>(null);
  const [verifiedLongTermHolder, setVerifiedLongTermHolder] = useState(false);

  const userId = profile?.auth_user_id || profile?.id;
  const userEmail = profile?.email;

  const fetchStatus = useCallback(async () => {
    if (!userEmail) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('bh-status-proxy', {
        body: { action: 'get_user_status', email: userEmail },
      });

      if (error) throw error;

      const autoLock = data?.auto_360lock ?? false;
      const autoLockAt = data?.auto_360lock_enabled_at ?? null;

      setAuto360lock(autoLock);
      setEnabledAt(autoLockAt);

      // Compute verified_long_term_holder client-side
      if (data?.verified_long_term_holder !== undefined) {
        setVerifiedLongTermHolder(data.verified_long_term_holder);
      } else if (autoLock && autoLockAt) {
        const daysSince = Math.floor(
          (Date.now() - new Date(autoLockAt).getTime()) / 86400000
        );
        setVerifiedLongTermHolder(daysSince >= 30);
      } else {
        setVerifiedLongTermHolder(false);
      }
    } catch (err) {
      console.warn('[Auto360Lock] Failed to fetch status:', err);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const callEdgeFunction = async (enabled: boolean) => {
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        'set-auto-360lock-preference',
        { body: { user_id: userId, enabled } }
      );

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Unknown error');

      setAuto360lock(enabled);
      if (enabled) {
        setEnabledAt(new Date().toISOString());
        setVerifiedLongTermHolder(false);
      } else {
        setEnabledAt(null);
        setVerifiedLongTermHolder(false);
      }

      toast.success(enabled ? 'Auto 360LOCK enabled' : 'Auto 360LOCK disabled');
    } catch (err: any) {
      console.error('[Auto360Lock] Error:', err);
      toast.error(err.message || 'Failed to update preference');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = () => {
    if (!auto360lock) {
      // Turning ON → show modal first
      setShowModal(true);
    } else {
      // Turning OFF → immediate
      callEdgeFunction(false);
    }
  };

  const handleModalEnable = async () => {
    await callEdgeFunction(true);
    setShowModal(false);
  };

  // Status message
  const renderStatusMessage = () => {
    if (!auto360lock) {
      return (
        <p className="text-xs text-muted-foreground mt-2">
          Turn on to auto-lock every bounty to Crescendo and earn bonus NCTR
        </p>
      );
    }

    if (verifiedLongTermHolder) {
      return (
        <p className="text-xs mt-2 font-medium" style={{ color: '#E2FF6D' }}>
          ✓ Verified Long-Term Holder — +0.25x bonus unlocks with crew mechanics
        </p>
      );
    }

    // Active but not yet verified
    const daysRemaining = enabledAt
      ? Math.max(0, 30 - Math.floor((Date.now() - new Date(enabledAt).getTime()) / 86400000))
      : 30;

    return (
      <p className="text-xs text-muted-foreground mt-2">
        Auto 360LOCK active. Verified Long-Term Holder status unlocks in {daysRemaining} days.
      </p>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-6 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            <CardTitle className="text-base">Commitment Preferences</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-bold uppercase tracking-wider">Auto 360LOCK</span>
            </div>
            <Switch
              checked={auto360lock}
              onCheckedChange={handleToggle}
              disabled={saving}
            />
          </div>
          {renderStatusMessage()}
        </CardContent>
      </Card>

      <Auto360LockExplainerModal
        isOpen={showModal}
        onEnable={handleModalEnable}
        onCancel={() => setShowModal(false)}
        enabling={saving}
      />
    </>
  );
}
