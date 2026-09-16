import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { type ReactNode, useEffect, useState } from "react";
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
import {
  useAuthStatus,
  useDemoModeHotkey,
  usePersistedCache,
  useResetWhenSignedOut,
} from "@/hooks";
import { fireConfetti } from "@/lib/confetti";
import { GROWN, SHRUNK, TRANSITION } from "@/lib/motion";
import { checkAuthorization, readAuthStatus, signIn } from "@/lib/music-kit/auth";

const SWAP = { initial: SHRUNK, animate: GROWN, exit: SHRUNK };

export function MusicKitGate({ children }: { children: ReactNode }) {
  const status = useAuthStatus();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string>();

  useResetWhenSignedOut();
  usePersistedCache();
  useDemoModeHotkey();

  useEffect(() => {
    void checkAuthorization();
  }, []);

  async function startSignIn(): Promise<void> {
    setIsSigningIn(true);
    setError(undefined);

    try {
      await signIn();

      if (readAuthStatus() === "signed-in") {
        fireConfetti();
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Sign in failed. Try again.");
    } finally {
      setIsSigningIn(false);
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        className="flex min-h-0 grow"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={TRANSITION}
        inert={status !== "signed-in"}
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
                      <CardTitle>Sign in with Apple Music</CardTitle>
                      <CardDescription>
                        You need an Apple Music subscription to play music from your library.
                      </CardDescription>
                    </CardHeader>
                    <CardPanel className="flex flex-col">
                      <Button loading={isSigningIn} onClick={startSignIn}>
                        Continue with Apple Music
                      </Button>
                      {error && (
                        <p className="text-sm text-destructive-foreground" role="alert">
                          {error}
                        </p>
                      )}
                    </CardPanel>
                    <CardFooter className="flex flex-col text-center text-xs text-muted-foreground">
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
