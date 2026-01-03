import { ArrowLeft, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MembershipStatistics } from './MembershipStatistics';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export function MembershipStatisticsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Please sign in to view statistics</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/membership')}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="w-8 h-8" />
              Membership Statistics
            </h1>
            <p className="text-muted-foreground mt-1">
              Track your membership journey and progress
            </p>
          </div>
        </div>

        <MembershipStatistics userId={user.id} />
      </div>
    </div>
  );
}
