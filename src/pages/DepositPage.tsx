import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Copy, Check, Lock, ArrowRight, Wallet, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const OPS_WALLET = '0x921D9D535DE02618BaB75B309e46207C735c17BC';

type DepositRow = {
  id: string;
  wallet_address: string;
  amount_nctr: number;
  tx_hash: string | null;
  status: string | null;
  deposited_at: string | null;
  unlocks_at: string | null;
  withdrawal_requested_at: string | null;
};

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-zinc-700', text: 'text-zinc-300', label: 'Pending' },
  confirmed: { bg: 'bg-blue-900/60', text: 'text-blue-300', label: 'Confirmed' },
  credited: { bg: 'bg-[#E2FF6D]/20', text: 'text-[#E2FF6D]', label: 'Credited' },
  unlock_eligible: { bg: 'bg-amber-900/40', text: 'text-amber-300', label: 'Unlock Eligible' },
  withdrawn: { bg: 'bg-zinc-800', text: 'text-zinc-100', label: 'Withdrawn' },
};

export default function DepositPage() {
  const { user } = useAuthContext();
  const [walletAddress, setWalletAddress] = useState('');
  const [registeredWallet, setRegisteredWallet] = useState<string | null>(null);
  const [txHash, setTxHash] = useState('');
  const [deposits, setDeposits] = useState<DepositRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showChangeWallet, setShowChangeWallet] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadProfile();
      loadDeposits();
    }
  }, [user?.id]);

  async function loadProfile() {
    const { data } = await supabase
      .from('profiles')
      .select('registered_wallet_address')
      .eq('id', user!.id)
      .single();
    if (data?.registered_wallet_address) {
      setRegisteredWallet(data.registered_wallet_address);
    }
    setLoading(false);
  }

  async function loadDeposits() {
    const { data } = await supabase
      .from('nctr_deposits')
      .select('id, wallet_address, amount_nctr, tx_hash, status, deposited_at, unlocks_at, withdrawal_requested_at')
      .eq('user_id', user!.id)
      .order('deposited_at', { ascending: false });
    if (data) setDeposits(data as DepositRow[]);
  }

  function isValidWallet(addr: string) {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
  }

  async function saveWallet() {
    if (!isValidWallet(walletAddress)) {
      toast.error('Enter a valid 0x wallet address (42 characters)');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        registered_wallet_address: walletAddress,
        wallet_verified_at: new Date().toISOString(),
      })
      .eq('id', user!.id);
    setSaving(false);
    if (error) {
      toast.error('Failed to save wallet address');
    } else {
      setRegisteredWallet(walletAddress);
      setShowChangeWallet(false);
      toast.success('Wallet address saved!');
    }
  }

  async function submitDeposit() {
    if (!txHash.startsWith('0x') || txHash.length < 10) {
      toast.error('Enter a valid transaction hash');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('nctr_deposits').insert({
      user_id: user!.id,
      wallet_address: registeredWallet!,
      tx_hash: txHash,
      status: 'pending',
      amount_nctr: 0,
      lock_type: '360LOCK',
    });
    setSubmitting(false);
    if (error) {
      if (error.code === '23505') {
        toast.error('This transaction hash has already been submitted');
      } else {
        toast.error('Failed to submit deposit');
      }
    } else {
      toast.success("Deposit submitted! We'll verify your transaction and credit your account within 24 hours.");
      setTxHash('');
      loadDeposits();
    }
  }

  async function requestWithdrawal(depositId: string) {
    const { error } = await supabase
      .from('nctr_deposits')
      .update({ withdrawal_requested_at: new Date().toISOString() })
      .eq('id', depositId)
      .eq('user_id', user!.id);
    if (error) {
      toast.error('Failed to submit withdrawal request');
    } else {
      toast.success('Withdrawal request submitted. Processing takes 1-3 business days.');
      loadDeposits();
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#E2FF6D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const showWalletStep = !registeredWallet || showChangeWallet;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Deposit NCTR</h1>
          <p className="text-muted-foreground mt-1">Lock tokens for 360 days to level up your membership status.</p>
        </div>

        {/* STEP 1: Register Wallet */}
        {showWalletStep && (
          <section className="rounded-xl border border-border bg-card p-6 space-y-4 nctr-animate-fade-in-up">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-[#E2FF6D]" />
              <h2 className="text-lg font-semibold">Connect Your Wallet</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Enter the Base wallet address you'll send NCTR from. This becomes your permanent withdrawal address.
            </p>
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value.trim())}
              placeholder="Your Base Wallet Address (0x...)"
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#E2FF6D]/50"
            />
            {walletAddress && !isValidWallet(walletAddress) && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Must start with 0x and be 42 characters
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={saveWallet}
                disabled={saving || !isValidWallet(walletAddress)}
                className="flex items-center gap-2 rounded-lg bg-[#E2FF6D] px-5 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-[#E2FF6D]/90 disabled:opacity-40 transition-colors"
              >
                {saving ? 'Saving...' : 'Save Wallet Address'}
                <ArrowRight className="w-4 h-4" />
              </button>
              {showChangeWallet && (
                <button
                  onClick={() => setShowChangeWallet(false)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </section>
        )}

        {/* STEP 2: Send NCTR */}
        {registeredWallet && !showChangeWallet && (
          <section className="rounded-xl border border-border bg-card p-6 space-y-5 nctr-animate-fade-in-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#E2FF6D]" />
                <h2 className="text-lg font-semibold">Send NCTR</h2>
              </div>
              <button
                onClick={() => {
                  setWalletAddress(registeredWallet);
                  setShowChangeWallet(true);
                }}
                className="text-xs text-muted-foreground hover:text-[#E2FF6D] underline transition-colors"
              >
                change wallet
              </button>
            </div>

            <div className="text-xs text-muted-foreground">
              Your registered wallet: <span className="font-mono text-foreground">{registeredWallet}</span>
            </div>

            {/* Ops wallet card */}
            <div className="rounded-lg border border-[#E2FF6D]/20 bg-[#E2FF6D]/5 p-4 space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#E2FF6D]">
                Send NCTR to this address
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm font-mono text-foreground break-all">{OPS_WALLET}</code>
                <button
                  onClick={() => copyToClipboard(OPS_WALLET)}
                  className="shrink-0 p-2 rounded-md hover:bg-[#E2FF6D]/10 transition-colors"
                  title="Copy address"
                >
                  {copied ? <Check className="w-4 h-4 text-[#E2FF6D]" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E2FF6D]/15 px-3 py-1 text-xs font-semibold text-[#E2FF6D]">
                  <Lock className="w-3 h-3" /> 360LOCK — 360 day commitment
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Send NCTR from your registered wallet only. Deposits from unregistered wallets cannot be credited.
              </p>
              <a
                href={`https://basescan.org/address/${OPS_WALLET}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#E2FF6D] hover:underline"
              >
                View ops wallet on BaseScan ↗
              </a>
            </div>

            {/* TX Hash submission */}
            <div className="space-y-3 pt-2">
              <p className="text-sm text-muted-foreground">
                After sending, paste your transaction hash below to notify us.
              </p>
              <input
                type="text"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value.trim())}
                placeholder="Transaction Hash (0x...)"
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#E2FF6D]/50"
              />
              <button
                onClick={submitDeposit}
                disabled={submitting || !txHash.startsWith('0x') || txHash.length < 10}
                className="flex items-center gap-2 rounded-lg bg-[#E2FF6D] px-5 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-[#E2FF6D]/90 disabled:opacity-40 transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit Deposit'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </section>
        )}

        {/* STEP 3: Deposit History */}
        <section className="rounded-xl border border-border bg-card p-6 space-y-4 nctr-animate-fade-in-up">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#E2FF6D]" />
            <h2 className="text-lg font-semibold">Deposit History</h2>
          </div>

          {deposits.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No deposits yet.</p>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase tracking-wider">
                    <th className="py-2 px-2">Date</th>
                    <th className="py-2 px-2">Amount</th>
                    <th className="py-2 px-2">Status</th>
                    <th className="py-2 px-2">Unlocks On</th>
                    <th className="py-2 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deposits.map((d) => {
                    const st = STATUS_STYLES[d.status || 'pending'] || STATUS_STYLES.pending;
                    return (
                      <tr key={d.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-2 whitespace-nowrap">
                          {d.deposited_at ? format(new Date(d.deposited_at), 'MMM d, yyyy') : '—'}
                        </td>
                        <td className="py-3 px-2 font-mono">
                          {d.amount_nctr > 0 ? d.amount_nctr.toLocaleString() : '—'}
                        </td>
                        <td className="py-3 px-2">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${st.bg} ${st.text}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="py-3 px-2 whitespace-nowrap text-muted-foreground">
                          {d.unlocks_at ? format(new Date(d.unlocks_at), 'MMM d, yyyy') : '—'}
                        </td>
                        <td className="py-3 px-2">
                          {d.status === 'unlock_eligible' && !d.withdrawal_requested_at && (
                            <button
                              onClick={() => requestWithdrawal(d.id)}
                              className="text-xs font-semibold text-[#E2FF6D] hover:underline"
                            >
                              Request Withdrawal
                            </button>
                          )}
                          {d.withdrawal_requested_at && d.status !== 'withdrawn' && (
                            <span className="text-xs text-muted-foreground">Requested</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
