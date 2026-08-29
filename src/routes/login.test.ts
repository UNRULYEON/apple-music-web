import { isRedirect } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { mockAuth } from "@/test/mock-auth";
import { redirectFor } from "@/test/redirect-for";
import { Route } from "./login.tsx";

function readSearch(search: Record<string, unknown>) {
  const validateSearch = Route.options.validateSearch as (input: unknown) => unknown;

  return validateSearch(search);
}

describe("/login", () => {
  describe("the search", () => {
    it("reads the page the visitor came from", () => {
      expect(readSearch({ redirect: "/albums/123" })).toEqual({ redirect: "/albums/123" });
    });

    it("drops a redirect that is not a string", () => {
      expect(readSearch({ redirect: ["/a", "/b"] })).toEqual({ redirect: undefined });
    });

    it("accepts a visit with no search at all", () => {
      expect(readSearch({})).toEqual({ redirect: undefined });
    });
  });

  describe("the guard", () => {
    it("leaves a visitor who is not signed in on the page", async () => {
      const auth = mockAuth({ authorizedAfterLoad: false });

      const thrown = await redirectFor(Route, { context: { auth }, search: {} });

      expect(thrown).toBeUndefined();
    });

    it("sends a signed in visitor back to where they came from", async () => {
      const auth = mockAuth({ authorizedAfterLoad: true });

      const thrown = await redirectFor(Route, {
        context: { auth },
        search: { redirect: "/albums/123" },
      });

      expect(isRedirect(thrown)).toBe(true);
      expect(thrown).toMatchObject({ options: { href: "/albums/123" } });
    });

    it("sends a signed in visitor home when there is nowhere to go back to", async () => {
      const auth = mockAuth({ authorizedAfterLoad: true });

      const thrown = await redirectFor(Route, { context: { auth }, search: {} });

      expect(thrown).toMatchObject({ options: { href: "/" } });
    });
  });
});
