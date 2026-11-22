// The vault's security cameras: wall-mounted heads that sweep their cones
// back and forth. A camera that sees Rook raises the alarm fast — until an
// EMP burst knocks every camera dark for a few seconds.
import { CAMERA } from './config.js';
import { hasLineOfSight, inShadow, inSmoke } from './world.js';

/** Two cameras, one watching the north hall, one the diamond's approach. */
export function createCameras() {
  return [
    {
      name: 'CAM-1', x: 640, y: 40, baseAngle: Math.PI / 2,
      angle: Math.PI / 2, phase: 0, disabled: 0,
    },
    {
      name: 'CAM-2', x: 1228, y: 300, baseAngle: Math.PI,
      angle: Math.PI, phase: 1.6, disabled: 0,
    },
  ];
}

/** Sweep the heads; returns true when any live camera can see the thief. */
export function updateCameras(cameras, dt, state) {
  let anySees = false;
  for (const cam of cameras) {
    if (cam.disabled > 0) {
      cam.disabled -= dt;
      continue;
    }
    cam.phase += dt * CAMERA.sweepSpeed;
    cam.angle = cam.baseAngle + Math.sin(cam.phase) * CAMERA.sweepHalfAngle;
    if (cameraSees(cam, state.thief, state)) anySees = true;
  }
  return anySees;
}

/** How strongly this camera sees the thief, 0 when not at all. */
export function cameraSees(cam, thief, state) {
  if (cam.disabled > 0) return 0;
  if (state.grace > 0) return 0;
  if (inSmoke(state, thief.x, thief.y)) return 0;
  const dx = thief.x - cam.x;
  const dy = thief.y - cam.y;
  const dist = Math.hypot(dx, dy);
  if (dist > CAMERA.range) return 0;
  let diff = Math.atan2(dy, dx) - cam.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > CAMERA.halfAngle) return 0;
  if (!hasLineOfSight(cam.x, cam.y, thief.x, thief.y)) return 0;
  let strength = 1 - (dist / CAMERA.range) * 0.5;
  if (thief.sneaking) strength *= 0.5;
  if (inShadow(thief.x, thief.y)) strength *= 0.5;
  return Math.max(0, strength);
}

/** Kill every camera for CAMERA.empSeconds. Returns true when it fired. */
export function fireEmp(cameras, state) {
  if (state.tools.emp <= 0) return false;
  state.tools.emp -= 1;
  for (const cam of cameras) cam.disabled = CAMERA.empSeconds;
  state.empTimer = CAMERA.empSeconds;
  return true;
}
