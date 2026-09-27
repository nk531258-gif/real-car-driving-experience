import {
  CAR_PRESETS,
  distanceToTarget,
  getTrafficLightState,
  parkingSuccess,
  updatePlayerPhysics
} from './game-core.mjs';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const carSelect = document.getElementById('car-select');
const cameraSelect = document.getElementById('camera-select');
const parkingModeEl = document.getElementById('parking-mode');
const dayNightBtn = document.getElementById('day-night');
const resetBtn = document.getElementById('reset-car');
const speedEl = document.getElementById('speed');
const signalEl = document.getElementById('signal');
const directionEl = document.getElementById('direction');
const modeEl = document.getElementById('mode');
const statusEl = document.getElementById('status');

const world = { width: 3200, height: 2200 };
const intersection = { x: 1600, y: 1100, size: 220 };
const checkpoint = { x: 2820, y: 420, radius: 70 };
const parkingSpot = { x: 420, y: 1720, width: 140, height: 260 };

let mode = 'Day';
let preset = CAR_PRESETS.Sedan;
let cameraMode = 'follow';

const playerStart = { x: 420, y: 360, angle: 0, speed: 0 };
let player = { ...playerStart };

const keys = new Set();
const aiCars = [
  { axis: 'h', t: 0.18, speed: 120, lane: -65, color: '#f97316' },
  { axis: 'h', t: 0.68, speed: 140, lane: 65, color: '#60a5fa' },
  { axis: 'v', t: 0.32, speed: 110, lane: -70, color: '#34d399' },
  { axis: 'v', t: 0.78, speed: 130, lane: 70, color: '#f43f5e' }
];

for (const name of Object.keys(CAR_PRESETS)) {
  const option = document.createElement('option');
  option.value = name;
  option.textContent = name;
  if (name === 'Sedan') option.selected = true;
  carSelect.append(option);
}

carSelect.addEventListener('change', () => {
  preset = CAR_PRESETS[carSelect.value] || CAR_PRESETS.Sedan;
  statusEl.textContent = `${carSelect.value} selected.`;
});

cameraSelect.addEventListener('change', () => {
  cameraMode = cameraSelect.value;
  statusEl.textContent = `Camera set to ${cameraMode}.`;
});

dayNightBtn.addEventListener('click', () => {
  mode = mode === 'Day' ? 'Night' : 'Day';
  modeEl.textContent = mode;
});

resetBtn.addEventListener('click', () => {
  player = { ...playerStart };
  statusEl.textContent = 'Car reset to start point.';
});

window.addEventListener('keydown', (event) => {
  keys.add(event.key.toLowerCase());
});
window.addEventListener('keyup', (event) => {
  keys.delete(event.key.toLowerCase());
});

function controls() {
  return {
    forward: keys.has('w') || keys.has('arrowup'),
    backward: keys.has('s') || keys.has('arrowdown'),
    left: keys.has('a') || keys.has('arrowleft'),
    right: keys.has('d') || keys.has('arrowright'),
    handbrake: keys.has(' ')
  };
}

function updateAi(dt, signal) {
  for (const car of aiCars) {
    const nearIntersection =
      car.axis === 'h'
        ? Math.abs(car.t * world.width - intersection.x) < 190
        : Math.abs(car.t * world.height - intersection.y) < 180;

    const mustStop =
      (car.axis === 'h' && signal.ew === 'Red' && nearIntersection) ||
      (car.axis === 'v' && signal.ns === 'Red' && nearIntersection);

    if (!mustStop) {
      const span = car.axis === 'h' ? world.width : world.height;
      car.t = (car.t + (car.speed * dt) / span) % 1;
    }
  }
}

function camera() {
  if (cameraMode === 'overhead') {
    return { x: world.width / 2 - canvas.width / 2, y: world.height / 2 - canvas.height / 2, zoom: 0.62 };
  }
  if (cameraMode === 'driver') {
    return {
      x: player.x - canvas.width * 0.3 + Math.cos(player.angle) * 160,
      y: player.y - canvas.height * 0.52 + Math.sin(player.angle) * 160,
      zoom: 1.1
    };
  }
  return { x: player.x - canvas.width / 2, y: player.y - canvas.height / 2, zoom: 1 };
}

function drawRoads() {
  ctx.fillStyle = '#2f3d22';
  ctx.fillRect(0, 0, world.width, world.height);

  ctx.fillStyle = '#293241';
  ctx.fillRect(0, intersection.y - 140, world.width, 280);
  ctx.fillRect(intersection.x - 140, 0, 280, world.height);

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 4;
  ctx.setLineDash([28, 20]);
  ctx.beginPath();
  ctx.moveTo(0, intersection.y);
  ctx.lineTo(world.width, intersection.y);
  ctx.moveTo(intersection.x, 0);
  ctx.lineTo(intersection.x, world.height);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawSignals(signal) {
  const lights = [
    { x: intersection.x - 180, y: intersection.y - 180, active: signal.ew },
    { x: intersection.x + 180, y: intersection.y + 180, active: signal.ew },
    { x: intersection.x + 180, y: intersection.y - 180, active: signal.ns },
    { x: intersection.x - 180, y: intersection.y + 180, active: signal.ns }
  ];

  for (const light of lights) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(light.x - 12, light.y - 18, 24, 36);
    ctx.fillStyle = light.active === 'Green' ? '#22c55e' : '#ef4444';
    ctx.beginPath();
    ctx.arc(light.x, light.y, 7, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawAiCars() {
  for (const car of aiCars) {
    const x = car.axis === 'h' ? car.t * world.width : intersection.x + car.lane;
    const y = car.axis === 'h' ? intersection.y + car.lane : car.t * world.height;
    const angle = car.axis === 'h' ? 0 : Math.PI / 2;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = car.color;
    ctx.fillRect(-20, -10, 40, 20);
    ctx.fillStyle = '#111827';
    ctx.fillRect(-10, -8, 20, 16);
    ctx.restore();
  }
}

function drawPlayer() {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);
  ctx.fillStyle = '#eab308';
  ctx.fillRect(-22, -12, 44, 24);
  ctx.fillStyle = '#111827';
  ctx.fillRect(-9, -9, 18, 18);
  ctx.restore();
}

function drawObjectives() {
  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(checkpoint.x, checkpoint.y, checkpoint.radius, 0, Math.PI * 2);
  ctx.stroke();

  if (parkingModeEl.checked) {
    ctx.strokeStyle = '#f59e0b';
    ctx.strokeRect(parkingSpot.x, parkingSpot.y, parkingSpot.width, parkingSpot.height);
  }
}

function drawWorld(signal) {
  ctx.save();
  const cam = camera();
  ctx.scale(cam.zoom, cam.zoom);
  ctx.translate(-cam.x, -cam.y);

  drawRoads();
  drawSignals(signal);
  drawObjectives();
  drawAiCars();
  drawPlayer();

  ctx.restore();
}

function drawOverlay() {
  if (mode === 'Night') {
    ctx.fillStyle = 'rgba(3, 7, 18, 0.45)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

let previous = performance.now();
function loop(now) {
  const dt = Math.min(0.033, (now - previous) / 1000);
  previous = now;

  player = updatePlayerPhysics(player, controls(), dt, preset);
  player.x = Math.max(40, Math.min(world.width - 40, player.x));
  player.y = Math.max(40, Math.min(world.height - 40, player.y));

  const signal = getTrafficLightState(now);
  updateAi(dt, signal);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawWorld(signal);
  drawOverlay();

  const speedKph = Math.round(Math.abs(player.speed) * 0.22);
  speedEl.textContent = String(speedKph);
  signalEl.textContent = `EW: ${signal.ew} / NS: ${signal.ns}`;

  const destinationMeters = Math.round(distanceToTarget(player, checkpoint));
  directionEl.textContent = destinationMeters < checkpoint.radius ? 'Checkpoint reached!' : `${destinationMeters} m to checkpoint`;

  if (parkingModeEl.checked) {
    statusEl.textContent = parkingSuccess(player, parkingSpot)
      ? 'Parking complete. Great control!'
      : 'Parking mode active: move into marked bay and slow below 18 km/h.';
  } else if (destinationMeters < checkpoint.radius) {
    statusEl.textContent = 'Checkpoint reached. Try parking mode next!';
  }

  requestAnimationFrame(loop);
}

modeEl.textContent = mode;
requestAnimationFrame(loop);
