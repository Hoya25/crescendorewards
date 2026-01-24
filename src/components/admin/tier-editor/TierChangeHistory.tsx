import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, User, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface TierChangeLog {
  id: string;
  tier_id: string;
  changed_by: string | null;
  changed_at: string;
  old_values: Record<string, any>;
  new_values: Record<string, any>;
  change_summary: string | null;
  changer_name?: string;
  tier_name?: string;
}

interface TierChangeHistoryProps {
  tierId?: string;
  limit?: number;
}

export function TierChangeHistory({ tierId, limit = 10 }: TierChangeHistoryProps) {
  const [logs, setLogs] = useState<TierChangeLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [tierId]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('tier_changes_log')
        .select(`
          *,
          status_tiers!tier_id (tier_name, display_name),
          unified_profiles!changed_by (display_name)
        `)
        .order('changed_at', { ascending: false })
        .limit(limit);
      
      if (tierId) {
        query = query.eq('tier_id', tierId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const formatted = (data || []).map((log: any) => ({
        ...log,
        tier_name: log.status_tiers?.display_name || 'Unknown Tier',
        changer_name: log.unified_profiles?.display_name || 'System'
      }));
      
      setLogs(formatted);
    } catch (error) {
      console.error('Error fetching tier change logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChangedFields = (oldValues: Record<string, any>, newValues: Record<string, any>) => {
    const changes: { field: string; old: any; new: any }[] = [];
    
    for (const key of Object.keys(newValues)) {
      if (JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])) {
        changes.push({
          field: key.replace(/_/g, ' '),
          old: oldValues[key],
          new: newValues[key]
        });
      }
    }
    
    return changes;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No change history yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="w-5 h-5" />
          Change History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-4">
            {logs.map(log => {
              const changes = getChangedFields(log.old_values, log.new_values);
              
              return (
                <div key={log.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{log.tier_name}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(log.changed_at), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <User className="w-3 h-3" />
                      {log.changer_name}
                    </div>
                  </div>
                  
                  {log.change_summary && (
                    <p className="text-sm text-muted-foreground">{log.change_summary}</p>
                  )}
                  
                  <div className="space-y-1">
                    {changes.slice(0, 5).map((change, i) => (
                      <div key={i} className="text-xs flex items-center gap-2">
                        <span className="font-medium capitalize">{change.field}:</span>
                        <span className="text-destructive line-through">
                          {typeof change.old === 'boolean' ? (change.old ? 'Yes' : 'No') : change.old}
                        </span>
                        <span>→</span>
                        <span className="text-success">
                          {typeof change.new === 'boolean' ? (change.new ? 'Yes' : 'No') : change.new}
                        </span>
                      </div>
                    ))}
                    {changes.length > 5 && (
                      <span className="text-xs text-muted-foreground">
                        +{changes.length - 5} more changes
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
