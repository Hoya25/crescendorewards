import { Loader2 } from 'lucide-react';
import nctrIconDark from '@/assets/nctr-grey.png';
import nctrIconLight from '@/assets/nctr-yellow.png';

interface RouteLoadingProps {
  message?: string;
}

export function RouteLoading({ message = 'Loading...' }: RouteLoadingProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] bg-background">
      <div className="text-center">
        <img src={nctrIconDark} alt="NCTR" className="block dark:hidden w-10 h-10 mx-auto mb-2" />
        <img src={nctrIconLight} alt="NCTR" className="hidden dark:block w-10 h-10 mx-auto mb-2" />
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
        <img src={nctrIconDark} alt="NCTR" className="block dark:hidden w-10 h-10 mx-auto mb-2" />
        <img src={nctrIconLight} alt="NCTR" className="hidden dark:block w-10 h-10 mx-auto mb-2" />
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}