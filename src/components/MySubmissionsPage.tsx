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
  FileText, Filter, AlertCircle
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
}

export function MySubmissionsPage({ onBack }: SubmissionPageProps) {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<RewardSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (user) {
      fetchSubmissions();
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
        return 'Your reward has been approved and will be added to the marketplace';
      case 'rejected':
        return 'Your submission was not approved. Check admin notes below for details';
      default:
        return '';
    }
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
                      <img 
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
                        <h3 className="text-2xl font-bold mb-2">{submission.title}</h3>
                        <p className="text-muted-foreground">{submission.description}</p>
                      </div>
                      {getStatusBadge(submission.status)}
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
                      <div className="bg-muted/50 rounded-lg p-4">
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
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}