import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { PermissionGate } from '@/components/admin/PermissionGate';
import { useAdminRole } from '@/hooks/useAdminRole';
import { 
  CheckCircle, XCircle, Clock, Search, 
  Package, User, Calendar, DollarSign, Lock,
  FileText, Image as ImageIcon, Star, GitBranch,
  History, Eye, Pencil, MessageSquare, ChevronRight,
  AlertCircle, Inbox, RefreshCcw
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { RewardVersionHistory } from '@/components/RewardVersionHistory';
import { SubmissionComparisonModal } from '@/components/admin/SubmissionComparisonModal';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

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
  version: number;
  parent_submission_id: string | null;
  is_latest_version: boolean;
  version_notes: string | null;
  // New compensation fields
  floor_usd_amount: number | null;
  lock_option: string | null;
  nctr_rate_at_submission: number | null;
  claims_required: number | null;
  claim_value_at_submission: number | null;
  profiles?: {
    full_name: string | null;
    email: string | null;
  };
  reward_featured?: boolean;
}

const REJECTION_REASONS = [
  { value: 'duplicate', label: 'Duplicate reward' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'insufficient', label: 'Insufficient details' },
  { value: 'not_aligned', label: 'Not aligned with Crescendo' },
  { value: 'other', label: 'Other' },
];

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'alliance_tokens', label: 'Alliance Tokens' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'experiences', label: 'Experiences' },
  { value: 'merchandise', label: 'Merchandise' },
  { value: 'gift_cards', label: 'Gift Cards' },
  { value: 'crypto', label: 'Digital Collectible' },
];

export function AdminSubmissions() {
  const { hasPermission, logActivity } = useAdminRole();
  const [submissions, setSubmissions] = useState<RewardSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<RewardSubmission | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [versionHistoryId, setVersionHistoryId] = useState<string | null>(null);
  const [previewAsCard, setPreviewAsCard] = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  
  // Modal states
  const [showApproveEditModal, setShowApproveEditModal] = useState(false);
  const [showRequestChangesModal, setShowRequestChangesModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  
  // Edit form data
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    cost: 0,
    category: '',
    stock_quantity: null as number | null,
    is_featured: false,
  });
  
  // Track calculated claims for showing override info
  const [calculatedClaims, setCalculatedClaims] = useState<number | null>(null);
  
  // Reject form data
  const [rejectionReason, setRejectionReason] = useState('');
  const [customRejectionMessage, setCustomRejectionMessage] = useState('');
  
  // Request changes message
  const [changesRequestMessage, setChangesRequestMessage] = useState('');

  useEffect(() => {
    fetchSubmissions();
  }, []);

  // Auto-select first pending when filter changes
  useEffect(() => {
    const filtered = getFilteredSubmissions();
    if (filtered.length > 0 && (!selectedSubmission || !filtered.find(s => s.id === selectedSubmission.id))) {
      setSelectedSubmission(filtered[0]);
    }
  }, [statusFilter, categoryFilter, searchTerm, submissions]);

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

  const getFilteredSubmissions = () => {
    return submissions.filter(sub => {
      const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || sub.category === categoryFilter;
      const matchesSearch = sub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (sub.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
                           (sub.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      return matchesStatus && matchesSearch && matchesCategory;
    });
  };

  const filteredSubmissions = getFilteredSubmissions();

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
      await fetchSubmissions();
      
      // Select next pending submission
      const pending = submissions.filter(s => s.status === 'pending' && s.id !== submissionId);
      if (pending.length > 0) {
        setSelectedSubmission(pending[0]);
      } else {
        setSelectedSubmission(null);
      }
      
      setAdminNotes('');
    } catch (error) {
      console.error('Error updating submission:', error);
      toast.error('Failed to update submission');
    } finally {
      setUpdating(false);
    }
  };



  const handleApproveAndEdit = async () => {
    if (!selectedSubmission) return;
    
    try {
      setUpdating(true);
      
      // Determine if claims were manually adjusted
      const wasManuallyAdjusted = calculatedClaims !== null && editFormData.cost !== calculatedClaims;
      const adjustmentNote = wasManuallyAdjusted 
        ? ` | Claims adjusted from ${calculatedClaims} to ${editFormData.cost} by admin.`
        : '';
      
      // First approve the submission with the edited data
      const { error: submitError } = await supabase
        .from('reward_submissions')
        .update({ 
          status: 'approved',
          title: editFormData.title,
          description: editFormData.description,
          claims_required: editFormData.cost,
          claim_passes_required: editFormData.cost,
          category: editFormData.category,
          stock_quantity: editFormData.stock_quantity,
          admin_notes: `Edited and approved by admin. Original title: ${selectedSubmission.title}${adjustmentNote}`
        })
        .eq('id', selectedSubmission.id);

      if (submitError) throw submitError;

      let rewardId: string | undefined;

      // The trigger will create the reward automatically
      // Now update the featured status if needed
      // Wait a moment for the trigger to create the reward
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Try to find the newly created reward
      const { data: newReward } = await supabase
        .from('rewards')
        .select('id')
        .eq('title', editFormData.title)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (newReward) {
        rewardId = newReward.id;
        
        if (editFormData.is_featured) {
          await supabase
            .from('rewards')
            .update({ is_featured: true })
            .eq('id', newReward.id);
        }
      }


      toast.success('Submission approved and edited successfully');
      setShowApproveEditModal(false);
      await fetchSubmissions();
      
      // Select next pending
      const pending = submissions.filter(s => s.status === 'pending' && s.id !== selectedSubmission.id);
      setSelectedSubmission(pending.length > 0 ? pending[0] : null);
    } catch (error) {
      console.error('Error approving submission:', error);
      toast.error('Failed to approve submission');
    } finally {
      setUpdating(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!selectedSubmission || !changesRequestMessage.trim()) return;
    
    await updateSubmissionStatus(
      selectedSubmission.id, 
      'pending', 
      `Changes requested: ${changesRequestMessage}`
    );
    setShowRequestChangesModal(false);
    setChangesRequestMessage('');
  };

  const handleReject = async () => {
    if (!selectedSubmission || !rejectionReason) return;
    
    const reasonLabel = REJECTION_REASONS.find(r => r.value === rejectionReason)?.label || rejectionReason;
    const fullMessage = customRejectionMessage 
      ? `${reasonLabel}: ${customRejectionMessage}`
      : reasonLabel;
    
    try {
      setUpdating(true);
      
      // Update submission status
      await updateSubmissionStatus(selectedSubmission.id, 'rejected', fullMessage);
      
      // Create notification for the contributor
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: selectedSubmission.user_id,
          type: 'submission_rejected',
          title: `Submission Rejected: ${selectedSubmission.title}`,
          message: `Your reward submission was rejected. Reason: ${fullMessage}. You can resubmit with changes.`,
          is_read: false,
          metadata: {
            submission_id: selectedSubmission.id,
            rejection_reason: reasonLabel,
            custom_message: customRejectionMessage || null,
            link: '/my-submissions'
          }
        });
      
      if (notifError) {
        console.error('Failed to create rejection notification:', notifError);
      }
      
      
      setShowRejectModal(false);
      setRejectionReason('');
      setCustomRejectionMessage('');
    } catch (error) {
      console.error('Error rejecting submission:', error);
      toast.error('Failed to reject submission');
    } finally {
      setUpdating(false);
    }
  };

  const openApproveEditModal = () => {
    if (!selectedSubmission) return;
    
    // Calculate the expected claims based on floor amount
    const claimValueAtSubmission = selectedSubmission.claim_value_at_submission || 5;
    const calculated = selectedSubmission.floor_usd_amount 
      ? Math.ceil(selectedSubmission.floor_usd_amount / claimValueAtSubmission)
      : selectedSubmission.claims_required || selectedSubmission.claim_passes_required;
    
    // Use claims_required if available, otherwise fall back
    const currentCost = selectedSubmission.claims_required 
      || calculated 
      || selectedSubmission.claim_passes_required;
    
    setCalculatedClaims(calculated);
    setEditFormData({
      title: selectedSubmission.title,
      description: selectedSubmission.description,
      cost: currentCost,
      category: selectedSubmission.category,
      stock_quantity: selectedSubmission.stock_quantity,
      is_featured: false,
    });
    setShowApproveEditModal(true);
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

  const getStatusBadge = (status: string, size: 'sm' | 'default' = 'default') => {
    const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className={cn("gap-1", size === 'sm' && "text-xs")}><Clock className={iconSize} />Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className={cn("gap-1 bg-green-500", size === 'sm' && "text-xs")}><CheckCircle className={iconSize} />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className={cn("gap-1", size === 'sm' && "text-xs")}><XCircle className={iconSize} />Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const statusCounts = {
    all: submissions.length,
    pending: submissions.filter(s => s.status === 'pending').length,
    approved: submissions.filter(s => s.status === 'approved').length,
    rejected: submissions.filter(s => s.status === 'rejected').length,
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
    <div className="h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h2 className="text-3xl font-bold tracking-tight">Reward Submissions</h2>
        <p className="text-muted-foreground">Review and manage community-submitted rewards</p>
      </div>

      {/* Two Panel Layout */}
      <div className="flex flex-col lg:flex-row gap-4 h-[calc(100%-4rem)]">
        {/* Left Panel - Submissions List */}
        <div className="w-full lg:w-[40%] flex flex-col border rounded-lg bg-card">
          {/* Filter Tabs */}
          <div className="p-3 border-b">
            <Tabs value={statusFilter} onValueChange={setStatusFilter}>
              <TabsList className="w-full grid grid-cols-4">
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                <TabsTrigger value="pending" className="text-xs gap-1">
                  Pending
                  {statusCounts.pending > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-xs">
                      {statusCounts.pending}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="approved" className="text-xs">Approved</TabsTrigger>
                <TabsTrigger value="rejected" className="text-xs">Rejected</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* Search and Category Filter */}
          <div className="p-3 border-b space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by title or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Submissions List */}
          <ScrollArea className="flex-1">
            {filteredSubmissions.length === 0 ? (
              <div className="p-8 text-center">
                <Inbox className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium">No submissions found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {statusFilter === 'pending' 
                    ? 'No pending submissions to review'
                    : 'Try adjusting your filters'}
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredSubmissions.map((submission) => (
                  <button
                    key={submission.id}
                    onClick={() => setSelectedSubmission(submission)}
                    className={cn(
                      "w-full p-3 text-left hover:bg-muted/50 transition-colors flex gap-3",
                      selectedSubmission?.id === submission.id && "bg-muted border-l-2 border-l-primary"
                    )}
                  >
                    {/* Thumbnail */}
                    <div className="flex-shrink-0">
                      {submission.image_url ? (
                        <img 
                          src={submission.image_url} 
                          alt={submission.title}
                          className="w-12 h-12 object-cover rounded-md border"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded-md border flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate text-sm">{submission.title}</span>
                        {submission.version > 1 && (
                          <Badge variant="outline" className="text-[10px] h-4 px-1">
                            v{submission.version}
                          </Badge>
                        )}
                        {submission.parent_submission_id && (
                          <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            Resubmission
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="truncate">{submission.profiles?.full_name || submission.profiles?.email || 'Unknown'}</span>
                        <span>•</span>
                        <span>{new Date(submission.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="mt-1.5">
                        {getStatusBadge(submission.status, 'sm')}
                      </div>
                    </div>
                    
                    <ChevronRight className="w-4 h-4 text-muted-foreground self-center flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Right Panel - Preview */}
        <div className="w-full lg:w-[60%] flex flex-col border rounded-lg bg-card">
          {selectedSubmission ? (
            <>
              <ScrollArea className="flex-1">
                <div className="p-6 space-y-6">
                  {/* Preview Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Preview as Reward Card</span>
                    </div>
                    <Switch
                      checked={previewAsCard}
                      onCheckedChange={setPreviewAsCard}
                    />
                  </div>

                  {previewAsCard ? (
                    /* Card Preview */
                    <div className="flex justify-center">
                      <Card className="w-full max-w-sm overflow-hidden">
                        <div className="relative aspect-[4/3]">
                          {selectedSubmission.image_url ? (
                            <img 
                              src={selectedSubmission.image_url} 
                              alt={selectedSubmission.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <ImageIcon className="w-16 h-16 text-muted-foreground" />
                            </div>
                          )}
                          <Badge className="absolute top-3 left-3 capitalize">
                            {selectedSubmission.category.replace('_', ' ')}
                          </Badge>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-bold text-lg mb-2">{selectedSubmission.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {selectedSubmission.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-primary">
                              {selectedSubmission.claim_passes_required} Claims
                            </span>
                            {selectedSubmission.stock_quantity !== null && (
                              <span className="text-xs text-muted-foreground">
                                {selectedSubmission.stock_quantity} left
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    /* Full Preview */
                    <>
                      {/* Large Image */}
                      <div className="relative aspect-video rounded-lg overflow-hidden border">
                        {selectedSubmission.image_url ? (
                          <img 
                            src={selectedSubmission.image_url} 
                            alt={selectedSubmission.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <ImageIcon className="w-20 h-20 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Title and Status */}
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className="text-2xl font-bold">{selectedSubmission.title}</h3>
                            {selectedSubmission.version > 1 && (
                              <Badge variant="outline" className="gap-1">
                                <GitBranch className="w-3 h-3" />
                                v{selectedSubmission.version}
                              </Badge>
                            )}
                            {selectedSubmission.parent_submission_id && (
                              <Badge className="gap-1 bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400">
                                <RefreshCcw className="w-3 h-3" />
                                Resubmission
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(selectedSubmission.status)}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {selectedSubmission.parent_submission_id && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => setShowComparisonModal(true)}
                              className="gap-1 bg-amber-600 hover:bg-amber-700"
                            >
                              <History className="w-4 h-4" />
                              Compare Versions
                            </Button>
                          )}
                          {selectedSubmission.version > 1 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setVersionHistoryId(selectedSubmission.id);
                                setShowVersionHistory(true);
                              }}
                              className="gap-2"
                            >
                              <History className="w-4 h-4" />
                              History
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Resubmission Info */}
                      {selectedSubmission.parent_submission_id && selectedSubmission.version_notes && (
                        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <RefreshCcw className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">
                                Resubmitted on {new Date(selectedSubmission.created_at).toLocaleDateString()}
                              </div>
                              <p className="text-sm text-amber-800 dark:text-amber-300">
                                {selectedSubmission.version_notes}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Description */}
                      <div>
                        <Label className="text-muted-foreground text-xs uppercase tracking-wide">Description</Label>
                        <p className="mt-1">{selectedSubmission.description}</p>
                      </div>

                      {/* Compensation Section - New Fields */}
                      {(selectedSubmission.floor_usd_amount || selectedSubmission.nctr_value > 0) && (
                        <div className="bg-gradient-to-r from-[#E85D04]/10 via-primary/5 to-[#E85D04]/10 border border-[#E85D04]/30 rounded-lg p-4">
                          <Label className="text-[#E85D04] text-xs uppercase tracking-wide mb-3 block flex items-center gap-2">
                            <DollarSign className="w-3.5 h-3.5" />
                            Contributor Compensation Request
                          </Label>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Floor Amount</div>
                              <div className="font-bold text-lg">
                                {selectedSubmission.floor_usd_amount 
                                  ? `$${selectedSubmission.floor_usd_amount.toLocaleString()}`
                                  : 'N/A'}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Claims Required</div>
                              <div className="font-bold text-lg text-primary">
                                {selectedSubmission.claims_required 
                                  ? `${selectedSubmission.claims_required} Claims`
                                  : selectedSubmission.floor_usd_amount 
                                    ? `${Math.ceil(selectedSubmission.floor_usd_amount / (selectedSubmission.claim_value_at_submission || 5))} Claims`
                                    : 'N/A'}
                                {selectedSubmission.claim_value_at_submission && (
                                  <span className="text-xs font-normal text-muted-foreground ml-1">
                                    (at ${selectedSubmission.claim_value_at_submission})
                                  </span>
                                )}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Lock Option</div>
                              <div className="font-bold text-lg">
                                {selectedSubmission.lock_option 
                                  ? `${selectedSubmission.lock_option}LOCK`
                                  : selectedSubmission.lock_rate 
                                    ? `${selectedSubmission.lock_rate}LOCK`
                                    : 'N/A'}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">NCTR Amount</div>
                              <div className="font-bold text-lg text-[#E85D04]">
                                {selectedSubmission.nctr_value?.toLocaleString() || 0} NCTR
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Rate at Submission</div>
                              <div className="font-bold text-lg">
                                {selectedSubmission.nctr_rate_at_submission 
                                  ? `$${selectedSubmission.nctr_rate_at_submission}`
                                  : '$0.05'}
                              </div>
                            </div>
                          </div>
                          {selectedSubmission.floor_usd_amount && selectedSubmission.nctr_value > 0 && (
                            <div className="mt-3 pt-3 border-t border-[#E85D04]/20 text-sm text-muted-foreground">
                              Contributor expects <span className="font-medium text-foreground">${selectedSubmission.floor_usd_amount}</span> minimum, 
                              requesting <span className="font-medium text-[#E85D04]">{selectedSubmission.nctr_value.toLocaleString()} NCTR</span> with multiplier applied
                            </div>
                          )}
                        </div>
                      )}

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                            <DollarSign className="w-3.5 h-3.5" />
                            Cost
                          </div>
                          <div className="font-bold">{selectedSubmission.claim_passes_required} Claims</div>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                            <Lock className="w-3.5 h-3.5" />
                            Reward Type
                          </div>
                          <div className="font-bold capitalize">{selectedSubmission.reward_type.replace('_', ' ')}</div>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                            <Package className="w-3.5 h-3.5" />
                            Category
                          </div>
                          <div className="font-bold capitalize">{selectedSubmission.category.replace('_', ' ')}</div>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                            <Package className="w-3.5 h-3.5" />
                            Stock
                          </div>
                          <div className="font-bold">
                            {selectedSubmission.stock_quantity !== null ? selectedSubmission.stock_quantity : 'Unlimited'}
                          </div>
                        </div>
                      </div>

                      {/* Submitter Info */}
                      <div className="bg-muted/30 rounded-lg p-4 border">
                        <Label className="text-muted-foreground text-xs uppercase tracking-wide mb-3 block">Submitter Information</Label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">{selectedSubmission.profiles?.full_name || 'Unknown'}</div>
                              <div className="text-xs text-muted-foreground">{selectedSubmission.profiles?.email}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                              <Calendar className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div>
                              <div className="font-medium">{new Date(selectedSubmission.created_at).toLocaleDateString()}</div>
                              <div className="text-xs text-muted-foreground">Submitted</div>
                            </div>
                          </div>
                          {selectedSubmission.brand && (
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                <Package className="w-5 h-5 text-muted-foreground" />
                              </div>
                              <div>
                                <div className="font-medium">{selectedSubmission.brand}</div>
                                <div className="text-xs text-muted-foreground">Brand</div>
                              </div>
                            </div>
                          )}
                        </div>
                        {selectedSubmission.version_notes && (
                          <div className="mt-4 pt-4 border-t">
                            <Label className="text-xs text-muted-foreground">Version Notes</Label>
                            <p className="text-sm mt-1">{selectedSubmission.version_notes}</p>
                          </div>
                        )}
                      </div>

                      {/* Admin Notes */}
                      {selectedSubmission.admin_notes && (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                          <div className="flex items-start gap-2">
                            <FileText className="w-4 h-4 text-amber-600 mt-0.5" />
                            <div>
                              <Label className="text-amber-600 text-xs uppercase tracking-wide">Admin Notes</Label>
                              <p className="text-sm mt-1">{selectedSubmission.admin_notes}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Featured Toggle for Approved */}
                      {selectedSubmission.status === 'approved' && getRewardIdFromNotes(selectedSubmission.admin_notes) && (
                        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border">
                          <Star className={cn(
                            "w-5 h-5",
                            selectedSubmission.reward_featured ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'
                          )} />
                          <div className="flex-1">
                            <Label className="cursor-pointer font-medium">Featured in Marketplace</Label>
                            <p className="text-xs text-muted-foreground">
                              {selectedSubmission.reward_featured ? 'Currently featured' : 'Not featured'}
                            </p>
                          </div>
                          <Switch
                            checked={selectedSubmission.reward_featured || false}
                            onCheckedChange={(checked) => toggleFeatured(selectedSubmission, checked)}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </ScrollArea>

              {/* Sticky Action Bar */}
              {selectedSubmission.status === 'pending' && (
                <div className="p-4 border-t bg-card flex flex-wrap gap-2">
                  <PermissionGate permission="submissions_approve">
                    <Button
                      onClick={() => updateSubmissionStatus(selectedSubmission.id, 'approved')}
                      disabled={updating}
                      className="bg-green-600 hover:bg-green-700 gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </Button>
                    <Button
                      onClick={openApproveEditModal}
                      disabled={updating}
                      variant="default"
                      className="gap-2"
                    >
                      <Pencil className="w-4 h-4" />
                      Approve & Edit
                    </Button>
                  </PermissionGate>
                  <Button
                    onClick={() => setShowRequestChangesModal(true)}
                    disabled={updating}
                    variant="outline"
                    className="gap-2 border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Request Changes
                  </Button>
                  <PermissionGate permission="submissions_reject">
                    <Button
                      onClick={() => setShowRejectModal(true)}
                      disabled={updating}
                      variant="destructive"
                      className="gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </Button>
                  </PermissionGate>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium text-lg mb-1">No Submission Selected</h3>
                <p className="text-muted-foreground text-sm">
                  Select a submission from the list to preview
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Approve & Edit Modal */}
      <Dialog open={showApproveEditModal} onOpenChange={setShowApproveEditModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Approve & Edit Submission</DialogTitle>
            <DialogDescription>
              Edit the submission details before approving
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedSubmission?.image_url && (
              <div className="aspect-video rounded-lg overflow-hidden border">
                <img 
                  src={selectedSubmission.image_url} 
                  alt={selectedSubmission.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                rows={3}
              />
            </div>
            {/* Claims Required with Override */}
            <div className="space-y-2">
              <Label htmlFor="edit-cost">Claims Required</Label>
              <Input
                id="edit-cost"
                type="number"
                min={1}
                value={editFormData.cost}
                onChange={(e) => setEditFormData({ ...editFormData, cost: parseInt(e.target.value) || 1 })}
              />
              {calculatedClaims !== null && (
                <div className="text-xs space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>Calculated: {calculatedClaims} Claims</span>
                    {selectedSubmission?.floor_usd_amount && selectedSubmission?.claim_value_at_submission && (
                      <span className="text-muted-foreground/70">
                        (${selectedSubmission.floor_usd_amount} ÷ ${selectedSubmission.claim_value_at_submission})
                      </span>
                    )}
                  </div>
                  {editFormData.cost !== calculatedClaims && (
                    <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <AlertCircle className="w-3 h-3" />
                      <span>Manual override: {editFormData.cost > calculatedClaims ? '+' : ''}{editFormData.cost - calculatedClaims} from calculated</span>
                    </div>
                  )}
                  {editFormData.cost !== calculatedClaims && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 text-xs px-2"
                      onClick={() => setEditFormData({ ...editFormData, cost: calculatedClaims })}
                    >
                      Reset to calculated
                    </Button>
                  )}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-stock">Stock Quantity</Label>
              <Input
                id="edit-stock"
                type="number"
                placeholder="Unlimited"
                value={editFormData.stock_quantity ?? ''}
                onChange={(e) => setEditFormData({ 
                  ...editFormData, 
                  stock_quantity: e.target.value ? parseInt(e.target.value) : null 
                })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select value={editFormData.category} onValueChange={(v) => setEditFormData({ ...editFormData, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.filter(c => c.value !== 'all').map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Star className={cn(
                "w-5 h-5",
                editFormData.is_featured ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'
              )} />
              <div className="flex-1">
                <Label className="cursor-pointer">Mark as Featured</Label>
              </div>
              <Switch
                checked={editFormData.is_featured}
                onCheckedChange={(checked) => setEditFormData({ ...editFormData, is_featured: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveEditModal(false)}>Cancel</Button>
            <Button onClick={handleApproveAndEdit} disabled={updating} className="bg-green-600 hover:bg-green-700">
              {updating ? 'Saving...' : 'Save & Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Changes Modal */}
      <Dialog open={showRequestChangesModal} onOpenChange={setShowRequestChangesModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Changes</DialogTitle>
            <DialogDescription>
              Send feedback to the submitter about what needs to be updated
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="changes-message">Your Feedback</Label>
              <Textarea
                id="changes-message"
                placeholder="Please describe what changes are needed..."
                value={changesRequestMessage}
                onChange={(e) => setChangesRequestMessage(e.target.value)}
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestChangesModal(false)}>Cancel</Button>
            <Button 
              onClick={handleRequestChanges} 
              disabled={updating || !changesRequestMessage.trim()}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {updating ? 'Sending...' : 'Send Feedback'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Reject Submission
            </DialogTitle>
            <DialogDescription>
              Select a reason for rejecting this submission
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rejection Reason *</Label>
              <Select value={rejectionReason} onValueChange={setRejectionReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason..." />
                </SelectTrigger>
                <SelectContent>
                  {REJECTION_REASONS.map(reason => (
                    <SelectItem key={reason.value} value={reason.value}>{reason.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="custom-message">Additional Message (Optional)</Label>
              <Textarea
                id="custom-message"
                placeholder="Add more context about the rejection..."
                value={customRejectionMessage}
                onChange={(e) => setCustomRejectionMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectModal(false)}>Cancel</Button>
            <Button 
              onClick={handleReject} 
              disabled={updating || !rejectionReason}
              variant="destructive"
            >
              {updating ? 'Rejecting...' : 'Confirm Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Version History Modal */}
      {versionHistoryId && (
        <RewardVersionHistory
          open={showVersionHistory}
          onClose={() => setShowVersionHistory(false)}
          submissionId={versionHistoryId}
        />
      )}

      {/* Comparison Modal for Resubmissions */}
      {selectedSubmission && selectedSubmission.parent_submission_id && (
        <SubmissionComparisonModal
          open={showComparisonModal}
          onClose={() => setShowComparisonModal(false)}
          currentSubmission={selectedSubmission}
          parentSubmissionId={selectedSubmission.parent_submission_id}
        />
      )}
    </div>
  );
}
