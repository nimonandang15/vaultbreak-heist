// The Meridian vault hall: one room, every route visible at once.
// Crates and pillars are cover (they block movement and sight); shadow
// zones are dark floor where the thief is half as easy to spot.
import { VIEW, WALL } from './config.js';

export const KIND_CRATE = 'crate';
export const KIND_PILLAR = 'pillar';

// Axis-aligned cover boxes { x, y, w, h } and round pillars { x, y, r }.
export const COVER_BOXES = [
  { x: 210, y: 150, w: 92, h: 64 }, // west crates
  { x: 210, y: 470, w: 92, h: 64 }, // south-west crates
  { x: 470, y: 330, w: 110, h: 70 }, // centre crates
  { x: 700, y: 130, w: 92, h: 64 }, // north crates
  { x: 760, y: 480, w: 92, h: 64 }, // south-east crates
  { x: 1010, y: 330, w: 84, h: 60 }, // case-side crates
];
export const PILLARS = [
  { x: 400, y: 240, r: 26 },
  { x: 640, y: 560, r: 26 },
  { x: 900, y: 250, r: 26 },
  { x: 420, y: 620, r: 22 },
];

// Dark floor patches: standing in one halves every detection rate.
export const SHADOWS = [
  { x: 330, y: 120, w: 150, h: 90 },
  { x: 560, y: 430, w: 170, h: 90 },
  { x: 950, y: 130, w: 150, h: 90 },
  { x: 150, y: 330, w: 120, h: 110 },
];

export const CASE = { x: 1120, y: 78, w: 96, h: 64 }; // the Meridian Diamond's display case
export const EXIT = { x: 52, y: 606, w: 110, h: 88 }; // the service door, bottom-left
export const ENTRANCE = { x: 107, y: 650 }; // where Rook slips in (and is dragged back to when caught)

/** Fresh mutable state for one run. */
export function createState() {
  return {
    mode: 'title', // title | play | won | busted
    time: 0,
    alarm: 0,
    diamondTaken: false,
    grabProgress: 0, // 0..1 while E is held at the case
    grace: 0, // seconds of untouchability after being caught
    thief: { x: ENTRANCE.x, y: ENTRANCE.y, sneaking: false, hidden: false },
    coins: [], // thrown coin lures { x, y, ttl }
    smoke: [], // smoke clouds { x, y, r, ttl }
    empTimer: 0, // seconds of camera blackout left
    tools: { coins: 3, smoke: 2, emp: 1 },
    stats: { spotted: 0, caught: 0 },
    message: '',
    messageTimer: 0,
  };
}

export function resetState(state) {
  const fresh = createState();
  fresh.mode = 'play';
  Object.assign(state, fresh);
}

/** Keep a circle inside the hall and out of cover; returns the clamped position. */
export function collide(x, y, radius) {
  const minX = WALL + radius;
  const maxX = VIEW.width - WALL - radius;
  const minY = WALL + radius;
  const maxY = VIEW.height - WALL - radius;
  x = Math.max(minX, Math.min(maxX, x));
  y = Math.max(minY, Math.min(maxY, y));
  for (const box of COVER_BOXES) {
    const cx = Math.max(box.x, Math.min(x, box.x + box.w));
    const cy = Math.max(box.y, Math.min(y, box.y + box.h));
    const dx = x - cx;
    const dy = y - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 < radius * radius) {
      if (d2 === 0) { x = box.x - radius; continue; }
      const d = Math.sqrt(d2);
      x = cx + (dx / d) * radius;
      y = cy + (dy / d) * radius;
    }
  }
  for (const p of PILLARS) {
    const dx = x - p.x;
    const dy = y - p.y;
    const d = Math.hypot(dx, dy);
    const min = p.r + radius;
    if (d < min && d > 0) {
      x = p.x + (dx / d) * min;
      y = p.y + (dy / d) * min;
    }
  }
  return { x, y };
}

/** True when the segment (x1,y1)-(x2,y2) is not blocked by cover or walls. */
export function hasLineOfSight(x1, y1, x2, y2) {
  for (const box of COVER_BOXES) {
    if (segmentHitsBox(x1, y1, x2, y2, box)) return false;
  }
  for (const p of PILLARS) {
    if (segmentHitsCircle(x1, y1, x2, y2, p.x, p.y, p.r)) return false;
  }
  return true;
}

function segmentHitsBox(x1, y1, x2, y2, box) {
  // Liang-Barsky: does the segment cross the box's interior?
  const dx = x2 - x1;
  const dy = y2 - y1;
  let t0 = 0;
  let t1 = 1;
  const edges = [
    [-dx, x1 - box.x],
    [dx, box.x + box.w - x1],
    [-dy, y1 - box.y],
    [dy, box.y + box.h - y1],
  ];
  for (const [p, q] of edges) {
    if (p === 0) {
      if (q < 0) return false;
    } else {
      const t = q / p;
      if (p < 0) {
        if (t > t1) return false;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return false;
        if (t < t1) t1 = t;
      }
    }
  }
  return t0 <= t1;
}

function segmentHitsCircle(x1, y1, x2, y2, cx, cy, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((cx - x1) * dx + (cy - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const px = x1 + dx * t;
  const py = y1 + dy * t;
  return Math.hypot(px - cx, py - cy) < r;
}

/** True when (x, y) stands inside a shadow zone. */
export function inShadow(x, y) {
  for (const s of SHADOWS) {
    if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) return true;
  }
  return false;
}

/** True when (x, y) stands inside a smoke cloud. */
export function inSmoke(state, x, y) {
  for (const c of state.smoke) {
    if (Math.hypot(x - c.x, y - c.y) < c.r) return true;
  }
  return false;
}

/** True when (x, y) is close enough to the case to work the lock. */
export function nearCase(x, y) {
  return x > CASE.x - 46 && x < CASE.x + CASE.w + 46 && y > CASE.y - 46 && y < CASE.y + CASE.h + 46;
}

/** True when (x, y) stands on the exit mat. */
export function onExit(x, y) {
  return x >= EXIT.x && x <= EXIT.x + EXIT.w && y >= EXIT.y && y <= EXIT.y + EXIT.h;
}
