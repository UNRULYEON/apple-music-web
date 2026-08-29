import { Outlet, createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authed")({
  async beforeLoad({ context, location }) {
    await context.auth.ensureLoaded();

    if (!context.auth.isAuthorized) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
  },
  component: AuthedLayout,
});

function AuthedLayout(): React.ReactElement {
  const { auth } = Route.useRouteContext();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut(): Promise<void> {
    setSigningOut(true);
    await auth.signOut();
    await router.invalidate();
  }

  return (
    <>
      <header className="flex items-center justify-end border-b p-3">
        <Button loading={signingOut} onClick={handleSignOut} size="sm" variant="outline">
          Sign out
        </Button>
      </header>
      <Outlet />
    </>
  );
}
