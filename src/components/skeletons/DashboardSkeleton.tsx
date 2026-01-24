import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function DashboardMetricSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-3 xs:p-4 text-center space-y-2">
        <Skeleton className="w-7 h-7 xs:w-8 xs:h-8 mx-auto rounded-full" />
        <Skeleton className="h-4 w-20 xs:w-24 mx-auto" />
        <Skeleton className="h-3 w-16 xs:w-20 mx-auto" />
      </CardContent>
    </Card>
  );
}

export function MembershipCardSkeleton() {
  return (
    <Card className="border-2 animate-pulse">
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3 xs:gap-4">
            <Skeleton className="w-12 h-12 xs:w-16 xs:h-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 xs:h-6 w-28 xs:w-32" />
              <Skeleton className="h-4 w-20 xs:w-24" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 xs:w-20" />
            <Skeleton className="h-6 w-14 xs:w-16" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-28 xs:w-32" />
          <Skeleton className="h-4 w-20 xs:w-24" />
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-4 w-40 xs:w-48" />
        <div className="flex gap-3 pt-2">
          <Skeleton className="h-10 xs:h-11 flex-1" />
          <Skeleton className="h-10 xs:h-11 flex-1" />
        </div>
      </CardContent>
    </Card>
  );
}

export function QuickActionsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 xs:gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-4 xs:p-5 flex items-center gap-3 xs:gap-4">
            <Skeleton className="w-12 h-12 xs:w-14 xs:h-14 rounded-full flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-36" />
            </div>
            <Skeleton className="w-5 h-5 rounded flex-shrink-0" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function BalanceCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-20 xs:w-24" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-16 xs:w-20" />
          <Skeleton className="h-6 w-14 xs:w-16" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20 xs:w-24" />
          <Skeleton className="h-6 w-14 xs:w-16" />
        </div>
        <Skeleton className="h-10 xs:h-11 w-full mt-4" />
      </CardContent>
    </Card>
  );
}

export function CarouselSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32 xs:w-40" />
        <Skeleton className="h-8 w-20" />
      </div>
      <div className="flex gap-3 xs:gap-4 overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-[280px] xs:w-[300px]">
            <Card>
              <Skeleton className="aspect-video w-full" />
              <CardContent className="p-3 xs:p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-4 xs:space-y-6">
      <MembershipCardSkeleton />
      <QuickActionsSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 xs:gap-6">
        <BalanceCardSkeleton />
        <BalanceCardSkeleton />
        <BalanceCardSkeleton />
      </div>
      <CarouselSkeleton />
    </div>
  );
}
