import { MotionGlobalConfig } from "motion";
import { vi } from "vitest";

// Animations land instantly, so no test waits on a fade and none is torn down mid-flight.
MotionGlobalConfig.skipAnimations = true;

// The real one is a server function, so no test may reach it and no test needs a token.
vi.mock("@/lib/music-kit/developer-token", () => ({
  getDeveloperToken: vi.fn(async () => "test-developer-token"),
}));
