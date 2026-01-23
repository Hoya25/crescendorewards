import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { 
  ArrowRight, 
  Image as ImageIcon, 
  AlertCircle, 
  CheckCircle2, 
  MinusCircle,
  DollarSign,
  Lock,
  Package,
  FileText,
  Calendar
} from 'lucide-react';

interface Submission {
  id: string;
  title: string;
  description: string;
  category: string;
  brand: string | null;
  reward_type: string;
  lock_rate: string;
  lock_option: string | null;
  nctr_value: number;
  claim_passes_required: number;
  claims_required: number | null;
  floor_usd_amount: number | null;
  stock_quantity: number | null;
  image_url: string | null;
  status: string;
  admin_notes: string | null;
  version: number;
  version_notes: string | null;
  created_at: string;
}

interface SubmissionComparisonModalProps {
  open: boolean;
  onClose: () => void;
  currentSubmission: Submission;
  parentSubmissionId: string;
}

type FieldChange = {
  field: string;
  label: string;
  oldValue: string | number | null;
  newValue: string | number | null;
  changed: boolean;
};

export function SubmissionComparisonModal({ 
  open, 
  onClose, 
  currentSubmission, 
  parentSubmissionId 
}: SubmissionComparisonModalProps) {
  const [previousSubmission, setPreviousSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && parentSubmissionId) {
      fetchPreviousSubmission();
    }
  }, [open, parentSubmissionId]);

  const fetchPreviousSubmission = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reward_submissions')
        .select('*')
        .eq('id', parentSubmissionId)
        .single();

      if (error) throw error;
      setPreviousSubmission(data);
    } catch (error) {
      console.error('Error fetching previous submission:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFieldChanges = (): FieldChange[] => {
    if (!previousSubmission) return [];

    const fields: { key: keyof Submission; label: string }[] = [
      { key: 'title', label: 'Title' },
      { key: 'description', label: 'Description' },
      { key: 'category', label: 'Category' },
      { key: 'brand', label: 'Brand' },
      { key: 'reward_type', label: 'Reward Type' },
      { key: 'floor_usd_amount', label: 'Floor Amount (USD)' },
      { key: 'lock_option', label: 'Lock Option' },
      { key: 'nctr_value', label: 'NCTR Amount' },
      { key: 'claims_required', label: 'Claims Required' },
      { key: 'stock_quantity', label: 'Stock Quantity' },
      { key: 'image_url', label: 'Image' },
    ];

    return fields.map(({ key, label }) => ({
      field: key,
      label,
      oldValue: previousSubmission[key] as string | number | null,
      newValue: currentSubmission[key] as string | number | null,
      changed: previousSubmission[key] !== currentSubmission[key],
    }));
  };

  const formatValue = (field: string, value: string | number | null): string => {
    if (value === null || value === undefined) return 'Not set';
    if (field === 'floor_usd_amount') return `$${value}`;
    if (field === 'nctr_value') return `${Number(value).toLocaleString()} NCTR`;
    if (field === 'claims_required' || field === 'claim_passes_required') return `${value} Claims`;
    if (field === 'stock_quantity') return value === 0 ? 'Unlimited' : String(value);
    if (field === 'lock_option' || field === 'lock_rate') return `${value}LOCK`;
    if (field === 'category' || field === 'reward_type') {
      return String(value).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    if (field === 'image_url') return value ? 'Updated' : 'Not set';
    return String(value);
  };

  const fieldChanges = getFieldChanges();
  const changedFields = fieldChanges.filter(f => f.changed);
  const unchangedFields = fieldChanges.filter(f => !f.changed);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Compare Versions
            <Badge variant="outline" className="ml-2">
              v{previousSubmission?.version || '?'} → v{currentSubmission.version}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Side-by-side comparison of the rejected version and the resubmission
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : previousSubmission ? (
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-6 pr-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-primary">{changedFields.length}</div>
                  <div className="text-sm text-muted-foreground">Fields Changed</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold">{unchangedFields.length}</div>
                  <div className="text-sm text-muted-foreground">Fields Unchanged</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-amber-600">
                    {currentSubmission.version - previousSubmission.version}
                  </div>
                  <div className="text-sm text-muted-foreground">Version Jump</div>
                </div>
              </div>

              {/* Contributor's Notes */}
              {currentSubmission.version_notes && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <Label className="text-amber-700 dark:text-amber-400 text-xs uppercase tracking-wide flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4" />
                    Contributor's Resubmission Notes
                  </Label>
                  <p className="text-sm">{currentSubmission.version_notes}</p>
                </div>
              )}

              {/* Previous Rejection Reason */}
              {previousSubmission.admin_notes && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <Label className="text-red-700 dark:text-red-400 text-xs uppercase tracking-wide flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4" />
                    Previous Rejection Reason
                  </Label>
                  <p className="text-sm">{previousSubmission.admin_notes}</p>
                </div>
              )}

              <Separator />

              {/* Image Comparison */}
              <div>
                <Label className="text-muted-foreground text-xs uppercase tracking-wide mb-3 block">
                  Image Comparison
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Previous (v{previousSubmission.version})</Badge>
                      {previousSubmission.image_url !== currentSubmission.image_url && (
                        <Badge variant="destructive" className="text-xs">Changed</Badge>
                      )}
                    </div>
                    <div className="aspect-video rounded-lg overflow-hidden border bg-muted">
                      {previousSubmission.image_url ? (
                        <img 
                          src={previousSubmission.image_url} 
                          alt="Previous version"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Current (v{currentSubmission.version})</Badge>
                    </div>
                    <div className="aspect-video rounded-lg overflow-hidden border bg-muted">
                      {currentSubmission.image_url ? (
                        <img 
                          src={currentSubmission.image_url} 
                          alt="Current version"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Changed Fields */}
              {changedFields.length > 0 && (
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wide mb-3 block flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Changed Fields ({changedFields.length})
                  </Label>
                  <div className="space-y-3">
                    {changedFields.map((change) => (
                      <div 
                        key={change.field}
                        className="grid grid-cols-[1fr,auto,1fr] gap-4 items-start p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg"
                      >
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">{change.label} (Previous)</div>
                          <div className={cn(
                            "font-medium",
                            change.field === 'description' ? 'text-sm line-clamp-3' : ''
                          )}>
                            {change.field === 'image_url' ? (
                              change.oldValue ? '✓ Has image' : '✗ No image'
                            ) : (
                              formatValue(change.field, change.oldValue)
                            )}
                          </div>
                        </div>
                        <div className="self-center">
                          <ArrowRight className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">{change.label} (New)</div>
                          <div className={cn(
                            "font-medium text-green-700 dark:text-green-400",
                            change.field === 'description' ? 'text-sm line-clamp-3' : ''
                          )}>
                            {change.field === 'image_url' ? (
                              change.newValue ? '✓ Has image' : '✗ No image'
                            ) : (
                              formatValue(change.field, change.newValue)
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Unchanged Fields */}
              {unchangedFields.length > 0 && (
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wide mb-3 block flex items-center gap-2">
                    <MinusCircle className="w-4 h-4 text-muted-foreground" />
                    Unchanged Fields ({unchangedFields.length})
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {unchangedFields.map((field) => (
                      <div 
                        key={field.field}
                        className="p-2 bg-muted/30 rounded-lg text-sm"
                      >
                        <div className="text-xs text-muted-foreground">{field.label}</div>
                        <div className="font-medium truncate">
                          {formatValue(field.field, field.newValue)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <Separator />
              <div>
                <Label className="text-muted-foreground text-xs uppercase tracking-wide mb-3 block flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Timeline
                </Label>
                <div className="flex items-center gap-4">
                  <div className="flex-1 p-3 bg-muted/30 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Previous Submitted</div>
                    <div className="font-medium">{new Date(previousSubmission.created_at).toLocaleString()}</div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 p-3 bg-muted/30 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Resubmitted</div>
                    <div className="font-medium">{new Date(currentSubmission.created_at).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            Could not load previous version
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
