import { isRedirect } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { mockAuth } from "@/test/mock-auth";
import { redirectFor } from "@/test/redirect-for";
import { Route } from "./_authed.tsx";

describe("/_authed", () => {
  describe("the guard", () => {
    it("sends a visitor who is not signed in to the login page", async () => {
      const auth = mockAuth({ authorizedAfterLoad: false });

      const thrown = await redirectFor(Route, { context: { auth }, location: { href: "/" } });

      expect(isRedirect(thrown)).toBe(true);
      expect(thrown).toMatchObject({ options: { to: "/login" } });
    });

    it("remembers where the visitor wanted to go", async () => {
      const auth = mockAuth({ authorizedAfterLoad: false });

      const thrown = await redirectFor(Route, {
        context: { auth },
        location: { href: "/albums/123" },
      });

      expect(thrown).toMatchObject({ options: { search: { redirect: "/albums/123" } } });
    });

    it("lets a signed in visitor through", async () => {
      const auth = mockAuth({ authorizedAfterLoad: true });

      const thrown = await redirectFor(Route, { context: { auth }, location: { href: "/" } });

      expect(thrown).toBeUndefined();
    });

    it("waits for MusicKit before it reads the state", async () => {
      const auth = mockAuth({ authorizedAfterLoad: true });

      await redirectFor(Route, { context: { auth }, location: { href: "/" } });

      expect(auth.ensureLoaded).toHaveBeenCalledOnce();
    });
  });
});
