const COLOR_TOKENS = [
  "--color-chart-1",
  "--color-chart-2",
  "--color-chart-3",
  "--color-chart-4",
  "--color-chart-5",
];

const COUNT = 80;
const LIFETIME = 2800;
const FADE_AT = 2000;
const GRAVITY = 0.0011;
const DRAG = 0.999;
const SPREAD = Math.PI * 0.6;

interface Piece {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  tilt: number;
  spin: number;
  size: number;
  color: string;
}

export function fireConfetti(): void {
  if (
    typeof document === "undefined" ||
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  ) {
    return;
  }

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  canvas.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:60";
  document.body.append(canvas);

  let width = 0;
  let height = 0;

  function resize(): void {
    const ratio = window.devicePixelRatio || 1;

    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    context?.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  resize();
  window.addEventListener("resize", resize);

  const colors = readColors();
  const pieces = Array.from({ length: COUNT }, () => createPiece(width, height, colors));

  let start = 0;
  let previous = 0;
  let frame = requestAnimationFrame(step);

  function step(now: number): void {
    start ||= now;
    const elapsed = now - start;
    const delta = Math.min(now - (previous || now), 50);
    previous = now;

    if (elapsed > LIFETIME) {
      stop();
      return;
    }

    const decay = DRAG ** delta;
    const alpha = 1 - Math.max(0, elapsed - FADE_AT) / (LIFETIME - FADE_AT);

    context?.clearRect(0, 0, width, height);

    for (const piece of pieces) {
      piece.velocityX *= decay;
      piece.velocityY = piece.velocityY * decay + GRAVITY * delta;
      piece.x += piece.velocityX * delta;
      piece.y += piece.velocityY * delta;
      piece.tilt += piece.spin * delta;

      draw(piece, alpha);
    }

    frame = requestAnimationFrame(step);
  }

  function draw(piece: Piece, alpha: number): void {
    if (!context) {
      return;
    }

    context.save();
    context.translate(piece.x, piece.y);
    context.rotate(piece.tilt);
    context.globalAlpha = alpha;
    context.fillStyle = piece.color;
    context.fillRect(
      -piece.size / 2,
      -piece.size / 4,
      piece.size,
      (piece.size / 2) * Math.cos(piece.tilt * 2),
    );
    context.restore();
  }

  function stop(): void {
    cancelAnimationFrame(frame);
    window.removeEventListener("resize", resize);
    canvas.remove();
  }
}

function createPiece(width: number, height: number, colors: string[]): Piece {
  const angle = -Math.PI / 2 + (Math.random() - 0.5) * SPREAD;
  const speed = 0.8 + Math.random() * 0.6;

  return {
    x: width / 2,
    y: height / 2,
    velocityX: Math.cos(angle) * speed,
    velocityY: Math.sin(angle) * speed,
    tilt: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.02,
    size: 6 + Math.random() * 5,
    color: colors[Math.floor(Math.random() * colors.length)] ?? "currentColor",
  };
}

function readColors(): string[] {
  const probe = document.createElement("span");
  probe.style.display = "none";
  document.body.append(probe);

  const colors = COLOR_TOKENS.map((token) => {
    probe.style.color = `var(${token})`;

    return getComputedStyle(probe).color;
  });

  probe.remove();

  return colors;
}
