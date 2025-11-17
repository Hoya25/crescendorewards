import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  ArrowLeft, Clock, CheckCircle, XCircle, Package, 
  Calendar, DollarSign, Lock, Image as ImageIcon,
  FileText, Filter, AlertCircle, Share2, Twitter, 
  Facebook, Linkedin, Link2, Check, TrendingUp, 
  MousePointerClick, Users, Award, Edit, History, 
  GitBranch
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { UpdateRewardModal } from '@/components/UpdateRewardModal';
import { RewardVersionHistory } from '@/components/RewardVersionHistory';
import { ImageWithFallback } from '@/components/ImageWithFallback';

interface SubmissionPageProps {
  onBack: () => void;
}

interface RewardSubmission {
  id: string;
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
}

export function MySubmissionsPage({ onBack }: SubmissionPageProps) {
  const { user, profile } = useAuth();
  const [submissions, setSubmissions] = useState<RewardSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<RewardSubmission | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareStats, setShareStats] = useState<Record<string, any>>({});
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [submissionToUpdate, setSubmissionToUpdate] = useState<RewardSubmission | null>(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [versionHistoryId, setVersionHistoryId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchSubmissions();
      fetchShareStats();
    }
  }, [user]);

  const fetchSubmissions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reward_submissions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const fetchShareStats = async () => {
    if (!user || !profile) return;

    try {
      // Fetch share statistics for approved submissions
      const { data: submissions } = await supabase
        .from('reward_submissions')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'approved');

      if (!submissions || submissions.length === 0) return;

      // Get the reward IDs that were created from these submissions
      const { data: rewards } = await supabase
        .from('rewards')
        .select('id, title')
        .in('title', submissions.map(s => s.id)); // We'll need to match by title or another way

      if (!rewards) return;

      // Fetch share stats for these rewards
      const { data: shares } = await supabase
        .from('reward_shares')
        .select('reward_id, clicks, conversions, bonus_earned')
        .eq('user_id', user.id);

      if (shares) {
        const statsMap: Record<string, any> = {};
        shares.forEach(share => {
          if (!statsMap[share.reward_id]) {
            statsMap[share.reward_id] = {
              clicks: 0,
              conversions: 0,
              bonus: 0
            };
          }
          statsMap[share.reward_id].clicks += share.clicks;
          statsMap[share.reward_id].conversions += share.conversions;
          statsMap[share.reward_id].bonus += share.bonus_earned;
        });
        setShareStats(statsMap);
      }
    } catch (error) {
      console.error('Error fetching share stats:', error);
    }
  };

  const filteredSubmissions = submissions.filter(sub => 
    statusFilter === 'all' || sub.status === statusFilter
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-700 dark:text-yellow-400">
            <Clock className="w-3 h-3" />
            Under Review
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="gap-1 bg-green-500 hover:bg-green-600">
            <CheckCircle className="w-3 h-3" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="w-3 h-3" />
            Rejected
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Your submission is being reviewed by our team';
      case 'approved':
        return 'Your reward has been approved and added to the marketplace! Start promoting it to earn bonuses.';
      case 'rejected':
        return 'Your submission was not approved. Check admin notes below for details';
      default:
        return '';
    }
  };

  const handleShareClick = (submission: RewardSubmission) => {
    setSelectedSubmission(submission);
    setShowShareModal(true);
  };

  const generateShareUrl = (submissionId: string) => {
    const baseUrl = window.location.origin;
    const referralCode = profile?.referral_code || '';
    return `${baseUrl}/?submission=${submissionId}&ref=${referralCode}`;
  };

  const trackShare = async (platform: string) => {
    if (!profile?.referral_code || !selectedSubmission) return;

    try {
      const { error } = await supabase
        .from('reward_shares')
        .insert({
          user_id: profile.id,
          reward_id: selectedSubmission.id,
          referral_code: profile.referral_code,
          share_platform: platform,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error tracking share:', error);
    }
  };

  const handleShare = async (platform: string) => {
    if (!selectedSubmission) return;

    const shareUrl = generateShareUrl(selectedSubmission.id);
    const shareText = `Check out this amazing reward: ${selectedSubmission.title} - Earn NCTR and get exclusive benefits!`;
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(shareText);

    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    };

    if (urls[platform]) {
      await trackShare(platform);
      window.open(urls[platform], '_blank', 'width=600,height=400');
    }
  };

  const handleCopyLink = async () => {
    if (!selectedSubmission) return;

    try {
      await trackShare('direct_link');
      const shareUrl = generateShareUrl(selectedSubmission.id);
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied! Share it to earn bonuses when people claim this reward.');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleUpdateClick = (submission: RewardSubmission) => {
    setSubmissionToUpdate(submission);
    setShowUpdateModal(true);
  };

  const handleViewHistory = (submissionId: string) => {
    setVersionHistoryId(submissionId);
    setShowVersionHistory(true);
  };

  const handleUpdateSuccess = () => {
    fetchSubmissions();
    setShowUpdateModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your submissions...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                My Submissions
              </h1>
              <p className="text-muted-foreground mt-2">
                Track the status of your reward submissions
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{submissions.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                {submissions.filter(s => s.status === 'pending').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {submissions.filter(s => s.status === 'approved').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {submissions.filter(s => s.status === 'rejected').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-64">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Submissions</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Submissions List */}
        {filteredSubmissions.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Submissions Yet</h3>
              <p className="text-muted-foreground mb-6">
                {statusFilter === 'all' 
                  ? "You haven't submitted any rewards yet. Start contributing to the marketplace!"
                  : `No ${statusFilter} submissions found.`}
              </p>
              <Button onClick={onBack}>Go Back</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredSubmissions.map((submission) => (
              <Card key={submission.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="flex flex-col lg:flex-row">
                  {/* Image */}
                  <div className="lg:w-64 flex-shrink-0">
                    {submission.image_url ? (
                      <ImageWithFallback 
                        src={submission.image_url} 
                        alt={submission.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-64 lg:h-full bg-muted flex items-center justify-center">
                        <ImageIcon className="w-16 h-16 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-2xl font-bold">{submission.title}</h3>
                          {submission.version > 1 && (
                            <Badge variant="outline" className="gap-1">
                              <GitBranch className="w-3 h-3" />
                              v{submission.version}
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground">{submission.description}</p>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        {getStatusBadge(submission.status)}
                        {submission.is_latest_version && submission.version > 1 && (
                          <Badge variant="secondary" className="text-xs">
                            Latest
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Status Description */}
                    <div className={`mb-4 p-3 rounded-lg flex items-start gap-2 ${
                      submission.status === 'pending' ? 'bg-yellow-50 dark:bg-yellow-950/20' :
                      submission.status === 'approved' ? 'bg-green-50 dark:bg-green-950/20' :
                      'bg-red-50 dark:bg-red-950/20'
                    }`}>
                      <AlertCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        submission.status === 'pending' ? 'text-yellow-600' :
                        submission.status === 'approved' ? 'text-green-600' :
                        'text-red-600'
                      }`} />
                      <p className={`text-sm ${
                        submission.status === 'pending' ? 'text-yellow-700 dark:text-yellow-400' :
                        submission.status === 'approved' ? 'text-green-700 dark:text-green-400' :
                        'text-red-700 dark:text-red-400'
                      }`}>
                        {getStatusDescription(submission.status)}
                      </p>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y mb-4">
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
                          <div className="text-muted-foreground text-xs">Lock Period</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <div className="text-sm">
                          <div className="font-medium">
                            {new Date(submission.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-muted-foreground text-xs">Submitted</div>
                        </div>
                      </div>
                    </div>

                    {/* Brand */}
                    {submission.brand && (
                      <div className="mb-4">
                        <span className="text-sm text-muted-foreground">Brand: </span>
                        <span className="text-sm font-medium">{submission.brand}</span>
                      </div>
                    )}

                    {/* Admin Notes */}
                    {submission.admin_notes && (
                      <div className="bg-muted/50 rounded-lg p-4 mb-4">
                        <div className="flex items-start gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div>
                            <div className="text-xs font-medium text-muted-foreground mb-1">
                              Admin Notes
                            </div>
                            <p className="text-sm">{submission.admin_notes}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Version Notes for Updates */}
                    {submission.version_notes && submission.version > 1 && (
                      <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 mb-4">
                        <div className="flex items-start gap-2">
                          <GitBranch className="w-4 h-4 text-blue-600 mt-0.5" />
                          <div>
                            <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                              Update Notes (v{submission.version})
                            </div>
                            <p className="text-sm">{submission.version_notes}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Version Management for Approved Submissions */}
                    {submission.status === 'approved' && submission.is_latest_version && (
                      <div className="border-t pt-4 mt-4 mb-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Edit className="w-5 h-5 text-primary" />
                              <h4 className="font-semibold">Manage Your Reward</h4>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Keep your reward up-to-date by submitting improvements
                            </p>
                          </div>
                          <div className="flex gap-2 w-full sm:w-auto">
                            {(submission.version > 1 || submission.parent_submission_id) && (
                              <Button
                                variant="outline"
                                onClick={() => handleViewHistory(submission.id)}
                                className="gap-2 flex-1 sm:flex-initial"
                              >
                                <History className="w-4 h-4" />
                                History
                              </Button>
                            )}
                            <Button
                              onClick={() => handleUpdateClick(submission)}
                              className="gap-2 flex-1 sm:flex-initial"
                            >
                              <Edit className="w-4 h-4" />
                              Update Reward
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Share/Promote Section for Approved Submissions */}
                    {submission.status === 'approved' && (
                      <div className="border-t pt-4 mt-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Award className="w-5 h-5 text-primary" />
                              <h4 className="font-semibold">Promote Your Reward</h4>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Share this reward and earn bonus claim passes when someone claims it through your link
                            </p>
                          </div>
                          <Button
                            onClick={() => handleShareClick(submission)}
                            className="gap-2 w-full sm:w-auto"
                          >
                            <Share2 className="w-4 h-4" />
                            Share & Earn
                          </Button>
                        </div>

                        {/* Performance Stats (if available) */}
                        {shareStats[submission.id] && (
                          <div className="grid grid-cols-3 gap-3 mt-4 p-4 bg-muted/30 rounded-lg">
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <MousePointerClick className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <div className="text-lg font-bold">{shareStats[submission.id].clicks}</div>
                              <div className="text-xs text-muted-foreground">Clicks</div>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <Users className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <div className="text-lg font-bold text-primary">{shareStats[submission.id].conversions}</div>
                              <div className="text-xs text-muted-foreground">Claims</div>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <div className="text-lg font-bold text-primary">+{shareStats[submission.id].bonus}</div>
                              <div className="text-xs text-muted-foreground">Earned</div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Share Modal */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-primary" />
              Promote Your Reward
            </DialogTitle>
            <DialogDescription>
              Share your approved reward and earn bonus claim passes when others claim it through your link!
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-4">
              {/* Submission Preview */}
              <Card className="p-4 bg-muted/50">
                <div className="flex items-center gap-3">
                  {selectedSubmission.image_url ? (
                    <ImageWithFallback
                      src={selectedSubmission.image_url}
                      alt={selectedSubmission.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">{selectedSubmission.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedSubmission.claim_passes_required} Claim Passes • {selectedSubmission.nctr_value} NCTR
                    </p>
                  </div>
                </div>
              </Card>

              {/* Earning Potential */}
              <Card className="p-4 bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Award className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Earn Bonus Rewards</h4>
                    <p className="text-sm text-muted-foreground">
                      Get 5 bonus claim passes for each person who claims this reward using your referral link!
                    </p>
                  </div>
                </div>
              </Card>

              {/* Share Buttons */}
              <div className="space-y-3">
                <p className="text-sm font-medium">Share on social media:</p>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => handleShare('twitter')}
                  >
                    <Twitter className="w-4 h-4" />
                    Twitter
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => handleShare('facebook')}
                  >
                    <Facebook className="w-4 h-4" />
                    Facebook
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => handleShare('linkedin')}
                  >
                    <Linkedin className="w-4 h-4" />
                    LinkedIn
                  </Button>
                </div>
              </div>

              {/* Copy Link */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Or copy the link:</p>
                <div className="flex gap-2">
                  <Input
                    value={generateShareUrl(selectedSubmission.id)}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    onClick={handleCopyLink}
                    className="gap-2 flex-shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Link2 className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {profile?.referral_code && (
                <p className="text-xs text-muted-foreground text-center">
                  Your referral code: <span className="font-mono font-semibold text-foreground">{profile.referral_code}</span>
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Reward Modal */}
      {submissionToUpdate && (
        <UpdateRewardModal
          open={showUpdateModal}
          onClose={() => setShowUpdateModal(false)}
          submission={submissionToUpdate}
          onSuccess={handleUpdateSuccess}
        />
      )}

      {/* Version History Modal */}
      {versionHistoryId && (
        <RewardVersionHistory
          open={showVersionHistory}
          onClose={() => setShowVersionHistory(false)}
          submissionId={versionHistoryId}
        />
      )}
    </div>
  );
}