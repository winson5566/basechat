import { useEffect, useState } from "react";

interface UsePollingOptions<T> {
  pollFunction: () => Promise<T>; // Function to execute periodically
  interval: number; // Polling interval in milliseconds
  onSuccess?: (data: T) => void; // Callback for successful responses
  onError?: (error: unknown) => void; // Callback for errors
}

export default function usePolling<T>(options: UsePollingOptions<T>) {
  const { pollFunction, interval, onSuccess, onError } = options;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    const executeFunction = async () => {
      setLoading(true);
      try {
        const result = await pollFunction();
        if (isMounted) {
          setData(result);
          setError(null);
          if (onSuccess) onSuccess(result);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
          if (onError) onError(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          timeoutId = setTimeout(executeFunction, interval); // Schedule the next tick
        }
      }
    };

    // Start polling
    executeFunction();

    // Cleanup
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [pollFunction, interval, onSuccess, onError]);

  return { data, error, loading };
}
