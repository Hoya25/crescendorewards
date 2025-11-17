import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Clock, CheckCircle, XCircle, FileText, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface VersionHistoryProps {
  open: boolean;
  onClose: () => void;
  submissionId: string;
}

interface Version {
  id: string;
  version: number;
  status: string;
  version_notes: string | null;
  created_at: string;
  updated_at: string;
  admin_notes: string | null;
}

interface VersionChange {
  previous_version: number;
  new_version: number;
  changed_fields: any;
  change_summary: string;
  created_at: string;
}

export function RewardVersionHistory({ open, onClose, submissionId }: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [changes, setChanges] = useState<VersionChange[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchVersionHistory();
    }
  }, [open, submissionId]);

  const fetchVersionHistory = async () => {
    try {
      setLoading(true);

      // Get the parent submission ID first
      const { data: currentSubmission } = await supabase
        .from('reward_submissions')
        .select('id, parent_submission_id')
        .eq('id', submissionId)
        .single();

      if (!currentSubmission) return;

      const parentId = currentSubmission.parent_submission_id || currentSubmission.id;

      // Fetch all versions
      const { data: versionsData, error: versionsError } = await supabase
        .from('reward_submissions')
        .select('id, version, status, version_notes, created_at, updated_at, admin_notes')
        .or(`id.eq.${parentId},parent_submission_id.eq.${parentId}`)
        .order('version', { ascending: true });

      if (versionsError) throw versionsError;

      // Fetch change history
      const versionIds = versionsData?.map(v => v.id) || [];
      if (versionIds.length > 0) {
        const { data: changesData, error: changesError } = await supabase
          .from('reward_submission_changes')
          .select('*')
          .in('submission_id', versionIds)
          .order('created_at', { ascending: true });

        if (changesError) throw changesError;
        setChanges(changesData || []);
      }

      setVersions(versionsData || []);
    } catch (error) {
      console.error('Error fetching version history:', error);
      toast.error('Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

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

  const renderChangedField = (fieldName: string, change: any) => {
    if (!change) return null;

    return (
      <div className="text-sm py-2">
        <span className="font-medium capitalize">{fieldName.replace(/_/g, ' ')}: </span>
        <span className="text-muted-foreground line-through">{String(change.old || 'N/A')}</span>
        <ArrowRight className="w-3 h-3 inline mx-2" />
        <span className="text-primary font-medium">{String(change.new)}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
          <DialogDescription>
            View all versions and changes to this reward submission
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {versions.map((version, index) => {
            const versionChanges = changes.find(c => c.new_version === version.version);

            return (
              <Card key={version.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">Version {version.version}</h3>
                      {getStatusBadge(version.status)}
                      {index === versions.length - 1 && (
                        <Badge variant="secondary">Latest</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Submitted on {new Date(version.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {version.version_notes && (
                  <div className="mb-4">
                    <div className="flex items-start gap-2 text-sm">
                      <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <span className="font-medium">Changes: </span>
                        <span className="text-muted-foreground">{version.version_notes}</span>
                      </div>
                    </div>
                  </div>
                )}

                {versionChanges && versionChanges.changed_fields && (
                  <div className="bg-muted/30 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-semibold mb-3">Updated Fields:</h4>
                    <div className="space-y-1">
                      {Object.entries(versionChanges.changed_fields).map(([field, change]) => (
                        <div key={field}>
                          {renderChangedField(field, change)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {version.admin_notes && (
                  <div className={`p-3 rounded-lg ${
                    version.status === 'approved' 
                      ? 'bg-green-50 dark:bg-green-950/20' 
                      : 'bg-red-50 dark:bg-red-950/20'
                  }`}>
                    <p className="text-sm font-medium mb-1">Admin Notes:</p>
                    <p className="text-sm">{version.admin_notes}</p>
                  </div>
                )}

                {index < versions.length - 1 && <Separator className="mt-6" />}
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
