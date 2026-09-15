// @vitest-environment happy-dom
import { ArtworkImage } from "@/components/artwork";
import type { Artwork } from "@/lib/music-kit/resource";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const SKELETON = '[data-slot="skeleton"]';

function cover(name: string): Artwork {
  return { url: `https://example.com/${name}-{w}x{h}{c}.{f}`, width: 300, height: 300 };
}

function show(artwork: Artwork) {
  render(<ArtworkImage artwork={artwork} alt="Cover" size={64} />);
}

function skeleton() {
  return document.querySelector(SKELETON);
}

// happy-dom calls every image complete with no width, which the component reads as a
// picture that cannot be shown. These tests say when an image is done themselves.
const original = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "complete");

beforeEach(() => {
  Object.defineProperty(HTMLImageElement.prototype, "complete", {
    configurable: true,
    get: () => false,
  });
});

afterEach(() => {
  cleanup();

  if (original) {
    Object.defineProperty(HTMLImageElement.prototype, "complete", original);
  }
});

describe("ArtworkImage", () => {
  it("waits behind a placeholder for a picture it has not shown", () => {
    show(cover("one"));

    expect(skeleton()).toBeTruthy();
  });

  // a long list keeps only the rows in sight, so a row that comes back must not reveal
  // its picture again and read as the list flashing
  it("shows a picture it has shown before at once", () => {
    show(cover("two"));
    fireEvent.load(screen.getByAltText("Cover"));
    cleanup();

    show(cover("two"));

    expect(skeleton()).toBeNull();
  });

  it("still waits for a picture it has not shown", () => {
    show(cover("three"));
    fireEvent.load(screen.getByAltText("Cover"));
    cleanup();

    show(cover("four"));

    expect(skeleton()).toBeTruthy();
  });

  it("falls back to a note when the picture cannot be shown", () => {
    show(cover("five"));

    fireEvent.error(screen.getByAltText("Cover"));

    expect(screen.queryByAltText("Cover")).toBeNull();
  });
});

describe("ArtworkImage with a mosaic", () => {
  it("shows the four covers of the mosaic in one box", () => {
    const pieces = ["a", "b", "c", "d"].map(cover);

    show({ ...cover("a"), mosaic: pieces });

    const box = screen.getByRole("img", { name: "Cover" });
    const urls = [...box.querySelectorAll("img")].map((img) => img.getAttribute("src"));

    expect(urls).toEqual([
      "https://example.com/a-32x32bb.jpg",
      "https://example.com/b-32x32bb.jpg",
      "https://example.com/c-32x32bb.jpg",
      "https://example.com/d-32x32bb.jpg",
    ]);
  });

  it("shows one cover when the mosaic is not full", () => {
    show({ ...cover("a"), mosaic: [cover("a"), cover("b")] });

    expect(document.querySelectorAll("img")).toHaveLength(1);
  });
});
