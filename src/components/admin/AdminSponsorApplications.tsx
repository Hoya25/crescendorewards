import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { 
  FileCheck, 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  ExternalLink, 
  Mail, 
  User, 
  Building2,
  Clock,
  Search
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface SponsorApplication {
  id: string;
  user_id: string | null;
  company_name: string;
  contact_name: string;
  contact_email: string;
  website_url: string | null;
  description: string | null;
  type: string;
  intended_contribution: string | null;
  status: string;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'more_info', label: 'More Info Needed' },
];

const TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'brand', label: 'Brand' },
  { value: 'creator', label: 'Creator' },
  { value: 'employer', label: 'Employer' },
  { value: 'individual', label: 'Individual' },
  { value: 'nonprofit', label: 'Nonprofit' },
  { value: 'organization', label: 'Organization' },
];

export function AdminSponsorApplications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<SponsorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Review modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewingApplication, setReviewingApplication] = useState<SponsorApplication | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'more_info'>('approve');
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sponsor_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load applications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications = applications.filter(app => {
    if (statusFilter !== 'all' && app.status !== statusFilter) return false;
    if (typeFilter !== 'all' && app.type !== typeFilter) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      if (
        !app.company_name.toLowerCase().includes(search) &&
        !app.contact_name.toLowerCase().includes(search) &&
        !app.contact_email.toLowerCase().includes(search)
      ) {
        return false;
      }
    }
    return true;
  });

  const pendingCount = applications.filter(a => a.status === 'pending').length;

  const openReviewModal = (application: SponsorApplication, action: 'approve' | 'reject' | 'more_info') => {
    setReviewingApplication(application);
    setReviewAction(action);
    setAdminNotes(application.admin_notes || '');
    setShowReviewModal(true);
  };

  const handleReview = async () => {
    if (!reviewingApplication || !user) return;

    setProcessing(true);
    try {
      const now = new Date().toISOString();
      
      // Update application status
      const { error: updateError } = await supabase
        .from('sponsor_applications')
        .update({
          status: reviewAction === 'more_info' ? 'more_info' : reviewAction === 'approve' ? 'approved' : 'rejected',
          admin_notes: adminNotes || null,
          reviewed_by: user.id,
          reviewed_at: now,
        })
        .eq('id', reviewingApplication.id);

      if (updateError) throw updateError;

      // If approved, create sponsor profile
      if (reviewAction === 'approve') {
        // Generate slug from company name
        const slug = reviewingApplication.company_name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        const { error: sponsorError } = await supabase
          .from('sponsors')
          .insert({
            name: reviewingApplication.company_name,
            slug: slug,
            user_id: reviewingApplication.user_id,
            contact_email: reviewingApplication.contact_email,
            website_url: reviewingApplication.website_url,
            description: reviewingApplication.description,
            type: reviewingApplication.type,
            is_active: true,
            is_verified: true,
          });

        if (sponsorError) {
          // If it's a duplicate slug, try with timestamp
          if (sponsorError.code === '23505') {
            const slugWithTime = `${slug}-${Date.now()}`;
            const { error: retryError } = await supabase
              .from('sponsors')
              .insert({
                name: reviewingApplication.company_name,
                slug: slugWithTime,
                user_id: reviewingApplication.user_id,
                contact_email: reviewingApplication.contact_email,
                website_url: reviewingApplication.website_url,
                description: reviewingApplication.description,
                type: reviewingApplication.type,
                is_active: true,
                is_verified: true,
              });
            if (retryError) throw retryError;
          } else {
            throw sponsorError;
          }
        }
      }

      toast({
        title: 'Application Reviewed',
        description: reviewAction === 'approve' 
          ? `${reviewingApplication.company_name} has been approved as a sponsor` 
          : reviewAction === 'reject'
          ? 'Application has been rejected'
          : 'Request for more information sent',
      });

      setShowReviewModal(false);
      setReviewingApplication(null);
      setAdminNotes('');
      loadApplications();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to process application',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200">Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-200">Rejected</Badge>;
      case 'more_info':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200">More Info</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const labels: Record<string, { label: string; className: string }> = {
      brand: { label: 'Brand', className: 'bg-purple-500/10 text-purple-600 border-purple-200' },
      creator: { label: 'Creator', className: 'bg-pink-500/10 text-pink-600 border-pink-200' },
      employer: { label: 'Employer', className: 'bg-blue-500/10 text-blue-600 border-blue-200' },
      individual: { label: 'Individual', className: 'bg-slate-500/10 text-slate-600 border-slate-200' },
      nonprofit: { label: 'Nonprofit', className: 'bg-green-500/10 text-green-600 border-green-200' },
      organization: { label: 'Organization', className: 'bg-orange-500/10 text-orange-600 border-orange-200' },
    };
    const config = labels[type] || { label: type, className: '' };
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <FileCheck className="w-8 h-8" />
            Sponsor Applications
          </h2>
          <p className="text-muted-foreground mt-1">
            Review and approve sponsor partnership requests
          </p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="destructive" className="text-lg px-4 py-2">
            {pendingCount} Pending
          </Badge>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by company, name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : filteredApplications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <FileCheck className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="font-medium">No applications found</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {statusFilter === 'pending' ? 'All caught up!' : 'Try adjusting your filters'}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredApplications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          {app.company_name}
                        </div>
                        {app.website_url && (
                          <a 
                            href={app.website_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {app.website_url.replace(/^https?:\/\//, '').slice(0, 30)}
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-muted-foreground" />
                          {app.contact_name}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          {app.contact_email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(app.type)}</TableCell>
                    <TableCell>{getStatusBadge(app.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(app.created_at), { addSuffix: true })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {app.status === 'pending' || app.status === 'more_info' ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-green-600 border-green-200 hover:bg-green-50"
                            onClick={() => openReviewModal(app, 'approve')}
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => openReviewModal(app, 'reject')}
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1"
                            onClick={() => openReviewModal(app, 'more_info')}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Reviewed {app.reviewed_at && formatDistanceToNow(new Date(app.reviewed_at), { addSuffix: true })}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Review Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {reviewAction === 'approve' && <CheckCircle className="w-5 h-5 text-green-600" />}
              {reviewAction === 'reject' && <XCircle className="w-5 h-5 text-red-600" />}
              {reviewAction === 'more_info' && <MessageSquare className="w-5 h-5 text-blue-600" />}
              {reviewAction === 'approve' ? 'Approve Application' : 
               reviewAction === 'reject' ? 'Reject Application' : 'Request More Information'}
            </DialogTitle>
            <DialogDescription>
              {reviewingApplication?.company_name} - {reviewingApplication?.contact_email}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Application Details */}
            <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
              <div><strong>Type:</strong> {reviewingApplication?.type}</div>
              {reviewingApplication?.description && (
                <div><strong>Description:</strong> {reviewingApplication.description}</div>
              )}
              {reviewingApplication?.intended_contribution && (
                <div><strong>Intended Contribution:</strong> {reviewingApplication.intended_contribution}</div>
              )}
            </div>

            {/* Admin Notes */}
            <div className="space-y-2">
              <Label>
                {reviewAction === 'reject' ? 'Rejection Reason' : 
                 reviewAction === 'more_info' ? 'What info do you need?' : 'Admin Notes (optional)'}
              </Label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={
                  reviewAction === 'reject' ? 'Explain why the application was rejected...' :
                  reviewAction === 'more_info' ? 'Specify what additional information is needed...' :
                  'Any notes about this approval...'
                }
                rows={3}
              />
            </div>

            {reviewAction === 'approve' && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>This will create a new sponsor profile</strong> for {reviewingApplication?.company_name} 
                  and grant them access to the Sponsor Portal.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReview}
              disabled={processing || (reviewAction !== 'approve' && !adminNotes)}
              className={cn(
                reviewAction === 'approve' && 'bg-green-600 hover:bg-green-700',
                reviewAction === 'reject' && 'bg-red-600 hover:bg-red-700'
              )}
            >
              {processing ? 'Processing...' : 
               reviewAction === 'approve' ? 'Approve & Create Sponsor' :
               reviewAction === 'reject' ? 'Reject Application' : 'Send Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
