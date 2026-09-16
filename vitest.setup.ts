import { MotionGlobalConfig } from "motion";
import { vi } from "vitest";

MotionGlobalConfig.skipAnimations = true;

vi.mock("@/lib/music-kit/developer-token", () => ({
  getDeveloperToken: vi.fn(async () => "test-developer-token"),
}));
