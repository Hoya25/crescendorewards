import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Star, Check, X, ShoppingBag, Users, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import {
  useFounding111Candidates,
  useFounding111,
  useApproveFounding111,
  useRejectFounding111,
  type Founding111Candidate,
} from '@/hooks/useFounding111';
import { supabase } from '@/lib/supabase';
import { SUPABASE_URL } from '@/lib/supabase';
import { format } from 'date-fns';

export function AdminFounding111() {
  const { data: candidates = [], isLoading } = useFounding111Candidates();
  const { data: approvedCount = 0 } = useFounding111();
  const approveMutation = useApproveFounding111();
  const rejectMutation = useRejectFounding111();

  const qualified = candidates.filter(
    (c) => c.founding_111_qualified && !c.founding_111_approved && c.founding_111_candidate
  );
  const approved = candidates.filter((c) => c.founding_111_approved);
  const rejected = candidates.filter(
    (c) => !c.founding_111_candidate && !c.founding_111_approved && !c.founding_111_qualified
  );

  const handleApprove = async (candidate: Founding111Candidate) => {
    try {
      const result = await approveMutation.mutateAsync(candidate.id);
      if (result.success) {
        toast.success(`Approved as Founding 111 #${result.founding_number}`);
        // Send approval email via edge function
        try {
          await supabase.functions.invoke('founding-111-email', {
            body: {
              type: 'approved',
              user_id: candidate.id,
              email: candidate.email,
              display_name: candidate.display_name,
              founding_number: result.founding_number,
            },
          });
        } catch (emailErr) {
          console.error('Email send failed:', emailErr);
        }
      } else {
        toast.error(result.error || 'Failed to approve');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error approving member');
    }
  };

  const handleReject = async (candidate: Founding111Candidate) => {
    try {
      const result = await rejectMutation.mutateAsync(candidate.id);
      if (result.success) {
        toast.success('Candidate rejected');
      } else {
        toast.error(result.error || 'Failed to reject');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error rejecting');
    }
  };

  if (isLoading) {
    return <div className="text-muted-foreground p-8 text-center">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: '#E2FF6D20' }}
          >
            <Star className="h-5 w-5" style={{ color: '#E2FF6D' }} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Founding 111 — Member Approval</h2>
            <p className="text-sm text-muted-foreground">Review and approve qualified candidates</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black" style={{ color: '#E2FF6D' }}>
            {approvedCount}/111
          </p>
          <p className="text-xs text-muted-foreground">Approved</p>
        </div>
      </div>

      <Progress
        value={(approvedCount / 111) * 100}
        className="h-2"
        style={{ ['--progress-color' as string]: '#E2FF6D' }}
      />

      {/* Tabs */}
      <Tabs defaultValue="pending">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            Qualified ({qualified.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({approved.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({rejected.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-4">
          {qualified.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground">No pending candidates</CardContent></Card>
          ) : (
            qualified.map((c) => (
              <CandidateCard
                key={c.id}
                candidate={c}
                nextNumber={approvedCount + 1}
                onApprove={() => handleApprove(c)}
                onReject={() => handleReject(c)}
                isApproving={approveMutation.isPending}
                isRejecting={rejectMutation.isPending}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4 mt-4">
          {approved.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground">No approved members yet</CardContent></Card>
          ) : (
            approved
              .sort((a, b) => (a.founding_111_number || 999) - (b.founding_111_number || 999))
              .map((c) => (
                <Card key={c.id} className="border-border">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge
                        className="text-xs font-black border-0 px-2.5 py-1"
                        style={{ backgroundColor: '#E2FF6D', color: '#323232' }}
                      >
                        #{c.founding_111_number}
                      </Badge>
                      <div>
                        <p className="font-semibold text-foreground">{c.display_name || 'Anonymous'}</p>
                        <p className="text-xs text-muted-foreground">{c.email}</p>
                      </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      {c.founding_111_approved_at && (
                        <p>Approved {format(new Date(c.founding_111_approved_at), 'MMM d, yyyy')}</p>
                      )}
                      <p>{c.purchase_count} purchases · {c.referral_purchases} referral purchases</p>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4 mt-4">
          {rejected.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground">No rejected candidates</CardContent></Card>
          ) : (
            rejected.map((c) => (
              <Card key={c.id} className="border-border opacity-60">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{c.display_name || 'Anonymous'}</p>
                    <p className="text-xs text-muted-foreground">{c.email}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // Re-approve: would need to re-qualify them
                      toast.info('Re-approval not yet implemented. Set candidate + qualified manually.');
                    }}
                  >
                    Re-evaluate
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CandidateCard({
  candidate,
  nextNumber,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: {
  candidate: Founding111Candidate;
  nextNumber: number;
  onApprove: () => void;
  onReject: () => void;
  isApproving: boolean;
  isRejecting: boolean;
}) {
  const accountAgeDays = Math.floor(
    (Date.now() - new Date(candidate.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Card className="border-border hover:border-[#E2FF6D]/30 transition-colors">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-foreground text-lg">{candidate.display_name || 'Anonymous'}</h3>
            <p className="text-sm text-muted-foreground">{candidate.email}</p>
          </div>
          {candidate.founding_111_qualified_at && (
            <Badge variant="secondary" className="text-xs">
              Qualified {format(new Date(candidate.founding_111_qualified_at), 'MMM d')}
            </Badge>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatBox icon={ShoppingBag} label="Purchases" value={candidate.purchase_count.toString()} />
          <StatBox icon={ShoppingBag} label="Total Spend" value={`$${(candidate.total_spend / 100).toFixed(0)}`} />
          <StatBox icon={Users} label="Referrals" value={candidate.referral_count.toString()} />
          <StatBox icon={Users} label="Ref Purchases" value={candidate.referral_purchases.toString()} />
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Joined {format(new Date(candidate.created_at), 'MMM d, yyyy')}
          </span>
          <span>{accountAgeDays} days old</span>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <Button
            onClick={onApprove}
            disabled={isApproving}
            className="flex-1 font-bold"
            style={{ backgroundColor: '#E2FF6D', color: '#323232' }}
          >
            <Check className="h-4 w-4 mr-1.5" />
            Approve as Founding #{nextNumber}
          </Button>
          <Button
            variant="secondary"
            onClick={onReject}
            disabled={isRejecting}
            className="font-medium"
          >
            <X className="h-4 w-4 mr-1.5" />
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StatBox({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-2.5 text-center">
      <Icon className="h-3.5 w-3.5 text-muted-foreground mx-auto mb-1" />
      <p className="text-sm font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
