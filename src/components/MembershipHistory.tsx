import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, TrendingUp, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { membershipTiers } from '@/utils/membershipLevels';

interface HistoryEntry {
  id: string;
  tier_level: number;
  tier_name: string;
  locked_nctr: number;
  previous_tier_level: number | null;
  previous_tier_name: string | null;
  created_at: string;
}

interface MembershipHistoryProps {
  userId: string;
}

export function MembershipHistory({ userId }: MembershipHistoryProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [userId]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('membership_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching membership history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (level: number) => {
    const tier = membershipTiers.find(t => t.level === level);
    return tier?.color || 'hsl(var(--muted))';
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-muted rounded"></div>
            <div className="h-16 bg-muted rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No membership history yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Lock NCTR to upgrade your tier and build your history
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
        <TrendingUp className="w-5 h-5" />
        Membership History
      </h3>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[19px] top-8 bottom-8 w-0.5 bg-border"></div>

        <div className="space-y-6">
          {history.map((entry, index) => (
            <div key={entry.id} className="relative pl-12">
              {/* Timeline dot */}
              <div
                className="absolute left-0 w-10 h-10 rounded-full flex items-center justify-center border-4 border-background z-10"
                style={{ backgroundColor: getTierColor(entry.tier_level) }}
              >
                <Lock className="w-5 h-5 text-white" />
              </div>

              <Card className="p-4 bg-card/50">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {entry.previous_tier_name && (
                        <>
                          <Badge variant="secondary" className="text-xs">
                            {entry.previous_tier_name}
                          </Badge>
                          <span className="text-muted-foreground">→</span>
                        </>
                      )}
                      <Badge
                        style={{
                          backgroundColor: getTierColor(entry.tier_level),
                          color: 'white',
                        }}
                      >
                        {entry.tier_name}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(entry.created_at), 'MMM d, yyyy • h:mm a')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {entry.locked_nctr.toLocaleString()} NCTR
                    </p>
                    <p className="text-xs text-muted-foreground">Locked</p>
                  </div>
                </div>

                {index === 0 && (
                  <Badge variant="outline" className="text-xs">
                    Current Tier
                  </Badge>
                )}
              </Card>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
