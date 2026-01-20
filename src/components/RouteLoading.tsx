import { Loader2 } from 'lucide-react';

interface RouteLoadingProps {
  message?: string;
}

export function RouteLoading({ message = 'Loading...' }: RouteLoadingProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] bg-background">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground text-sm">{message}</p>
      </div>
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
