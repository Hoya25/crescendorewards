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

interface ReferralAnalyticsDashboardProps {
  onBack: () => void;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export function ReferralAnalyticsDashboard({ onBack }: ReferralAnalyticsDashboardProps) {
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

  const totalStats = {
    shares: analytics.reduce((sum, a) => sum + Number(a.total_shares), 0),
    clicks: analytics.reduce((sum, a) => sum + Number(a.total_clicks), 0),
    conversions: analytics.reduce((sum, a) => sum + Number(a.total_conversions), 0),
    bonusEarned: analytics.reduce((sum, a) => sum + Number(a.total_bonus_earned), 0),
  };

  const overallConversionRate = totalStats.clicks > 0 
    ? ((totalStats.conversions / totalStats.clicks) * 100).toFixed(2)
    : '0.00';

  const topPerformers = [...analytics]
    .sort((a, b) => Number(b.total_conversions) - Number(a.total_conversions))
    .slice(0, 5);

  const conversionChartData = analytics.map(a => ({
    name: a.reward_title.substring(0, 20) + (a.reward_title.length > 20 ? '...' : ''),
    conversions: Number(a.total_conversions),
    clicks: Number(a.total_clicks),
  }));

  const pieChartData = analytics.slice(0, 4).map(a => ({
    name: a.reward_title.substring(0, 15) + '...',
    value: Number(a.total_conversions),
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-primary/20 rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onBack} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Referral Analytics</h1>
                <p className="text-sm text-muted-foreground">Track your shared rewards performance</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Shares</CardTitle>
              <Share2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStats.shares}</div>
              <p className="text-xs text-muted-foreground">Rewards shared</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStats.clicks}</div>
              <p className="text-xs text-muted-foreground">Link clicks received</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStats.conversions}</div>
              <p className="text-xs text-muted-foreground">{overallConversionRate}% conversion rate</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bonus Earned</CardTitle>
              <Coins className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalStats.bonusEarned}</div>
              <p className="text-xs text-muted-foreground">Claim passes earned</p>
            </CardContent>
          </Card>
        </div>

        {analytics.length === 0 ? (
          <Card className="p-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Share2 className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">No Shares Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start sharing rewards with your referral code to track analytics here
                </p>
                <Button onClick={onBack}>
                  Browse Rewards
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Conversion Performance Chart */}
            <Card className="col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Conversion Performance
                </CardTitle>
                <CardDescription>Clicks vs Conversions by reward</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={conversionChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="clicks" fill="hsl(var(--muted))" name="Clicks" />
                    <Bar dataKey="conversions" fill="hsl(var(--primary))" name="Conversions" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Conversion Distribution */}
            {pieChartData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" />
                    Conversion Distribution
                  </CardTitle>
                  <CardDescription>Top performing rewards</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="hsl(var(--primary))"
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Top Performing Rewards
                </CardTitle>
                <CardDescription>Highest conversion rewards</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topPerformers.map((analytic, index) => (
                    <div key={analytic.reward_id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-sm">
                        #{index + 1}
                      </div>
                      {analytic.reward_image ? (
                        <ImageWithFallback
                          src={analytic.reward_image}
                          alt={analytic.reward_title}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Award className="w-6 h-6 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{analytic.reward_title}</p>
                        <p className="text-xs text-muted-foreground">
                          {analytic.total_conversions} conversions • {analytic.conversion_rate}% rate
                        </p>
                      </div>
                      <Badge variant="secondary">
                        +{analytic.total_bonus_earned}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Detailed Breakdown */}
            <Card className="col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle>All Shared Rewards</CardTitle>
                <CardDescription>Complete breakdown of your referral performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.map((analytic) => (
                    <div key={analytic.reward_id} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start gap-4">
                        {analytic.reward_image ? (
                          <ImageWithFallback
                            src={analytic.reward_image}
                            alt={analytic.reward_title}
                            className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Award className="w-10 h-10 text-primary" />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold mb-2">{analytic.reward_title}</h4>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                            <div>
                              <p className="text-xs text-muted-foreground">Shares</p>
                              <p className="text-sm font-semibold">{analytic.total_shares}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Clicks</p>
                              <p className="text-sm font-semibold">{analytic.total_clicks}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Conversions</p>
                              <p className="text-sm font-semibold text-primary">{analytic.total_conversions}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Bonus Earned</p>
                              <p className="text-sm font-semibold text-primary">+{analytic.total_bonus_earned}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge variant={Number(analytic.conversion_rate) > 5 ? "default" : "secondary"}>
                              {analytic.conversion_rate}% conversion rate
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Last shared: {new Date(analytic.last_shared_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
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
