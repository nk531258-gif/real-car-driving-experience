import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CAR_PRESETS,
  distanceToTarget,
  getTrafficLightState,
  parkingSuccess,
  updatePlayerPhysics
} from '../game-core.mjs';

test('player accelerates and is clamped by max speed', () => {
  let player = { x: 0, y: 0, angle: 0, speed: 0 };
  for (let i = 0; i < 300; i += 1) {
    player = updatePlayerPhysics(player, { forward: true }, 0.016, CAR_PRESETS.Supercar);
  }

  assert.ok(player.speed <= CAR_PRESETS.Supercar.maxForward);
  assert.ok(player.speed > 0);
});

test('traffic lights alternate by cycle phase', () => {
  const start = getTrafficLightState(0, 8000);
  const half = getTrafficLightState(5000, 8000);
  assert.equal(start.ns, 'Green');
  assert.equal(start.ew, 'Red');
  assert.equal(half.ns, 'Red');
  assert.equal(half.ew, 'Green');
});

test('parking succeeds only when inside spot and low speed', () => {
  const spot = { x: 10, y: 20, width: 100, height: 80 };
  assert.equal(parkingSuccess({ x: 30, y: 60, speed: 12 }, spot), true);
  assert.equal(parkingSuccess({ x: 30, y: 60, speed: 30 }, spot), false);
  assert.equal(parkingSuccess({ x: 300, y: 60, speed: 10 }, spot), false);
});

test('distance to target calculates euclidean distance', () => {
  const d = distanceToTarget({ x: 0, y: 0 }, { x: 3, y: 4 });
  assert.equal(d, 5);
});
