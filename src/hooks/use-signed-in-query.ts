import { useDemoMode } from "@/lib/demo/mode";
import { useAuthStatus } from "@/lib/music-kit/auth";
import {
  useQuery,
  type QueryKey,
  type UseQueryOptions,
  type UseQueryResult,
} from "@tanstack/react-query";

export function useSignedInQuery<
  TQueryFnData,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>): UseQueryResult<TData, TError> {
  const status = useAuthStatus();
  useDemoMode();

  return useQuery({ ...options, enabled: status === "signed-in" && options.enabled !== false });
}
