import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  CheckCircle, XCircle, Clock, Filter, Search, 
  Package, User, Calendar, DollarSign, Lock,
  FileText, Image as ImageIcon, Star
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

interface RewardSubmission {
  id: string;
  user_id: string;
  lock_rate: string;
  reward_type: string;
  title: string;
  description: string;
  category: string;
  brand: string | null;
  nctr_value: number;
  claim_passes_required: number;
  stock_quantity: number | null;
  image_url: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string | null;
    email: string | null;
  };
  reward_featured?: boolean;
}

export function AdminSubmissions() {
  const [submissions, setSubmissions] = useState<RewardSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<RewardSubmission | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reward_submissions')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // For approved submissions, fetch their reward featured status
      const submissionsWithFeaturedStatus = await Promise.all(
        (data || []).map(async (submission) => {
          if (submission.status === 'approved') {
            const rewardId = getRewardIdFromNotes(submission.admin_notes);
            if (rewardId) {
              const { data: reward } = await supabase
                .from('rewards')
                .select('is_featured')
                .eq('id', rewardId)
                .single();
              
              return {
                ...submission,
                reward_featured: reward?.is_featured || false
              };
            }
          }
          return submission;
        })
      );
      
      setSubmissions(submissionsWithFeaturedStatus);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const updateSubmissionStatus = async (submissionId: string, newStatus: string, notes?: string) => {
    try {
      setUpdating(true);
      const updateData: any = { status: newStatus };
      if (notes !== undefined) {
        updateData.admin_notes = notes;
      }

      const { error } = await supabase
        .from('reward_submissions')
        .update(updateData)
        .eq('id', submissionId);

      if (error) throw error;

      toast.success(`Submission ${newStatus} successfully`);
      fetchSubmissions();
      setSelectedSubmission(null);
      setAdminNotes('');
    } catch (error) {
      console.error('Error updating submission:', error);
      toast.error('Failed to update submission');
    } finally {
      setUpdating(false);
    }
  };

  const getRewardIdFromNotes = (adminNotes: string | null): string | null => {
    if (!adminNotes) return null;
    const match = adminNotes.match(/reward ID: ([a-f0-9-]+)/i);
    return match ? match[1] : null;
  };

  const toggleFeatured = async (submission: RewardSubmission, isFeatured: boolean) => {
    const rewardId = getRewardIdFromNotes(submission.admin_notes);
    
    if (!rewardId) {
      toast.error('Cannot toggle featured - reward not yet created');
      return;
    }

    try {
      const { error } = await supabase
        .from('rewards')
        .update({ is_featured: isFeatured })
        .eq('id', rewardId);

      if (error) throw error;

      toast.success(`Reward ${isFeatured ? 'featured' : 'unfeatured'} successfully`);
      fetchSubmissions();
    } catch (error) {
      console.error('Error toggling featured status:', error);
      toast.error('Failed to update featured status');
    }
  };

  const filteredSubmissions = submissions.filter(sub => {
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    const matchesSearch = sub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (sub.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="gap-1 bg-green-500"><CheckCircle className="w-3 h-3" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" />Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Reward Submissions</h2>
        <p className="text-muted-foreground">Review and manage community-submitted rewards</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search submissions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submissions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {submissions.filter(s => s.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {submissions.filter(s => s.status === 'approved').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {submissions.filter(s => s.status === 'rejected').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submissions List */}
      <div className="grid gap-4">
        {filteredSubmissions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No submissions found</p>
            </CardContent>
          </Card>
        ) : (
          filteredSubmissions.map((submission) => (
            <Card key={submission.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Image Preview */}
                  <div className="flex-shrink-0">
                    {submission.image_url ? (
                      <img 
                        src={submission.image_url} 
                        alt={submission.title}
                        className="w-full lg:w-48 h-48 object-cover rounded-lg border border-border"
                      />
                    ) : (
                      <div className="w-full lg:w-48 h-48 bg-muted rounded-lg border border-border flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold">{submission.title}</h3>
                          {getStatusBadge(submission.status)}
                        </div>
                        <p className="text-muted-foreground line-clamp-2">{submission.description}</p>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <div className="text-sm">
                          <div className="font-medium">{submission.profiles?.full_name || 'Unknown'}</div>
                          <div className="text-muted-foreground text-xs">{submission.profiles?.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        <div className="text-sm">
                          <div className="font-medium capitalize">{submission.reward_type}</div>
                          <div className="text-muted-foreground text-xs">{submission.category}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <div className="text-sm">
                          <div className="font-medium">{submission.nctr_value} NCTR</div>
                          <div className="text-muted-foreground text-xs">{submission.claim_passes_required} Claim Pass</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-muted-foreground" />
                        <div className="text-sm">
                          <div className="font-medium">{submission.lock_rate}LOCK</div>
                          <div className="text-muted-foreground text-xs">
                            {submission.stock_quantity ? `${submission.stock_quantity} in stock` : 'Unlimited'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Brand & Date */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {submission.brand && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Brand:</span> {submission.brand}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(submission.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Admin Notes */}
                    {submission.admin_notes && (
                      <div className="bg-muted/50 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div>
                            <div className="text-xs font-medium text-muted-foreground mb-1">Admin Notes</div>
                            <p className="text-sm">{submission.admin_notes}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Featured Toggle for Approved Submissions */}
                    {submission.status === 'approved' && getRewardIdFromNotes(submission.admin_notes) && (
                      <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg mb-4 border border-border">
                        <div className="flex items-center gap-2 flex-1">
                          <Star className={`w-5 h-5 ${submission.reward_featured ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} />
                          <div>
                            <Label htmlFor={`featured-${submission.id}`} className="cursor-pointer font-medium">
                              Mark as Featured in Marketplace
                            </Label>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {submission.reward_featured ? 'Currently featured' : 'Not featured'}
                            </p>
                          </div>
                        </div>
                        <Switch
                          id={`featured-${submission.id}`}
                          checked={submission.reward_featured || false}
                          onCheckedChange={(checked) => toggleFeatured(submission, checked)}
                        />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedSubmission(submission);
                              setAdminNotes(submission.admin_notes || '');
                            }}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Approve Submission</DialogTitle>
                            <DialogDescription>
                              Add optional notes and approve this reward submission
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="notes">Admin Notes (Optional)</Label>
                              <Textarea
                                id="notes"
                                placeholder="Add notes about this approval..."
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                rows={4}
                              />
                            </div>
                            <div className="flex gap-2 justify-end">
                              <DialogTrigger asChild>
                                <Button variant="outline">Cancel</Button>
                              </DialogTrigger>
                              <Button
                                onClick={() => updateSubmissionStatus(submission.id, 'approved', adminNotes)}
                                disabled={updating}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                {updating ? 'Approving...' : 'Approve Submission'}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedSubmission(submission);
                              setAdminNotes(submission.admin_notes || '');
                            }}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Reject Submission</DialogTitle>
                            <DialogDescription>
                              Please provide a reason for rejecting this submission
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="reject-notes">Reason for Rejection *</Label>
                              <Textarea
                                id="reject-notes"
                                placeholder="Explain why this submission is being rejected..."
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                rows={4}
                                required
                              />
                            </div>
                            <div className="flex gap-2 justify-end">
                              <DialogTrigger asChild>
                                <Button variant="outline">Cancel</Button>
                              </DialogTrigger>
                              <Button
                                onClick={() => updateSubmissionStatus(submission.id, 'rejected', adminNotes)}
                                disabled={updating || !adminNotes.trim()}
                                variant="destructive"
                              >
                                {updating ? 'Rejecting...' : 'Reject Submission'}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {submission.status !== 'pending' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => updateSubmissionStatus(submission.id, 'pending')}
                          disabled={updating}
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          Reset to Pending
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}