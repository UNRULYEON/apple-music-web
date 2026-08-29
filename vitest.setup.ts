import { vi } from "vitest";

vi.mock("@/lib/music-kit/developer-token", () => ({
  getDeveloperToken: vi.fn(async () => "test-developer-token"),
}));
