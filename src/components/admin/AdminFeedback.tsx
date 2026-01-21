import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { MessageSquare, Trash2, Image, Search, ExternalLink, CheckCircle, XCircle, Clock, CheckCheck, Eye } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FeedbackItem {
  id: string;
  user_id: string | null;
  page_url: string;
  whats_working: string | null;
  whats_broken: string | null;
  image_url: string | null;
  created_at: string;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  user_email?: string;
  reviewer_email?: string;
}

export function AdminFeedback() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: feedback, isLoading } = useQuery({
    queryKey: ['admin-feedback'],
    queryFn: async () => {
      // Get feedback with user info
      const { data: feedbackData, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user emails for feedback with user_id and reviewed_by
      const userIds = [
        ...new Set([
          ...(feedbackData?.filter(f => f.user_id).map(f => f.user_id) || []),
          ...(feedbackData?.filter(f => f.reviewed_by).map(f => f.reviewed_by) || [])
        ])
      ];

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', userIds);

        const emailMap = new Map(profiles?.map(p => [p.id, p.email]) || []);

        return feedbackData?.map(f => ({
          ...f,
          user_email: f.user_id ? emailMap.get(f.user_id) : null,
          reviewer_email: f.reviewed_by ? emailMap.get(f.reviewed_by) : null
        })) as FeedbackItem[];
      }

      return feedbackData as FeedbackItem[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (feedbackId: string) => {
      const { error } = await supabase
        .from('feedback')
        .delete()
        .eq('id', feedbackId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
      toast({ title: 'Feedback deleted' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error deleting feedback',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ feedbackId, status }: { feedbackId: string; status: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('feedback')
        .update({ 
          status,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', feedbackId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
      toast({ title: 'Status updated' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const filteredFeedback = feedback?.filter(f => {
    // Apply status filter
    if (statusFilter !== 'all' && f.status !== statusFilter) return false;
    
    // Apply search filter
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      f.page_url.toLowerCase().includes(query) ||
      f.whats_working?.toLowerCase().includes(query) ||
      f.whats_broken?.toLowerCase().includes(query) ||
      f.user_email?.toLowerCase().includes(query)
    );
  });

  const stats = {
    total: feedback?.length || 0,
    pending: feedback?.filter(f => f.status === 'pending').length || 0,
    reviewed: feedback?.filter(f => f.status === 'reviewed').length || 0,
    resolved: feedback?.filter(f => f.status === 'resolved').length || 0,
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Beta Feedback</h2>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search feedback..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card 
          className={`cursor-pointer transition-colors ${statusFilter === 'all' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-colors ${statusFilter === 'pending' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setStatusFilter('pending')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-colors ${statusFilter === 'reviewed' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setStatusFilter('reviewed')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Reviewed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.reviewed}</div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-colors ${statusFilter === 'resolved' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setStatusFilter('resolved')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCheck className="w-4 h-4" />
              Resolved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{stats.resolved}</div>
          </CardContent>
        </Card>
      </div>

      {/* Feedback Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Date</TableHead>
                <TableHead className="w-[180px]">User</TableHead>
                <TableHead className="w-[120px]">Page</TableHead>
                <TableHead>Feedback</TableHead>
                <TableHead className="w-[130px]">Status</TableHead>
                <TableHead className="w-[80px] text-center">Screenshot</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFeedback?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No feedback found
                  </TableCell>
                </TableRow>
              ) : (
                filteredFeedback?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(item.created_at), 'MMM d, yyyy')}
                      <br />
                      <span className="text-xs">{format(new Date(item.created_at), 'h:mm a')}</span>
                    </TableCell>
                    <TableCell>
                      {item.user_email ? (
                        <span className="text-sm truncate block max-w-[160px]">{item.user_email}</span>
                      ) : (
                        <Badge variant="outline" className="text-xs">Anonymous</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded truncate block max-w-[100px]">
                        {item.page_url}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2 max-w-sm">
                        {item.whats_working && (
                          <div className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400 mt-0.5 shrink-0" />
                            <p className={`text-sm ${expandedFeedback === item.id ? '' : 'line-clamp-2'}`}>
                              {item.whats_working}
                            </p>
                          </div>
                        )}
                        {item.whats_broken && (
                          <div className="flex items-start gap-2">
                            <XCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                            <p className={`text-sm ${expandedFeedback === item.id ? '' : 'line-clamp-2'}`}>
                              {item.whats_broken}
                            </p>
                          </div>
                        )}
                        {((item.whats_working?.length || 0) > 100 || (item.whats_broken?.length || 0) > 100) && (
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs"
                            onClick={() => setExpandedFeedback(
                              expandedFeedback === item.id ? null : item.id
                            )}
                          >
                            {expandedFeedback === item.id ? 'Show less' : 'Show more'}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={item.status}
                        onValueChange={(value) => updateStatusMutation.mutate({ feedbackId: item.id, status: value })}
                      >
                        <SelectTrigger className="w-[120px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">
                            <span className="flex items-center gap-2">
                              <Clock className="w-3 h-3 text-amber-500" />
                              Pending
                            </span>
                          </SelectItem>
                          <SelectItem value="reviewed">
                            <span className="flex items-center gap-2">
                              <Eye className="w-3 h-3 text-blue-500" />
                              Reviewed
                            </span>
                          </SelectItem>
                          <SelectItem value="resolved">
                            <span className="flex items-center gap-2">
                              <CheckCheck className="w-3 h-3 text-emerald-500" />
                              Resolved
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {item.reviewed_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(item.reviewed_at), 'MMM d')}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.image_url ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedImage(item.image_url)}
                          className="text-primary hover:text-primary/80"
                        >
                          <Image className="w-4 h-4" />
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(item.id)}
                        disabled={deleteMutation.isPending}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Screenshot Lightbox */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Screenshot
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(selectedImage!, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Full Size
              </Button>
            </DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Feedback screenshot"
              className="w-full h-auto rounded-lg max-h-[70vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}