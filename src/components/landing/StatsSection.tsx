import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function StatsSection() {
  const [stats, setStats] = useState<{ members: number; nctrEarned: number; rewardsClaimed: number } | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [membersRes, nctrRes, claimsRes] = await Promise.all([
          supabase.from('unified_profiles').select('id', { count: 'exact', head: true }),
          supabase.from('unified_profiles').select('nctr_balance'),
          supabase.from('rewards_claims').select('id', { count: 'exact', head: true }),
        ]);

        const members = membersRes.count || 0;
        const nctrEarned = (nctrRes.data || []).reduce((sum: number, p: any) => sum + (p.nctr_balance || 0), 0);
        const rewardsClaimed = claimsRes.count || 0;

        // Only show if numbers are meaningful for beta
        if (members > 10 || nctrEarned > 100 || rewardsClaimed > 5) {
          setStats({ members, nctrEarned, rewardsClaimed });
        }
      } catch {
        // silently fail
      }
    };
    fetchStats();
  }, []);

  if (!stats) return null;

  const statCards = [
    { label: 'Members', value: stats.members > 10 ? `${stats.members.toLocaleString()}+` : 'Growing Community' },
    { label: 'NCTR Earned', value: stats.nctrEarned > 100 ? stats.nctrEarned.toLocaleString() : '—' },
    { label: 'Rewards Claimed', value: stats.rewardsClaimed > 5 ? stats.rewardsClaimed.toLocaleString() : '—' },
  ].filter((s) => s.value !== '—');

  if (statCards.length < 2) return null;

  return (
    <section className="py-16 md:py-20 px-4 md:px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-10 text-foreground">
          The Community Is Growing
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="bg-muted/40 rounded-2xl p-6 border"
            >
              <p className="text-3xl md:text-4xl font-extrabold text-foreground mb-1">
                {stat.value}
              </p>
              <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
