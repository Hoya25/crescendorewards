import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Users, ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface StatusTier {
  id: string;
  tier_name: string;
  display_name: string;
  badge_emoji: string;
  earning_multiplier: number;
  claims_per_year: number;
  discount_percent: number;
}

interface TierUserCount {
  tier_id: string;
  tier_name: string;
  user_count: number;
}

interface UserImpactPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalTiers: StatusTier[];
  modifiedTiers: StatusTier[];
  onConfirm: () => void;
}

export function UserImpactPreview({
  open,
  onOpenChange,
  originalTiers,
  modifiedTiers,
  onConfirm
}: UserImpactPreviewProps) {
  const [userCounts, setUserCounts] = useState<TierUserCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchUserCounts();
    }
  }, [open]);

  const fetchUserCounts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_tier_user_counts');
      
      if (error) throw error;
      setUserCounts(data || []);
    } catch (error) {
      console.error('Error fetching user counts:', error);
      setUserCounts([]);
    } finally {
      setLoading(false);
    }
  };

  const getChangesForTier = (tierId: string) => {
    const original = originalTiers.find(t => t.id === tierId);
    const modified = modifiedTiers.find(t => t.id === tierId);
    
    if (!original || !modified) return [];
    
    const changes: { field: string; old: any; new: any; direction: 'up' | 'down' | 'same' }[] = [];
    
    if (original.earning_multiplier !== modified.earning_multiplier) {
      changes.push({
        field: 'Multiplier',
        old: `${original.earning_multiplier}x`,
        new: `${modified.earning_multiplier}x`,
        direction: modified.earning_multiplier > original.earning_multiplier ? 'up' : 'down'
      });
    }
    
    if (original.claims_per_year !== modified.claims_per_year) {
      changes.push({
        field: 'Claims/Year',
        old: original.claims_per_year,
        new: modified.claims_per_year,
        direction: modified.claims_per_year > original.claims_per_year ? 'up' : 'down'
      });
    }
    
    if (original.discount_percent !== modified.discount_percent) {
      changes.push({
        field: 'Discount',
        old: `${original.discount_percent}%`,
        new: `${modified.discount_percent}%`,
        direction: modified.discount_percent > original.discount_percent ? 'up' : 'down'
      });
    }
    
    return changes;
  };

  const totalAffectedUsers = userCounts.reduce((sum, tc) => {
    const changes = getChangesForTier(tc.tier_id);
    return sum + (changes.length > 0 ? Number(tc.user_count) : 0);
  }, 0);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            User Impact Preview
          </AlertDialogTitle>
          <AlertDialogDescription>
            Review how these changes will affect members before saving.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 my-4">
          {loading ? (
            <div className="text-center py-4 text-muted-foreground">Loading user counts...</div>
          ) : (
            <>
              {userCounts.map(tc => {
                const tier = modifiedTiers.find(t => t.id === tc.tier_id);
                const changes = getChangesForTier(tc.tier_id);
                
                if (!tier) return null;
                
                return (
                  <div key={tc.tier_id} className="flex items-start justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{tier.badge_emoji}</span>
                      <div>
                        <div className="font-medium">{tier.display_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {tc.user_count.toLocaleString()} member{Number(tc.user_count) !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {changes.length === 0 ? (
                        <Badge variant="outline" className="text-xs">
                          <Minus className="w-3 h-3 mr-1" />
                          No change
                        </Badge>
                      ) : (
                        <div className="space-y-1">
                          {changes.map((change, i) => (
                            <div key={i} className="flex items-center gap-1 text-xs justify-end">
                              {change.direction === 'up' ? (
                                <ArrowUp className="w-3 h-3 text-success" />
                              ) : (
                                <ArrowDown className="w-3 h-3 text-destructive" />
                              )}
                              <span>{change.field}:</span>
                              <span className="text-muted-foreground">{change.old}</span>
                              <span>→</span>
                              <span className={change.direction === 'up' ? 'text-success' : 'text-destructive'}>
                                {change.new}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {totalAffectedUsers > 0 && (
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <span className="font-medium">{totalAffectedUsers.toLocaleString()}</span>
                  <span className="text-muted-foreground"> members will be affected by these changes</span>
                </div>
              )}
            </>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Save Changes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
