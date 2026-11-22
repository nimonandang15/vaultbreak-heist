// The vault's guards: patrol routes, vision cones, suspicion, chase and
// the coin lure. A guard who sees Rook gets suspicious, then chases; a
// guard who reaches Rook drags him back to the entrance and spikes the alarm.
import { GUARD } from './config.js';
import { hasLineOfSight, inShadow, inSmoke, collide, ENTRANCE } from './world.js';

export const GUARD_PATROL = 'patrol';
export const GUARD_SUSPICIOUS = 'suspicious';
export const GUARD_CHASE = 'chase';
export const GUARD_INVESTIGATE = 'investigate';

/** Three guards, each with a loop of waypoints through the hall. */
export function createGuards() {
  return [
    {
      name: 'Vera', x: 330, y: 300, angle: 0, speed: GUARD.patrolSpeed,
      state: GUARD_PATROL, suspicion: 0, wait: 0, lastSeen: null,
      waypoints: [
        { x: 330, y: 300 }, { x: 330, y: 620 }, { x: 560, y: 620 }, { x: 560, y: 300 },
      ],
      wp: 0, target: null, investigateTimer: 0,
    },
    {
      name: 'Marlo', x: 880, y: 420, angle: Math.PI, speed: GUARD.patrolSpeed,
      state: GUARD_PATROL, suspicion: 0, wait: 0, lastSeen: null,
      waypoints: [
        { x: 880, y: 420 }, { x: 880, y: 140 }, { x: 1080, y: 140 }, { x: 1080, y: 420 },
      ],
      wp: 0, target: null, investigateTimer: 0,
    },
    {
      name: 'Ilya', x: 640, y: 110, angle: Math.PI / 2, speed: GUARD.patrolSpeed,
      state: GUARD_PATROL, suspicion: 0, wait: 0, lastSeen: null,
      waypoints: [
        { x: 640, y: 110 }, { x: 640, y: 260 }, { x: 240, y: 260 }, { x: 240, y: 110 },
      ],
      wp: 0, target: null, investigateTimer: 0,
    },
  ];
}

/** How strongly this guard can see the thief right now, 0 when not at all. */
export function guardSees(guard, thief, state) {
  if (state.grace > 0) return 0;
  if (inSmoke(state, thief.x, thief.y)) return 0;
  const dx = thief.x - guard.x;
  const dy = thief.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > GUARD.visionRange) return 0;
  let diff = Math.atan2(dy, dx) - guard.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > GUARD.visionHalfAngle) return 0;
  if (!hasLineOfSight(guard.x, guard.y, thief.x, thief.y)) return 0;
  // Closer and standing still in the open is easier to spot; sneaking in
  // shadow is hardest. Strength 0..1 scales the suspicion fill rate.
  let strength = 1 - (dist / GUARD.visionRange) * 0.65;
  if (thief.sneaking) strength *= 0.5;
  if (inShadow(thief.x, thief.y)) strength *= 0.5;
  return Math.max(0, strength);
}

function moveToward(guard, tx, ty, dt, speed) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return true;
  const step = Math.min(dist, speed * dt);
  const nx = guard.x + (dx / dist) * step;
  const ny = guard.y + (dy / dist) * step;
  const pos = collide(nx, ny, GUARD.radius);
  guard.x = pos.x;
  guard.y = pos.y;
  guard.angle = Math.atan2(dy, dx);
  return dist <= speed * dt + 2;
}

/** Advance one guard a frame. Returns 'caught' when it lays hands on Rook. */
export function updateGuard(guard, dt, state) {
  const thief = state.thief;
  const seen = guardSees(guard, thief, state);

  if (guard.state === GUARD_INVESTIGATE) {
    guard.investigateTimer -= dt;
    if (guard.target) {
      if (moveToward(guard, guard.target.x, guard.target.y, dt, GUARD.patrolSpeed * 1.25)) {
        guard.wait = 1.2;
        guard.target = null;
      }
    } else if (guard.wait > 0) {
      guard.wait -= dt;
      guard.angle += dt * 1.4; // looks around, puzzled
    }
    if (guard.investigateTimer <= 0 && !guard.target && guard.wait <= 0) {
      guard.state = GUARD_PATROL;
    }
  } else if (seen > 0) {
    guard.suspicion += seen * GUARD.suspicionPerSecond * dt;
    guard.angle = Math.atan2(thief.y - guard.y, thief.x - guard.x);
    if (guard.suspicion >= 1) {
      guard.state = GUARD_CHASE;
      state.stats.spotted += 1;
    } else if (guard.state === GUARD_PATROL) {
      guard.state = GUARD_SUSPICIOUS;
    }
  } else {
    guard.suspicion = Math.max(0, guard.suspicion - GUARD.suspicionDecayPerSecond * dt);
    if (guard.state === GUARD_SUSPICIOUS && guard.suspicion <= 0) guard.state = GUARD_PATROL;
  }

  if (guard.state === GUARD_CHASE) {
    if (seen > 0) {
      guard.lastSeen = { x: thief.x, y: thief.y };
      guard.suspicion = 1;
    } else {
      // Lost him: search the last place he was seen, then give up.
      guard.suspicion -= GUARD.suspicionDecayPerSecond * 2 * dt;
      if (guard.suspicion <= 0) guard.state = GUARD_PATROL;
    }
    const dest = guard.lastSeen ?? { x: thief.x, y: thief.y };
    moveToward(guard, dest.x, dest.y, dt, GUARD.chaseSpeed);
    if (state.grace <= 0 && Math.hypot(thief.x - guard.x, thief.y - guard.y) < GUARD.catchRadius) {
      return 'caught';
    }
  } else if (guard.state === GUARD_PATROL) {
    const wp = guard.waypoints[guard.wp];
    if (moveToward(guard, wp.x, wp.y, dt, GUARD.patrolSpeed)) {
      guard.wp = (guard.wp + 1) % guard.waypoints.length;
    }
  } else if (guard.state === GUARD_SUSPICIOUS) {
    // Freeze and stare at where he thought he saw something.
    guard.angle = Math.atan2(thief.y - guard.y, thief.x - guard.x);
  }
  return null;
}

/** Send the nearest guard(s) to look at a coin that just landed. */
export function lureGuards(guards, x, y, radius) {
  let lured = 0;
  for (const guard of guards) {
    if (guard.state === GUARD_CHASE) continue;
    if (Math.hypot(guard.x - x, guard.y - y) < radius) {
      guard.state = GUARD_INVESTIGATE;
      guard.target = { x, y };
      guard.investigateTimer = GUARD.investigateSeconds;
      guard.suspicion = Math.max(0, guard.suspicion - 0.5);
      lured += 1;
    }
  }
  return lured;
}

/** The caught moment: Rook is dragged back to the entrance. */
export function onCaught(state) {
  state.thief.x = ENTRANCE.x;
  state.thief.y = ENTRANCE.y;
  state.grace = 2.5;
  state.stats.caught += 1;
}
