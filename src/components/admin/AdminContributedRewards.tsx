import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { Gift, Check, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export function AdminContributedRewards() {
  const queryClient = useQueryClient();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data: pendingRewards = [], isLoading } = useQuery({
    queryKey: ['admin-contributed-rewards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rewards')
        .select('*, contributed_by')
        .eq('is_contributed', true)
        .order('created_at', { ascending: true });
      if (error) throw error;

      // Fetch contributor names
      const contributorIds = [...new Set((data ?? []).map((r: any) => r.contributed_by).filter(Boolean))];
      let contributorMap: Record<string, string> = {};
      if (contributorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('unified_profiles')
          .select('id, display_name, email')
          .in('id', contributorIds);
        (profiles ?? []).forEach((p: any) => {
          contributorMap[p.id] = p.display_name || p.email || 'Unknown';
        });
      }

      return (data ?? []).map((r: any) => ({
        ...r,
        contributor_name: contributorMap[r.contributed_by] || 'Unknown',
      }));
    },
  });

  const handleApprove = async (id: string) => {
    const { error } = await supabase
      .from('rewards')
      .update({ contribution_status: 'approved', is_active: true })
      .eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Approved', description: 'Reward is now live in the marketplace.' });
      queryClient.invalidateQueries({ queryKey: ['admin-contributed-rewards'] });
    }
  };

  const handleReject = async () => {
    if (!rejectId || !rejectReason) return;
    const { error } = await supabase
      .from('rewards')
      .update({ contribution_status: 'rejected', rejection_reason: rejectReason, is_active: false })
      .eq('id', rejectId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Rejected', description: 'Contributor will be notified.' });
      queryClient.invalidateQueries({ queryKey: ['admin-contributed-rewards'] });
    }
    setRejectId(null);
    setRejectReason('');
  };

  const pending = pendingRewards.filter((r: any) => r.contribution_status === 'pending');
  const all = pendingRewards;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Contributed Rewards</h2>
        <p className="text-muted-foreground text-sm">
          {pending.length} pending review · {all.length} total
        </p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : all.length === 0 ? (
        <p className="text-muted-foreground">No contributed rewards yet.</p>
      ) : (
        <div className="space-y-3">
          {all.map((r: any) => (
            <div key={r.id} className="border rounded-xl p-4 flex gap-4 items-start">
              <div className="shrink-0">
                {r.image_url ? (
                  <ImageWithFallback src={r.image_url} alt={r.title} className="h-20 w-20 rounded-lg object-cover" />
                ) : (
                  <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center">
                    <Gift className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">{r.title}</span>
                  <Badge variant={r.contribution_status === 'pending' ? 'secondary' : r.contribution_status === 'approved' ? 'default' : 'destructive'}>
                    {r.contribution_status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{r.description}</p>
                <div className="text-xs text-muted-foreground space-x-3">
                  <span>By: {r.contributor_name}</span>
                  <span>Category: {r.contribution_category}</span>
                  <span>Delivery: {r.delivery_method}</span>
                  <span>Cost: {r.cost} Claims</span>
                  <span>NCTR/claim: {r.contributor_nctr_per_claim}</span>
                </div>
                {r.contribution_status === 'rejected' && r.rejection_reason && (
                  <p className="text-xs text-red-400">Reason: {r.rejection_reason}</p>
                )}
                {r.contribution_status === 'pending' && (
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-7 text-xs" onClick={() => handleApprove(r.id)}>
                      <Check className="h-3 w-3 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => setRejectId(r.id)}>
                      <X className="h-3 w-3 mr-1" /> Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={!!rejectId} onOpenChange={() => { setRejectId(null); setRejectReason(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Contribution</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Provide a reason for rejection..."
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectReason}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
