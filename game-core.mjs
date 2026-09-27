export const CAR_PRESETS = {
  Hatchback: { acceleration: 140, brake: 190, maxForward: 320, maxReverse: -120, turnRate: 2.8, traction: 2.4 },
  Sedan: { acceleration: 160, brake: 210, maxForward: 350, maxReverse: -130, turnRate: 2.9, traction: 2.5 },
  SUV: { acceleration: 130, brake: 220, maxForward: 300, maxReverse: -110, turnRate: 2.5, traction: 2.8 },
  Sport: { acceleration: 220, brake: 260, maxForward: 430, maxReverse: -140, turnRate: 3.3, traction: 2.1 },
  Supercar: { acceleration: 280, brake: 280, maxForward: 520, maxReverse: -150, turnRate: 3.6, traction: 1.9 }
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function updatePlayerPhysics(player, input, dt, preset) {
  const next = { ...player };

  const accel = input.forward ? preset.acceleration : input.backward ? -preset.brake : 0;
  next.speed += accel * dt;

  if (!input.forward && !input.backward) {
    const friction = preset.acceleration * 0.6 * dt;
    if (Math.abs(next.speed) <= friction) next.speed = 0;
    else next.speed -= Math.sign(next.speed) * friction;
  }

  if (input.handbrake) {
    next.speed *= 0.86;
  }

  next.speed = clamp(next.speed, preset.maxReverse, preset.maxForward);

  const steerInput = (input.left ? -1 : 0) + (input.right ? 1 : 0);
  const steerStrength = clamp(Math.abs(next.speed) / 220, 0.2, 1);
  next.angle += steerInput * preset.turnRate * steerStrength * dt;

  next.x += Math.cos(next.angle) * next.speed * dt;
  next.y += Math.sin(next.angle) * next.speed * dt;

  return next;
}

export function getTrafficLightState(timeMs, cycleMs = 8000) {
  const phase = ((timeMs % cycleMs) + cycleMs) % cycleMs;
  const nsGreen = phase < cycleMs / 2;
  return {
    ns: nsGreen ? 'Green' : 'Red',
    ew: nsGreen ? 'Red' : 'Green'
  };
}

export function parkingSuccess(player, spot) {
  const inside =
    player.x > spot.x &&
    player.x < spot.x + spot.width &&
    player.y > spot.y &&
    player.y < spot.y + spot.height;

  return inside && Math.abs(player.speed) < 18;
}

export function distanceToTarget(player, target) {
  const dx = target.x - player.x;
  const dy = target.y - player.y;
  return Math.hypot(dx, dy);
}
