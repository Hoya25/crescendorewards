import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function RewardCardSkeleton() {
  return (
    <Card className="overflow-hidden animate-pulse">
      <Skeleton className="aspect-video w-full" />
      <CardContent className="p-3 xs:p-4 space-y-2 xs:space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-5 xs:h-6 w-16 xs:w-20" />
          <Skeleton className="h-7 xs:h-8 w-20 xs:w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

export function RewardsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <RewardCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function RewardCardSkeletonCompact() {
  return (
    <Card className="overflow-hidden animate-pulse">
      <Skeleton className="aspect-[4/3] w-full" />
      <CardContent className="p-2 xs:p-3 space-y-2">
        <Skeleton className="h-3 xs:h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </CardContent>
    </Card>
  );
}
