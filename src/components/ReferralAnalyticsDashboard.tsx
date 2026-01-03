import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { ArrowLeft, TrendingUp, Users, MousePointerClick, Award, Zap, Share2, ExternalLink, Coins } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';

interface ShareAnalytic {
  reward_id: string;
  reward_title: string;
  reward_image: string | null;
  total_shares: number;
  total_clicks: number;
  total_conversions: number;
  total_bonus_earned: number;
  conversion_rate: number;
  last_shared_at: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export function ReferralAnalyticsDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [analytics, setAnalytics] = useState<ShareAnalytic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_share_analytics');
      
      if (error) throw error;
      setAnalytics(data || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load referral analytics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const totalShares = analytics.reduce((sum, a) => sum + a.total_shares, 0);
  const totalClicks = analytics.reduce((sum, a) => sum + a.total_clicks, 0);
  const totalConversions = analytics.reduce((sum, a) => sum + a.total_conversions, 0);
  const totalBonus = analytics.reduce((sum, a) => sum + a.total_bonus_earned, 0);
  const avgConversionRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(1) : '0';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="w-8 h-8" />
            Referral Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your reward sharing performance
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Share2 className="w-4 h-4" />
                <span className="text-sm">Total Shares</span>
              </div>
              <p className="text-2xl font-bold">{totalShares}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <MousePointerClick className="w-4 h-4" />
                <span className="text-sm">Total Clicks</span>
              </div>
              <p className="text-2xl font-bold">{totalClicks}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Users className="w-4 h-4" />
                <span className="text-sm">Conversions</span>
              </div>
              <p className="text-2xl font-bold">{totalConversions}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Coins className="w-4 h-4" />
                <span className="text-sm">Bonus Earned</span>
              </div>
              <p className="text-2xl font-bold">{totalBonus}</p>
            </CardContent>
          </Card>
        </div>

        {analytics.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Share2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No Referral Data Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start sharing rewards to earn bonuses!
              </p>
              <Button onClick={() => navigate('/rewards')}>
                Browse Rewards
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.slice(0, 5)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="reward_title" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="total_clicks" fill="hsl(var(--primary))" name="Clicks" />
                      <Bar dataKey="total_conversions" fill="hsl(var(--secondary))" name="Conversions" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Reward List */}
            <Card>
              <CardHeader>
                <CardTitle>Shared Rewards</CardTitle>
                <CardDescription>Your most shared rewards</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.map((item) => (
                    <div key={item.reward_id} className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        <ImageWithFallback
                          src={item.reward_image || '/placeholder.svg'}
                          alt={item.reward_title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{item.reward_title}</h4>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Badge variant="secondary">{item.total_shares} shares</Badge>
                          <Badge variant="outline">{item.total_clicks} clicks</Badge>
                          <Badge className="bg-green-100 text-green-700">
                            {item.total_conversions} conversions
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Bonus</p>
                        <p className="font-bold text-green-600">+{item.total_bonus_earned}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
