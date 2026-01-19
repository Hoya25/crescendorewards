import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface UseDataFetchOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

interface UseDataFetchReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: () => Promise<T | null>;
  retry: () => Promise<T | null>;
  reset: () => void;
}

export function useDataFetch<T>(
  fetchFn: () => Promise<T>,
  options: UseDataFetchOptions<T> = {}
): UseDataFetchReturn<T> {
  const {
    onSuccess,
    onError,
    successMessage,
    errorMessage = 'An error occurred. Please try again.',
    showSuccessToast = false,
    showErrorToast = true,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn();
      setData(result);
      onSuccess?.(result);
      
      if (showSuccessToast && successMessage) {
        toast({
          title: 'Success',
          description: successMessage,
        });
      }
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
      
      if (showErrorToast) {
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchFn, onSuccess, onError, successMessage, errorMessage, showSuccessToast, showErrorToast]);

  const retry = useCallback(() => execute(), [execute]);

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  return { data, loading, error, execute, retry, reset };
}

// Helper for mutation operations (create, update, delete)
interface UseMutationOptions<T, P> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
}

interface UseMutationReturn<T, P> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  mutate: (params: P) => Promise<T | null>;
  reset: () => void;
}

export function useMutation<T, P = void>(
  mutationFn: (params: P) => Promise<T>,
  options: UseMutationOptions<T, P> = {}
): UseMutationReturn<T, P> {
  const {
    onSuccess,
    onError,
    successMessage = 'Operation completed successfully',
    errorMessage = 'Operation failed. Please try again.',
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (params: P): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await mutationFn(params);
      setData(result);
      onSuccess?.(result);
      
      toast({
        title: 'Success',
        description: successMessage,
      });
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
      
      toast({
        title: 'Error',
        description: error.message || errorMessage,
        variant: 'destructive',
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [mutationFn, onSuccess, onError, successMessage, errorMessage]);

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
}
