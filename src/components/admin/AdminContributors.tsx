import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserCircle, FileCheck, Award } from 'lucide-react';

export function AdminContributors() {
  // Contributors are users who have submitted rewards
  const { data: contributors = [], isLoading } = useQuery({
    queryKey: ['admin-contributors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reward_submissions')
        .select('user_id, status')
        .eq('is_latest_version', true);
      if (error) throw error;

      // Aggregate by user
      const map = new Map<string, { total: number; approved: number; pending: number; rejected: number }>();
      (data || []).forEach(s => {
        const entry = map.get(s.user_id) || { total: 0, approved: 0, pending: 0, rejected: 0 };
        entry.total++;
        if (s.status === 'approved') entry.approved++;
        else if (s.status === 'pending') entry.pending++;
        else if (s.status === 'rejected') entry.rejected++;
        map.set(s.user_id, entry);
      });

      // Fetch profiles for these users
      const userIds = [...map.keys()];
      if (userIds.length === 0) return [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', userIds);

      return (profiles || []).map(p => ({
        ...p,
        stats: map.get(p.id) || { total: 0, approved: 0, pending: 0, rejected: 0 },
      }));
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <UserCircle className="h-6 w-6" /> Contributors
        </h2>
        <p className="text-muted-foreground mt-1">Members who submit rewards and content to the community</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{contributors.length}</p>
            <p className="text-xs text-muted-foreground">Total Contributors</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{contributors.reduce((s, c) => s + c.stats.approved, 0)}</p>
            <p className="text-xs text-muted-foreground">Approved Submissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{contributors.reduce((s, c) => s + c.stats.pending, 0)}</p>
            <p className="text-xs text-muted-foreground">Pending Review</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contributor</TableHead>
                <TableHead>Total Submissions</TableHead>
                <TableHead>Approved</TableHead>
                <TableHead>Pending</TableHead>
                <TableHead>Rejected</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : contributors.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No contributors yet</TableCell></TableRow>
              ) : (
                contributors.map(c => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                          {c.avatar_url ? <img src={c.avatar_url} alt="" className="w-full h-full object-cover" /> : <UserCircle className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{c.full_name || 'Anonymous'}</p>
                          <p className="text-xs text-muted-foreground">{c.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{c.stats.total}</Badge></TableCell>
                    <TableCell><span className="text-green-600 font-medium">{c.stats.approved}</span></TableCell>
                    <TableCell><span className="text-yellow-600 font-medium">{c.stats.pending}</span></TableCell>
                    <TableCell><span className="text-red-600 font-medium">{c.stats.rejected}</span></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
