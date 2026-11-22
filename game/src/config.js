// VAULTBREAK — The Meridian Job: every tuning number in one place.
// The whole vault hall fits in a single 1280x720 frame, so the player can
// read every patrol, cone and hiding spot before moving a step.
export const VIEW = { width: 1280, height: 720 };
export const WALL = 26; // marble wall thickness around the hall

export const THIEF = {
  radius: 13,
  walkSpeed: 205, // px per second
  sneakSpeed: 105, // slower, but half as easy to spot
  grabSeconds: 1.2, // hold E at the case to pick the lock
  graceSeconds: 2.5, // untouchable just after being caught
};

export const ALARM = {
  max: 100,
  cameraPerSecond: 14, // spotted by a camera
  suspiciousPerSecond: 9, // a guard is suspicious of you
  chasePerSecond: 20, // a guard is actively chasing you
  caughtPenalty: 35, // a guard lays hands on you
  decayPerSecond: 2.5, // alarm cools off while nobody sees you
};

export const GUARD = {
  radius: 14,
  patrolSpeed: 78,
  chaseSpeed: 168,
  visionRange: 225,
  visionHalfAngle: 0.56, // ~32 degrees each side
  suspicionPerSecond: 1.0, // fills in ~1s at point blank, slower far away
  suspicionDecayPerSecond: 0.45,
  catchRadius: 26,
  investigateSeconds: 4,
};

export const CAMERA = {
  range: 260,
  halfAngle: 0.42, // ~24 degrees each side
  sweepHalfAngle: 0.85, // how far the head swings each way
  sweepSpeed: 0.55, // radians per second
  empSeconds: 6, // cameras stay dark after an EMP burst
};

export const TOOLS = {
  coins: 3, // click anywhere to toss a coin lure
  smoke: 2, // Q: a cloud you cannot be seen inside
  emp: 1, // F: kills every camera for a few seconds
  coinLureRadius: 380, // guards closer than this come to look
  smokeRadius: 92,
  smokeSeconds: 5,
};

export const PALETTE = {
  floorA: '#2b2f3a',
  floorB: '#262a34',
  floorLine: '#343947',
  wall: '#4a4238',
  wallTop: '#6b5f4c',
  gold: '#e8b64c',
  goldDim: '#9a7a33',
  diamond: '#8fe8ff',
  exit: '#39d98a',
  shadow: '#151824',
  crate: '#7a5c33',
  crateTop: '#96703d',
  pillar: '#5d5a66',
  pillarTop: '#7d7a8c',
  guard: '#c94f4f',
  guardCone: 'rgba(232, 182, 76, 0.20)',
  guardConeAlert: 'rgba(220, 60, 60, 0.30)',
  cameraCone: 'rgba(255, 90, 90, 0.16)',
  thief: '#4fc3f7',
  thiefSneak: '#2f8fc9',
  smoke: 'rgba(200, 205, 215, 0.55)',
  hud: '#0f1117',
  text: '#f2ead8',
  muted: '#a89f88',
};
