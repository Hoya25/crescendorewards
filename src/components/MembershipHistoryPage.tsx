import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MembershipHistory } from './MembershipHistory';
import { useAuth } from '@/hooks/useAuth';

interface MembershipHistoryPageProps {
  onBack: () => void;
}

export function MembershipHistoryPage({ onBack }: MembershipHistoryPageProps) {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Membership
          </Button>

          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Membership History</h1>
            <p className="text-muted-foreground">
              Track your membership journey and tier upgrades
            </p>
          </div>

          <MembershipHistory userId={user.id} />
        </div>
      </div>
    </div>
  );
}
