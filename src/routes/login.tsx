import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface LoginSearch {
  redirect?: string;
}

export const Route = createFileRoute("/login")({
  validateSearch(search: Record<string, unknown>): LoginSearch {
    return { redirect: typeof search.redirect === "string" ? search.redirect : undefined };
  },
  async beforeLoad({ context, search }) {
    await context.auth.ensureLoaded();

    if (context.auth.isAuthorized) {
      throw redirect({ href: search.redirect ?? "/" });
    }
  },
  component: Login,
});

function Login(): React.ReactElement {
  const { auth } = Route.useRouteContext();
  const search = Route.useSearch();
  const router = useRouter();
  const navigate = Route.useNavigate();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string>();

  async function handleSignIn(): Promise<void> {
    setSigningIn(true);
    setError(undefined);

    try {
      await auth.signIn();
      await router.invalidate();
      await navigate({ href: search.redirect ?? "/" });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Sign in failed. Try again.");
      setSigningIn(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in to Apple Music</CardTitle>
          <CardDescription>
            You need an Apple Music subscription to play music and to read your library.
          </CardDescription>
        </CardHeader>
        <div className="flex flex-col gap-3 px-6 pb-6">
          <Button loading={signingIn} onClick={handleSignIn}>
            Continue with Apple Music
          </Button>
          {error && (
            <p className="text-destructive-foreground text-sm" role="alert">
              {error}
            </p>
          )}
        </div>
      </Card>
    </main>
  );
}
