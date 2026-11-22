// VAULTBREAK — The Meridian Job: the game loop. Rook crosses one vault
// hall past three patrolling guards and two sweeping cameras, picks the
// Meridian Diamond from its case, and slips out the service door before
// the alarm meter hits 100%.
import { VIEW, THIEF, ALARM, TOOLS } from './config.js';
import { createInput, moveVector } from './input.js';
import {
  createState, resetState, collide, nearCase, onExit, inSmoke, ENTRANCE,
} from './world.js';
import { createGuards, updateGuard, lureGuards, onCaught, guardSees, GUARD_CHASE } from './guards.js';
import { createCameras, updateCameras, fireEmp, cameraSees } from './cameras.js';
import {
  unlockAudio, toggleMute, sfxCoin, sfxPickup, sfxSpotted, sfxCaught,
  sfxEmp, sfxSmoke, sfxWin, sfxLose,
} from './audio.js';
import { render } from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW.width;
canvas.height = VIEW.height;

const input = createInput(canvas);
const state = createState();
let guards = createGuards();
let cameras = createCameras();
let spottedSting = false; // true while the spotted sting is already ringing

function setMessage(text, seconds = 2.5) {
  state.message = text;
  state.messageTimer = seconds;
}

function startJob() {
  resetState(state);
  guards = createGuards();
  cameras = createCameras();
  spottedSting = false;
  input.click = null; // a title-screen click starts the job, it must not also toss a coin
  setMessage('Stay out of the cones. The diamond is up in the case.', 4);
}

/** One fixed step of the simulation. */
function update(dt) {
  state.time += dt;
  if (state.messageTimer > 0) state.messageTimer -= dt;
  if (state.grace > 0) state.grace -= dt;
  if (state.empTimer > 0) state.empTimer -= dt;

  // --- Thief movement -------------------------------------------------
  const dir = moveVector(input);
  const sneaking = input.keys.has('sneak');
  state.thief.sneaking = sneaking;
  if (dir) {
    const speed = sneaking ? THIEF.sneakSpeed : THIEF.walkSpeed;
    const pos = collide(
      state.thief.x + dir.x * speed * dt,
      state.thief.y + dir.y * speed * dt,
      13,
    );
    state.thief.x = pos.x;
    state.thief.y = pos.y;
  }
  state.thief.hidden = inSmoke(state, state.thief.x, state.thief.y);

  // --- Tools -----------------------------------------------------------
  if (input.click) {
    const { x, y } = input.click;
    input.click = null;
    if (state.tools.coins > 0) {
      state.tools.coins -= 1;
      state.coins.push({ x, y, ttl: 6 });
      sfxCoin();
      const lured = lureGuards(guards, x, y, TOOLS.coinLureRadius);
      setMessage(lured > 0 ? 'Clink! A guard goes to look.' : 'Clink… nobody heard it.');
    } else {
      setMessage('Out of coins.');
    }
  }
  if (input.smokePressed) {
    input.smokePressed = false;
    if (state.tools.smoke > 0) {
      state.tools.smoke -= 1;
      state.smoke.push({ x: state.thief.x, y: state.thief.y, r: TOOLS.smokeRadius, ttl: TOOLS.smokeSeconds });
      sfxSmoke();
      setMessage('Smoke! You are invisible inside the cloud.');
    } else setMessage('Out of smoke pellets.');
  }
  if (input.empPressed) {
    input.empPressed = false;
    if (fireEmp(cameras, state)) {
      sfxEmp();
      setMessage('EMP burst — cameras dark for 6 seconds!');
    } else setMessage('No EMP charges left.');
  }

  // Coins and smoke fade.
  for (const coin of state.coins) coin.ttl -= dt;
  state.coins = state.coins.filter((c) => c.ttl > 0);
  for (const cloud of state.smoke) cloud.ttl -= dt;
  state.smoke = state.smoke.filter((c) => c.ttl > 0);

  // --- The diamond -----------------------------------------------------
  if (!state.diamondTaken && nearCase(state.thief.x, state.thief.y) && input.keys.has('interact')) {
    state.grabProgress += dt / THIEF.grabSeconds;
    if (state.grabProgress >= 1) {
      state.diamondTaken = true;
      state.grabProgress = 0;
      sfxPickup();
      setMessage('The Meridian Diamond is yours — now GET OUT!', 4);
    }
  } else if (state.grabProgress > 0) {
    state.grabProgress = Math.max(0, state.grabProgress - dt * 2);
  }

  // --- Guards and cameras ----------------------------------------------
  let anyChase = false;
  let anySuspicious = false;
  for (const guard of guards) {
    if (updateGuard(guard, dt, state) === 'caught') {
      state.alarm = Math.min(ALARM.max, state.alarm + ALARM.caughtPenalty);
      onCaught(state);
      sfxCaught();
      setMessage('CAUGHT! Dragged back to the door — alarm +35.', 3);
    }
    if (guard.state === GUARD_CHASE) anyChase = true;
    else if (guard.suspicion > 0.25) anySuspicious = true;
  }
  const cameraSeesThief = updateCameras(cameras, dt, state);

  // --- Alarm ------------------------------------------------------------
  let rise = 0;
  if (cameraSeesThief) rise += ALARM.cameraPerSecond;
  if (anyChase) rise += ALARM.chasePerSecond;
  else if (anySuspicious) rise += ALARM.suspiciousPerSecond;
  if (rise > 0) {
    state.alarm = Math.min(ALARM.max, state.alarm + rise * dt);
    if (!spottedSting && (cameraSeesThief || anyChase)) {
      spottedSting = true;
      sfxSpotted();
    }
  } else {
    state.alarm = Math.max(0, state.alarm - ALARM.decayPerSecond * dt);
    spottedSting = false;
  }

  // --- Win / lose --------------------------------------------------------
  if (state.diamondTaken && onExit(state.thief.x, state.thief.y)) {
    state.mode = 'won';
    sfxWin();
  } else if (state.alarm >= ALARM.max) {
    state.mode = 'busted';
    sfxLose();
  }
}

// --- Staged states for honest screenshots -------------------------------
// ?shot=cover|patrol|alarm|loot places the thief, the guards and the alarm
// exactly where a real run can put them, then holds the frame still.
// Default (no ?shot=) is the title screen over a live hall.
function stageShot(name) {
  resetState(state);
  guards = createGuards();
  cameras = createCameras();
  state.mode = 'play';
  if (name === 'patrol') {
    // Early job: Rook just inside the door, guards on patrol, alarm calm.
    state.thief.x = 190;
    state.thief.y = 590;
    state.alarm = 4;
    guards[0].x = 330; guards[0].y = 430; guards[0].angle = Math.PI / 2;
    guards[1].x = 980; guards[1].y = 220; guards[1].angle = Math.PI;
    guards[2].x = 420; guards[2].y = 110; guards[2].angle = 0;
    cameras[0].angle = Math.PI / 2 + 0.5;
    cameras[1].angle = Math.PI - 0.4;
  } else if (name === 'alarm') {
    // Mid-chase: Vera is on Rook's tail, alarm nearly maxed, EMP spent.
    state.thief.x = 560;
    state.thief.y = 480;
    state.alarm = 82;
    state.tools.emp = 0;
    state.tools.coins = 1;
    guards[0].x = 500; guards[0].y = 430; guards[0].angle = Math.PI / 4;
    guards[0].state = GUARD_CHASE; guards[0].suspicion = 1;
    guards[0].lastSeen = { x: 560, y: 480 };
    guards[1].x = 880; guards[1].y = 300; guards[1].angle = Math.PI * 0.75;
    guards[1].suspicion = 0.8;
    guards[2].x = 700; guards[2].y = 220; guards[2].angle = Math.PI / 2;
    cameras[0].angle = Math.PI / 2 - 0.6;
    cameras[1].angle = Math.PI + 0.3;
  } else if (name === 'loot') {
    // At the case, lock half-picked, diamond still glittering, alarm warm.
    state.thief.x = 1075;
    state.thief.y = 150;
    state.alarm = 55;
    state.grabProgress = 0.55;
    state.tools.coins = 2;
    guards[0].x = 420; guards[0].y = 560; guards[0].angle = -Math.PI / 2;
    guards[1].x = 980; guards[1].y = 380; guards[1].angle = Math.PI / 2;
    guards[1].suspicion = 0.6;
    guards[2].x = 640; guards[2].y = 260; guards[2].angle = Math.PI;
    cameras[0].angle = Math.PI / 2 + 0.7;
    cameras[1].angle = Math.PI - 0.2;
    cameras[1].disabled = 3;
  } else {
    // cover: mid-heist, Rook sneaking behind the centre crates, every
    // cone, the case and the alarm all in one frame.
    state.thief.x = 520;
    state.thief.y = 420;
    state.thief.sneaking = true;
    state.alarm = 34;
    state.tools.coins = 2;
    state.tools.smoke = 1;
    guards[0].x = 430; guards[0].y = 300; guards[0].angle = Math.PI / 2;
    guards[0].suspicion = 0.45;
    guards[1].x = 900; guards[1].y = 200; guards[1].angle = -Math.PI / 2;
    guards[2].x = 350; guards[2].y = 250; guards[2].angle = Math.PI / 4;
    guards[2].suspicion = 0.3;
    cameras[0].angle = Math.PI / 2 + 0.4;
    cameras[1].angle = Math.PI - 0.5;
    state.smoke.push({ x: 640, y: 520, r: TOOLS.smokeRadius, ttl: 5 });
    state.coins.push({ x: 700, y: 600, ttl: 6 });
  }
  state.time = name === 'cover' ? 47 : name === 'patrol' ? 12 : name === 'alarm' ? 96 : 73;
}

// --- Main loop ------------------------------------------------------------
const shot = new URLSearchParams(window.location.search).get('shot');
if (shot) {
  stageShot(shot);
  // Held still: the frame is the staged state, exactly as a real run shows it.
  render(ctx, state, guards, cameras);
  window.__shotReady = true;
} else {
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (state.mode === 'play') update(dt);
    if (input.startPressed) {
      input.startPressed = false;
      unlockAudio();
      if (state.mode !== 'play') startJob();
    }
    if (input.keys.has('mute')) {
      input.keys.delete('mute');
      toggleMute();
    }
    render(ctx, state, guards, cameras);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// Clicking the title also starts the job (keyboard-free first run).
canvas.addEventListener('mousedown', () => {
  unlockAudio();
  if (!shot && state.mode !== 'play') startJob();
});
