import { describe, expect, it } from 'vitest';
import {
  accelerateVelocity,
  calculatePaddleBounce,
  hasRepeatingImpacts,
  INITIAL_BALL_SPEED,
  MAX_BALL_SPEED,
  MIN_HORIZONTAL_SPEED,
  MIN_VERTICAL_SPEED,
  nudgeLoopingTrajectory,
  stabilizeVelocity,
} from './ballPhysics';

describe('calculatePaddleBounce', () => {
  it('maps five hit positions to progressively wider reflection angles', () => {
    const positions = [0, 50, 100, 150, 200];
    const velocities = positions.map((x) =>
      calculatePaddleBounce(x, 100, 200, 500, 1),
    );

    expect(velocities.map(({ x }) => Math.sign(x))).toEqual([-1, -1, 1, 1, 1]);
    expect(Math.abs(velocities[0]!.x)).toBeGreaterThan(Math.abs(velocities[1]!.x));
    expect(Math.abs(velocities[1]!.x)).toBeGreaterThan(Math.abs(velocities[2]!.x));
    expect(Math.abs(velocities[4]!.x)).toBeGreaterThan(Math.abs(velocities[3]!.x));
    velocities.forEach((velocity) => {
      expect(Math.abs(velocity.y)).toBeGreaterThanOrEqual(MIN_VERTICAL_SPEED - 0.001);
      expect(Math.hypot(velocity.x, velocity.y)).toBeCloseTo(500);
    });
  });

  it('sends the ball left after a hit on the left side', () => {
    const velocity = calculatePaddleBounce(10, 100, 200, 500);

    expect(velocity.x).toBeLessThan(0);
    expect(velocity.y).toBeLessThan(0);
  });

  it('keeps a center hit safe from a vertical loop', () => {
    const velocity = calculatePaddleBounce(100, 100, 200, 500, 1);

    expect(velocity.x).toBeGreaterThanOrEqual(MIN_HORIZONTAL_SPEED);
    expect(velocity.y).toBeLessThan(0);
  });

  it('sends the ball right after a hit on the right side', () => {
    const velocity = calculatePaddleBounce(190, 100, 200, 500);

    expect(velocity.x).toBeGreaterThan(0);
    expect(velocity.y).toBeLessThan(0);
  });
});

describe('stabilizeVelocity', () => {
  it('limits total speed', () => {
    const velocity = stabilizeVelocity({ x: 1000, y: -1000 });

    expect(Math.hypot(velocity.x, velocity.y)).toBeCloseTo(MAX_BALL_SPEED);
  });

  it('corrects an almost horizontal trajectory', () => {
    const velocity = stabilizeVelocity({ x: 600, y: -1 });

    expect(Math.abs(velocity.y)).toBeGreaterThanOrEqual(MIN_VERTICAL_SPEED);
  });

  it('corrects a vertical trajectory', () => {
    const velocity = stabilizeVelocity({ x: 0, y: -500 }, -1);

    expect(velocity.x).toBeLessThanOrEqual(-MIN_HORIZONTAL_SPEED);
  });
});

describe('trajectory progression', () => {
  it('gradually accelerates without exceeding the maximum', () => {
    const accelerated = accelerateVelocity(
      { x: INITIAL_BALL_SPEED, y: -INITIAL_BALL_SPEED },
      100,
    );

    expect(Math.hypot(accelerated.x, accelerated.y)).toBeCloseTo(
      MAX_BALL_SPEED,
    );
  });

  it('detects three repeating paddle impacts', () => {
    expect(hasRepeatingImpacts([0.2, 0.21, 0.19])).toBe(true);
    expect(hasRepeatingImpacts([-0.6, 0, 0.6])).toBe(false);
  });

  it('nudges a looping trajectory without changing its speed', () => {
    const velocity = { x: 200, y: -400 };
    const nudged = nudgeLoopingTrajectory(velocity, 1);

    expect(nudged.x).not.toBeCloseTo(velocity.x);
    expect(Math.hypot(nudged.x, nudged.y)).toBeCloseTo(
      Math.hypot(velocity.x, velocity.y),
    );
  });
});
