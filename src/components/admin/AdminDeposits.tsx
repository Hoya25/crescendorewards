import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { syncTierToBountyHunter } from '@/lib/sync-tier-to-bounty-hunter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ExternalLink, CheckCircle, CreditCard, ArrowDownCircle, RefreshCw, Wallet, Clock, AlertTriangle, Coins } from 'lucide-react';

interface Deposit {
  id: string;
  user_id: string;
  wallet_address: string;
  amount_nctr: number;
  tx_hash: string | null;
  status: string;
  lock_type: string | null;
  deposited_at: string | null;
  unlocks_at: string | null;
  withdrawal_requested_at: string | null;
  withdrawal_approved_at: string | null;
  withdrawal_tx_hash: string | null;
  created_at: string | null;
  profiles?: { email: string | null; full_name: string | null } | null;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-zinc-700 text-zinc-200' },
  confirmed: { label: 'Confirmed', className: 'bg-blue-900/60 text-blue-200' },
  credited: { label: 'Credited', className: 'bg-emerald-900/50 text-emerald-300' },
  unlock_eligible: { label: 'Unlock Eligible', className: 'bg-amber-900/40 text-amber-300' },
  withdrawn: { label: 'Withdrawn', className: 'bg-zinc-800 text-zinc-300' },
};

export function AdminDeposits() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalDeposited: 0, pendingCount: 0, withdrawalRequests: 0, totalCirculating: 0 });

  // Verify modal
  const [verifyDeposit, setVerifyDeposit] = useState<Deposit | null>(null);
  const [verifyAmount, setVerifyAmount] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Credit confirmation
  const [creditDeposit, setCreditDeposit] = useState<Deposit | null>(null);
  const [crediting, setCrediting] = useState(false);

  // Withdrawal modal
  const [withdrawDeposit, setWithdrawDeposit] = useState<Deposit | null>(null);
  const [withdrawTxHash, setWithdrawTxHash] = useState('');
  const [approving, setApproving] = useState(false);

  const fetchDeposits = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('nctr_deposits')
      .select('*, profiles!nctr_deposits_user_id_fkey(email, full_name)')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load deposits');
      console.error(error);
    } else {
      const typed = (data || []) as unknown as Deposit[];
      setDeposits(typed);

      const totalDeposited = typed.reduce((sum, d) => sum + (d.status !== 'pending' ? Number(d.amount_nctr) : 0), 0);
      const pendingCount = typed.filter(d => d.status === 'pending').length;
      const withdrawalRequests = typed.filter(d => d.withdrawal_requested_at && d.status === 'unlock_eligible').length;
      const totalCirculating = typed.reduce((sum, d) => ['confirmed', 'credited', 'unlock_eligible'].includes(d.status) ? sum + Number(d.amount_nctr) : sum, 0);

      setStats({ totalDeposited, pendingCount, withdrawalRequests, totalCirculating });
    }
    setLoading(false);
  };

  useEffect(() => { fetchDeposits(); }, []);

  const handleVerify = async () => {
    if (!verifyDeposit || !verifyAmount) return;
    const amount = parseFloat(verifyAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    setVerifying(true);
    const { error: depErr } = await supabase
      .from('nctr_deposits')
      .update({ status: 'confirmed', amount_nctr: amount } as any)
      .eq('id', verifyDeposit.id);

    if (depErr) {
      toast.error('Failed to verify deposit');
      console.error(depErr);
    } else {
      // Update profile total_locked_nctr
      const { error: profErr } = await supabase.rpc('get_public_stats'); // dummy to avoid type issues
      // Direct update via raw approach
      await supabase
        .from('profiles')
        .update({ total_locked_nctr: undefined } as any) // we need raw SQL
        .eq('id', verifyDeposit.user_id);

      // Use a more reliable approach - fetch current value and add
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_locked_nctr')
        .eq('id', verifyDeposit.user_id)
        .single();

      if (profile) {
        const currentLocked = Number(profile.total_locked_nctr) || 0;
        await supabase
          .from('profiles')
          .update({ total_locked_nctr: currentLocked + amount } as any)
          .eq('id', verifyDeposit.user_id);
      }

      toast.success(`Deposit verified: ${amount} NCTR confirmed`);
      setVerifyDeposit(null);
      setVerifyAmount('');
      fetchDeposits();
    }
    setVerifying(false);
  };

  const handleCredit = async () => {
    if (!creditDeposit) return;
    setCrediting(true);
    const { error } = await supabase
      .from('nctr_deposits')
      .update({ status: 'credited' } as any)
      .eq('id', creditDeposit.id);

    if (error) {
      toast.error('Failed to credit deposit');
    } else {
      // Trigger tier recalculation — find unified_profiles.id from auth_user_id
      const { data: unifiedProfile } = await supabase
        .from('unified_profiles')
        .select('id')
        .eq('auth_user_id', creditDeposit.user_id)
        .single();

      if (unifiedProfile) {
        await supabase.rpc('calculate_user_tier', { p_user_id: unifiedProfile.id });
      }

      toast.success('Deposit credited — tier recalculated');
      setCreditDeposit(null);
      fetchDeposits();
    }
    setCrediting(false);
  };

  const handleApproveWithdrawal = async () => {
    if (!withdrawDeposit) return;
    setApproving(true);

    const { error: depErr } = await supabase
      .from('nctr_deposits')
      .update({
        status: 'withdrawn',
        withdrawal_approved_at: new Date().toISOString(),
        withdrawal_tx_hash: withdrawTxHash || null,
      } as any)
      .eq('id', withdrawDeposit.id);

    if (depErr) {
      toast.error('Failed to approve withdrawal');
    } else {
      // Subtract from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_locked_nctr')
        .eq('id', withdrawDeposit.user_id)
        .single();

      if (profile) {
        const currentLocked = Number(profile.total_locked_nctr) || 0;
        const newLocked = Math.max(0, currentLocked - Number(withdrawDeposit.amount_nctr));
        await supabase
          .from('profiles')
          .update({ total_locked_nctr: newLocked } as any)
          .eq('id', withdrawDeposit.user_id);
      }

      // Recalculate tier after withdrawal
      const { data: unifiedProfile } = await supabase
        .from('unified_profiles')
        .select('id')
        .eq('auth_user_id', withdrawDeposit.user_id)
        .single();

      if (unifiedProfile) {
        await supabase.rpc('calculate_user_tier', { p_user_id: unifiedProfile.id });
      }

      toast.success('Withdrawal approved — tier recalculated');
      setWithdrawDeposit(null);
      setWithdrawTxHash('');
      fetchDeposits();
    }
    setApproving(false);
  };

  const isWithdrawalRequest = (d: Deposit) => d.withdrawal_requested_at && d.status === 'unlock_eligible';

  const statCards = [
    { label: 'Total NCTR Deposited', value: stats.totalDeposited.toLocaleString(), icon: Coins, color: 'text-emerald-400' },
    { label: 'Pending Deposits', value: stats.pendingCount, icon: Clock, color: 'text-zinc-400' },
    { label: 'Withdrawal Requests', value: stats.withdrawalRequests, icon: AlertTriangle, color: 'text-amber-400' },
    { label: 'NCTR In Circulation', value: stats.totalCirculating.toLocaleString(), icon: Wallet, color: 'text-blue-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Deposits</h2>
        <Button variant="outline" size="sm" onClick={fetchDeposits} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`w-8 h-8 ${s.color}`} />
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Deposits</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : deposits.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No deposits found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>User Email</TableHead>
                    <TableHead>Wallet Address</TableHead>
                    <TableHead>TX Hash</TableHead>
                    <TableHead className="text-right">Amount NCTR</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Unlocks On</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deposits.map((d) => {
                    const withdrawalReq = isWithdrawalRequest(d);
                    const sc = STATUS_CONFIG[d.status] || STATUS_CONFIG.pending;
                    return (
                      <TableRow
                        key={d.id}
                        className={withdrawalReq ? 'bg-amber-950/20 border-amber-800/30' : ''}
                      >
                        <TableCell className="whitespace-nowrap text-sm">
                          {d.created_at ? format(new Date(d.created_at), 'MMM d, yyyy') : '—'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {(d.profiles as any)?.email || '—'}
                        </TableCell>
                        <TableCell className="text-xs font-mono max-w-[120px] truncate" title={d.wallet_address}>
                          {d.wallet_address ? `${d.wallet_address.slice(0, 6)}...${d.wallet_address.slice(-4)}` : '—'}
                        </TableCell>
                        <TableCell className="text-xs font-mono">
                          {d.tx_hash ? (
                            <a
                              href={`https://basescan.org/tx/${d.tx_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                            >
                              {d.tx_hash.slice(0, 8)}...
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : '—'}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {Number(d.amount_nctr).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${sc.className}`}>
                            {sc.label}
                          </span>
                          {withdrawalReq && (
                            <span className="ml-1 inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-amber-600/30 text-amber-300">
                              Withdrawal Req
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {d.unlocks_at ? format(new Date(d.unlocks_at), 'MMM d, yyyy') : '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {d.status === 'pending' && (
                              <Button size="sm" variant="outline" onClick={() => { setVerifyDeposit(d); setVerifyAmount(''); }}>
                                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Verify
                              </Button>
                            )}
                            {d.status === 'confirmed' && (
                              <Button size="sm" variant="outline" onClick={() => setCreditDeposit(d)}>
                                <CreditCard className="w-3.5 h-3.5 mr-1" /> Credit
                              </Button>
                            )}
                            {withdrawalReq && (
                              <Button size="sm" variant="outline" className="border-amber-700 text-amber-300 hover:bg-amber-900/30" onClick={() => { setWithdrawDeposit(d); setWithdrawTxHash(''); }}>
                                <ArrowDownCircle className="w-3.5 h-3.5 mr-1" /> Approve
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verify Modal */}
      <Dialog open={!!verifyDeposit} onOpenChange={(open) => !open && setVerifyDeposit(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verify Deposit</DialogTitle>
            <DialogDescription>
              Confirm the NCTR amount from the on-chain transaction.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>User:</strong> {(verifyDeposit?.profiles as any)?.email || '—'}</p>
              {verifyDeposit?.tx_hash && (
                <p>
                  <strong>TX:</strong>{' '}
                  <a href={`https://basescan.org/tx/${verifyDeposit.tx_hash}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                    {verifyDeposit.tx_hash.slice(0, 16)}...
                  </a>
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="verify-amount">Confirmed NCTR Amount</Label>
              <Input
                id="verify-amount"
                type="number"
                min="0"
                step="0.0001"
                placeholder="e.g. 1000"
                value={verifyAmount}
                onChange={(e) => setVerifyAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setVerifyDeposit(null)}>Cancel</Button>
            <Button onClick={handleVerify} disabled={verifying || !verifyAmount}>
              {verifying ? 'Verifying...' : 'Confirm & Verify'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credit Confirmation */}
      <ConfirmationDialog
        isOpen={!!creditDeposit}
        onClose={() => setCreditDeposit(null)}
        onConfirm={handleCredit}
        title="Credit Account"
        description={`Credit ${Number(creditDeposit?.amount_nctr || 0).toLocaleString()} NCTR to the member's account? This will trigger a tier recalculation.`}
        confirmText="Credit Account"
        isLoading={crediting}
        icon={<CreditCard className="w-5 h-5 text-emerald-400" />}
      />

      {/* Withdrawal Approval Modal */}
      <Dialog open={!!withdrawDeposit} onOpenChange={(open) => !open && setWithdrawDeposit(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Withdrawal</DialogTitle>
            <DialogDescription>
              Approve the withdrawal of {Number(withdrawDeposit?.amount_nctr || 0).toLocaleString()} NCTR back to {withdrawDeposit?.wallet_address ? `${withdrawDeposit.wallet_address.slice(0, 6)}...${withdrawDeposit.wallet_address.slice(-4)}` : 'wallet'}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="withdraw-tx">Withdrawal TX Hash (optional)</Label>
              <Input
                id="withdraw-tx"
                placeholder="0x..."
                value={withdrawTxHash}
                onChange={(e) => setWithdrawTxHash(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setWithdrawDeposit(null)}>Cancel</Button>
            <Button onClick={handleApproveWithdrawal} disabled={approving} className="bg-amber-600 hover:bg-amber-700">
              {approving ? 'Approving...' : 'Approve Withdrawal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
