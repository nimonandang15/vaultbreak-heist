// Keyboard + mouse input for VAULTBREAK. WASD / arrows move, Shift sneaks,
// E interacts, Q drops smoke, F fires the EMP, a mouse click tosses a coin.
// The module only records state; main.js decides what it means.
export function createInput(canvas) {
  const keys = new Set();
  const input = {
    keys,
    click: null, // { x, y } in canvas pixels, consumed by main.js
    mouse: { x: 0, y: 0 },
    interactHeld: false,
    smokePressed: false,
    empPressed: false,
    startPressed: false,
  };

  const KEYMAP = {
    KeyW: 'up', ArrowUp: 'up',
    KeyS: 'down', ArrowDown: 'down',
    KeyA: 'left', ArrowLeft: 'left',
    KeyD: 'right', ArrowRight: 'right',
    ShiftLeft: 'sneak', ShiftRight: 'sneak',
    KeyE: 'interact',
    KeyQ: 'smoke',
    KeyF: 'emp',
    KeyM: 'mute',
    Enter: 'start',
    Space: 'start',
  };

  window.addEventListener('keydown', (event) => {
    const action = KEYMAP[event.code];
    if (!action) return;
    if (['up', 'down', 'left', 'right', 'start'].includes(action)) event.preventDefault();
    if (event.repeat) return;
    keys.add(action);
    if (action === 'smoke') input.smokePressed = true;
    if (action === 'emp') input.empPressed = true;
    if (action === 'start') input.startPressed = true;
  });
  window.addEventListener('keyup', (event) => {
    const action = KEYMAP[event.code];
    if (action) keys.delete(action);
  });
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    input.mouse.x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    input.mouse.y = ((event.clientY - rect.top) / rect.height) * canvas.height;
  });
  canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    input.click = {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
    input.mouse.x = input.click.x;
    input.mouse.y = input.click.y;
  });

  return input;
}

/** A unit move vector from the held keys, or null when standing still. */
export function moveVector(input) {
  let x = 0;
  let y = 0;
  if (input.keys.has('left')) x -= 1;
  if (input.keys.has('right')) x += 1;
  if (input.keys.has('up')) y -= 1;
  if (input.keys.has('down')) y += 1;
  if (x === 0 && y === 0) return null;
  const len = Math.hypot(x, y);
  return { x: x / len, y: y / len };
}
