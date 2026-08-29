import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { loadAuthorization, signIn, useAuthStatus } from "@/lib/music-kit/auth";

const TRANSITION = { duration: 0.24, ease: [0.16, 1, 0.3, 1] } as const;

const SWAP = {
  initial: { opacity: 0, scale: 0.96, filter: "blur(8px)" },
  animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
  exit: { opacity: 0, scale: 0.96, filter: "blur(8px)" },
};

export function MusicKitGate({ children }: { children: React.ReactNode }): React.ReactElement {
  const status = useAuthStatus();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    void loadAuthorization();
  }, []);

  async function handleSignIn(): Promise<void> {
    setIsSigningIn(true);
    setError(undefined);

    try {
      await signIn();
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

      <AnimatePresence initial={false} mode="wait">
        {status !== "signed-in" && (
          <motion.div
            key="music-kit-gate"
            initial={{ opacity: 0, filter: "blur(8px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, filter: "blur(8px)" }}
            transition={TRANSITION}
            role="dialog"
            aria-label={status === "checking" ? "Starting Apple Music" : "Sign in to Apple Music"}
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-6 backdrop-blur-sm"
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
                    <CardPanel className="flex flex-col">
                      <Button loading={isSigningIn} onClick={handleSignIn}>
                        Continue with Apple Music
                      </Button>
                      {error && (
                        <p className="text-destructive-foreground text-sm" role="alert">
                          {error}
                        </p>
                      )}
                    </CardPanel>
                    <CardFooter className="flex flex-col text-center text-muted-foreground text-xs">
                      <p>Not affiliated with or endorsed by Apple Inc.</p>
                      <p>Apple Music is a trademark of Apple Inc.</p>
                    </CardFooter>
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
