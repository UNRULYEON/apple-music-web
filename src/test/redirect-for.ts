interface RouteWithGuard {
  options: { beforeLoad?: unknown };
}

/**
 * The redirect a route throws for one visit, or undefined when it lets the visitor through.
 */
export async function redirectFor(
  route: RouteWithGuard,
  visit: Record<string, unknown>,
): Promise<unknown> {
  const beforeLoad = route.options.beforeLoad as (input: unknown) => Promise<unknown>;

  return await beforeLoad(visit).then(
    () => undefined,
    (thrown: unknown) => thrown,
  );
}
