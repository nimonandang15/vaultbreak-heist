// Every pixel of VAULTBREAK is drawn here on one canvas: the hall, the
// cover, the vision cones, the thief, the diamond and the HUD. Safe cover,
// danger and loot are meant to read at a glance, even shrunk to a thumbnail.
import { VIEW, WALL, PALETTE, GUARD, CAMERA, THIEF } from './config.js';
import { CASE, EXIT, COVER_BOXES, PILLARS, SHADOWS } from './world.js';
import { GUARD_CHASE, GUARD_SUSPICIOUS } from './guards.js';

function conePath(ctx, x, y, angle, halfAngle, range) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
}

function drawCone(ctx, x, y, angle, halfAngle, range, fill) {
  conePath(ctx, x, y, angle, halfAngle, range);
  ctx.fillStyle = fill;
  ctx.fill();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawHall(ctx, state) {
  // Checkerboard marble floor.
  const tile = 80;
  for (let ty = 0; ty < VIEW.height / tile; ty += 1) {
    for (let tx = 0; tx < VIEW.width / tile; tx += 1) {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? PALETTE.floorA : PALETTE.floorB;
      ctx.fillRect(tx * tile, ty * tile, tile, tile);
    }
  }
  ctx.strokeStyle = PALETTE.floorLine;
  ctx.lineWidth = 1;
  for (let x = 0; x <= VIEW.width; x += tile) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, VIEW.height); ctx.stroke();
  }
  for (let y = 0; y <= VIEW.height; y += tile) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(VIEW.width, y); ctx.stroke();
  }

  // Shadow zones: dark floor where detection is halved.
  for (const s of SHADOWS) {
    ctx.fillStyle = PALETTE.shadow;
    ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.strokeStyle = 'rgba(140, 150, 190, 0.25)';
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(s.x, s.y, s.w, s.h);
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(160, 170, 205, 0.5)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SHADOW', s.x + s.w / 2, s.y + s.h / 2 + 4);
  }

  // Exit mat and door.
  ctx.fillStyle = state.diamondTaken ? PALETTE.exit : '#1d5c3a';
  ctx.fillRect(EXIT.x, EXIT.y, EXIT.w, EXIT.h);
  ctx.strokeStyle = PALETTE.exit;
  ctx.lineWidth = 3;
  ctx.strokeRect(EXIT.x, EXIT.y, EXIT.w, EXIT.h);
  ctx.fillStyle = '#eafff3';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', EXIT.x + EXIT.w / 2, EXIT.y + EXIT.h / 2 + 7);
  if (state.diamondTaken) {
    ctx.font = '12px sans-serif';
    ctx.fillText('GET OUT!', EXIT.x + EXIT.w / 2, EXIT.y + EXIT.h / 2 + 24);
  }

  // The Meridian Diamond's display case.
  ctx.fillStyle = '#20242e';
  roundRect(ctx, CASE.x - 6, CASE.y - 6, CASE.w + 12, CASE.h + 12, 8);
  ctx.fill();
  ctx.strokeStyle = PALETTE.goldDim;
  ctx.lineWidth = 2;
  ctx.stroke();
  if (!state.diamondTaken) {
    ctx.save();
    ctx.translate(CASE.x + CASE.w / 2, CASE.y + CASE.h / 2);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = PALETTE.diamond;
    const s = 17;
    ctx.fillRect(-s / 2, -s / 2, s, s);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(-s / 4, -s / 4, s / 2, s / 2);
    ctx.restore();
    ctx.fillStyle = PALETTE.gold;
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('MERIDIAN DIAMOND', CASE.x + CASE.w / 2, CASE.y - 12);
  } else {
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '11px sans-serif';
    ctx.fillText('CASE EMPTY', CASE.x + CASE.w / 2, CASE.y + CASE.h / 2 + 4);
  }
}

function drawCover(ctx) {
  for (const box of COVER_BOXES) {
    ctx.fillStyle = PALETTE.crate;
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.fillStyle = PALETTE.crateTop;
    ctx.fillRect(box.x + 4, box.y + 4, box.w - 8, box.h - 8);
    ctx.strokeStyle = '#4a3419';
    ctx.lineWidth = 2;
    ctx.strokeRect(box.x, box.y, box.w, box.h);
    ctx.beginPath();
    ctx.moveTo(box.x + 4, box.y + 4);
    ctx.lineTo(box.x + box.w - 4, box.y + box.h - 4);
    ctx.moveTo(box.x + box.w - 4, box.y + 4);
    ctx.lineTo(box.x + 4, box.y + box.h - 4);
    ctx.stroke();
  }
  for (const p of PILLARS) {
    ctx.fillStyle = PALETTE.pillar;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = PALETTE.pillarTop;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r - 6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#3a3844';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.stroke();
  }
}

function drawWalls(ctx) {
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 0, VIEW.width, WALL);
  ctx.fillRect(0, VIEW.height - WALL, VIEW.width, WALL);
  ctx.fillRect(0, 0, WALL, VIEW.height);
  ctx.fillRect(VIEW.width - WALL, 0, WALL, VIEW.height);
  ctx.fillStyle = PALETTE.wallTop;
  ctx.fillRect(0, 0, VIEW.width, 6);
  ctx.fillRect(0, VIEW.height - 6, VIEW.width, 6);
  ctx.fillRect(0, 0, 6, VIEW.height);
  ctx.fillRect(VIEW.width - 6, 0, 6, VIEW.height);
  ctx.fillStyle = PALETTE.gold;
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('— MERIDIAN VAULT —', VIEW.width / 2, 19);
}

function drawThief(ctx, state) {
  const t = state.thief;
  if (state.grace > 0 && Math.floor(state.time * 8) % 2 === 0) return; // blink while untouchable
  ctx.save();
  ctx.translate(t.x, t.y);
  // Soft shadow blob.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(0, 9, 13, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = t.sneaking ? PALETTE.thiefSneak : PALETTE.thief;
  ctx.beginPath(); ctx.arc(0, 0, THIEF.radius, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#0b2a3d';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Hood + eyes, facing up the hall.
  ctx.fillStyle = '#0b2a3d';
  ctx.beginPath(); ctx.arc(0, -3, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#eaf7ff';
  ctx.fillRect(-5, -5, 3, 2);
  ctx.fillRect(2, -5, 3, 2);
  if (state.diamondTaken) {
    ctx.fillStyle = PALETTE.diamond;
    ctx.save();
    ctx.translate(10, 8);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-4, -4, 8, 8);
    ctx.restore();
  }
  ctx.restore();
  // Lock-picking progress ring.
  if (state.grabProgress > 0 && state.grabProgress < 1) {
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(t.x, t.y, 22, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = PALETTE.gold;
    ctx.beginPath(); ctx.arc(t.x, t.y, 22, -Math.PI / 2, -Math.PI / 2 + state.grabProgress * Math.PI * 2); ctx.stroke();
  }
}

function drawGuards(ctx, guards) {
  for (const g of guards) {
    const alert = g.state === GUARD_CHASE;
    const sus = g.state === GUARD_SUSPICIOUS;
    drawCone(ctx, g.x, g.y, g.angle, GUARD.visionHalfAngle, GUARD.visionRange,
      alert ? PALETTE.guardConeAlert : PALETTE.guardCone);
    ctx.fillStyle = alert ? '#e33' : PALETTE.guard;
    ctx.beginPath(); ctx.arc(g.x, g.y, GUARD.radius, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#3d0d0d';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Cap brim shows facing.
    ctx.fillStyle = '#7d1f1f';
    ctx.beginPath(); ctx.arc(g.x + Math.cos(g.angle) * 8, g.y + Math.sin(g.angle) * 8, 5, 0, Math.PI * 2); ctx.fill();
    // Suspicion arc over the head.
    if (g.suspicion > 0.05 && !alert) {
      ctx.strokeStyle = sus ? '#ffcf3f' : 'rgba(255,207,63,0.6)';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(g.x, g.y, 21, -Math.PI / 2, -Math.PI / 2 + g.suspicion * Math.PI * 2); ctx.stroke();
    }
    if (alert) {
      ctx.fillStyle = '#ff5a5a';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', g.x, g.y - 22);
    }
    ctx.fillStyle = '#f2ead8';
    ctx.font = '10px sans-serif';
    ctx.fillText(g.name.toUpperCase(), g.x, g.y + 26);
  }
}

function drawCameras(ctx, cameras) {
  for (const cam of cameras) {
    const dead = cam.disabled > 0;
    if (!dead) drawCone(ctx, cam.x, cam.y, cam.angle, CAMERA.halfAngle, CAMERA.range, PALETTE.cameraCone);
    ctx.fillStyle = dead ? '#555' : '#c22';
    ctx.beginPath(); ctx.arc(cam.x, cam.y, 9, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = dead ? '#888' : '#ff7070';
    ctx.beginPath();
    ctx.moveTo(cam.x, cam.y);
    ctx.lineTo(cam.x + Math.cos(cam.angle) * 18, cam.y + Math.sin(cam.angle) * 18);
    ctx.stroke();
    ctx.fillStyle = '#f2ead8';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(dead ? `${cam.name} OFF ${Math.ceil(cam.disabled)}s` : cam.name, cam.x, cam.y + 22);
  }
}

function drawTools(ctx, state) {
  for (const coin of state.coins) {
    ctx.fillStyle = PALETTE.gold;
    ctx.beginPath(); ctx.arc(coin.x, coin.y, 6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#6b4d12';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(232,182,76,0.5)';
    ctx.beginPath(); ctx.arc(coin.x, coin.y, 11 + Math.sin(state.time * 6) * 2, 0, Math.PI * 2); ctx.stroke();
  }
  for (const cloud of state.smoke) {
    ctx.fillStyle = PALETTE.smoke;
    ctx.beginPath(); ctx.arc(cloud.x, cloud.y, cloud.r, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cloud.x - 30, cloud.y + 12, cloud.r * 0.6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cloud.x + 32, cloud.y - 10, cloud.r * 0.55, 0, Math.PI * 2); ctx.fill();
  }
}

function alarmColor(alarm) {
  if (alarm >= 75) return '#ff3b30';
  if (alarm >= 45) return '#ff9500';
  return '#39d98a';
}

function drawHud(ctx, state) {
  // Top bar.
  ctx.fillStyle = PALETTE.hud;
  ctx.fillRect(0, 0, VIEW.width, 34);
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('VAULTBREAK', 12, 22);
  ctx.font = '13px sans-serif';
  ctx.fillStyle = PALETTE.muted;
  ctx.fillText('The Meridian Job', 118, 22);

  // Alarm meter.
  const mx = 300;
  const mw = 420;
  ctx.fillStyle = '#2a2e38';
  ctx.fillRect(mx, 9, mw, 16);
  ctx.fillStyle = alarmColor(state.alarm);
  ctx.fillRect(mx, 9, mw * Math.min(1, state.alarm / 100), 16);
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1;
  ctx.strokeRect(mx, 9, mw, 16);
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`ALARM ${Math.floor(state.alarm)}%`, mx + mw + 10, 22);
  if (state.alarm >= 75) {
    ctx.fillStyle = '#ff3b30';
    ctx.fillText('!!', mx + mw + 92, 22);
  }

  // Objective + tools, right side.
  ctx.textAlign = 'right';
  ctx.fillStyle = state.diamondTaken ? PALETTE.diamond : PALETTE.gold;
  ctx.font = 'bold 13px sans-serif';
  const objective = state.diamondTaken ? '◆ GET TO THE EXIT' : '◆ STEAL THE DIAMOND';
  ctx.fillText(objective, VIEW.width - 12, 22);
  ctx.font = '12px sans-serif';
  ctx.fillStyle = PALETTE.muted;
  ctx.fillText(`coins ${state.tools.coins}   smoke ${state.tools.smoke}   EMP ${state.tools.emp}`, VIEW.width - 12, 52);

  // Timer.
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '12px sans-serif';
  const mins = Math.floor(state.time / 60);
  const secs = Math.floor(state.time % 60);
  ctx.fillText(`TIME ${mins}:${String(secs).padStart(2, '0')}`, 12, 52);

  // Controls footer.
  ctx.fillStyle = 'rgba(10, 12, 16, 0.75)';
  ctx.fillRect(0, VIEW.height - 26, VIEW.width, 26);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    'WASD / arrows move · SHIFT sneak · E grab / pick lock · CLICK toss a coin · Q smoke · F EMP · M mute',
    VIEW.width / 2, VIEW.height - 9,
  );

  // Transient message.
  if (state.messageTimer > 0) {
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(state.message, VIEW.width / 2, 66);
  }
}

function drawOverlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(8, 10, 14, 0.72)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = accent;
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, VIEW.width / 2, 290);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '16px sans-serif';
  lines.forEach((line, i) => {
    ctx.fillText(line, VIEW.width / 2, 330 + i * 26);
  });
}

/** Draw one frame. */
export function render(ctx, state, guards, cameras) {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  drawHall(ctx, state);
  drawCameras(ctx, cameras);
  drawGuards(ctx, guards);
  drawCover(ctx);
  drawTools(ctx, state);
  drawThief(ctx, state);
  drawWalls(ctx);
  drawHud(ctx, state);

  if (state.mode === 'title') {
    drawOverlay(ctx, 'VAULTBREAK', [
      'The Meridian Job — one vault, three guards, two cameras, one diamond.',
      'Sneak past the cones. Grab the diamond. Get out before the alarm hits 100%.',
      '',
      'WASD / arrows move · SHIFT sneak · E pick the lock · CLICK toss a coin lure',
      'Q smoke pellet · F EMP the cameras',
      '',
      'Press ENTER or click to start the job',
    ], PALETTE.gold);
  } else if (state.mode === 'won') {
    drawOverlay(ctx, 'CLEAN GETAWAY', [
      `The Meridian Diamond is yours. Time ${Math.floor(state.time / 60)}:${String(Math.floor(state.time % 60)).padStart(2, '0')} · caught ${state.stats.caught}× · spotted ${state.stats.spotted}×`,
      '',
      'Press ENTER to run it again',
    ], PALETTE.exit);
  } else if (state.mode === 'busted') {
    drawOverlay(ctx, 'BUSTED', [
      'The alarm hit 100%. The vault seals, the lights come up, Rook is done.',
      '',
      'Press ENTER to try the job again',
    ], '#ff3b30');
  }
}
