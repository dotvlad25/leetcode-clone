import { trpc } from "@/lib/trpc";
import { useMemo } from "react";

/**
 * Local single-user mode: there is no sign-in step. The server attributes every
 * request to one auto-provisioned user, so `auth.me` always resolves to it.
 * `isAuthenticated` is false only while that first query is in flight, which is
 * what gates the queries that need a user id.
 */
export function useAuth() {
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  const state = useMemo(
    () => ({
      user: meQuery.data ?? null,
      loading: meQuery.isLoading,
      error: meQuery.error ?? null,
      isAuthenticated: Boolean(meQuery.data),
    }),
    [meQuery.data, meQuery.error, meQuery.isLoading]
  );

  return {
    ...state,
    refresh: () => meQuery.refetch(),
  };
}
