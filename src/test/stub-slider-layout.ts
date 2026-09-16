import { vi } from "vitest";

const CONTROL = "[data-base-ui-slider-control]";
const CONTROL_WIDTH = 200;
const CONTROL_HEIGHT = 16;

export function stubSliderLayout(): void {
  const measure = HTMLElement.prototype.getBoundingClientRect;

  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    function (this: HTMLElement) {
      return this.matches(CONTROL)
        ? new DOMRect(0, 0, CONTROL_WIDTH, CONTROL_HEIGHT)
        : measure.call(this);
    },
  );
}
