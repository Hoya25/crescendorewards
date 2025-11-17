import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, CheckCircle2, ExternalLink, Users, Share2, Calendar, Zap, Store, Trophy, Gift, Lock, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EarnNCTRProps {
  onBack: () => void;
  onNavigateToRewards?: () => void;
  onNavigateToStatus?: () => void;
  onNavigateToBrands?: () => void;
  onRefreshProfile?: () => void;
}

interface EarnTask {
  task_id: string;
  task_type: 'daily' | 'social' | 'referral' | 'challenge' | 'partner';
  title: string;
  description: string;
  reward_amount: number;
  icon: string;
  link: string | null;
  recurring: boolean;
  is_completed: boolean;
  completed_at: string | null;
}

const iconMap: Record<string, any> = {
  'calendar': Calendar,
  'gift': Gift,
  'trophy': Trophy,
  'share': Share2,
  'users': Users,
  'user-plus': Users,
  'lock': Lock,
  'zap': Zap,
  'store': Store,
  'star': Trophy,
};

const categoryConfig = {
  daily: { title: 'Daily Opportunities', icon: Calendar, color: 'violet' },
  social: { title: 'Social Tasks', icon: Share2, color: 'blue' },
  referral: { title: 'Referral Rewards', icon: Users, color: 'amber' },
  challenge: { title: 'Challenges', icon: Trophy, color: 'purple' },
  partner: { title: 'Partner Activities', icon: Store, color: 'green' },
};

export function EarnNCTR({ onBack, onNavigateToRewards, onNavigateToStatus, onNavigateToBrands, onRefreshProfile }: EarnNCTRProps) {
  const [tasks, setTasks] = useState<EarnTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingTask, setCompletingTask] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_task_progress' as any);
      
      if (error) {
        console.error('Error loading tasks:', error);
        toast.error('Failed to load tasks');
        return;
      }

      setTasks((data as any) || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId: string, taskTitle: string, hasLink: boolean) => {
    setCompletingTask(taskId);

    try {
      const { data, error } = await supabase.rpc('complete_task' as any, {
        p_task_id: taskId,
      });

      if (error) {
        console.error('Error completing task:', error);
        toast.error('Failed to complete task');
        return;
      }

      const result = data as any;
      if (result?.success) {
        toast.success(result.message || `+${result.reward_amount} NCTR earned!`, {
          description: taskTitle,
        });
        
        await loadTasks();
        
        if (onRefreshProfile) {
          onRefreshProfile();
        }
      } else {
        toast.error(result?.error || 'Task already completed');
      }
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Failed to complete task');
    } finally {
      setCompletingTask(null);
    }
  };

  const groupedTasks = tasks.reduce((acc, task) => {
    if (!acc[task.task_type]) {
      acc[task.task_type] = [];
    }
    acc[task.task_type].push(task);
    return acc;
  }, {} as Record<string, EarnTask[]>);

  const filteredCategories = activeCategory === 'all' 
    ? Object.keys(groupedTasks) 
    : [activeCategory];

  const totalEarnableToday = tasks
    .filter(t => !t.is_completed && (t.recurring || !t.completed_at))
    .reduce((sum, t) => sum + t.reward_amount, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" onClick={onBack} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
          <h1 className="text-4xl font-bold mb-2">Earn NCTR</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Complete tasks and activities to earn NCTR tokens</p>
        </div>
      </div>

      {/* Stats Banner */}
      <div className="bg-gradient-to-br from-violet-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{totalEarnableToday}</div>
              <p className="text-violet-100">NCTR Available Today</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{tasks.filter(t => t.is_completed).length}</div>
              <p className="text-violet-100">Tasks Completed</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{tasks.length}</div>
              <p className="text-violet-100">Total Opportunities</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeCategory === 'all' ? 'default' : 'outline'}
              onClick={() => setActiveCategory('all')}
              size="sm"
              className={activeCategory === 'all' ? 'bg-violet-600 hover:bg-violet-700 text-white' : ''}
            >
              All Tasks
            </Button>
            {Object.entries(categoryConfig).map(([key, config]) => (
              groupedTasks[key] && (
                <Button
                  key={key}
                  variant={activeCategory === key ? 'default' : 'outline'}
                  onClick={() => setActiveCategory(key)}
                  size="sm"
                  className={activeCategory === key ? 'bg-violet-600 hover:bg-violet-700 text-white' : ''}
                >
                  <config.icon className="w-4 h-4 mr-2" />
                  {config.title}
                </Button>
              )
            ))}
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="space-y-8">
          {filteredCategories.map((category) => {
            const categoryTasks = groupedTasks[category];
            if (!categoryTasks || categoryTasks.length === 0) return null;

            const config = categoryConfig[category as keyof typeof categoryConfig];
            const CategoryIcon = config.icon;

            return (
              <div key={category}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center">
                    <CategoryIcon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <h2 className="text-2xl font-bold">{config.title}</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {categoryTasks.map((task) => {
                    const TaskIcon = iconMap[task.icon] || Gift;
                    const isCompleting = completingTask === task.task_id;

                    return (
                      <Card key={task.task_id} className={`transition-all ${task.is_completed ? 'opacity-60' : 'hover:border-violet-200 dark:hover:border-violet-800'}`}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-3 flex-1">
                              <div className={`w-12 h-12 bg-gradient-to-br from-violet-400 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0 ${task.is_completed ? 'opacity-50' : ''}`}>
                                <TaskIcon className="w-6 h-6 text-white" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold mb-1 flex items-center gap-2">
                                  {task.title}
                                  {task.recurring && <Badge variant="secondary" className="text-xs">Daily</Badge>}
                                </h3>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">{task.description}</p>
                                
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 border-0">
                                    +{task.reward_amount} NCTR
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {task.is_completed ? (
                              <Button variant="outline" disabled className="w-full gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                {task.recurring ? 'Completed Today' : 'Completed'}
                              </Button>
                            ) : (
                              <>
                                {task.link ? (
                                  <>
                                    <Button
                                      variant="outline"
                                      className="flex-1 gap-2"
                                      onClick={() => window.open(task.link!, '_blank')}
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                      Visit
                                    </Button>
                                    <Button
                                      className="flex-1 gap-2 bg-violet-600 hover:bg-violet-700 text-white"
                                      onClick={() => handleCompleteTask(task.task_id, task.title, true)}
                                      disabled={isCompleting}
                                    >
                                      {isCompleting ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <>
                                          <CheckCircle2 className="w-4 h-4" />
                                          Verify
                                        </>
                                      )}
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    className="w-full gap-2 bg-violet-600 hover:bg-violet-700 text-white"
                                    onClick={() => handleCompleteTask(task.task_id, task.title, false)}
                                    disabled={isCompleting}
                                  >
                                    {isCompleting ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <>
                                        <CheckCircle2 className="w-4 h-4" />
                                        Complete
                                      </>
                                    )}
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Links */}
        <Card className="mt-10">
          <CardHeader>
            <CardTitle>Explore More Ways to Earn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {onNavigateToRewards && (
                <Button variant="outline" onClick={onNavigateToRewards} className="h-auto py-6 flex-col gap-2">
                  <Gift className="w-6 h-6 text-violet-600" />
                  <span className="font-semibold">Browse Rewards</span>
                  <span className="text-xs text-neutral-600 dark:text-neutral-400">View claimable rewards</span>
                </Button>
              )}
              {onNavigateToStatus && (
                <Button variant="outline" onClick={onNavigateToStatus} className="h-auto py-6 flex-col gap-2">
                  <Trophy className="w-6 h-6 text-violet-600" />
                  <span className="font-semibold">Membership Levels</span>
                  <span className="text-xs text-neutral-600 dark:text-neutral-400">Lock NCTR for better rewards</span>
                </Button>
              )}
              {onNavigateToBrands && (
                <Button variant="outline" onClick={onNavigateToBrands} className="h-auto py-6 flex-col gap-2">
                  <Store className="w-6 h-6 text-violet-600" />
                  <span className="font-semibold">Brand Partners</span>
                  <span className="text-xs text-neutral-600 dark:text-neutral-400">Earn from purchases</span>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
