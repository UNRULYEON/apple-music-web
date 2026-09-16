import {
  type QueryKey,
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from "@tanstack/react-query";
import { useAuthStatus } from "./use-auth-status";
import { useDemoMode } from "./use-demo-mode";

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
