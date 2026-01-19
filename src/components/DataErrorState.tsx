import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react';

interface DataErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retrying?: boolean;
  variant?: 'inline' | 'card' | 'fullpage';
  showIcon?: boolean;
}

export function DataErrorState({
  title = 'Failed to load data',
  message = 'Something went wrong while fetching the data. Please try again.',
  onRetry,
  retrying = false,
  variant = 'card',
  showIcon = true,
}: DataErrorStateProps) {
  const content = (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      {showIcon && (
        <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <AlertCircle className="w-7 h-7 text-destructive" />
        </div>
      )}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-sm mb-6">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} disabled={retrying} variant="outline" className="gap-2">
          <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
          {retrying ? 'Retrying...' : 'Try Again'}
        </Button>
      )}
    </div>
  );

  if (variant === 'inline') {
    return content;
  }

  if (variant === 'fullpage') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        {content}
      </CardContent>
    </Card>
  );
}

// Network-specific error state
export function NetworkErrorState({ onRetry, retrying }: { onRetry?: () => void; retrying?: boolean }) {
  return (
    <DataErrorState
      title="Connection Error"
      message="Unable to connect to the server. Please check your internet connection and try again."
      onRetry={onRetry}
      retrying={retrying}
      showIcon={true}
    />
  );
}
