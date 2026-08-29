import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { loadAuthorization, signIn } from "@/lib/music-kit/auth";

type Status = "checking" | "signed-out" | "signed-in";

const TRANSITION = { duration: 0.24, ease: [0.16, 1, 0.3, 1] } as const;

const SWAP = {
  initial: { opacity: 0, scale: 0.96, filter: "blur(8px)" },
  animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
  exit: { opacity: 0, scale: 0.96, filter: "blur(8px)" },
};

export function MusicKitGate({ children }: { children: React.ReactNode }): React.ReactElement {
  const [status, setStatus] = useState<Status>("checking");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;

    void loadAuthorization().then((authorized) => {
      if (active) {
        setStatus(authorized ? "signed-in" : "signed-out");
      }
    });

    return () => {
      active = false;
    };
  }, []);

  async function handleSignIn(): Promise<void> {
    setIsSigningIn(true);
    setError(undefined);

    try {
      setStatus((await signIn()) ? "signed-in" : "signed-out");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Sign in failed. Try again.");
    } finally {
      setIsSigningIn(false);
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        className="isolate relative flex min-h-svh flex-col"
        transition={TRANSITION}
        inert={status !== "signed-in"}
        {...SWAP}
      >
        {children}
      </motion.div>

      <AnimatePresence>
        {status !== "signed-in" && (
          <motion.div
            animate={{ opacity: 1 }}
            aria-label={status === "checking" ? "Starting Apple Music" : "Sign in to Apple Music"}
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-6 backdrop-blur-sm"
            exit={{ opacity: 0 }}
            initial={false}
            key="music-kit-gate"
            role="dialog"
            transition={TRANSITION}
          >
            <AnimatePresence initial={false} mode="wait">
              {status === "checking" ? (
                <motion.div key="checking" transition={TRANSITION} {...SWAP}>
                  <Spinner className="size-6" />
                </motion.div>
              ) : (
                <motion.div
                  className="w-full max-w-sm"
                  key="signed-out"
                  transition={TRANSITION}
                  {...SWAP}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Sign in to Apple Music</CardTitle>
                      <CardDescription>
                        You need an Apple Music subscription to play music and to read your library.
                      </CardDescription>
                    </CardHeader>
                    <div className="flex flex-col gap-3 px-6 pb-6">
                      <Button loading={isSigningIn} onClick={handleSignIn}>
                        Continue with Apple Music
                      </Button>
                      {error && (
                        <p className="text-destructive-foreground text-sm" role="alert">
                          {error}
                        </p>
                      )}
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
