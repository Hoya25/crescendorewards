import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { TrendingUp, ArrowUpRight, Lock, Copy, Check, AlertTriangle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const NCTR_CONTRACT = '0x973104fAa7F2B11787557e85953ECA6B4e262328';
const TREASURY_ADDRESS = '0x921D9D535DE02618BaB75B309e46207C735c17BC';

const TIER_COLORS: Record<string, string> = {
  Diamond: '#E2FF6D',
  Platinum: '#E5E4E2',
  Gold: '#FFD700',
  Silver: '#C0C0C0',
  Bronze: '#CD7F32',
};

interface LevelUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetTierName: string;
  targetTierRequirement: number;
  currentLocked: number;
  availableNCTR: number;
  userEmail: string;
  onBalanceRefresh?: () => Promise<void>;
}

export function LevelUpModal({
  open,
  onOpenChange,
  targetTierName,
  targetTierRequirement,
  currentLocked,
  availableNCTR,
  userEmail,
  onBalanceRefresh,
}: LevelUpModalProps) {
  const [txHash, setTxHash] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copiedContract, setCopiedContract] = useState(false);
  const [copiedTreasury, setCopiedTreasury] = useState(false);
  const [resultMsg, setResultMsg] = useState<{ text: string; color: string } | null>(null);
  const [buttonText, setButtonText] = useState('Verify & Deposit →');

  const amountNeeded = Math.max(0, targetTierRequirement - currentLocked);
  const tierColor = TIER_COLORS[targetTierName] || '#E2FF6D';

  const copyToClipboard = (text: string, type: 'contract' | 'treasury') => {
    navigator.clipboard.writeText(text);
    if (type === 'contract') {
      setCopiedContract(true);
      setTimeout(() => setCopiedContract(false), 2000);
    } else {
      setCopiedTreasury(true);
      setTimeout(() => setCopiedTreasury(false), 2000);
    }
    toast.success('Copied to clipboard');
  };

  const handleDeposit = async () => {
    if (!txHash.trim()) {
      toast.error('Please paste your transaction hash');
      return;
    }
    setSubmitting(true);
    setResultMsg(null);
    try {
      const res = await supabase.functions.invoke('bh-status-proxy', {
        body: {
          action: 'verify_deposit',
          email: userEmail,
          tx_hash: txHash.trim(),
        },
      });
      if (res.error) throw new Error('Endpoint error');
      const data = res.data;
      if (data?.error) throw new Error(data.error);

      const status = data?.status || data?.result?.status;

      if (status === 'confirmed') {
        const amount = data?.amount || data?.result?.amount || '';
        setResultMsg({ text: `Deposit confirmed! +${amount ? Number(amount).toLocaleString() + ' ' : ''}NCTR credited to your account.`, color: '#E2FF6D' });
        setTxHash('');
        window.dispatchEvent(new Event('nctr-balance-refresh'));
        if (onBalanceRefresh) await onBalanceRefresh();
      } else if (status === 'pending') {
        setResultMsg({ text: 'Transaction is still confirming on Base. Try again in a few minutes.', color: '#FFD700' });
        setButtonText('TRY AGAIN');
        setTimeout(() => setButtonText('Verify & Deposit →'), 30000);
      } else if (status === 'failed') {
        setResultMsg({ text: 'Transaction failed on-chain. Double-check hash and network.', color: '#FF6B6B' });
      } else if (status === 'already_credited') {
        setResultMsg({ text: 'This transaction was already credited.', color: '#D9D9D9' });
      } else {
        setResultMsg({ text: `Deposit confirmed! NCTR credited to your account.`, color: '#E2FF6D' });
        if (onBalanceRefresh) await onBalanceRefresh();
      }
    } catch (err) {
      console.error('Deposit verification error:', err, { tx_hash: txHash, email: userEmail });
      setResultMsg({ text: 'Unable to verify right now. Try again in a moment.', color: '#FFD700' });
    } finally {
      setSubmitting(false);
    }
  };

  const [lockResult, setLockResult] = useState<{ text: string; color: string } | null>(null);
  const [locking, setLocking] = useState(false);

  const handleLockAvailable = async () => {
    setLocking(true);
    setLockResult(null);
    try {
      const res = await supabase.functions.invoke('bh-status-proxy', {
        body: {
          action: 'upgrade_to_360lock',
          email: userEmail,
          amount: availableNCTR,
        },
      });
      if (res.error) throw new Error('Lock failed');
      const data = res.data;
      if (data?.error) throw new Error(data.error);
      setLockResult({ text: `Locked! +${availableNCTR.toLocaleString()} NCTR committed to 360LOCK`, color: '#E2FF6D' });
      if (onBalanceRefresh) await onBalanceRefresh();
    } catch (err) {
      console.error('Lock error:', err);
      setLockResult({ text: 'Unable to lock right now. Try again in a moment.', color: '#FFD700' });
    } finally {
      setLocking(false);
    }
  };

  const mono = "'DM Mono', monospace";
  const sans = "'DM Sans', sans-serif";
  const heading = "'Barlow Condensed', sans-serif";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 border-0 bg-transparent max-w-lg sm:max-w-lg"
        style={{ borderRadius: 0 }}
      >
        <div
          style={{
            background: '#131313',
            border: '1px solid #323232',
            borderRadius: 0,
            padding: '32px',
            maxHeight: '85vh',
            overflowY: 'auto',
          }}
        >
          {/* Header */}
          <h2
            style={{
              fontFamily: heading,
              fontSize: '24px',
              textTransform: 'uppercase',
              color: tierColor,
              marginBottom: '8px',
              letterSpacing: '0.05em',
            }}
          >
            REACH {targetTierName.toUpperCase()}
          </h2>
          <p style={{ fontFamily: sans, fontSize: '14px', color: '#D9D9D9', marginBottom: '24px' }}>
            You have {currentLocked.toLocaleString()} NCTR locked. You need{' '}
            {amountNeeded.toLocaleString()} more to reach {targetTierName}.
          </p>

          {/* PATH 0: Lock Available */}
          {availableNCTR > 0 && !lockResult && (
            <>
              <div style={{ borderBottom: '1px solid #323232', paddingBottom: '20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Lock size={20} color="#E2FF6D" />
                  <span style={{ fontFamily: heading, fontSize: '16px', textTransform: 'uppercase', color: '#FFFFFF' }}>
                    LOCK YOUR AVAILABLE NCTR
                  </span>
                </div>
                <p style={{ fontFamily: sans, fontSize: '13px', color: '#D9D9D9', marginBottom: '12px' }}>
                  You have {availableNCTR.toLocaleString()} NCTR available. Lock it now to build status.
                </p>
                <button
                  onClick={handleLockAvailable}
                  disabled={locking}
                  style={{
                    fontFamily: mono,
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    color: '#E2FF6D',
                    background: 'transparent',
                    border: '1px solid #E2FF6D',
                    borderRadius: 0,
                    padding: '10px 20px',
                    cursor: locking ? 'wait' : 'pointer',
                    opacity: locking ? 0.7 : 1,
                    transition: 'all 200ms',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#E2FF6D';
                    e.currentTarget.style.color = '#131313';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#E2FF6D';
                  }}
                >
                  {locking ? 'Locking...' : `Lock ${availableNCTR.toLocaleString()} NCTR →`}
                </button>
              </div>
            </>
          )}
          {lockResult && (
            <div style={{ borderBottom: '1px solid #323232', paddingBottom: '20px', marginBottom: '20px' }}>
              <p style={{ fontFamily: sans, fontSize: '13px', color: lockResult.color, animation: 'fadeIn 300ms ease-in' }}>
                {lockResult.text}
              </p>
            </div>
          )}

          {/* PATH 1: Earn It */}
          <div style={{ borderBottom: '1px solid #323232', paddingBottom: '20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <TrendingUp size={20} color="#E2FF6D" />
              <span style={{ fontFamily: heading, fontSize: '16px', textTransform: 'uppercase', color: '#FFFFFF' }}>
                EARN IT
              </span>
            </div>
            <p style={{ fontFamily: sans, fontSize: '13px', color: '#D9D9D9', marginBottom: '12px' }}>
              Shop and earn on Bounty Hunter. Every purchase earns NCTR that automatically builds your status.
            </p>
            <a
              href="https://bountyhunter.nctr.live"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: mono,
                fontSize: '12px',
                textTransform: 'uppercase',
                color: '#E2FF6D',
                background: 'transparent',
                border: '1px solid #E2FF6D',
                borderRadius: 0,
                padding: '10px 20px',
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'all 200ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#E2FF6D';
                e.currentTarget.style.color = '#131313';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#E2FF6D';
              }}
            >
              OPEN BOUNTY HUNTER <ExternalLink size={14} />
            </a>
          </div>

          {/* PATH 2: Send NCTR */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <ArrowUpRight size={20} color="#E2FF6D" />
              <span style={{ fontFamily: heading, fontSize: '16px', textTransform: 'uppercase', color: '#FFFFFF' }}>
                SEND NCTR
              </span>
            </div>
            <p style={{ fontFamily: sans, fontSize: '13px', color: '#D9D9D9', marginBottom: '16px' }}>
              Already have NCTR? Send it to your account to level up instantly.
            </p>

            {/* Contract Address */}
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontFamily: sans, fontSize: '12px', color: '#999', marginBottom: '6px', textTransform: 'uppercase' }}>
                CONTRACT ADDRESS (BASE)
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <code style={{ fontFamily: mono, fontSize: '12px', color: '#FFFFFF', wordBreak: 'break-all' }}>
                  {NCTR_CONTRACT}
                </code>
                <button
                  onClick={() => copyToClipboard(NCTR_CONTRACT, 'contract')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D9D9D9', flexShrink: 0 }}
                >
                  {copiedContract ? <Check size={14} color="#E2FF6D" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            {/* Where to Buy */}
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontFamily: sans, fontSize: '12px', color: '#999', marginBottom: '6px', textTransform: 'uppercase' }}>
                WHERE TO BUY
              </p>
              <ul style={{ fontFamily: sans, fontSize: '13px', color: '#D9D9D9', listStyle: 'disc', paddingLeft: '20px', margin: 0, lineHeight: '1.8' }}>
                <li><strong>Coinbase</strong> — Search NCTR or paste the contract address</li>
                <li>
                  <strong>Aerodrome</strong> — Swap any Base token for NCTR at{' '}
                  <a href="https://aerodrome.finance" target="_blank" rel="noopener noreferrer" style={{ color: '#E2FF6D', textDecoration: 'underline' }}>
                    aerodrome.finance
                  </a>
                </li>
                <li><strong>Uniswap</strong> — Use Base network and paste the contract address</li>
              </ul>
            </div>

            {/* Warning Box */}
            <div
              style={{
                border: '1px solid #FFD700',
                background: 'rgba(255,215,0,0.05)',
                padding: '12px',
                borderRadius: 0,
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
              }}
            >
              <AlertTriangle size={16} color="#FFD700" style={{ flexShrink: 0, marginTop: '2px' }} />
              <p style={{ fontFamily: sans, fontSize: '12px', color: '#FFD700', margin: 0 }}>
                VERIFY THE CONTRACT ADDRESS — Only buy NCTR matching the address above. Do not trust search results alone.
              </p>
            </div>

            {/* Send To Address */}
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontFamily: sans, fontSize: '12px', color: '#999', marginBottom: '6px', textTransform: 'uppercase' }}>
                SEND TO THIS ADDRESS
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <code style={{ fontFamily: mono, fontSize: '12px', color: '#FFFFFF', wordBreak: 'break-all' }}>
                  {TREASURY_ADDRESS}
                </code>
                <button
                  onClick={() => copyToClipboard(TREASURY_ADDRESS, 'treasury')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D9D9D9', flexShrink: 0 }}
                >
                  {copiedTreasury ? <Check size={14} color="#E2FF6D" /> : <Copy size={14} />}
                </button>
              </div>
              <div style={{ marginTop: '6px' }}>
                <span style={{ fontFamily: mono, fontSize: '12px', color: '#D9D9D9' }}>NETWORK: Base </span>
                <span style={{ fontFamily: mono, fontSize: '12px', color: '#FF4444' }}>
                  (do NOT send on Ethereum or any other network)
                </span>
              </div>
            </div>

            {/* TX Hash Input */}
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontFamily: sans, fontSize: '12px', color: '#999', marginBottom: '6px', textTransform: 'uppercase' }}>
                TRANSACTION HASH
              </p>
              <input
                type="text"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                placeholder="0x... paste your tx hash here"
                style={{
                  width: '100%',
                  background: '#0D0D0D',
                  border: '1px solid #323232',
                  color: '#FFFFFF',
                  fontFamily: mono,
                  fontSize: '14px',
                  padding: '12px',
                  borderRadius: 0,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#E2FF6D')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#323232')}
              />
            </div>

            {/* Result Message */}
            {resultMsg && (
              <p style={{
                fontFamily: sans,
                fontSize: '13px',
                color: resultMsg.color,
                marginBottom: '12px',
                animation: 'fadeIn 300ms ease-in',
              }}>
                {resultMsg.text}
              </p>
            )}

            {/* Submit Button */}
            <button
              onClick={handleDeposit}
              disabled={submitting}
              style={{
                width: '100%',
                background: '#E2FF6D',
                color: '#131313',
                fontFamily: mono,
                fontSize: '13px',
                textTransform: 'uppercase',
                padding: '14px',
                border: 'none',
                borderRadius: 0,
                cursor: submitting ? 'wait' : 'pointer',
                opacity: submitting ? 0.7 : 1,
                fontWeight: 600,
              }}
            >
              {submitting ? 'Verifying...' : buttonText}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
