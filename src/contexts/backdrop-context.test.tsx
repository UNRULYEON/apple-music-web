// @vitest-environment happy-dom
import { cleanup, render, screen, waitForElementToBeRemoved } from "@testing-library/react";
import { useMemo } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useBackdrop } from "@/hooks";
import { BackdropProvider } from "./backdrop-context";

vi.mock("@paper-design/shaders-react", () => ({
  MeshGradient: ({ colors }: { colors: string[] }) => (
    <div data-colors={colors.join(" ")} data-testid="mesh-gradient" />
  ),
}));

afterEach(cleanup);

const COLORS = ["#1d1d1f", "#f5f5f7"];

function View({ colors }: { colors: string[] }) {
  useBackdrop(useMemo(() => colors, [colors]));
  return null;
}

describe("BackdropProvider", () => {
  it("shows no gradient until a view asks for one", () => {
    render(<BackdropProvider>{null}</BackdropProvider>);

    expect(screen.queryByTestId("mesh-gradient")).toBeNull();
  });

  it("shows the gradient with the colors of the view", () => {
    render(
      <BackdropProvider>
        <View colors={COLORS} />
      </BackdropProvider>,
    );

    expect(screen.getByTestId("mesh-gradient").getAttribute("data-colors")).toBe(COLORS.join(" "));
  });

  it("removes the gradient when the view goes away", async () => {
    const { rerender } = render(
      <BackdropProvider>
        <View colors={COLORS} />
      </BackdropProvider>,
    );

    rerender(<BackdropProvider>{null}</BackdropProvider>);

    await waitForElementToBeRemoved(() => screen.queryByTestId("mesh-gradient"), {
      timeout: 3000,
    });
  });
});

describe("useBackdrop", () => {
  it("asks for a provider", () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<View colors={COLORS} />)).toThrow("BackdropProvider");

    quiet.mockRestore();
  });
});
