import { useAuthStatus } from "@/lib/music-kit/auth";
import {
  useQuery,
  type QueryKey,
  type UseQueryOptions,
  type UseQueryResult,
} from "@tanstack/react-query";

// every answer comes from the Apple Music session, so no query starts before a person
// is signed in. A query that asks to wait still waits.
export function useSignedInQuery<
  TQueryFnData,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>): UseQueryResult<TData, TError> {
  const status = useAuthStatus();

  return useQuery({ ...options, enabled: status === "signed-in" && options.enabled !== false });
}
