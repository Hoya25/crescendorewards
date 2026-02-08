import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

export function SubmissionSuccess() {
  const navigate = useNavigate();

  return (
    <Card>
      <CardContent className="p-8 text-center space-y-4">
        <CheckCircle2 className="h-16 w-16 mx-auto text-emerald-500" />
        <h2 className="text-2xl font-bold">Thanks for sharing!</h2>
        <p className="text-muted-foreground">
          Your content has been submitted for review. Our team will review it within 24-48 hours.
        </p>

        <div className="text-left bg-muted/50 rounded-lg p-4 space-y-2 max-w-md mx-auto">
          <p className="font-medium text-sm">What happens next:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• We'll review your content for quality and guidelines</li>
            <li>• Once approved, it will appear on the platform</li>
            <li>• You'll get a notification when it's live</li>
          </ul>
        </div>

        <div className="flex gap-3 justify-center pt-2">
          <Button variant="outline" onClick={() => navigate('/my-content')}>
            My Content
          </Button>
          <Button onClick={() => window.location.reload()}>
            Submit Another
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
