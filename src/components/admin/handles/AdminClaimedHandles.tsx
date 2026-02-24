import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Loader2, XCircle, ArrowRightLeft, ShieldBan } from 'lucide-react';
import { toast } from 'sonner';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';

interface ClaimedUser {
  id: string;
  handle: string;
  display_name: string | null;
  email: string | null;
  current_tier_id: string | null;
}

interface Props {
  onAction: () => void;
}

export function AdminClaimedHandles({ onAction }: Props) {
  const { profile } = useUnifiedUser();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [revokeTarget, setRevokeTarget] = useState<ClaimedUser | null>(null);
  const [reserveAfterRevoke, setReserveAfterRevoke] = useState(false);
  const [transferTarget, setTransferTarget] = useState<ClaimedUser | null>(null);
  const [transferTo, setTransferTo] = useState('');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-claimed-handles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('unified_profiles')
        .select('id, handle, display_name, email, current_tier_id')
        .not('handle', 'is', null)
        .order('handle');
      if (error) throw error;
      return data as ClaimedUser[];
    },
  });

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.handle?.includes(q) || u.display_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  const logAudit = async (action: string, targetHandle: string, targetUserId?: string, notes?: string) => {
    if (!profile?.id) return;
    await supabase.from('handle_audit_log').insert({
      admin_user_id: profile.id,
      action,
      target_handle: targetHandle,
      target_user_id: targetUserId || null,
      notes,
    });
  };

  const revokeMutation = useMutation({
    mutationFn: async () => {
      if (!revokeTarget) return;
      const handle = revokeTarget.handle;

      // Revoke
      const { error } = await supabase.from('unified_profiles').update({ handle: null }).eq('id', revokeTarget.id);
      if (error) throw error;

      // Optionally reserve
      if (reserveAfterRevoke) {
        await supabase.from('reserved_handles').insert({ handle, category: 'system', reason: 'Revoked by admin' });
        await logAudit('reserve', handle, revokeTarget.id, 'Reserved after revoke');
      }

      await logAudit('revoke', handle, revokeTarget.id);
    },
    onSuccess: () => {
      toast.success(`@${revokeTarget?.handle} revoked`);
      queryClient.invalidateQueries({ queryKey: ['admin-claimed-handles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reserved-handles'] });
      setRevokeTarget(null);
      setReserveAfterRevoke(false);
      onAction();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const transferMutation = useMutation({
    mutationFn: async () => {
      if (!transferTarget || !transferTo) return;
      const handle = transferTarget.handle;

      // Find recipient by email or ID
      const { data: recipient } = await supabase
        .from('unified_profiles')
        .select('id, handle')
        .or(`email.eq.${transferTo},id.eq.${transferTo}`)
        .maybeSingle();

      if (!recipient) throw new Error('Recipient not found');
      if (recipient.handle) throw new Error(`Recipient already has @${recipient.handle}`);

      // Remove from current owner
      const { error: e1 } = await supabase.from('unified_profiles').update({ handle: null }).eq('id', transferTarget.id);
      if (e1) throw e1;

      // Assign to new owner
      const { error: e2 } = await supabase.from('unified_profiles').update({ handle }).eq('id', recipient.id);
      if (e2) throw e2;

      await logAudit('transfer', handle, recipient.id, `From ${transferTarget.id} to ${recipient.id}`);
    },
    onSuccess: () => {
      toast.success(`@${transferTarget?.handle} transferred`);
      queryClient.invalidateQueries({ queryKey: ['admin-claimed-handles'] });
      setTransferTarget(null);
      setTransferTo('');
      onAction();
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by handle, name, or email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="px-4 py-3 font-medium">@Handle</th>
                    <th className="px-4 py-3 font-medium">Display Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium w-48">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => (
                    <tr key={u.id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-2.5 font-mono text-xs font-medium" style={{ color: '#E2FF6D' }}>@{u.handle}</td>
                      <td className="px-4 py-2.5 text-xs">{u.display_name || '—'}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{u.email || '—'}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => { setRevokeTarget(u); setReserveAfterRevoke(false); }}>
                            <XCircle className="h-3.5 w-3.5 mr-1" /> Revoke
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setTransferTarget(u)}>
                            <ArrowRightLeft className="h-3.5 w-3.5 mr-1" /> Transfer
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-orange-400" onClick={() => { setRevokeTarget(u); setReserveAfterRevoke(true); }}>
                            <ShieldBan className="h-3.5 w-3.5 mr-1" /> Revoke & Reserve
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No claimed handles found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revoke Confirmation */}
      <Dialog open={!!revokeTarget} onOpenChange={() => setRevokeTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{reserveAfterRevoke ? 'Revoke & Reserve' : 'Revoke'} @{revokeTarget?.handle}?</DialogTitle>
            <DialogDescription>
              {reserveAfterRevoke
                ? `This will remove @${revokeTarget?.handle} from ${revokeTarget?.display_name || 'this user'} and reserve it so nobody else can claim it.`
                : `This will remove @${revokeTarget?.handle} from ${revokeTarget?.display_name || 'this user'}. This cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => revokeMutation.mutate()} disabled={revokeMutation.isPending}>
              {revokeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              {reserveAfterRevoke ? 'Revoke & Reserve' : 'Revoke Handle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={!!transferTarget} onOpenChange={() => { setTransferTarget(null); setTransferTo(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer @{transferTarget?.handle}</DialogTitle>
            <DialogDescription>Enter the email or user ID of the new owner.</DialogDescription>
          </DialogHeader>
          <div>
            <Label>Recipient email or user ID</Label>
            <Input value={transferTo} onChange={e => setTransferTo(e.target.value)} placeholder="user@example.com" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setTransferTarget(null); setTransferTo(''); }}>Cancel</Button>
            <Button onClick={() => transferMutation.mutate()} disabled={!transferTo || transferMutation.isPending}
                    style={{ backgroundColor: '#E2FF6D', color: '#323232' }}>
              {transferMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
