import { QueryClient } from '@tanstack/react-query';

// Configure React Query with optimized caching defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes
      staleTime: 1000 * 60 * 5,
      // Keep cached data for 30 minutes
      gcTime: 1000 * 60 * 30,
      // Retry failed requests up to 2 times
      retry: 2,
      // Don't refetch on window focus in production
      refetchOnWindowFocus: false,
      // Don't refetch on reconnect unless data is stale
      refetchOnReconnect: 'always',
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    },
  },
});

// Query key factories for consistent cache management
export const queryKeys = {
  // Rewards
  rewards: {
    all: ['rewards'] as const,
    list: (filters?: Record<string, unknown>) => ['rewards', 'list', filters] as const,
    detail: (id: string) => ['rewards', 'detail', id] as const,
    featured: () => ['rewards', 'featured'] as const,
  },
  // User profile
  profile: {
    current: () => ['profile', 'current'] as const,
    byId: (id: string) => ['profile', id] as const,
  },
  // Claims
  claims: {
    all: ['claims'] as const,
    byUser: (userId: string) => ['claims', 'user', userId] as const,
    pending: () => ['claims', 'pending'] as const,
  },
  // Submissions
  submissions: {
    all: ['submissions'] as const,
    byUser: (userId: string) => ['submissions', 'user', userId] as const,
    pending: () => ['submissions', 'pending'] as const,
  },
  // Admin
  admin: {
    stats: () => ['admin', 'stats'] as const,
    activity: () => ['admin', 'activity'] as const,
  },
  // Notifications
  notifications: {
    all: ['notifications'] as const,
    unread: () => ['notifications', 'unread'] as const,
  },
  // Wishlist
  wishlist: {
    all: ['wishlist'] as const,
    byUser: (userId: string) => ['wishlist', 'user', userId] as const,
  },
  // Brands
  brands: {
    all: ['brands'] as const,
    featured: () => ['brands', 'featured'] as const,
    detail: (id: string) => ['brands', id] as const,
  },
} as const;
