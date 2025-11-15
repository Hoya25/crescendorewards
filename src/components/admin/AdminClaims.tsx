import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Eye } from 'lucide-react';

interface Claim {
  claim_id: string;
  user_email: string;
  user_name: string;
  reward_title: string;
  reward_cost: number;
  status: string;
  claimed_at: string;
  shipping_info: any;
}

export function AdminClaims() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    loadClaims();
  }, []);

  const loadClaims = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_all_claims') as { data: any; error: any };

      if (error) throw error;
      setClaims(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load claims',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (claim: Claim) => {
    setSelectedClaim(claim);
    setNewStatus(claim.status);
    setShowDetailModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedClaim) return;

    try {
      const { data, error } = await supabase.rpc('update_claim_status', {
        p_claim_id: selectedClaim.claim_id,
        p_status: newStatus,
      }) as { data: any; error: any };

      if (error) throw error;

      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error || 'Failed to update status');
      }

      toast({
        title: 'Success',
        description: 'Claim status updated successfully',
      });

      setShowDetailModal(false);
      loadClaims();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update claim status',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      approved: 'default',
      shipped: 'outline',
      completed: 'default',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Claims Management</h2>
        <p className="text-muted-foreground mt-1">Manage and approve reward claims</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Reward</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Claimed Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : claims.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No claims found
                  </TableCell>
                </TableRow>
              ) : (
                claims.map((claim) => (
                  <TableRow key={claim.claim_id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{claim.user_name || 'Unknown'}</div>
                        <div className="text-sm text-muted-foreground">{claim.user_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{claim.reward_title}</TableCell>
                    <TableCell>{claim.reward_cost} tokens</TableCell>
                    <TableCell>{getStatusBadge(claim.status)}</TableCell>
                    <TableCell>
                      {format(new Date(claim.claimed_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(claim)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="sm:max-w-lg">
          {selectedClaim && (
            <>
              <DialogHeader>
                <DialogTitle>Claim Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <h4 className="font-semibold mb-2">User Information</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Name:</span> {selectedClaim.user_name || 'Not provided'}</p>
                    <p><span className="text-muted-foreground">Email:</span> {selectedClaim.user_email}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Reward Information</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Reward:</span> {selectedClaim.reward_title}</p>
                    <p><span className="text-muted-foreground">Cost:</span> {selectedClaim.reward_cost} tokens</p>
                    <p><span className="text-muted-foreground">Claimed:</span> {format(new Date(selectedClaim.claimed_at), 'PPP')}</p>
                  </div>
                </div>

                {selectedClaim.shipping_info && (
                  <div>
                    <h4 className="font-semibold mb-2">Shipping Information</h4>
                    <div className="space-y-1 text-sm">
                      <p>{selectedClaim.shipping_info.name}</p>
                      <p>{selectedClaim.shipping_info.address}</p>
                      <p>
                        {selectedClaim.shipping_info.city}, {selectedClaim.shipping_info.state} {selectedClaim.shipping_info.zip}
                      </p>
                      <p>{selectedClaim.shipping_info.country}</p>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold mb-2">Update Status</h4>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateStatus}>
                  Update Status
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
