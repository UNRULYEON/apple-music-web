import { ArtworkImage } from "@/components/artwork";
import { TRANSITION, TRANSITION_REVEAL } from "@/lib/motion";
import type { Artwork } from "@/lib/music-kit/resource";
import { useVirtualizer } from "@tanstack/react-virtual";
import { motion } from "motion/react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type Ref,
  type SetStateAction,
} from "react";

const ARTWORK_SIZE = 256;
const MIN_TILE = 208;
const WIDE_GRID = 768;
const GAP = 16;
const GAP_WIDE = 24;
const TEXT_BLOCK = 40;
// rows held ready above and below the window, so a fast scroll finds them drawn
// already instead of leaving a gap while it catches up
const OVERSCAN = 4;
const VIEWPORT = '[data-slot="scroll-area-viewport"]';

const BLURRED = { opacity: 0, filter: "blur(2px)" };
const SHARP = { opacity: 1, filter: "blur(0px)" };

export interface MediaTileItem {
  id: string;
  name: string;
  credit?: string;
  artwork?: Artwork;
  onClick: () => void;
}

interface Metrics {
  width: number;
  scrollMargin: number;
}

export function gapFor(width: number): number {
  return width >= WIDE_GRID ? GAP_WIDE : GAP;
}

// the same grid the css drew before: tiles of at least 13rem, and never more than
// two on a narrow window
export function columnCount(width: number): number {
  if (width <= 0) {
    return 1;
  }

  const smallest = Math.max(1, Math.min(MIN_TILE, width / 2 - GAP));

  return Math.max(1, Math.floor((width + gapFor(width)) / (smallest + gapFor(width))));
}

export function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    rows.push(items.slice(index, index + size));
  }

  return rows;
}

function measureGrid(node: HTMLElement, viewport: HTMLElement): Metrics {
  const box = node.getBoundingClientRect();

  return {
    width: node.clientWidth,
    scrollMargin: Math.round(box.top - viewport.getBoundingClientRect().top + viewport.scrollTop),
  };
}

export function sameMetrics(a: Metrics, b: Metrics): boolean {
  return a.width === b.width && a.scrollMargin === b.scrollMargin;
}

// the grid grows taller as the virtualizer measures its rows, which makes the observer
// fire again. safari ends the loop with an error unless the numbers the grid draws with
// hold still.
function updateMetrics(
  node: HTMLElement,
  viewport: HTMLElement,
  setMetrics: Dispatch<SetStateAction<Metrics>>,
): void {
  const next = measureGrid(node, viewport);

  setMetrics((current) => (sameMetrics(current, next) ? current : next));
}

export function MediaGrid({ items, ref }: { items: MediaTileItem[]; ref?: Ref<HTMLDivElement> }) {
  const container = useRef<HTMLDivElement | null>(null);
  const [viewport, setViewport] = useState<HTMLElement | null>(null);
  const [{ width, scrollMargin }, setMetrics] = useState<Metrics>({ width: 0, scrollMargin: 0 });

  const attach = useCallback(
    (node: HTMLDivElement | null) => {
      container.current = node;
      setViewport(node?.closest<HTMLElement>(VIEWPORT) ?? null);

      // AnimatePresence takes the grid out of the flow while it leaves, but only when it
      // can reach this node. Without it the grid keeps its space and the state that
      // follows sits under the grid until the grid has gone.
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref],
  );

  useLayoutEffect(() => {
    const node = container.current;

    if (!node || !viewport) {
      return;
    }

    updateMetrics(node, viewport, setMetrics);

    const observer = new ResizeObserver(() => updateMetrics(node, viewport, setMetrics));

    observer.observe(node);

    return () => observer.disconnect();
  }, [viewport]);

  const gap = gapFor(width);
  const columns = columnCount(width);
  const tile = width > 0 ? (width - gap * (columns - 1)) / columns : MIN_TILE;
  const rows = useMemo(() => chunk(items, columns), [items, columns]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => viewport,
    estimateSize: () => tile + TEXT_BLOCK + gap,
    overscan: OVERSCAN,
    scrollMargin,
  });

  // a new column count makes every row the virtualizer already measured the wrong height
  useEffect(() => {
    virtualizer.measure();
  }, [virtualizer, columns]);

  return (
    <motion.div
      ref={attach}
      className="relative w-full shrink-0"
      style={{ height: virtualizer.getTotalSize() }}
      initial={BLURRED}
      animate={SHARP}
      exit={BLURRED}
      transition={TRANSITION_REVEAL}
    >
      {virtualizer.getVirtualItems().map((row) => (
        <div
          key={row.key}
          data-index={row.index}
          ref={virtualizer.measureElement}
          className="absolute top-0 left-0 grid w-full"
          style={{
            columnGap: gap,
            paddingBottom: gap,
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            transform: `translateY(${row.start - scrollMargin}px)`,
          }}
        >
          {rows[row.index]?.map((item) => (
            <MediaTile key={item.id} {...item} />
          ))}
        </div>
      ))}
    </motion.div>
  );
}

function MediaTile({ name, credit, artwork, onClick }: MediaTileItem) {
  return (
    <motion.div
      className="flex flex-col gap-2 cursor-pointer"
      whileHover={{ scale: 1.01 }}
      transition={TRANSITION}
      onClick={onClick}
    >
      <ArtworkImage artwork={artwork} size={ARTWORK_SIZE} className="rounded-xl" />
      <div className="flex flex-col">
        <div className="truncate text-xs text-neutral-600 dark:text-neutral-300 select-none theme-fade-text">
          {name}
        </div>
        {credit && (
          <div className="truncate text-muted-foreground text-xs select-none">{credit}</div>
        )}
      </div>
    </motion.div>
  );
}
