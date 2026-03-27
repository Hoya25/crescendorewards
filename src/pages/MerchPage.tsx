import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { ShoppingBag, Zap, TrendingUp, ShoppingCart, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

const MERCH_STORE_URL = 'https://merch.nctr.live';

const cardStyle = 'bg-[rgba(50,50,50,0.6)] border border-[rgba(226,255,109,0.15)] rounded-none p-6';

function ShopNowButton({ className = '' }: { className?: string }) {
  return (
    <a
      href={MERCH_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 bg-[#E2FF6D] text-[#323232] font-bold uppercase px-6 py-3 rounded-none hover:bg-[#d4f050] transition-colors ${className}`}
    >
      SHOP NOW
      <ExternalLink className="w-4 h-4" />
    </a>
  );
}

export default function MerchPage() {
  const { user } = useAuthContext();
  const { profile } = useUnifiedUser();

  // Fetch shop settings for earn rate
  const { data: shopSettings } = useQuery({
    queryKey: ['shop_settings', 'nctr-merch'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shop_settings' as any)
        .select('nctr_per_dollar, is_active')
        .eq('store_identifier', 'nctr-merch')
        .single();
      if (error) throw error;
      return data as { nctr_per_dollar: number; is_active: boolean } | null;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Fetch user's merch transactions
  const userEmail = profile?.email || user?.email;
  const userId = user?.id;

  const { data: transactions } = useQuery({
    queryKey: ['shop_transactions', userId, userEmail],
    queryFn: async () => {
      let query = supabase
        .from('shop_transactions' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      // Build OR filter for user_id or email match
      if (userId && userEmail) {
        query = query.or(`user_id.eq.${userId},customer_email.ilike.${userEmail}`);
      } else if (userId) {
        query = query.eq('user_id', userId);
      } else if (userEmail) {
        query = query.ilike('customer_email', userEmail);
      } else {
        return [];
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Array<{
        id: string;
        order_number: string;
        order_total: number;
        currency: string;
        nctr_earned: number;
        status: string;
        created_at: string;
      }>;
    },
    enabled: !!(userId || userEmail),
    staleTime: 1000 * 60 * 1,
  });

  const creditedTransactions = transactions?.filter(t => t.status === 'credited') || [];
  const totalNctrEarned = creditedTransactions.reduce((sum, t) => sum + (t.nctr_earned || 0), 0);
  const totalOrders = transactions?.length || 0;
  const mostRecentDate = transactions?.[0]?.created_at;

  const isActive = shopSettings?.is_active !== false;
  const earnRate = shopSettings?.nctr_per_dollar ?? 0;

  return (
    <div className="min-h-screen bg-[#131313]">
      {/* 1. HERO BANNER */}
      <section className="bg-[#323232] py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold uppercase text-white tracking-wide" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 }}>
            SHOP THE ALLIANCE
          </h1>
          <p className="text-[#D9D9D9] text-lg">
            Every purchase earns NCTR. Wear it. Own it.
          </p>
          <div className="pt-2">
            <ShopNowButton />
          </div>
          <p className="text-[#5A5A58] text-sm pt-1">
            Earn NCTR on every dollar spent
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* 2. EARNING RATE CARD */}
        <div className={cardStyle}>
          <div className="flex items-center gap-3 mb-3">
            <ShoppingBag className="w-6 h-6 text-[#E2FF6D]" />
            <h2 className="text-white text-lg font-semibold">Current Earn Rate</h2>
          </div>
          {isActive ? (
            <p className="text-[#E2FF6D] text-3xl font-bold" style={{ fontFamily: "'DM Mono', monospace" }}>
              {earnRate} NCTR per $1 spent
            </p>
          ) : (
            <p className="text-[#5A5A58] text-lg">Merch rewards temporarily paused</p>
          )}
        </div>

        {/* 3. YOUR MERCH EARNINGS (logged in only) */}
        {user && (
          <div className={cardStyle}>
            <h2 className="text-white text-lg font-semibold mb-4">Your Merch Earnings</h2>
            {totalOrders > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <p className="text-[#D9D9D9] text-sm mb-1">Total NCTR Earned</p>
                  <p className="text-[#E2FF6D] text-3xl font-bold" style={{ fontFamily: "'DM Mono', monospace" }}>
                    {totalNctrEarned.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[#D9D9D9] text-sm mb-1">Total Orders</p>
                  <p className="text-white text-3xl font-bold" style={{ fontFamily: "'DM Mono', monospace" }}>
                    {totalOrders}
                  </p>
                </div>
                <div>
                  <p className="text-[#D9D9D9] text-sm mb-1">Most Recent Order</p>
                  <p className="text-white text-lg font-medium">
                    {mostRecentDate ? format(new Date(mostRecentDate), 'MMM d, yyyy') : '—'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-3">
                <p className="text-[#D9D9D9]">No merch purchases yet. Shop the store to start earning!</p>
                <ShopNowButton />
              </div>
            )}
          </div>
        )}

        {/* 4. RECENT ORDERS TABLE */}
        {user && transactions && transactions.length > 0 && (
          <div className={cardStyle}>
            <h2 className="text-white text-lg font-semibold mb-4">Recent Orders</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[rgba(226,255,109,0.15)]">
                    <th className="text-[#D9D9D9] text-xs uppercase tracking-wider pb-3 pr-4">Date</th>
                    <th className="text-[#D9D9D9] text-xs uppercase tracking-wider pb-3 pr-4">Order #</th>
                    <th className="text-[#D9D9D9] text-xs uppercase tracking-wider pb-3 pr-4">Total</th>
                    <th className="text-[#D9D9D9] text-xs uppercase tracking-wider pb-3 pr-4">NCTR Earned</th>
                    <th className="text-[#D9D9D9] text-xs uppercase tracking-wider pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-[rgba(226,255,109,0.08)]">
                      <td className="text-white text-sm py-3 pr-4">
                        {format(new Date(tx.created_at), 'MMM d, yyyy')}
                      </td>
                      <td className="text-white text-sm py-3 pr-4" style={{ fontFamily: "'DM Mono', monospace" }}>
                        #{tx.order_number}
                      </td>
                      <td className="text-white text-sm py-3 pr-4">
                        ${(tx.order_total || 0).toFixed(2)} {tx.currency?.toUpperCase() || 'USD'}
                      </td>
                      <td className="text-[#E2FF6D] text-sm font-semibold py-3 pr-4" style={{ fontFamily: "'DM Mono', monospace" }}>
                        {(tx.nctr_earned || 0).toLocaleString()}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-block px-2 py-0.5 text-xs font-semibold uppercase rounded-none ${
                            tx.status === 'credited'
                              ? 'bg-[#E2FF6D] text-[#323232]'
                              : 'bg-[#5A5A58] text-[#D9D9D9]'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. HOW IT WORKS */}
        <div>
          <h2 className="text-white text-lg font-semibold mb-4">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: ShoppingCart, title: 'Shop', desc: 'Browse merch at merch.nctr.live' },
              { icon: Zap, title: 'Earn', desc: 'NCTR is automatically credited to your account' },
              { icon: TrendingUp, title: 'Grow', desc: 'NCTR earnings count toward your Crescendo status' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className={cardStyle}>
                <Icon className="w-8 h-8 text-[#E2FF6D] mb-3" />
                <h3 className="text-white font-semibold mb-1">{title}</h3>
                <p className="text-[#D9D9D9] text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. BOTTOM CTA */}
      <section className="bg-[#E2FF6D] py-8 px-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-[#323232] text-xl font-bold" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            Ready to earn?
          </span>
          <a
            href={MERCH_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#323232] text-white font-bold uppercase px-6 py-3 rounded-none hover:bg-[#444] transition-colors"
          >
            VISIT THE STORE
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </section>
    </div>
  );
}
