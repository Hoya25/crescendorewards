import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface AuditEntry {
  id: string;
  admin_user_id: string;
  action: string;
  target_handle: string;
  target_user_id: string | null;
  notes: string | null;
  created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  revoke: '#EF4444',
  transfer: '#3B82F6',
  reserve: '#F97316',
  unreserve: '#6B7280',
  add_reserved: '#22C55E',
  remove_reserved: '#EF4444',
};

export function AdminHandleAuditLog() {
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['admin-handle-audit-log'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('handle_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as AuditEntry[];
    },
  });

  return (
    <Card>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : entries.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">No audit entries yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Handle</th>
                  <th className="px-4 py-3 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e.id} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {new Date(e.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant="outline" className="text-[10px]"
                             style={{ borderColor: (ACTION_COLORS[e.action] || '#6B7280') + '60', color: ACTION_COLORS[e.action] || '#6B7280' }}>
                        {e.action}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs">@{e.target_handle}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{e.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
