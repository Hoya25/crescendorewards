import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, CheckCircle2, ExternalLink, Users, Share2, Calendar, Zap, Store, Trophy, Gift, Lock, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { NCTRLogo } from './NCTRLogo';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';

interface EarnTask {
  task_id: string;
  task_type: string;
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

export function EarnNCTR() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuthContext();
  const [tasks, setTasks] = useState<EarnTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingTask, setCompletingTask] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_task_progress');
      
      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const completeTask = async (taskId: string, taskTitle: string, rewardAmount: number) => {
    setCompletingTask(taskId);
    
    try {
      toast.success(`Completed: ${taskTitle}`, {
        description: `Earned ${rewardAmount} NCTR!`,
      });
      
      // Refresh tasks to update completion status
      fetchTasks();
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold mb-2">Earn NCTR</h1>
          <p className="text-muted-foreground">
            Complete tasks and activities to earn NCTR tokens
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card 
            className="cursor-pointer hover:border-violet-300 transition-colors"
            onClick={() => navigate('/rewards')}
          >
            <CardContent className="p-4 text-center">
              <Gift className="w-6 h-6 mx-auto mb-2 text-violet-600" />
              <p className="text-sm font-medium">Rewards</p>
            </CardContent>
          </Card>
          <Card 
            className="cursor-pointer hover:border-amber-300 transition-colors"
            onClick={() => navigate('/membership')}
          >
            <CardContent className="p-4 text-center">
              <Trophy className="w-6 h-6 mx-auto mb-2 text-amber-600" />
              <p className="text-sm font-medium">Status</p>
            </CardContent>
          </Card>
          <Card 
            className="cursor-pointer hover:border-blue-300 transition-colors"
            onClick={() => navigate('/brands')}
          >
            <CardContent className="p-4 text-center">
              <Store className="w-6 h-6 mx-auto mb-2 text-blue-600" />
              <p className="text-sm font-medium">Brands</p>
            </CardContent>
          </Card>
        </div>

        {/* Task Categories */}
        <div className="space-y-8">
          {Object.entries(categoryConfig).map(([category, config]) => {
            const categoryTasks = groupedTasks[category] || [];
            if (categoryTasks.length === 0) return null;
            
            const CategoryIcon = config.icon;
            
            return (
              <div key={category}>
                <div className="flex items-center gap-2 mb-4">
                  <CategoryIcon className={`w-5 h-5 text-${config.color}-600`} />
                  <h2 className="text-xl font-bold">{config.title}</h2>
                  <Badge variant="secondary" className="ml-auto">
                    {categoryTasks.filter(t => t.is_completed).length}/{categoryTasks.length}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  {categoryTasks.map((task) => {
                    const TaskIcon = iconMap[task.icon] || Zap;
                    
                    return (
                      <Card key={task.task_id} className={task.is_completed ? 'opacity-60' : ''}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              task.is_completed 
                                ? 'bg-green-100 dark:bg-green-900/30' 
                                : 'bg-violet-100 dark:bg-violet-900/30'
                            }`}>
                              {task.is_completed ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              ) : (
                                <TaskIcon className="w-5 h-5 text-violet-600" />
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <h3 className="font-medium">{task.title}</h3>
                              <p className="text-sm text-muted-foreground">{task.description}</p>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <Badge variant="secondary" className="flex items-center gap-1">
                                +{task.reward_amount} <NCTRLogo size="sm" />
                              </Badge>
                              
                              {task.is_completed ? (
                                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                  Completed
                                </Badge>
                              ) : task.link ? (
                                <Button 
                                  size="sm"
                                  onClick={() => window.open(task.link!, '_blank')}
                                  className="gap-1"
                                >
                                  Go <ExternalLink className="w-3 h-3" />
                                </Button>
                              ) : (
                                <Button 
                                  size="sm"
                                  onClick={() => completeTask(task.task_id, task.title, task.reward_amount)}
                                  disabled={completingTask === task.task_id}
                                >
                                  {completingTask === task.task_id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    'Complete'
                                  )}
                                </Button>
                              )}
                            </div>
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

        {tasks.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Zap className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No Tasks Available</h3>
              <p className="text-muted-foreground">Check back later for new earning opportunities!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
